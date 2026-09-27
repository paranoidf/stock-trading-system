import type { AccountLedger } from './account-ledger.js';
import type { OrderBook } from './order-book.js';
import type { Order } from './order-types.js';
import type { Trade } from './trade-types.js';

export class MatchingEngine {
  private readonly trades: Trade[] = [];
  private sequence = 0;

  constructor(
    private readonly book: OrderBook,
    private readonly ledger: AccountLedger,
    private readonly now: () => string = () => new Date().toISOString()
  ) {}

  match(symbol: string): Trade[] {
    const created: Trade[] = [];
    while (true) {
      const buy = this.book.activeBuys(symbol)[0];
      const sell = this.book.activeSells(symbol)[0];
      if (!buy || !sell || buy.limitPriceCents < sell.limitPriceCents) break;
      const quantity = Math.min(buy.remainingQuantity, sell.remainingQuantity);
      const priceCents = buy.sequence < sell.sequence ? buy.limitPriceCents : sell.limitPriceCents;

      this.ledger.settleTrade({
        buyerId: buy.userId,
        sellerId: sell.userId,
        symbol,
        quantity,
        tradePriceCents: priceCents,
        buyLimitPriceCents: buy.limitPriceCents
      });
      this.fill(buy, quantity);
      this.fill(sell, quantity);

      const sequence = ++this.sequence;
      const trade: Trade = {
        id: `trade-${sequence}`,
        symbol,
        priceCents,
        quantity,
        buyOrderId: buy.id,
        sellOrderId: sell.id,
        buyerId: buy.userId,
        sellerId: sell.userId,
        executedAt: this.now(),
        sequence
      };
      this.trades.push(trade);
      if (this.trades.length > 500) this.trades.shift();
      created.push(trade);
    }
    return created;
  }

  tradesForUser(userId: string, limit = 50): Trade[] {
    return this.trades
      .filter((trade) => trade.buyerId === userId || trade.sellerId === userId)
      .slice(-limit)
      .reverse();
  }

  private fill(order: Order, quantity: number): void {
    order.remainingQuantity -= quantity;
    order.status = order.remainingQuantity === 0 ? 'filled' : 'partiallyFilled';
  }
}
