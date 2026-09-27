import { describe, expect, it } from 'vitest';
import { runtimeOptions } from '../src/config.js';

describe('运行时配置', () => {
  it('开发 HTTP 默认不提供静态目录且不启用 Secure Cookie', () => {
    expect(runtimeOptions({ NODE_ENV: 'development', COOKIE_SECURE: 'false' })).toEqual({ secureCookies: false });
  });

  it('生产环境解析静态目录并仅按明确开关启用 Secure Cookie', () => {
    const options = runtimeOptions({ NODE_ENV: 'production', COOKIE_SECURE: 'true' });
    expect(options.secureCookies).toBe(true);
    expect(options.staticDirectory).toMatch(/[\\/]web$/);
  });
});
