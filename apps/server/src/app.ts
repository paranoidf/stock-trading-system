import express from 'express';
import { AccountLedger } from './domain/account-ledger.js';
import { MatchingEngine } from './domain/matching-engine.js';
import { OrderBook } from './domain/order-book.js';
import { createLifecycle } from './lifecycle.js';
import { AuthService } from './modules/auth.js';
import { createMarketRouter, MarketSimulator } from './modules/market.js';
import { TradingService } from './modules/trading.js';
import { createAuthRouter } from './routes/auth.js';
import { createTradingRouter } from './routes/trading.js';
import { attachWebSocket } from './realtime/websocket.js';
import type { Server } from 'node:http';
import type { AppOptions } from './config.js';
import { serveWebApplication } from './static.js';

export function createApp(options: AppOptions = {}) {
  const app = express();
  const lifecycle = createLifecycle();
  const ledger = new AccountLedger();
  const auth = new AuthService();
  const market = new MarketSimulator();
  const book = new OrderBook(ledger);
  const engine = new MatchingEngine(book, ledger);
  const trading = new TradingService(book, engine, ledger, market);
  market.start();
  lifecycle.add(() => market.stop());

  app.disable('x-powered-by');
  app.use(express.json({ limit: '16kb' }));
  app.get('/api/health', (_request, response) => {
    response.json({ status: 'ok' });
  });
  app.use(createAuthRouter(auth, ledger, options.secureCookies));
  app.use(createMarketRouter(market));
  app.use(createTradingRouter(auth, trading));
  if (options.staticDirectory) serveWebApplication(app, options.staticDirectory);

  let realtimeAttached = false;
  const attachRealtime = (server: Server) => {
    if (realtimeAttached) throw new Error('WebSocket 已绑定');
    realtimeAttached = true;
    lifecycle.add(attachWebSocket(server, auth, market, trading));
  };

  return { app, close: lifecycle.close, attachRealtime, lifecycle, services: { auth, ledger, market, trading } };
}
