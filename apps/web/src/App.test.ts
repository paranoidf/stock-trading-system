// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import type { SnapshotDto } from '@stock-trading/shared';
import App from './App.vue';
import { sessionStore } from './stores/session.js';

const testSnapshot: SnapshotDto = {
  user: { id: 'u1', username: 'alice' },
  market: [{ symbol: 'AAPL', name: '苹果', price: '235.00', changePercent: '+0.00', updatedAt: '2026-01-01T00:00:00.000Z' }],
  orders: [], trades: [],
  portfolio: {
    availableCash: '1000000.00', reservedCash: '0.00', totalAssets: '1235000.00',
    positions: [{ symbol: 'AAPL', quantity: 1000, availableQuantity: 1000, reservedQuantity: 0, averageCost: '235.00', marketValue: '235000.00' }]
  }
};

vi.mock('./services/api.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./services/api.js')>();
  return { ...actual, fetchSnapshot: vi.fn(async () => testSnapshot) };
});

class FakeWebSocket {
  addEventListener = vi.fn();
  close = vi.fn();
}

describe('应用状态与可访问体验', () => {
  beforeEach(() => {
    sessionStore.clear();
    vi.stubGlobal('WebSocket', FakeWebSocket);
  });

  it('展示可理解的实时状态和交易空态', async () => {
    const wrapper = mount(App);
    await flushPromises();
    expect(wrapper.text()).toContain('实时连接：正在连接');
    expect(wrapper.text()).toContain('暂无委托');
    expect(wrapper.text()).toContain('暂无成交');
    expect(wrapper.find('form').attributes('aria-labelledby')).toBeTruthy();
  });
});
