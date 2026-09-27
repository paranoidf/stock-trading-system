// @vitest-environment jsdom
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AuthPanel from './AuthPanel.vue';

describe('AuthPanel', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('registers and emits the authenticated response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ user: { id: 'u1', username: 'alice' }, portfolio: { positions: [] } })
    }));
    const wrapper = mount(AuthPanel);
    await wrapper.get('input[name="username"]').setValue('alice');
    await wrapper.get('input[name="password"]').setValue('password123');
    await wrapper.get('button[data-action="register"]').trigger('click');
    await Promise.resolve();
    await Promise.resolve();
    expect(wrapper.emitted('authenticated')).toHaveLength(1);
  });
});
