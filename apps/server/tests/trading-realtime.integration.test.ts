import { createServer } from 'node:http';
import request from 'supertest';
import WebSocket from 'ws';
import { afterEach, describe, expect, it } from 'vitest';
import type { SnapshotDto } from '@stock-trading/shared';
import { parseMoney } from '@stock-trading/shared';
import { createApp } from '../src/app.js';

describe('双用户 REST/WebSocket 集成矩阵', () => {
  const cleanups: Array<() => Promise<void> | void> = [];
  afterEach(async () => { while (cleanups.length) await cleanups.pop()!(); });

  it('从确定性种子资产完成交叉成交并保持快照、事件和守恒一致', async () => {
    const runtime = createApp();
    const server = createServer(runtime.app);
    runtime.attachRealtime(server);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    cleanups.push(async () => {
      runtime.close();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    });
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('测试服务器未监听 TCP 端口');
    const sellerAgent = request.agent(server);
    const buyerAgent = request.agent(server);
    const register = async (agent: ReturnType<typeof request.agent>, username: string) => {
      const response = await agent.post('/api/auth/register').send({ username, password: 'password123' }).expect(201);
      const cookies = response.headers['set-cookie'];
      const cookie = Array.isArray(cookies) ? cookies[0] : cookies;
      if (!cookie) throw new Error('注册响应未设置会话 Cookie');
      return cookie.split(';')[0]!;
    };
    const sellerCookie = await register(sellerAgent, 'matrix_seller');
    const buyerCookie = await register(buyerAgent, 'matrix_buyer');
    const initialSeller = (await sellerAgent.get('/api/snapshot').expect(200)).body as SnapshotDto;
    const initialBuyer = (await buyerAgent.get('/api/snapshot').expect(200)).body as SnapshotDto;
    for (const snapshot of [initialSeller, initialBuyer]) {
      expect(snapshot.portfolio.availableCash).toBe('1000000.00');
      expect(snapshot.portfolio.reservedCash).toBe('0.00');
      expect(snapshot.portfolio.positions).toEqual(expect.arrayContaining([
        expect.objectContaining({ symbol: 'AAPL', quantity: 1000, availableQuantity: 1000, reservedQuantity: 0, averageCost: '235.00' })
      ]));
    }

    await sellerAgent.post('/api/orders').send({ symbol: 'AAPL', side: 'sell', price: '100.00', quantity: 10 }).expect(201);
    const connect = async (cookie: string) => {
      const socket = new WebSocket(`ws://127.0.0.1:${address.port}/ws`, { headers: { Cookie: cookie } });
      await new Promise<void>((resolve, reject) => { socket.once('open', resolve); socket.once('error', reject); });
      cleanups.push(() => socket.close());
      return socket;
    };
    const sellerSocket = await connect(sellerCookie);
    const buyerSocket = await connect(buyerCookie);
    const sellerEvents: unknown[] = [];
    const buyerEvents: unknown[] = [];
    sellerSocket.on('message', (data) => sellerEvents.push(JSON.parse(data.toString())));
    buyerSocket.on('message', (data) => buyerEvents.push(JSON.parse(data.toString())));

    await buyerAgent.post('/api/orders').send({ symbol: 'AAPL', side: 'buy', price: '101.00', quantity: 10 }).expect(201);
    await new Promise((resolve) => setTimeout(resolve, 50));
    const seller = (await sellerAgent.get('/api/snapshot').expect(200)).body as SnapshotDto;
    const buyer = (await buyerAgent.get('/api/snapshot').expect(200)).body as SnapshotDto;
    const sellerAapl = seller.portfolio.positions.find((position) => position.symbol === 'AAPL')!;
    const buyerAapl = buyer.portfolio.positions.find((position) => position.symbol === 'AAPL')!;

    expect(sellerAapl).toMatchObject({ quantity: 990, availableQuantity: 990, reservedQuantity: 0 });
    expect(buyerAapl).toMatchObject({ quantity: 1010, availableQuantity: 1010, reservedQuantity: 0 });
    expect(sellerAapl.quantity + buyerAapl.quantity).toBe(2000);
    expect(parseMoney(seller.portfolio.availableCash) + parseMoney(seller.portfolio.reservedCash)
      + parseMoney(buyer.portfolio.availableCash) + parseMoney(buyer.portfolio.reservedCash)).toBe(200_000_000);
    expect(seller.trades[0]).toMatchObject({ side: 'sell', price: '100.00', quantity: 10 });
    expect(buyer.trades[0]).toMatchObject({ side: 'buy', price: '100.00', quantity: 10 });
    expect(sellerEvents).toEqual(expect.arrayContaining([expect.objectContaining({ type: 'portfolio.updated', data: seller.portfolio })]));
    expect(buyerEvents).toEqual(expect.arrayContaining([expect.objectContaining({ type: 'portfolio.updated', data: buyer.portfolio })]));
  });
});
