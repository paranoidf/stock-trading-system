import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('authentication API', () => {
  it('registers a user with cash and deterministic seed positions', async () => {
    const runtime = createApp();
    const response = await request(runtime.app).post('/api/auth/register').send({ username: 'alice', password: 'password123' });
    runtime.close();

    expect(response.status).toBe(201);
    expect(response.headers['set-cookie']?.[0]).toContain('session=');
    expect(response.body.user.username).toBe('alice');
    expect(response.body.portfolio.availableCash).toBe('1000000.00');
    expect(response.body.portfolio.positions).toHaveLength(3);
    expect(response.body.portfolio.positions[0]).toMatchObject({ quantity: 1000, availableQuantity: 1000, reservedQuantity: 0 });
  });

  it('restores and destroys a cookie session without leaking credentials', async () => {
    const runtime = createApp();
    const agent = request.agent(runtime.app);
    await agent.post('/api/auth/register').send({ username: 'bob', password: 'password123' }).expect(201);
    const session = await agent.get('/api/session').expect(200);
    expect(session.body).toEqual({ user: { id: expect.any(String), username: 'bob' } });
    expect(JSON.stringify(session.body)).not.toContain('password');
    await agent.post('/api/auth/logout').expect(204);
    await agent.get('/api/session').expect(401);
    runtime.close();
  });

  it('rejects duplicate users and invalid credentials with stable errors', async () => {
    const runtime = createApp();
    await request(runtime.app).post('/api/auth/register').send({ username: 'alice', password: 'password123' }).expect(201);
    const duplicate = await request(runtime.app).post('/api/auth/register').send({ username: 'alice', password: 'password123' });
    expect(duplicate.body.error.code).toBe('USERNAME_TAKEN');
    const invalid = await request(runtime.app).post('/api/auth/login').send({ username: 'alice', password: 'wrongpass' });
    expect(invalid.status).toBe(401);
    expect(invalid.body.error.code).toBe('INVALID_CREDENTIALS');
    await request(runtime.app).post('/api/auth/login').send({ username: 'alice', password: 'password123' }).expect(200);
    const badName = await request(runtime.app).post('/api/auth/register').send({ username: 'a', password: 'password123' });
    expect(badName.body.error.code).toBe('INVALID_USERNAME');
    const badPassword = await request(runtime.app).post('/api/auth/register').send({ username: 'valid-user', password: 'short' });
    expect(badPassword.body.error.code).toBe('INVALID_PASSWORD');
    runtime.close();
  });
});
