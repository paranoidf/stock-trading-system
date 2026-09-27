import express from 'express';
import { createLifecycle } from './lifecycle.js';

export function createApp() {
  const app = express();
  const lifecycle = createLifecycle();

  app.disable('x-powered-by');
  app.use(express.json({ limit: '16kb' }));
  app.get('/api/health', (_request, response) => {
    response.json({ status: 'ok' });
  });

  return { app, close: lifecycle.close, lifecycle };
}
