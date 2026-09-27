import { describe, expect, it } from 'vitest';
import { createSessionStore } from './session.js';

describe('session store', () => {
  it('atomically applies and clears an authoritative snapshot', () => {
    const store = createSessionStore();
    store.applySnapshot({
      user: { id: 'u1', username: 'alice' },
      market: [], orders: [], trades: [],
      portfolio: { availableCash: '1000000.00', reservedCash: '0.00', totalAssets: '1765000.00', positions: [] }
    });
    expect(store.state.user?.username).toBe('alice');
    expect(store.state.portfolio?.availableCash).toBe('1000000.00');

    store.clear();
    expect(store.state.user).toBeNull();
    expect(store.state.portfolio).toBeNull();
  });
});
