// @vitest-environment jsdom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import MarketBoard from './MarketBoard.vue';

describe('MarketBoard', () => {
  it('renders stock identity, price and signed change', () => {
    const wrapper = mount(MarketBoard, { props: { quotes: [{ symbol: 'AAPL', name: '苹果', price: '235.00', changePercent: '+1.20', updatedAt: '2026-01-01T00:00:00Z' }] } });
    expect(wrapper.text()).toContain('AAPL');
    expect(wrapper.text()).toContain('苹果');
    expect(wrapper.text()).toContain('235.00');
    expect(wrapper.text()).toContain('+1.20%');
  });
});
