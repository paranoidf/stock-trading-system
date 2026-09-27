// @vitest-environment jsdom
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import TradeTicket from './TradeTicket.vue';

describe('TradeTicket', () => {
  it('submits a valid integer limit order', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const wrapper = mount(TradeTicket, { props: { symbols: ['AAPL'], onSubmit } });
    await wrapper.get('input[name="price"]').setValue('230.00');
    await wrapper.get('input[name="quantity"]').setValue('10');
    await wrapper.get('button[type="submit"]').trigger('submit');
    await Promise.resolve();
    expect(onSubmit).toHaveBeenCalledWith({ symbol: 'AAPL', side: 'buy', price: '230.00', quantity: 10 });
  });
});
