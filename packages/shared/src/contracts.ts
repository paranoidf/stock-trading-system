export type OrderSide = 'buy' | 'sell';
export type OrderStatus = 'open' | 'partiallyFilled' | 'filled';

export interface ApiErrorBody {
  error: { code: string; message: string };
}

export interface StockQuoteDto {
  symbol: string;
  name: string;
  price: string;
  changePercent: string;
  updatedAt: string;
}

export interface PositionDto {
  symbol: string;
  quantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  averageCost: string;
  marketValue: string;
}

export interface PortfolioDto {
  availableCash: string;
  reservedCash: string;
  totalAssets: string;
  positions: PositionDto[];
}

export interface OrderDto {
  id: string;
  symbol: string;
  side: OrderSide;
  price: string;
  originalQuantity: number;
  remainingQuantity: number;
  status: OrderStatus;
  createdAt: string;
}

export interface TradeDto {
  id: string;
  symbol: string;
  side: OrderSide;
  price: string;
  quantity: number;
  executedAt: string;
}

export interface SnapshotDto {
  user: { id: string; username: string };
  market: StockQuoteDto[];
  orders: OrderDto[];
  portfolio: PortfolioDto;
  trades: TradeDto[];
}

export type RealtimeEvent =
  | { type: 'market.updated'; version: 1; data: StockQuoteDto[] }
  | { type: 'order.updated'; version: 1; data: OrderDto }
  | { type: 'portfolio.updated'; version: 1; data: PortfolioDto }
  | { type: 'trade.created'; version: 1; data: TradeDto };
