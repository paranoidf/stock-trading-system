import { createServer } from 'node:http';
import WebSocket from 'ws';
import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

describe('公共行情 WebSocket', () => {
  const cleanups: Array<() => Promise<void> | void> = [];
  afterEach(async () => {
    while (cleanups.length) await cleanups.pop()!();
  });

  it('只允许有效会话连接并推送版本化行情事件', async () => {
    const runtime = createApp();
    const user = runtime.services.auth.register('socket_user', 'password123');
    runtime.services.ledger.createAccount(user.id);
    const token = runtime.services.auth.createSession(user.id);
    const server = createServer(runtime.app);
    runtime.attachRealtime(server);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    cleanups.push(async () => {
      await new Promise<void>((resolve) => server.close(() => resolve()));
      runtime.close();
    });
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('测试服务器未监听 TCP 端口');

    const unauthorized = new WebSocket(`ws://127.0.0.1:${address.port}/ws`);
    const unauthorizedStatus = await new Promise<number>((resolve) => {
      unauthorized.once('unexpected-response', (_request, response) => resolve(response.statusCode ?? 0));
    });
    expect(unauthorizedStatus).toBe(401);

    const socket = new WebSocket(`ws://127.0.0.1:${address.port}/ws`, { headers: { Cookie: `session=${token}` } });
    cleanups.push(() => socket.close());
    await new Promise<void>((resolve, reject) => {
      socket.once('open', resolve);
      socket.once('error', reject);
    });
    const message = new Promise<string>((resolve) => socket.once('message', (data) => resolve(data.toString())));
    runtime.services.market.tick();

    expect(JSON.parse(await message)).toMatchObject({
      type: 'market.updated',
      version: 1,
      data: expect.arrayContaining([expect.objectContaining({ symbol: 'AAPL' })])
    });
  });
});
