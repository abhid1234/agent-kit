// tests/strategy/sequential.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SequentialStrategy } from '../../src/strategy/sequential';
import { Agent } from '../../src/agent';
import { AgentEventEmitter } from '../../src/events';
import type { ModelAdapter } from '../../src/model/adapter';
import type { ModelResponse } from '../../src/types';
import type { AgentEvent } from '../../src/types';

function createMockModel(response: string): ModelAdapter {
  return {
    chat: vi.fn(async () => ({ content: response }) as ModelResponse),
    async *stream() {
      yield { text: response, done: true };
    },
  };
}

describe('SequentialStrategy', () => {
  let emitter: AgentEventEmitter;
  let strategy: SequentialStrategy;

  beforeEach(() => {
    emitter = new AgentEventEmitter();
    strategy = new SequentialStrategy();
  });

  it('runs agents in order and returns last agent output', async () => {
    const agent1 = new Agent({ name: 'agent-1', model: createMockModel('output from agent 1') });
    const agent2 = new Agent({ name: 'agent-2', model: createMockModel('output from agent 2') });

    const result = await strategy.execute([agent1, agent2], 'do task', {}, emitter);

    expect(result.content).toBe('output from agent 2');
  });

  it('passes previous agent output to next agent', async () => {
    const model1 = createMockModel('first output');
    const model2Chat = vi.fn(async () => ({ content: 'second output' }) as ModelResponse);
    const model2: ModelAdapter = {
      chat: model2Chat,
      async *stream() {
        yield { text: 'second output', done: true };
      },
    };

    const agent1 = new Agent({ name: 'agent-1', model: model1 });
    const agent2 = new Agent({ name: 'agent-2', model: model2 });

    await strategy.execute([agent1, agent2], 'original task', {}, emitter);

    // The second call should include the first agent's output
    const calls = model2Chat.mock.calls;
    expect(calls.length).toBe(1);
    const messages = calls[0][0] as Array<{ content: string }>;
    const allContent = messages.map((m) => m.content).join(' ');
    expect(allContent).toContain('first output');
  });

  it('works with a single agent', async () => {
    const agent = new Agent({ name: 'solo', model: createMockModel('solo response') });

    const result = await strategy.execute([agent], 'task', {}, emitter);

    expect(result.content).toBe('solo response');
    expect(result.responses).toHaveLength(1);
    expect(result.responses[0].agent).toBe('solo');
  });

  it('collects all agent responses', async () => {
    const agent1 = new Agent({ name: 'a1', model: createMockModel('resp 1') });
    const agent2 = new Agent({ name: 'a2', model: createMockModel('resp 2') });
    const agent3 = new Agent({ name: 'a3', model: createMockModel('resp 3') });

    const result = await strategy.execute([agent1, agent2, agent3], 'task', {}, emitter);

    expect(result.responses).toHaveLength(3);
    expect(result.responses[0].agent).toBe('a1');
    expect(result.responses[1].agent).toBe('a2');
    expect(result.responses[2].agent).toBe('a3');
  });

  it('emits team:agent:start and team:agent:end events', async () => {
    const agent1 = new Agent({ name: 'agent-1', model: createMockModel('out1') });
    const agent2 = new Agent({ name: 'agent-2', model: createMockModel('out2') });

    const events: AgentEvent[] = [];
    emitter.on('team:agent:start', (e) => events.push(e));
    emitter.on('team:agent:end', (e) => events.push(e));

    await strategy.execute([agent1, agent2], 'task', {}, emitter);

    const startEvents = events.filter((e) => e.type === 'team:agent:start');
    const endEvents = events.filter((e) => e.type === 'team:agent:end');

    expect(startEvents).toHaveLength(2);
    expect(endEvents).toHaveLength(2);
    expect(startEvents[0].data.agentName).toBe('agent-1');
    expect(startEvents[1].data.agentName).toBe('agent-2');
  });
});
