// @vitest-environment jsdom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import PortfolioPanel from './PortfolioPanel.vue';

describe('PortfolioPanel', () => {
  it('distinguishes initial cash, total assets and frozen holdings', () => {
    const wrapper = mount(PortfolioPanel, { props: { portfolio: {
      availableCash: '1000000.00', reservedCash: '0.00', totalAssets: '1765000.00',
      positions: [{ symbol: 'AAPL', quantity: 1000, availableQuantity: 900, reservedQuantity: 100, averageCost: '235.00', marketValue: '235000.00' }]
    } } });
    expect(wrapper.text()).toContain('可用现金 1000000.00');
    expect(wrapper.text()).toContain('总资产 1765000.00');
    expect(wrapper.text()).toContain('冻结 100');
  });
});
