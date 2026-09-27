import { STOCK_SEEDS } from '@stock-trading/shared';
import type { AccountLedger } from './account-ledger.js';
import type { Order, PlaceOrderInput } from './order-types.js';

const SYMBOLS = new Set(STOCK_SEEDS.map((seed) => seed.symbol));

export class OrderBook {
  private readonly orders: Order[] = [];
  private sequence = 0;

  constructor(
    private readonly ledger: AccountLedger,
    private readonly now: () => string = () => new Date().toISOString()
  ) {}

  place(input: PlaceOrderInput): Order {
    if (!SYMBOLS.has(input.symbol)) throw new Error('未知股票');
    if (!Number.isSafeInteger(input.limitPriceCents) || input.limitPriceCents <= 0) throw new Error('价格必须是正整数');
    if (!Number.isSafeInteger(input.quantity) || input.quantity <= 0) throw new Error('数量必须是正整数');
    if (input.side !== 'buy' && input.side !== 'sell') throw new Error('委托方向无效');

    if (input.side === 'buy') this.ledger.reserveBuy(input.userId, input.limitPriceCents, input.quantity);
    else this.ledger.reserveSell(input.userId, input.symbol, input.quantity);

    const sequence = ++this.sequence;
    const order: Order = {
      ...input,
      id: `order-${sequence}`,
      originalQuantity: input.quantity,
      remainingQuantity: input.quantity,
      status: 'open',
      createdAt: this.now(),
      sequence
    };
    this.orders.push(order);
    return order;
  }

  activeBuys(symbol: string): Order[] {
    return this.active(symbol, 'buy').sort((a, b) => b.limitPriceCents - a.limitPriceCents || a.sequence - b.sequence);
  }

  activeSells(symbol: string): Order[] {
    return this.active(symbol, 'sell').sort((a, b) => a.limitPriceCents - b.limitPriceCents || a.sequence - b.sequence);
  }

  ordersForUser(userId: string): Order[] {
    return this.orders.filter((order) => order.userId === userId).sort((a, b) => b.sequence - a.sequence);
  }

  private active(symbol: string, side: 'buy' | 'sell'): Order[] {
    return this.orders.filter((order) => order.symbol === symbol && order.side === side && order.remainingQuantity > 0);
  }
}
