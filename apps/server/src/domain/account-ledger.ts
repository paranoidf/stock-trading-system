import { STOCK_SEEDS } from '@stock-trading/shared';
import type { Account, Position, TradeSettlement } from './account-types.js';

const INITIAL_CASH_CENTS = 100_000_000;
const INITIAL_SHARES = 1000;

function requirePositiveInteger(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value <= 0) throw new Error(`${label}必须是正整数`);
}

export class AccountLedger {
  private readonly accounts = new Map<string, Account>();

  createAccount(userId: string): Account {
    if (this.accounts.has(userId)) throw new Error('账户已存在');
    const positions = new Map<string, Position>(STOCK_SEEDS.map((seed) => [seed.symbol, {
      symbol: seed.symbol,
      quantity: INITIAL_SHARES,
      availableQuantity: INITIAL_SHARES,
      reservedQuantity: 0,
      averageCostCents: seed.baselinePriceCents
    }]));
    const account: Account = {
      userId,
      availableCashCents: INITIAL_CASH_CENTS,
      reservedCashCents: 0,
      positions
    };
    this.accounts.set(userId, account);
    return account;
  }

  getAccount(userId: string): Account {
    const account = this.accounts.get(userId);
    if (!account) throw new Error('账户不存在');
    return account;
  }

  reserveBuy(userId: string, limitPriceCents: number, quantity: number): void {
    requirePositiveInteger(limitPriceCents, '价格');
    requirePositiveInteger(quantity, '数量');
    const account = this.getAccount(userId);
    const amount = limitPriceCents * quantity;
    if (!Number.isSafeInteger(amount) || account.availableCashCents < amount) throw new Error('可用资金不足');
    account.availableCashCents -= amount;
    account.reservedCashCents += amount;
  }

  reserveSell(userId: string, symbol: string, quantity: number): void {
    requirePositiveInteger(quantity, '数量');
    const position = this.requirePosition(userId, symbol);
    if (position.availableQuantity < quantity) throw new Error('可用持仓不足');
    position.availableQuantity -= quantity;
    position.reservedQuantity += quantity;
  }

  settleTrade(settlement: TradeSettlement): void {
    const { buyerId, sellerId, symbol, quantity, tradePriceCents, buyLimitPriceCents } = settlement;
    requirePositiveInteger(quantity, '数量');
    const buyer = this.getAccount(buyerId);
    const seller = this.getAccount(sellerId);
    const sellerPosition = this.requirePosition(sellerId, symbol);
    const reservedAmount = buyLimitPriceCents * quantity;
    const tradeAmount = tradePriceCents * quantity;
    if (buyer.reservedCashCents < reservedAmount || sellerPosition.reservedQuantity < quantity) {
      throw new Error('结算资源不足');
    }

    if (buyerId === sellerId) {
      buyer.reservedCashCents -= reservedAmount;
      buyer.availableCashCents += reservedAmount;
      sellerPosition.reservedQuantity -= quantity;
      sellerPosition.availableQuantity += quantity;
      return;
    }

    buyer.reservedCashCents -= reservedAmount;
    buyer.availableCashCents += reservedAmount - tradeAmount;
    seller.availableCashCents += tradeAmount;
    sellerPosition.reservedQuantity -= quantity;
    sellerPosition.quantity -= quantity;

    const buyerPosition = this.requirePosition(buyerId, symbol);
    const previousCost = buyerPosition.averageCostCents * buyerPosition.quantity;
    buyerPosition.quantity += quantity;
    buyerPosition.availableQuantity += quantity;
    buyerPosition.averageCostCents = Math.round((previousCost + tradeAmount) / buyerPosition.quantity);
  }

  totalAssetsCents(userId: string, prices: ReadonlyMap<string, number>): number {
    const account = this.getAccount(userId);
    let total = account.availableCashCents + account.reservedCashCents;
    for (const position of account.positions.values()) {
      const price = prices.get(position.symbol);
      if (price === undefined) throw new Error(`缺少行情：${position.symbol}`);
      total += position.quantity * price;
    }
    return total;
  }

  private requirePosition(userId: string, symbol: string): Position {
    const position = this.getAccount(userId).positions.get(symbol);
    if (!position) throw new Error('未知股票');
    return position;
  }
}
