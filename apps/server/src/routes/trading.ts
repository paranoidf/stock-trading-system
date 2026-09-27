import { Router, type Request, type Response } from 'express';
import { parseMoney, type OrderSide } from '@stock-trading/shared';
import type { AuthService } from '../modules/auth.js';
import type { TradingService } from '../modules/trading.js';
import { sessionToken } from './auth.js';

export function createTradingRouter(auth: AuthService, trading: TradingService) {
  const router = Router();
  const user = (request: Request, response: Response) => {
    const current = auth.userForToken(sessionToken(request));
    if (!current) response.status(401).json({ error: { code: 'UNAUTHORIZED', message: '请先登录' } });
    return current;
  };

  router.post('/api/orders', (request, response) => {
    const current = user(request, response);
    if (!current) return;
    try {
      const side = request.body?.side as OrderSide;
      const result = trading.place({
        userId: current.id,
        symbol: String(request.body?.symbol ?? ''),
        side,
        limitPriceCents: parseMoney(String(request.body?.price ?? '')),
        quantity: Number(request.body?.quantity)
      });
      response.status(201).json({ order: trading.orderDto(result.order), trades: result.trades.map((trade) => trading.tradeDto(trade, current.id)) });
    } catch (error) { domainError(response, error); }
  });
  router.get('/api/orders', (request, response) => {
    const current = user(request, response); if (!current) return;
    response.json(trading.snapshot(current).orders);
  });
  router.get('/api/portfolio', (request, response) => {
    const current = user(request, response); if (!current) return;
    response.json(trading.portfolio(current.id));
  });
  router.get('/api/trades', (request, response) => {
    const current = user(request, response); if (!current) return;
    response.json(trading.snapshot(current).trades);
  });
  router.get('/api/snapshot', (request, response) => {
    const current = user(request, response); if (!current) return;
    response.json(trading.snapshot(current));
  });
  return router;
}

function domainError(response: Response, error: unknown) {
  const message = error instanceof Error ? error.message : '请求无效';
  const code = message.includes('不足') ? 'INSUFFICIENT_RESOURCES' : 'INVALID_ORDER';
  response.status(400).json({ error: { code, message } });
}
