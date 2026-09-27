import { describe, expect, it } from 'vitest';
import { STOCK_SEEDS } from '@stock-trading/shared';
import { AccountLedger } from '../src/domain/account-ledger.js';

describe('AccountLedger', () => {
  it('creates deterministic seed assets independent of current quotes', () => {
    const ledger = new AccountLedger();
    const account = ledger.createAccount('user-1');

    expect(account.availableCashCents).toBe(100_000_000);
    expect(account.reservedCashCents).toBe(0);
    for (const seed of STOCK_SEEDS) {
      expect(account.positions.get(seed.symbol)).toEqual({
        symbol: seed.symbol,
        quantity: 1000,
        availableQuantity: 1000,
        reservedQuantity: 0,
        averageCostCents: seed.baselinePriceCents
      });
    }
  });

  it('reserves only available shares and never permits naked selling', () => {
    const ledger = new AccountLedger();
    ledger.createAccount('seller');

    ledger.reserveSell('seller', 'AAPL', 600);
    expect(ledger.getAccount('seller').positions.get('AAPL')).toMatchObject({
      quantity: 1000,
      availableQuantity: 400,
      reservedQuantity: 600
    });
    expect(() => ledger.reserveSell('seller', 'AAPL', 401)).toThrow('可用持仓不足');
  });

  it('settles cash and transfers frozen shares without changing totals', () => {
    const ledger = new AccountLedger();
    ledger.createAccount('buyer');
    ledger.createAccount('seller');
    ledger.reserveBuy('buyer', 25_000, 100);
    ledger.reserveSell('seller', 'AAPL', 100);

    ledger.settleTrade({
      buyerId: 'buyer', sellerId: 'seller', symbol: 'AAPL', quantity: 100,
      tradePriceCents: 24_000, buyLimitPriceCents: 25_000
    });

    const buyer = ledger.getAccount('buyer');
    const seller = ledger.getAccount('seller');
    expect(buyer.availableCashCents).toBe(100_000_000 - 2_400_000);
    expect(buyer.reservedCashCents).toBe(0);
    expect(buyer.positions.get('AAPL')?.quantity).toBe(1100);
    expect(seller.availableCashCents).toBe(102_400_000);
    expect(seller.positions.get('AAPL')).toMatchObject({ quantity: 900, reservedQuantity: 0 });
  });
});
