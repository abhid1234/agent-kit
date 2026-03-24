// tests/strategy/parallel.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ParallelStrategy } from '../../src/strategy/parallel';
import { Agent } from '../../src/agent';
import { AgentEventEmitter } from '../../src/events';
import type { ModelAdapter } from '../../src/model/adapter';
import type { ModelResponse } from '../../src/types';
import type { AgentEvent } from '../../src/types';

function createMockModel(response: string, delayMs = 0): ModelAdapter {
  return {
    chat: vi.fn(async () => {
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
      return { content: response } as ModelResponse;
    }),
    async *stream() {
      yield { text: response, done: true };
    },
  };
}

describe('ParallelStrategy', () => {
  let emitter: AgentEventEmitter;
  let strategy: ParallelStrategy;

  beforeEach(() => {
    emitter = new AgentEventEmitter();
    strategy = new ParallelStrategy();
  });

  it('runs all agents and collects responses', async () => {
    const agent1 = new Agent({ name: 'agent-1', model: createMockModel('response 1') });
    const agent2 = new Agent({ name: 'agent-2', model: createMockModel('response 2') });
    const agent3 = new Agent({ name: 'agent-3', model: createMockModel('response 3') });

    const result = await strategy.execute([agent1, agent2, agent3], 'do task', {}, emitter);

    expect(result.responses).toHaveLength(3);
    expect(result.responses.map((r) => r.agent).sort()).toEqual(['agent-1', 'agent-2', 'agent-3']);
  });

  it('merges output with agent attribution', async () => {
    const agent1 = new Agent({ name: 'researcher', model: createMockModel('research output') });
    const agent2 = new Agent({ name: 'writer', model: createMockModel('writing output') });

    const result = await strategy.execute([agent1, agent2], 'task', {}, emitter);

    expect(result.content).toContain('[researcher]');
    expect(result.content).toContain('research output');
    expect(result.content).toContain('[writer]');
    expect(result.content).toContain('writing output');
  });

  it('runs concurrently — total time near max single agent time', async () => {
    const delay = 50;
    const agent1 = new Agent({ name: 'a1', model: createMockModel('r1', delay) });
    const agent2 = new Agent({ name: 'a2', model: createMockModel('r2', delay) });
    const agent3 = new Agent({ name: 'a3', model: createMockModel('r3', delay) });

    const start = Date.now();
    await strategy.execute([agent1, agent2, agent3], 'task', {}, emitter);
    const elapsed = Date.now() - start;

    // If sequential, would take ~150ms; parallel should be ~50ms + overhead
    expect(elapsed).toBeLessThan(delay * 2.5);
  });

  it('emits team:agent:start and team:agent:end events for each agent', async () => {
    const agent1 = new Agent({ name: 'a1', model: createMockModel('out1') });
    const agent2 = new Agent({ name: 'a2', model: createMockModel('out2') });

    const events: AgentEvent[] = [];
    emitter.on('team:agent:start', (e) => events.push(e));
    emitter.on('team:agent:end', (e) => events.push(e));

    await strategy.execute([agent1, agent2], 'task', {}, emitter);

    const startEvents = events.filter((e) => e.type === 'team:agent:start');
    const endEvents = events.filter((e) => e.type === 'team:agent:end');

    expect(startEvents).toHaveLength(2);
    expect(endEvents).toHaveLength(2);
  });
});
