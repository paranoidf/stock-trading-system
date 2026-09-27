import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

describe('生产单进程入口', () => {
  const cleanups: Array<() => Promise<void> | void> = [];
  afterEach(async () => { while (cleanups.length) await cleanups.pop()!(); });

  it('提供 SPA 回退但不吞掉未知 API', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'stock-trading-static-'));
    cleanups.push(() => rm(directory, { recursive: true, force: true }));
    await writeFile(join(directory, 'index.html'), '<!doctype html><title>股票模拟交易系统</title>', 'utf8');
    const runtime = createApp({ staticDirectory: directory, secureCookies: false });
    cleanups.push(runtime.close);

    expect((await request(runtime.app).get('/portfolio').expect(200)).text).toContain('股票模拟交易系统');
    expect((await request(runtime.app).get('/api/not-found').expect(404)).text).not.toContain('股票模拟交易系统');
    const register = await request(runtime.app).post('/api/auth/register')
      .send({ username: 'production_user', password: 'password123' }).expect(201);
    expect(register.headers['set-cookie']?.[0]).not.toContain('Secure');
  });

  it('只在明确启用 HTTPS Cookie 时添加 Secure', async () => {
    const runtime = createApp({ secureCookies: true });
    cleanups.push(runtime.close);
    const register = await request(runtime.app).post('/api/auth/register')
      .send({ username: 'secure_user', password: 'password123' }).expect(201);
    expect(register.headers['set-cookie']?.[0]).toContain('Secure');
  });
});
