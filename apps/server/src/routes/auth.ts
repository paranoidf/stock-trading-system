import { Router, type Request, type Response } from 'express';
import { formatMoney } from '@stock-trading/shared';
import type { AccountLedger } from '../domain/account-ledger.js';
import { AuthError, type AuthService } from '../modules/auth.js';

const COOKIE = 'session';

export function sessionToken(request: Request): string | undefined {
  const cookie = request.headers.cookie?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${COOKIE}=`));
  return cookie?.slice(COOKIE.length + 1);
}

export function createAuthRouter(auth: AuthService, ledger: AccountLedger, secureCookies = false) {
  const router = Router();
  const setSession = (response: Response, token: string) => {
    response.cookie(COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: secureCookies, path: '/' });
  };
  const portfolio = (userId: string) => {
    const account = ledger.getAccount(userId);
    return {
      availableCash: formatMoney(account.availableCashCents), reservedCash: formatMoney(account.reservedCashCents),
      positions: [...account.positions.values()].map((position) => ({
        symbol: position.symbol, quantity: position.quantity, availableQuantity: position.availableQuantity,
        reservedQuantity: position.reservedQuantity, averageCost: formatMoney(position.averageCostCents)
      }))
    };
  };

  router.post('/api/auth/register', (request, response) => {
    try {
      const user = auth.register(request.body?.username, request.body?.password);
      ledger.createAccount(user.id);
      setSession(response, auth.createSession(user.id));
      response.status(201).json({ user, portfolio: portfolio(user.id) });
    } catch (error) { sendError(response, error); }
  });
  router.post('/api/auth/login', (request, response) => {
    try {
      const user = auth.login(request.body?.username, request.body?.password);
      setSession(response, auth.createSession(user.id));
      response.json({ user, portfolio: portfolio(user.id) });
    } catch (error) { sendError(response, error); }
  });
  router.post('/api/auth/logout', (request, response) => {
    auth.destroySession(sessionToken(request));
    response.clearCookie(COOKIE, { path: '/' }).status(204).send();
  });
  router.get('/api/session', (request, response) => {
    const user = auth.userForToken(sessionToken(request));
    if (!user) return response.status(401).json({ error: { code: 'UNAUTHORIZED', message: '请先登录' } });
    return response.json({ user });
  });
  return router;
}

function sendError(response: Response, error: unknown) {
  if (error instanceof AuthError) return response.status(error.status).json({ error: { code: error.code, message: error.message } });
  return response.status(500).json({ error: { code: 'INTERNAL_ERROR', message: '服务器内部错误' } });
}
