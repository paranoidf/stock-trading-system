import { reactive, readonly } from 'vue';
import type { SnapshotDto } from '@stock-trading/shared';

export function createSessionStore() {
  const state = reactive<{
    user: SnapshotDto['user'] | null;
    market: SnapshotDto['market'];
    orders: SnapshotDto['orders'];
    portfolio: SnapshotDto['portfolio'] | null;
    trades: SnapshotDto['trades'];
  }>({ user: null, market: [], orders: [], portfolio: null, trades: [] });

  return {
    state: readonly(state),
    applySnapshot(snapshot: SnapshotDto) {
      state.user = snapshot.user;
      state.market = snapshot.market;
      state.orders = snapshot.orders;
      state.portfolio = snapshot.portfolio;
      state.trades = snapshot.trades;
    },
    updateMarket(market: SnapshotDto['market']) {
      state.market = market;
    },
    clear() {
      state.user = null;
      state.market = [];
      state.orders = [];
      state.portfolio = null;
      state.trades = [];
    }
  };
}

export const sessionStore = createSessionStore();
