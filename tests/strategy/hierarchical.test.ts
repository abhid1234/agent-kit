// tests/strategy/hierarchical.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HierarchicalStrategy } from '../../src/strategy/hierarchical';
import { Agent } from '../../src/agent';
import { AgentEventEmitter } from '../../src/events';
import type { ModelAdapter } from '../../src/model/adapter';
import type { ModelResponse } from '../../src/types';
import type { AgentEvent } from '../../src/types';

describe('HierarchicalStrategy', () => {
  let emitter: AgentEventEmitter;
  let strategy: HierarchicalStrategy;

  beforeEach(() => {
    emitter = new AgentEventEmitter();
    strategy = new HierarchicalStrategy();
  });

  it('throws if no manager is provided', async () => {
    const worker = new Agent({
      name: 'worker',
      model: { chat: vi.fn(), stream: vi.fn() } as unknown as ModelAdapter,
    });

    await expect(strategy.execute([worker], 'task', {}, emitter)).rejects.toThrow(/manager/i);
  });

  it('manager delegates to worker agents', async () => {
    const workerModel: ModelAdapter = {
      chat: vi.fn(async () => ({ content: 'worker result' }) as ModelResponse),
      async *stream() {
        yield { text: 'ok', done: true };
      },
    };
    const worker = new Agent({ name: 'researcher', model: workerModel });

    // Manager model: first call delegates to 'researcher', second call responds directly
    let managerCallCount = 0;
    const managerModel: ModelAdapter = {
      chat: vi.fn(async (_messages, tools) => {
        managerCallCount++;
        if (managerCallCount === 1 && tools?.length) {
          // First call: delegate via tool
          return {
            content: '',
            toolCalls: [
              {
                id: 'tc-1',
                name: 'delegate',
                arguments: JSON.stringify({ agentName: 'researcher', task: 'research this topic' }),
              },
            ],
          } as ModelResponse;
        }
        // Second call: direct answer
        return { content: 'final manager answer' } as ModelResponse;
      }),
      async *stream() {
        yield { text: 'ok', done: true };
      },
    };
    const manager = new Agent({ name: 'manager', model: managerModel });

    const result = await strategy.execute([worker], 'task', { manager }, emitter);

    expect(result.content).toBe('final manager answer');
    expect(workerModel.chat).toHaveBeenCalled();
  });

  it('caps delegations at maxDelegations', async () => {
    const workerModel: ModelAdapter = {
      chat: vi.fn(async () => ({ content: 'worker result' }) as ModelResponse),
      async *stream() {
        yield { text: 'ok', done: true };
      },
    };
    const worker = new Agent({ name: 'worker', model: workerModel });

    // Manager always delegates (never responds directly)
    let delegateCallCount = 0;
    const managerModel: ModelAdapter = {
      chat: vi.fn(async (_messages, tools) => {
        if (tools?.length) {
          delegateCallCount++;
          return {
            content: '',
            toolCalls: [
              {
                id: `tc-${delegateCallCount}`,
                name: 'delegate',
                arguments: JSON.stringify({ agentName: 'worker', task: 'do something' }),
              },
            ],
          } as ModelResponse;
        }
        return { content: 'capped response' } as ModelResponse;
      }),
      async *stream() {
        yield { text: 'ok', done: true };
      },
    };
    const manager = new Agent({ name: 'manager', model: managerModel });

    const maxDelegations = 2;
    await strategy.execute([worker], 'task', { manager, maxDelegations }, emitter);

    // Worker should have been called at most maxDelegations times
    expect(workerModel.chat).toHaveBeenCalledTimes(maxDelegations);
  });

  it('emits team:delegate events when manager delegates', async () => {
    const workerModel: ModelAdapter = {
      chat: vi.fn(async () => ({ content: 'result' }) as ModelResponse),
      async *stream() {
        yield { text: 'ok', done: true };
      },
    };
    const worker = new Agent({ name: 'specialist', model: workerModel });

    let managerCallCount = 0;
    const managerModel: ModelAdapter = {
      chat: vi.fn(async (_messages, tools) => {
        managerCallCount++;
        if (managerCallCount === 1 && tools?.length) {
          return {
            content: '',
            toolCalls: [
              {
                id: 'tc-1',
                name: 'delegate',
                arguments: JSON.stringify({ agentName: 'specialist', task: 'do work' }),
              },
            ],
          } as ModelResponse;
        }
        return { content: 'done' } as ModelResponse;
      }),
      async *stream() {
        yield { text: 'ok', done: true };
      },
    };
    const manager = new Agent({ name: 'manager', model: managerModel });

    const events: AgentEvent[] = [];
    emitter.on('team:delegate', (e) => events.push(e));

    await strategy.execute([worker], 'task', { manager }, emitter);

    expect(events.length).toBeGreaterThan(0);
    expect(events[0].data.agentName).toBe('specialist');
  });
});
