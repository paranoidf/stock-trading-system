import type { RealtimeEvent } from '@stock-trading/shared';

interface SocketLike {
  addEventListener(name: string, handler: (event: { data?: unknown }) => void): void;
  close(): void;
}

export function parseRealtimeEvent(payload: unknown): RealtimeEvent | null {
  if (typeof payload !== 'string') return null;
  try {
    const value: unknown = JSON.parse(payload);
    if (!value || typeof value !== 'object') return null;
    const candidate = value as { type?: unknown; version?: unknown; data?: unknown };
    if (candidate.version !== 1) return null;
    if (!['market.updated', 'order.updated', 'portfolio.updated', 'trade.created'].includes(String(candidate.type))) return null;
    if (candidate.data === undefined) return null;
    return candidate as RealtimeEvent;
  } catch {
    return null;
  }
}

export function startRealtime(
  onEvent: (event: RealtimeEvent) => void,
  socketFactory: () => SocketLike = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return new WebSocket(`${protocol}//${window.location.host}/ws`);
  }
) {
  const socket = socketFactory();
  socket.addEventListener('message', (message) => {
    const event = parseRealtimeEvent(message.data);
    if (event) onEvent(event);
  });
  return () => socket.close();
}
