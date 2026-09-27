import { createServer } from 'node:http';
import WebSocket from 'ws';
import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

describe('私有交易 WebSocket', () => {
  const cleanups: Array<() => Promise<void> | void> = [];
  afterEach(async () => {
    while (cleanups.length) await cleanups.pop()!();
  });

  it('只向相关买卖双方发送各自的订单、资产和成交事件', async () => {
    const runtime = createApp();
    const users = ['private_seller', 'private_buyer', 'private_observer'].map((username) => {
      const user = runtime.services.auth.register(username, 'password123');
      runtime.services.ledger.createAccount(user.id);
      return { ...user, token: runtime.services.auth.createSession(user.id) };
    });
    const [seller, buyer, observer] = users;
    if (!seller || !buyer || !observer) throw new Error('测试用户创建失败');
    runtime.services.trading.place({ userId: seller.id, symbol: 'AAPL', side: 'sell', limitPriceCents: 10000, quantity: 10 });

    const server = createServer(runtime.app);
    runtime.attachRealtime(server);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    cleanups.push(async () => {
      runtime.close();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    });
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('测试服务器未监听 TCP 端口');
    const connect = async (token: string) => {
      const socket = new WebSocket(`ws://127.0.0.1:${address.port}/ws`, { headers: { Cookie: `session=${token}` } });
      await new Promise<void>((resolve, reject) => { socket.once('open', resolve); socket.once('error', reject); });
      cleanups.push(() => socket.close());
      return socket;
    };
    const sellerSocket = await connect(seller.token);
    const buyerSocket = await connect(buyer.token);
    const observerSocket = await connect(observer.token);
    const collect = (socket: WebSocket) => {
      const events: Array<{ type: string; data: unknown }> = [];
      socket.on('message', (data) => events.push(JSON.parse(data.toString())));
      return events;
    };
    const sellerEvents = collect(sellerSocket);
    const buyerEvents = collect(buyerSocket);
    const observerEvents = collect(observerSocket);

    runtime.services.trading.place({ userId: buyer.id, symbol: 'AAPL', side: 'buy', limitPriceCents: 10100, quantity: 10 });
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(sellerEvents.map((event) => event.type)).toEqual(expect.arrayContaining(['order.updated', 'portfolio.updated', 'trade.created']));
    expect(buyerEvents.map((event) => event.type)).toEqual(expect.arrayContaining(['order.updated', 'portfolio.updated', 'trade.created']));
    expect(observerEvents).toEqual([]);
    const sellerTrade = sellerEvents.find((event) => event.type === 'trade.created')?.data;
    const buyerTrade = buyerEvents.find((event) => event.type === 'trade.created')?.data;
    expect(sellerTrade).toMatchObject({ side: 'sell', quantity: 10, price: '100.00' });
    expect(buyerTrade).toMatchObject({ side: 'buy', quantity: 10, price: '100.00' });
    expect(JSON.stringify([...sellerEvents, ...buyerEvents])).not.toContain(observer.id);
  });

  it('销毁会话后立即关闭该 token 已建立的连接', async () => {
    const runtime = createApp();
    const user = runtime.services.auth.register('logout_socket', 'password123');
    runtime.services.ledger.createAccount(user.id);
    const token = runtime.services.auth.createSession(user.id);
    const server = createServer(runtime.app);
    runtime.attachRealtime(server);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    cleanups.push(async () => {
      runtime.close();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    });
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('测试服务器未监听 TCP 端口');
    const socket = new WebSocket(`ws://127.0.0.1:${address.port}/ws`, { headers: { Cookie: `session=${token}` } });
    cleanups.push(() => socket.close());
    await new Promise<void>((resolve, reject) => { socket.once('open', resolve); socket.once('error', reject); });
    const closed = new Promise<boolean>((resolve) => {
      socket.once('close', () => resolve(true));
      setTimeout(() => resolve(false), 100);
    });
    runtime.services.auth.destroySession(token);
    expect(await closed).toBe(true);
  });
});
