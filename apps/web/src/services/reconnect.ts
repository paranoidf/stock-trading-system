import type { RealtimeEvent, SnapshotDto } from '@stock-trading/shared';
import { parseRealtimeEvent } from './realtime.js';

export interface ReconnectSocket {
  addEventListener(name: string, handler: (event: { data?: unknown }) => void): void;
  close(): void;
}

export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'stopped';

interface ReconnectOptions {
  socketFactory: () => ReconnectSocket;
  loadSnapshot: () => Promise<SnapshotDto>;
  checkSession?: () => Promise<unknown>;
  applySnapshot: (snapshot: SnapshotDto) => void;
  applyEvent: (event: RealtimeEvent) => void;
  onStatus?: (status: ConnectionStatus) => void;
  onUnauthorized?: () => void;
  baseDelayMs?: number;
  maxDelayMs?: number;
  random?: () => number;
}

export function calculateReconnectDelay(
  attempt: number,
  random: () => number = Math.random,
  baseDelayMs = 500,
  maxDelayMs = 10_000
): number {
  const exponential = baseDelayMs * 2 ** attempt;
  const jittered = Math.round(exponential * (0.9 + random() * 0.2));
  return Math.min(jittered, maxDelayMs);
}

export function createReconnectController(options: ReconnectOptions) {
  let stopped = true;
  let socket: ReconnectSocket | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let generation = 0;
  let attempt = 0;
  let syncingGeneration: number | undefined;
  let buffered: RealtimeEvent[] = [];
  const baseDelay = options.baseDelayMs ?? 500;
  const maxDelay = options.maxDelayMs ?? 10_000;

  const status = (value: ConnectionStatus) => options.onStatus?.(value);
  const unauthorized = (error: unknown) => typeof error === 'object' && error !== null
    && 'status' in error && error.status === 401;
  const stopForUnauthorized = () => {
    api.stop();
    options.onUnauthorized?.();
  };
  const scheduleReconnect = () => {
    if (stopped || timer) return;
    status('reconnecting');
    const delay = calculateReconnectDelay(attempt, options.random, baseDelay, maxDelay);
    attempt += 1;
    timer = setTimeout(() => {
      timer = undefined;
      connect();
    }, delay);
  };
  const connect = () => {
    if (stopped) return;
    const currentGeneration = ++generation;
    status(attempt === 0 ? 'connecting' : 'reconnecting');
    const currentSocket = options.socketFactory();
    socket = currentSocket;
    currentSocket.addEventListener('message', (message) => {
      if (stopped || currentGeneration !== generation) return;
      const event = parseRealtimeEvent(message.data);
      if (!event) return;
      if (syncingGeneration === currentGeneration) buffered.push(event);
      else options.applyEvent(event);
    });
    currentSocket.addEventListener('open', () => {
      if (stopped || currentGeneration !== generation) return;
      syncingGeneration = currentGeneration;
      buffered = [];
      void options.loadSnapshot().then((snapshot) => {
        if (stopped || currentGeneration !== generation) return;
        options.applySnapshot(snapshot);
        const pending = buffered;
        buffered = [];
        syncingGeneration = undefined;
        for (const event of pending) options.applyEvent(event);
        attempt = 0;
        status('connected');
      }).catch((error: unknown) => {
        if (stopped || currentGeneration !== generation) return;
        if (unauthorized(error)) {
          stopForUnauthorized();
          return;
        }
        generation += 1;
        currentSocket.close();
        scheduleReconnect();
      });
    });
    currentSocket.addEventListener('close', () => {
      if (stopped || currentGeneration !== generation) return;
      generation += 1;
      syncingGeneration = undefined;
      buffered = [];
      if (!options.checkSession) {
        scheduleReconnect();
        return;
      }
      const recoveryGeneration = generation;
      void options.checkSession().then(() => {
        if (!stopped && recoveryGeneration === generation) scheduleReconnect();
      }).catch((error: unknown) => {
        if (stopped || recoveryGeneration !== generation) return;
        if (unauthorized(error)) stopForUnauthorized();
        else scheduleReconnect();
      });
    });
  };

  const api = {
    start() {
      if (!stopped) return;
      stopped = false;
      attempt = 0;
      connect();
    },
    stop() {
      if (stopped) return;
      stopped = true;
      generation += 1;
      if (timer) clearTimeout(timer);
      timer = undefined;
      syncingGeneration = undefined;
      buffered = [];
      socket?.close();
      socket = undefined;
      status('stopped');
    }
  };
  return api;
}
