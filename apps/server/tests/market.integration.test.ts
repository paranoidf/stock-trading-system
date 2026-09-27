import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('GET /api/market/stocks', () => {
  it('returns the required market fields', async () => {
    const runtime = createApp();
    const response = await request(runtime.app).get('/api/market/stocks').expect(200);
    runtime.close();
    expect(response.body).toHaveLength(3);
    expect(response.body[0]).toEqual(expect.objectContaining({ symbol: expect.any(String), name: expect.any(String), price: expect.stringMatching(/^\d+\.\d{2}$/), changePercent: expect.any(String), updatedAt: expect.any(String) }));
  });
});
