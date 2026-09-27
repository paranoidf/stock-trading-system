import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

async function register(app: ReturnType<typeof createApp>['app'], username: string) {
  const agent = request.agent(app);
  await agent.post('/api/auth/register').send({ username, password: 'password123' }).expect(201);
  return agent;
}

describe('trading REST API', () => {
  it('matches two users and returns isolated authoritative snapshots', async () => {
    const runtime = createApp();
    const seller = await register(runtime.app, 'seller');
    const buyer = await register(runtime.app, 'buyer');

    const sellResponse = await seller.post('/api/orders').send({ symbol: 'AAPL', side: 'sell', price: '230.00', quantity: 100 });
    expect(sellResponse.status, JSON.stringify(sellResponse.body)).toBe(201);
    const sellerOpen = await seller.get('/api/snapshot').expect(200);
    expect(sellerOpen.body.portfolio.positions.find((position: { symbol: string }) => position.symbol === 'AAPL')).toMatchObject({ availableQuantity: 900, reservedQuantity: 100 });

    await buyer.post('/api/orders').send({ symbol: 'AAPL', side: 'buy', price: '240.00', quantity: 100 }).expect(201);
    const sellerDone = await seller.get('/api/snapshot').expect(200);
    const buyerDone = await buyer.get('/api/snapshot').expect(200);
    expect(sellerDone.body.orders[0].status).toBe('filled');
    expect(buyerDone.body.orders[0].status).toBe('filled');
    expect(sellerDone.body.trades).toHaveLength(1);
    expect(buyerDone.body.trades).toHaveLength(1);
    expect(sellerDone.body.portfolio.positions.find((position: { symbol: string }) => position.symbol === 'AAPL').quantity).toBe(900);
    expect(buyerDone.body.portfolio.positions.find((position: { symbol: string }) => position.symbol === 'AAPL').quantity).toBe(1100);
    await buyer.get('/api/orders').expect(200);
    await buyer.get('/api/portfolio').expect(200);
    await buyer.get('/api/trades').expect(200);
    runtime.close();
  });

  it('rejects unauthenticated and invalid orders without mutation', async () => {
    const runtime = createApp();
    await request(runtime.app).post('/api/orders').send({ symbol: 'AAPL', side: 'buy', price: '1.00', quantity: 1 }).expect(401);
    const agent = await register(runtime.app, 'alice');
    const invalid = await agent.post('/api/orders').send({ symbol: 'AAPL', side: 'sell', price: '1.001', quantity: 1001 });
    expect(invalid.status).toBe(400);
    const snapshot = await agent.get('/api/snapshot');
    expect(snapshot.body.orders).toEqual([]);
    const insufficient = await agent.post('/api/orders').send({ symbol: 'AAPL', side: 'sell', price: '1.00', quantity: 1001 });
    expect(insufficient.body.error.code).toBe('INSUFFICIENT_RESOURCES');
    runtime.close();
  });
});
