import { afterEach, describe, expect, it, vi } from 'vitest';
import { MarketSimulator } from '../src/modules/market.js';

describe('MarketSimulator', () => {
  afterEach(() => vi.useRealTimers());
  it('updates every stock deterministically within the 0.5 percent bound', () => {
    const market = new MarketSimulator(() => 1, () => new Date('2026-01-01T00:00:01Z'));
    const before = market.snapshot();
    const after = market.tick();
    expect(after).toHaveLength(3);
    after.forEach((quote, index) => {
      expect(quote.priceCents).toBe(Math.round(before[index]!.priceCents * 1.005));
      expect(quote.priceCents).toBeGreaterThan(0);
    });
  });

  it('notifies subscribers and stops scheduled updates cleanly', () => {
    vi.useFakeTimers();
    const market = new MarketSimulator(() => 0.5, () => new Date('2026-01-01T00:00:01Z'));
    const listener = vi.fn();
    const unsubscribe = market.subscribe(listener);
    market.start();
    market.start();
    vi.advanceTimersByTime(1000);
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    market.stop();
    vi.advanceTimersByTime(1000);
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
