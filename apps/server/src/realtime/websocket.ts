import type { Server } from 'node:http';
import type { IncomingMessage } from 'node:http';
import { WebSocket, WebSocketServer } from 'ws';
import type { RealtimeEvent } from '@stock-trading/shared';
import type { AuthService } from '../modules/auth.js';
import type { MarketSimulator } from '../modules/market.js';
import type { TradingService } from '../modules/trading.js';

function sessionToken(request: IncomingMessage): string | undefined {
  const cookie = request.headers.cookie?.split(';').map((part) => part.trim())
    .find((part) => part.startsWith('session='));
  return cookie?.slice('session='.length);
}

export function attachWebSocket(server: Server, auth: AuthService, market: MarketSimulator, trading: TradingService) {
  const sockets = new Set<WebSocket>();
  const userSockets = new Map<string, Set<WebSocket>>();
  const usersByRequest = new WeakMap<IncomingMessage, string>();
  const wss = new WebSocketServer({ noServer: true });
  const onUpgrade = (request: IncomingMessage, socket: import('node:stream').Duplex, head: Buffer) => {
    if (new URL(request.url ?? '/', 'http://localhost').pathname !== '/ws') return;
    const user = auth.userForToken(sessionToken(request));
    if (!user) {
      socket.write('HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n');
      socket.destroy();
      return;
    }
    usersByRequest.set(request, user.id);
    wss.handleUpgrade(request, socket, head, (client) => wss.emit('connection', client, request));
  };
  server.on('upgrade', onUpgrade);
  wss.on('connection', (socket, request) => {
    sockets.add(socket);
    const userId = usersByRequest.get(request);
    if (userId) {
      const channels = userSockets.get(userId) ?? new Set<WebSocket>();
      channels.add(socket);
      userSockets.set(userId, channels);
    }
    socket.once('close', () => {
      sockets.delete(socket);
      if (!userId) return;
      const channels = userSockets.get(userId);
      channels?.delete(socket);
      if (channels?.size === 0) userSockets.delete(userId);
    });
  });
  const unsubscribe = market.subscribe((quotes) => {
    const event: RealtimeEvent = { type: 'market.updated', version: 1, data: quotes };
    const payload = JSON.stringify(event);
    for (const socket of sockets) if (socket.readyState === WebSocket.OPEN) socket.send(payload);
  });
  const unsubscribeTrading = trading.subscribe(({ order, trades, userIds }) => {
    const relatedOrderIds = new Set([order.id, ...trades.flatMap((trade) => [trade.buyOrderId, trade.sellOrderId])]);
    for (const userId of userIds) {
      const channels = userSockets.get(userId);
      if (!channels?.size) continue;
      const events: RealtimeEvent[] = trading.book.ordersForUser(userId)
        .filter((candidate) => relatedOrderIds.has(candidate.id))
        .map((candidate) => ({ type: 'order.updated', version: 1, data: trading.orderDto(candidate) }));
      events.push({ type: 'portfolio.updated', version: 1, data: trading.portfolio(userId) });
      for (const trade of trades) {
        if (trade.buyerId === userId || trade.sellerId === userId) {
          events.push({ type: 'trade.created', version: 1, data: trading.tradeDto(trade, userId) });
        }
      }
      for (const event of events) {
        const payload = JSON.stringify(event);
        for (const socket of channels) if (socket.readyState === WebSocket.OPEN) socket.send(payload);
      }
    }
  });
  return () => {
    unsubscribe();
    unsubscribeTrading();
    server.off('upgrade', onUpgrade);
    for (const socket of sockets) socket.terminate();
    sockets.clear();
    userSockets.clear();
    wss.close();
  };
}
