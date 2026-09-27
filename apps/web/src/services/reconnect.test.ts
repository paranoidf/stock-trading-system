import { describe, expect, it, vi } from 'vitest';
import type { SnapshotDto } from '@stock-trading/shared';
import { createReconnectController, type ReconnectSocket } from './reconnect.js';

function snapshot(username: string): SnapshotDto {
  return {
    user: { id: username, username }, market: [], orders: [], trades: [],
    portfolio: { availableCash: '1000000.00', reservedCash: '0.00', totalAssets: '1000000.00', positions: [] }
  };
}

class FakeSocket implements ReconnectSocket {
  private handlers = new Map<string, Array<(event: { data?: unknown }) => void>>();
  close = vi.fn();
  addEventListener(name: string, handler: (event: { data?: unknown }) => void) {
    const list = this.handlers.get(name) ?? [];
    list.push(handler);
    this.handlers.set(name, list);
  }
  emit(name: string, data?: unknown) { for (const handler of this.handlers.get(name) ?? []) handler({ data }); }
}

describe('断线重连控制器', () => {
  it('临时断开后只有一个指数退避重连循环', async () => {
    vi.useFakeTimers();
    const sockets: FakeSocket[] = [];
    const controller = createReconnectController({
      socketFactory: () => { const socket = new FakeSocket(); sockets.push(socket); return socket; },
      loadSnapshot: async () => snapshot('alice'), applySnapshot: vi.fn(), applyEvent: vi.fn()
    });
    controller.start();
    expect(sockets).toHaveLength(1);
    sockets[0]!.emit('close');
    sockets[0]!.emit('close');
    await vi.advanceTimersByTimeAsync(999);
    expect(sockets).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(sockets).toHaveLength(2);
    controller.stop();
    vi.useRealTimers();
  });

  it('以新世代快照为权威并在同步完成后回放缓冲事件', async () => {
    vi.useFakeTimers();
    const sockets: FakeSocket[] = [];
    const resolvers: Array<(value: SnapshotDto) => void> = [];
    const appliedSnapshots: string[] = [];
    const appliedEvents: string[] = [];
    const controller = createReconnectController({
      socketFactory: () => { const socket = new FakeSocket(); sockets.push(socket); return socket; },
      loadSnapshot: () => new Promise((resolve) => resolvers.push(resolve)),
      applySnapshot: (value) => appliedSnapshots.push(value.user.username),
      applyEvent: (event) => appliedEvents.push(event.type)
    });
    controller.start();
    sockets[0]!.emit('open');
    sockets[0]!.emit('message', '{"type":"market.updated","version":1,"data":[]}');
    sockets[0]!.emit('close');
    await vi.advanceTimersByTimeAsync(1000);
    sockets[1]!.emit('open');
    resolvers[1]!(snapshot('new'));
    await Promise.resolve();
    resolvers[0]!(snapshot('old'));
    await Promise.resolve();
    expect(appliedSnapshots).toEqual(['new']);
    expect(appliedEvents).toEqual([]);
    controller.stop();
    vi.useRealTimers();
  });

  it('快照 401 时停止重连并通知清理会话', async () => {
    vi.useFakeTimers();
    const socket = new FakeSocket();
    const onUnauthorized = vi.fn();
    const controller = createReconnectController({
      socketFactory: () => socket,
      loadSnapshot: async () => { throw Object.assign(new Error('unauthorized'), { status: 401 }); },
      applySnapshot: vi.fn(), applyEvent: vi.fn(), onUnauthorized
    });
    controller.start();
    socket.emit('open');
    await Promise.resolve();
    await Promise.resolve();
    expect(onUnauthorized).toHaveBeenCalledOnce();
    socket.emit('close');
    await vi.runAllTimersAsync();
    expect(socket.close).toHaveBeenCalled();
    controller.stop();
    vi.useRealTimers();
  });
});
