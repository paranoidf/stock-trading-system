import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiRequest } from './api.js';

describe('API 客户端', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('把成功的 204 无内容响应解析为 undefined', async () => {
    const json = vi.fn();
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 204, json })));
    await expect(apiRequest('/api/auth/logout', { method: 'POST' })).resolves.toBeUndefined();
    expect(json).not.toHaveBeenCalled();
  });
});
