// @vitest-environment jsdom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import TradeHistory from './TradeHistory.vue';

describe('TradeHistory', () => {
  it('renders the user side and execution details', () => {
    const wrapper = mount(TradeHistory, { props: { trades: [{ id: 't1', symbol: 'AAPL', side: 'sell', price: '230.00', quantity: 10, executedAt: '2026-01-01T00:00:00Z' }] } });
    expect(wrapper.text()).toContain('卖出');
    expect(wrapper.text()).toContain('230.00');
    expect(wrapper.text()).toContain('10');
  });
});
