import { formatMoney, type OrderDto, type PortfolioDto, type SnapshotDto, type TradeDto } from '@stock-trading/shared';
import type { AccountLedger } from '../domain/account-ledger.js';
import type { MatchingEngine } from '../domain/matching-engine.js';
import type { OrderBook } from '../domain/order-book.js';
import type { PlaceOrderInput } from '../domain/order-types.js';
import type { MarketSimulator } from './market.js';
import type { Order } from '../domain/order-types.js';
import type { Trade } from '../domain/trade-types.js';

export interface TradingChange {
  order: Order;
  trades: readonly Trade[];
  userIds: ReadonlySet<string>;
}

export class TradingService {
  private readonly listeners = new Set<(change: TradingChange) => void>();
  constructor(
    readonly book: OrderBook,
    readonly engine: MatchingEngine,
    readonly ledger: AccountLedger,
    readonly market: MarketSimulator
  ) {}

  place(input: PlaceOrderInput) {
    const order = this.book.place(input);
    const trades = this.engine.match(input.symbol);
    const userIds = new Set([input.userId]);
    for (const trade of trades) {
      userIds.add(trade.buyerId);
      userIds.add(trade.sellerId);
    }
    const change = { order, trades, userIds };
    for (const listener of this.listeners) {
      try { listener(change); } catch { /* 实时传输失败不得回滚已提交的交易 */ }
    }
    return { order, trades };
  }

  subscribe(listener: (change: TradingChange) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  snapshot(user: { id: string; username: string }): SnapshotDto {
    return {
      user,
      market: this.market.dto(),
      orders: this.book.ordersForUser(user.id).map((order) => this.orderDto(order)),
      portfolio: this.portfolio(user.id),
      trades: this.engine.tradesForUser(user.id).map((trade) => this.tradeDto(trade, user.id))
    };
  }

  portfolio(userId: string): PortfolioDto {
    const account = this.ledger.getAccount(userId);
    const prices = new Map(this.market.snapshot().map((quote) => [quote.symbol, quote.priceCents]));
    return {
      availableCash: formatMoney(account.availableCashCents),
      reservedCash: formatMoney(account.reservedCashCents),
      totalAssets: formatMoney(this.ledger.totalAssetsCents(userId, prices)),
      positions: [...account.positions.values()].map((position) => ({
        symbol: position.symbol,
        quantity: position.quantity,
        availableQuantity: position.availableQuantity,
        reservedQuantity: position.reservedQuantity,
        averageCost: formatMoney(position.averageCostCents),
        marketValue: formatMoney(position.quantity * prices.get(position.symbol)!)
      }))
    };
  }

  orderDto(order: ReturnType<OrderBook['place']>): OrderDto {
    return {
      id: order.id, symbol: order.symbol, side: order.side, price: formatMoney(order.limitPriceCents),
      originalQuantity: order.originalQuantity, remainingQuantity: order.remainingQuantity,
      status: order.status, createdAt: order.createdAt
    };
  }

  tradeDto(trade: ReturnType<MatchingEngine['tradesForUser']>[number], userId: string): TradeDto {
    return {
      id: trade.id, symbol: trade.symbol, side: trade.buyerId === userId ? 'buy' : 'sell',
      price: formatMoney(trade.priceCents), quantity: trade.quantity, executedAt: trade.executedAt
    };
  }
}
