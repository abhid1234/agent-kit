// tests/events.test.ts
import { describe, it, expect, vi } from 'vitest';
import { AgentEventEmitter } from '../src/events';
import type { AgentEvent } from '../src/types';

describe('AgentEventEmitter', () => {
  it('emits and receives typed events', () => {
    const emitter = new AgentEventEmitter();
    const handler = vi.fn();
    emitter.on('tool:start', handler);
    emitter.emit({
      type: 'tool:start',
      timestamp: Date.now(),
      agentId: 'test',
      data: { name: 'search' },
    });
    expect(handler).toHaveBeenCalledOnce();
    expect(handler.mock.calls[0][0].data.name).toBe('search');
  });

  it('wildcard listener receives all events', () => {
    const emitter = new AgentEventEmitter();
    const handler = vi.fn();
    emitter.on('*', handler);
    emitter.emit({ type: 'tool:start', timestamp: 0, agentId: 'test', data: {} });
    emitter.emit({ type: 'tool:end', timestamp: 0, agentId: 'test', data: {} });
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it('off removes a listener', () => {
    const emitter = new AgentEventEmitter();
    const handler = vi.fn();
    emitter.on('message', handler);
    emitter.off('message', handler);
    emitter.emit({ type: 'message', timestamp: 0, agentId: 'test', data: {} });
    expect(handler).not.toHaveBeenCalled();
  });

  it('includes latencyMs and tokens when provided', () => {
    const emitter = new AgentEventEmitter();
    const handler = vi.fn();
    emitter.on('tool:end', handler);
    emitter.emit({
      type: 'tool:end',
      timestamp: 0,
      agentId: 'test',
      data: {},
      latencyMs: 150,
      tokens: { input: 100, output: 50 },
    });
    const event: AgentEvent = handler.mock.calls[0][0];
    expect(event.latencyMs).toBe(150);
    expect(event.tokens).toEqual({ input: 100, output: 50 });
  });
});
