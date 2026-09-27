import type { OrderSide, OrderStatus } from '@stock-trading/shared';

export interface PlaceOrderInput {
  userId: string;
  symbol: string;
  side: OrderSide;
  limitPriceCents: number;
  quantity: number;
}

export interface Order extends PlaceOrderInput {
  id: string;
  originalQuantity: number;
  remainingQuantity: number;
  status: OrderStatus;
  createdAt: string;
  sequence: number;
}
