import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTradingStore } from './trading.js';

describe('trading store', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('places an order then refreshes the authoritative snapshot', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ order: { id: 'o1' }, trades: [] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ user: { id: 'u1', username: 'alice' }, market: [], orders: [], portfolio: { availableCash: '1.00', reservedCash: '0.00', totalAssets: '1.00', positions: [] }, trades: [] }) });
    vi.stubGlobal('fetch', fetchMock);
    const applySnapshot = vi.fn();
    const store = createTradingStore(applySnapshot);
    await store.placeOrder({ symbol: 'AAPL', side: 'buy', price: '1.00', quantity: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(applySnapshot).toHaveBeenCalledOnce();
  });
});
