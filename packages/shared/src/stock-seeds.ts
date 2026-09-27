export interface StockSeed {
  readonly symbol: string;
  readonly name: string;
  readonly initialPriceCents: number;
  readonly baselinePriceCents: number;
}

const seeds: StockSeed[] = [
  { symbol: 'AAPL', name: '苹果', initialPriceCents: 23_500, baselinePriceCents: 23_500 },
  { symbol: 'MSFT', name: '微软', initialPriceCents: 42_000, baselinePriceCents: 42_000 },
  { symbol: 'NVDA', name: '英伟达', initialPriceCents: 18_000, baselinePriceCents: 18_000 }
];

export const STOCK_SEEDS: readonly Readonly<StockSeed>[] = Object.freeze(
  seeds.map((seed) => Object.freeze(seed))
);
