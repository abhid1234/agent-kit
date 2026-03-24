// tests/strategy/debate.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DebateStrategy } from '../../src/strategy/debate';
import { Agent } from '../../src/agent';
import { AgentEventEmitter } from '../../src/events';
import type { ModelAdapter } from '../../src/model/adapter';
import type { ModelResponse } from '../../src/types';
import type { AgentEvent } from '../../src/types';

function createMockModel(makeResponse: (input: string) => string): ModelAdapter {
  return {
    chat: vi.fn(async (messages) => {
      const lastUser = [...messages].reverse().find((m) => m.role === 'user');
      return { content: makeResponse(lastUser?.content ?? '') } as ModelResponse;
    }),
    async *stream() {
      yield { text: 'ok', done: true };
    },
  };
}

describe('DebateStrategy', () => {
  let emitter: AgentEventEmitter;
  let strategy: DebateStrategy;

  beforeEach(() => {
    emitter = new AgentEventEmitter();
    strategy = new DebateStrategy();
  });

  it('alternates between agents for the specified number of rounds', async () => {
    let agent1CallCount = 0;
    let agent2CallCount = 0;

    const model1: ModelAdapter = {
      chat: vi.fn(async () => {
        agent1CallCount++;
        return { content: `agent1 response ${agent1CallCount}` } as ModelResponse;
      }),
      async *stream() {
        yield { text: 'ok', done: true };
      },
    };
    const model2: ModelAdapter = {
      chat: vi.fn(async () => {
        agent2CallCount++;
        return { content: `agent2 response ${agent2CallCount}` } as ModelResponse;
      }),
      async *stream() {
        yield { text: 'ok', done: true };
      },
    };

    const agent1 = new Agent({ name: 'agent-1', model: model1 });
    const agent2 = new Agent({ name: 'agent-2', model: model2 });

    await strategy.execute([agent1, agent2], 'debate topic', { maxRounds: 2 }, emitter);

    // With 2 rounds: agent1, agent2, agent1, agent2 — then agent1 final = 3 agent1 calls, 2 agent2
    // OR: 2 rounds of alternation = 2*2=4 calls, then final by agent1 = agent1 called 3 times
    // Total agent calls = maxRounds * 2 + 1 (final)
    expect(agent1CallCount + agent2CallCount).toBe(2 * 2 + 1);
  });

  it('defaults to 3 rounds', async () => {
    let totalCalls = 0;
    const model: ModelAdapter = {
      chat: vi.fn(async () => {
        totalCalls++;
        return { content: `response ${totalCalls}` } as ModelResponse;
      }),
      async *stream() {
        yield { text: 'ok', done: true };
      },
    };

    const agent1 = new Agent({ name: 'a1', model });
    const agent2 = new Agent({ name: 'a2', model });

    await strategy.execute([agent1, agent2], 'topic', {}, emitter);

    // 3 rounds * 2 agents + 1 final = 7
    expect(totalCalls).toBe(3 * 2 + 1);
  });

  it('includes round numbers in responses', async () => {
    const agent1 = new Agent({
      name: 'a1',
      model: createMockModel((input) => `a1: ${input.slice(0, 20)}`),
    });
    const agent2 = new Agent({
      name: 'a2',
      model: createMockModel((input) => `a2: ${input.slice(0, 20)}`),
    });

    const result = await strategy.execute([agent1, agent2], 'topic', { maxRounds: 1 }, emitter);

    // Responses during rounds should have round numbers
    const roundedResponses = result.responses.filter((r) => r.round !== undefined);
    expect(roundedResponses.length).toBeGreaterThan(0);
  });

  it('emits team:round events', async () => {
    const agent1 = new Agent({ name: 'a1', model: createMockModel(() => 'r1') });
    const agent2 = new Agent({ name: 'a2', model: createMockModel(() => 'r2') });

    const events: AgentEvent[] = [];
    emitter.on('team:round', (e) => events.push(e));

    await strategy.execute([agent1, agent2], 'topic', { maxRounds: 2 }, emitter);

    expect(events.length).toBeGreaterThan(0);
    expect(events[0].data.round).toBeDefined();
  });

  it('final content is produced by the first agent', async () => {
    const agent1 = new Agent({ name: 'first', model: createMockModel(() => 'final from first') });
    const agent2 = new Agent({ name: 'second', model: createMockModel(() => 'second opinion') });

    const result = await strategy.execute([agent1, agent2], 'topic', { maxRounds: 1 }, emitter);

    // The final response should come from agent1 (first agent)
    expect(result.content).toBe('final from first');
  });
});
