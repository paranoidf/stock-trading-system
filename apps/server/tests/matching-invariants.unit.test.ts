import { describe, expect, it } from 'vitest';
import { AccountLedger } from '../src/domain/account-ledger.js';
import { MatchingEngine } from '../src/domain/matching-engine.js';
import { OrderBook } from '../src/domain/order-book.js';

function totals(ledger: AccountLedger, users: string[], symbol: string) {
  return {
    cash: users.reduce((sum, user) => {
      const account = ledger.getAccount(user);
      return sum + account.availableCashCents + account.reservedCashCents;
    }, 0),
    shares: users.reduce((sum, user) => sum + (ledger.getAccount(user).positions.get(symbol)?.quantity ?? 0), 0)
  };
}

describe('matching invariants', () => {
  it('conserves cash and shares across multiple fills', () => {
    const ledger = new AccountLedger();
    const users = ['buyer', 'seller-a', 'seller-b'];
    users.forEach((user) => ledger.createAccount(user));
    const before = totals(ledger, users, 'AAPL');
    const book = new OrderBook(ledger);
    const engine = new MatchingEngine(book, ledger);
    book.place({ userId: 'seller-a', symbol: 'AAPL', side: 'sell', limitPriceCents: 20_000, quantity: 20 });
    book.place({ userId: 'seller-b', symbol: 'AAPL', side: 'sell', limitPriceCents: 21_000, quantity: 40 });
    book.place({ userId: 'buyer', symbol: 'AAPL', side: 'buy', limitPriceCents: 22_000, quantity: 50 });

    engine.match('AAPL');

    expect(totals(ledger, users, 'AAPL')).toEqual(before);
    expect(ledger.getAccount('buyer').positions.get('AAPL')?.quantity).toBe(1050);
    expect(ledger.getAccount('seller-b').positions.get('AAPL')).toMatchObject({ quantity: 970, reservedQuantity: 10 });
  });

  it('keeps a self trade economically neutral', () => {
    const ledger = new AccountLedger();
    ledger.createAccount('self');
    const before = structuredClone({
      cash: ledger.getAccount('self').availableCashCents,
      position: ledger.getAccount('self').positions.get('AAPL')
    });
    const book = new OrderBook(ledger);
    const engine = new MatchingEngine(book, ledger);
    book.place({ userId: 'self', symbol: 'AAPL', side: 'sell', limitPriceCents: 23_000, quantity: 10 });
    book.place({ userId: 'self', symbol: 'AAPL', side: 'buy', limitPriceCents: 23_000, quantity: 10 });

    engine.match('AAPL');

    expect(ledger.getAccount('self').availableCashCents).toBe(before.cash);
    expect(ledger.getAccount('self').positions.get('AAPL')).toEqual(before.position);
  });

  it('uses the earlier buy as the resting price and exposes recent trades', () => {
    const ledger = new AccountLedger();
    ledger.createAccount('buyer');
    ledger.createAccount('seller');
    const book = new OrderBook(ledger);
    const engine = new MatchingEngine(book, ledger);
    book.place({ userId: 'buyer', symbol: 'MSFT', side: 'buy', limitPriceCents: 45_000, quantity: 2 });
    book.place({ userId: 'seller', symbol: 'MSFT', side: 'sell', limitPriceCents: 44_000, quantity: 2 });

    const [trade] = engine.match('MSFT');

    expect(trade?.priceCents).toBe(45_000);
    expect(engine.tradesForUser('buyer', 1)).toEqual([trade]);
    expect(engine.tradesForUser('outsider')).toEqual([]);
  });

  it('calculates total assets from current quotes and rejects missing quotes', () => {
    const ledger = new AccountLedger();
    ledger.createAccount('user');
    const prices = new Map([['AAPL', 10_000], ['MSFT', 20_000], ['NVDA', 30_000]]);
    expect(ledger.totalAssetsCents('user', prices)).toBe(160_000_000);
    expect(() => ledger.totalAssetsCents('user', new Map())).toThrow('缺少行情');
    expect(() => ledger.createAccount('user')).toThrow('账户已存在');
    expect(() => ledger.getAccount('missing')).toThrow('账户不存在');
  });
});
