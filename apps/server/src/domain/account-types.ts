export interface Position {
  symbol: string;
  quantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  averageCostCents: number;
}

export interface Account {
  userId: string;
  availableCashCents: number;
  reservedCashCents: number;
  positions: Map<string, Position>;
}

export interface TradeSettlement {
  buyerId: string;
  sellerId: string;
  symbol: string;
  quantity: number;
  tradePriceCents: number;
  buyLimitPriceCents: number;
}
