export interface Trade {
  id: string;
  symbol: string;
  priceCents: number;
  quantity: number;
  buyOrderId: string;
  sellOrderId: string;
  buyerId: string;
  sellerId: string;
  executedAt: string;
  sequence: number;
}
