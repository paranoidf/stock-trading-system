import { describe, expect, it } from 'vitest';
import { AccountLedger } from '../src/domain/account-ledger.js';
import { MatchingEngine } from '../src/domain/matching-engine.js';
import { OrderBook } from '../src/domain/order-book.js';

function setup() {
  const ledger = new AccountLedger();
  for (const user of ['buyer', 'seller-a', 'seller-b']) ledger.createAccount(user);
  const book = new OrderBook(ledger, () => '2026-01-01T00:00:00.000Z');
  return { ledger, book, engine: new MatchingEngine(book, ledger, () => '2026-01-01T00:00:01.000Z') };
}

describe('MatchingEngine', () => {
  it('uses price priority and the resting order price', () => {
    const { book, engine } = setup();
    const expensive = book.place({ userId: 'seller-a', symbol: 'AAPL', side: 'sell', limitPriceCents: 23_000, quantity: 10 });
    const best = book.place({ userId: 'seller-b', symbol: 'AAPL', side: 'sell', limitPriceCents: 22_000, quantity: 10 });
    const buy = book.place({ userId: 'buyer', symbol: 'AAPL', side: 'buy', limitPriceCents: 24_000, quantity: 10 });

    const trades = engine.match('AAPL');

    expect(trades).toHaveLength(1);
    expect(trades[0]).toMatchObject({ sellOrderId: best.id, buyOrderId: buy.id, priceCents: 22_000, quantity: 10 });
    expect(expensive.status).toBe('open');
  });

  it('supports one-to-many partial fills in time order', () => {
    const { book, engine } = setup();
    const first = book.place({ userId: 'seller-a', symbol: 'AAPL', side: 'sell', limitPriceCents: 23_000, quantity: 30 });
    const second = book.place({ userId: 'seller-b', symbol: 'AAPL', side: 'sell', limitPriceCents: 23_000, quantity: 30 });
    const buy = book.place({ userId: 'buyer', symbol: 'AAPL', side: 'buy', limitPriceCents: 23_000, quantity: 50 });

    const trades = engine.match('AAPL');

    expect(trades.map((trade) => trade.sellOrderId)).toEqual([first.id, second.id]);
    expect(first.status).toBe('filled');
    expect(second).toMatchObject({ status: 'partiallyFilled', remainingQuantity: 10 });
    expect(buy.status).toBe('filled');
  });

  it('does not match orders from different symbols or a price gap', () => {
    const { book, engine } = setup();
    book.place({ userId: 'seller-a', symbol: 'AAPL', side: 'sell', limitPriceCents: 24_000, quantity: 1 });
    book.place({ userId: 'buyer', symbol: 'AAPL', side: 'buy', limitPriceCents: 23_999, quantity: 1 });
    expect(engine.match('AAPL')).toEqual([]);
  });
});
