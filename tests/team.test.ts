// tests/team.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Team } from '../src/team';
import { Agent } from '../src/agent';
import type { ModelAdapter } from '../src/model/adapter';
import type { ModelResponse } from '../src/types';
import type { AgentEvent } from '../src/types';

function createMockModel(response: string): ModelAdapter {
  return {
    chat: vi.fn(async () => ({ content: response }) as ModelResponse),
    async *stream() {
      yield { text: response, done: true };
    },
  };
}

describe('Team', () => {
  it('runs sequential strategy', async () => {
    const agent1 = new Agent({ name: 'a1', model: createMockModel('step 1') });
    const agent2 = new Agent({ name: 'a2', model: createMockModel('step 2') });

    const team = new Team({ agents: [agent1, agent2], strategy: 'sequential' });
    const result = await team.run('do task');

    expect(result.content).toBe('step 2');
    expect(result.responses).toHaveLength(2);
  });

  it('runs parallel strategy', async () => {
    const agent1 = new Agent({ name: 'a1', model: createMockModel('parallel 1') });
    const agent2 = new Agent({ name: 'a2', model: createMockModel('parallel 2') });

    const team = new Team({ agents: [agent1, agent2], strategy: 'parallel' });
    const result = await team.run('task');

    expect(result.content).toContain('[a1]');
    expect(result.content).toContain('[a2]');
    expect(result.responses).toHaveLength(2);
  });

  it('runs debate strategy', async () => {
    const agent1 = new Agent({ name: 'debater1', model: createMockModel('position A') });
    const agent2 = new Agent({ name: 'debater2', model: createMockModel('position B') });

    const team = new Team({ agents: [agent1, agent2], strategy: 'debate', maxRounds: 1 });
    const result = await team.run('debate topic');

    // Debate runs rounds + final answer from first agent
    expect(result.responses.length).toBeGreaterThan(0);
    expect(typeof result.content).toBe('string');
  });

  it('emits team:start and team:end events', async () => {
    const agent = new Agent({ name: 'solo', model: createMockModel('done') });
    const team = new Team({ agents: [agent], strategy: 'sequential' });

    const events: AgentEvent[] = [];
    team.on('team:start', (e) => events.push(e));
    team.on('team:end', (e) => events.push(e));

    await team.run('task');

    expect(events.some((e) => e.type === 'team:start')).toBe(true);
    expect(events.some((e) => e.type === 'team:end')).toBe(true);
  });

  it('throws on hierarchical strategy without manager', async () => {
    const worker = new Agent({ name: 'worker', model: createMockModel('result') });
    const team = new Team({ agents: [worker], strategy: 'hierarchical' });

    await expect(team.run('task')).rejects.toThrow(/manager/i);
  });

  it('runs hierarchical strategy with manager', async () => {
    const workerModel: ModelAdapter = {
      chat: vi.fn(async () => ({ content: 'worker output' }) as ModelResponse),
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
                arguments: JSON.stringify({ agentName: 'specialist', task: 'sub-task' }),
              },
            ],
          } as ModelResponse;
        }
        return { content: 'manager final answer' } as ModelResponse;
      }),
      async *stream() {
        yield { text: 'ok', done: true };
      },
    };
    const manager = new Agent({ name: 'manager', model: managerModel });

    const team = new Team({
      agents: [worker],
      strategy: 'hierarchical',
      manager,
    });

    const result = await team.run('complex task');
    expect(result.content).toBe('manager final answer');
  });

  it('passes maxRounds to debate strategy', async () => {
    let totalCalls = 0;
    const model: ModelAdapter = {
      chat: vi.fn(async () => {
        totalCalls++;
        return { content: `call ${totalCalls}` } as ModelResponse;
      }),
      async *stream() {
        yield { text: 'ok', done: true };
      },
    };

    const a1 = new Agent({ name: 'a1', model });
    const a2 = new Agent({ name: 'a2', model });

    const team = new Team({ agents: [a1, a2], strategy: 'debate', maxRounds: 2 });
    await team.run('topic');

    // 2 rounds * 2 agents + 1 final = 5
    expect(totalCalls).toBe(5);
  });
});
