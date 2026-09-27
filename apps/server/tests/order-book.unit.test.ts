import { describe, expect, it } from 'vitest';
import { AccountLedger } from '../src/domain/account-ledger.js';
import { OrderBook } from '../src/domain/order-book.js';

describe('OrderBook', () => {
  it('sorts buys by descending price and stable sequence', () => {
    const ledger = new AccountLedger();
    for (const user of ['a', 'b', 'c']) ledger.createAccount(user);
    const book = new OrderBook(ledger, () => '2026-01-01T00:00:00.000Z');

    const first = book.place({ userId: 'a', symbol: 'AAPL', side: 'buy', limitPriceCents: 100, quantity: 1 });
    const better = book.place({ userId: 'b', symbol: 'AAPL', side: 'buy', limitPriceCents: 101, quantity: 1 });
    const second = book.place({ userId: 'c', symbol: 'AAPL', side: 'buy', limitPriceCents: 100, quantity: 1 });

    expect(book.activeBuys('AAPL').map((order) => order.id)).toEqual([better.id, first.id, second.id]);
  });

  it('freezes only available holdings for sell orders', () => {
    const ledger = new AccountLedger();
    ledger.createAccount('seller');
    const book = new OrderBook(ledger);

    book.place({ userId: 'seller', symbol: 'AAPL', side: 'sell', limitPriceCents: 100, quantity: 700 });
    expect(ledger.getAccount('seller').positions.get('AAPL')).toMatchObject({ availableQuantity: 300, reservedQuantity: 700 });
    expect(() => book.place({ userId: 'seller', symbol: 'AAPL', side: 'sell', limitPriceCents: 100, quantity: 301 })).toThrow('可用持仓不足');
    expect(book.activeSells('AAPL')).toHaveLength(1);
  });

  it('rejects invalid symbols and quantities without side effects', () => {
    const ledger = new AccountLedger();
    ledger.createAccount('user');
    const book = new OrderBook(ledger);
    expect(() => book.place({ userId: 'user', symbol: 'NONE', side: 'buy', limitPriceCents: 100, quantity: 1 })).toThrow('未知股票');
    expect(() => book.place({ userId: 'user', symbol: 'AAPL', side: 'buy', limitPriceCents: 100, quantity: 1.5 })).toThrow('数量必须是正整数');
    expect(book.ordersForUser('user')).toEqual([]);
  });
});
