import type { OrderSide, SnapshotDto } from '@stock-trading/shared';
import { apiRequest, fetchSnapshot } from '../services/api.js';
import { sessionStore } from './session.js';

export interface PlaceOrderRequest {
  symbol: string;
  side: OrderSide;
  price: string;
  quantity: number;
}

export function createTradingStore(applySnapshot: (snapshot: SnapshotDto) => void) {
  return {
    async refresh() {
      applySnapshot(await fetchSnapshot());
    },
    async placeOrder(order: PlaceOrderRequest) {
      await apiRequest('/api/orders', { method: 'POST', body: JSON.stringify(order) });
      applySnapshot(await fetchSnapshot());
    }
  };
}

export const tradingStore = createTradingStore(sessionStore.applySnapshot);
