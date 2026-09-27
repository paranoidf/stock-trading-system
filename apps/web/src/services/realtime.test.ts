import { describe, expect, it, vi } from 'vitest';
import { parseRealtimeEvent, startRealtime } from './realtime.js';

describe('实时服务', () => {
  it('解析受支持事件并安全忽略无效载荷', () => {
    expect(parseRealtimeEvent('{"type":"market.updated","version":1,"data":[]}')).toEqual({
      type: 'market.updated', version: 1, data: []
    });
    expect(parseRealtimeEvent('not-json')).toBeNull();
    expect(parseRealtimeEvent('{"type":"unknown","version":1,"data":[]}')).toBeNull();
  });

  it('把合法消息交给调用方并可主动关闭', () => {
    const handlers = new Map<string, (event: { data?: string }) => void>();
    const socket = {
      addEventListener: vi.fn((name: string, handler: (event: { data?: string }) => void) => handlers.set(name, handler)),
      close: vi.fn()
    };
    const onEvent = vi.fn();
    const stop = startRealtime(onEvent, () => socket);
    handlers.get('message')?.({ data: '{"type":"market.updated","version":1,"data":[]}' });
    handlers.get('message')?.({ data: 'broken' });
    expect(onEvent).toHaveBeenCalledTimes(1);
    stop();
    expect(socket.close).toHaveBeenCalledOnce();
  });
});
