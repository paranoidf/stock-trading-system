import { describe, expect, it } from 'vitest';
import { formatMoney, parseMoney } from '../src/money.js';
import { STOCK_SEEDS } from '../src/stock-seeds.js';

describe('money boundary conversion', () => {
  it('parses and formats exactly two decimal places', () => {
    expect(parseMoney('1000000.00')).toBe(100_000_000);
    expect(formatMoney(12_345)).toBe('123.45');
  });

  it('rejects invalid precision and unsafe values', () => {
    expect(() => parseMoney('1.001')).toThrow('金额格式无效');
    expect(() => parseMoney('-1.00')).toThrow('金额格式无效');
  });
});

describe('stock seeds', () => {
  it('defines at least three unique stocks with immutable baseline prices', () => {
    expect(STOCK_SEEDS.length).toBeGreaterThanOrEqual(3);
    expect(new Set(STOCK_SEEDS.map((stock) => stock.symbol)).size).toBe(STOCK_SEEDS.length);
    expect(STOCK_SEEDS.every((stock) => stock.baselinePriceCents > 0)).toBe(true);
    expect(Object.isFrozen(STOCK_SEEDS)).toBe(true);
    expect(STOCK_SEEDS.every(Object.isFrozen)).toBe(true);
  });
});
