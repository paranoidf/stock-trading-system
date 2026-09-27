import type { RealtimeEvent } from '@stock-trading/shared';

interface SocketLike {
  addEventListener(name: string, handler: (event: { data?: unknown }) => void): void;
  close(): void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const isString = (value: unknown): value is string => typeof value === 'string';
const isInteger = (value: unknown): value is number => Number.isSafeInteger(value);
const isMoney = (value: unknown): value is string => isString(value) && /^\d+\.\d{2}$/.test(value);
const isSide = (value: unknown) => value === 'buy' || value === 'sell';
const isStatus = (value: unknown) => value === 'open' || value === 'partiallyFilled' || value === 'filled';

function isQuote(value: unknown): boolean {
  return isRecord(value) && isString(value.symbol) && isString(value.name) && isMoney(value.price)
    && isString(value.changePercent) && isString(value.updatedAt);
}

function isOrder(value: unknown): boolean {
  return isRecord(value) && isString(value.id) && isString(value.symbol) && isSide(value.side)
    && isMoney(value.price) && isInteger(value.originalQuantity) && isInteger(value.remainingQuantity)
    && isStatus(value.status) && isString(value.createdAt);
}

function isPosition(value: unknown): boolean {
  return isRecord(value) && isString(value.symbol) && isInteger(value.quantity)
    && isInteger(value.availableQuantity) && isInteger(value.reservedQuantity)
    && isMoney(value.averageCost) && isMoney(value.marketValue);
}

function isPortfolio(value: unknown): boolean {
  return isRecord(value) && isMoney(value.availableCash) && isMoney(value.reservedCash)
    && isMoney(value.totalAssets) && Array.isArray(value.positions) && value.positions.every(isPosition);
}

function isTrade(value: unknown): boolean {
  return isRecord(value) && isString(value.id) && isString(value.symbol) && isSide(value.side)
    && isMoney(value.price) && isInteger(value.quantity) && isString(value.executedAt);
}

export function parseRealtimeEvent(payload: unknown): RealtimeEvent | null {
  if (typeof payload !== 'string') return null;
  try {
    const value: unknown = JSON.parse(payload);
    if (!isRecord(value)) return null;
    const candidate = value;
    if (candidate.version !== 1) return null;
    if (candidate.type === 'market.updated' && !(Array.isArray(candidate.data) && candidate.data.every(isQuote))) return null;
    else if (candidate.type === 'order.updated' && !isOrder(candidate.data)) return null;
    else if (candidate.type === 'portfolio.updated' && !isPortfolio(candidate.data)) return null;
    else if (candidate.type === 'trade.created' && !isTrade(candidate.data)) return null;
    else if (!['market.updated', 'order.updated', 'portfolio.updated', 'trade.created'].includes(String(candidate.type))) return null;
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
