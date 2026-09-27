import { Router } from 'express';
import { formatMoney, STOCK_SEEDS, type StockQuoteDto } from '@stock-trading/shared';

export interface MarketQuote {
  symbol: string;
  name: string;
  priceCents: number;
  baselinePriceCents: number;
  updatedAt: string;
}

export class MarketSimulator {
  private quotes: MarketQuote[];
  private timer: ReturnType<typeof setInterval> | undefined;
  private readonly listeners = new Set<(quotes: StockQuoteDto[]) => void>();

  constructor(private readonly random = Math.random, private readonly now = () => new Date()) {
    const updatedAt = this.now().toISOString();
    this.quotes = STOCK_SEEDS.map((seed) => ({ ...seed, priceCents: seed.initialPriceCents, updatedAt }));
  }

  snapshot(): MarketQuote[] {
    return this.quotes.map((quote) => ({ ...quote }));
  }

  dto(): StockQuoteDto[] {
    return this.quotes.map((quote) => ({
      symbol: quote.symbol,
      name: quote.name,
      price: formatMoney(quote.priceCents),
      changePercent: `${((quote.priceCents - quote.baselinePriceCents) / quote.baselinePriceCents * 100) >= 0 ? '+' : ''}${((quote.priceCents - quote.baselinePriceCents) / quote.baselinePriceCents * 100).toFixed(2)}`,
      updatedAt: quote.updatedAt
    }));
  }

  tick(): MarketQuote[] {
    const updatedAt = this.now().toISOString();
    this.quotes = this.quotes.map((quote) => {
      const factor = 0.995 + this.random() * 0.01;
      return { ...quote, priceCents: Math.max(1, Math.round(quote.priceCents * factor)), updatedAt };
    });
    const dto = this.dto();
    this.listeners.forEach((listener) => listener(dto));
    return this.snapshot();
  }

  subscribe(listener: (quotes: StockQuoteDto[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  start(): void {
    if (!this.timer) this.timer = setInterval(() => this.tick(), 1000);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
    this.listeners.clear();
  }
}

export function createMarketRouter(market: MarketSimulator) {
  const router = Router();
  router.get('/api/market/stocks', (_request, response) => response.json(market.dto()));
  return router;
}
