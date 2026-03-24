// src/strategy/parallel.ts
import type { Agent } from '../agent';
import type { AgentEventEmitter } from '../events';
import type { Strategy, StrategyOptions, TeamResult, AgentResponse } from './interface';

export class ParallelStrategy implements Strategy {
  async execute(
    agents: Agent[],
    task: string,
    _options: StrategyOptions,
    emitter: AgentEventEmitter,
  ): Promise<TeamResult> {
    // Emit start events and launch all agent calls concurrently
    const agentPromises = agents.map(async (agent) => {
      emitter.emit({
        type: 'team:agent:start',
        timestamp: Date.now(),
        agentId: 'team',
        data: { agentName: agent.name, input: task },
      });

      const startTime = Date.now();
      const result = await agent.chat(task);
      const latencyMs = Date.now() - startTime;

      emitter.emit({
        type: 'team:agent:end',
        timestamp: Date.now(),
        agentId: 'team',
        data: { agentName: agent.name, output: result.content },
        latencyMs,
      });

      return { agent: agent.name, content: result.content } satisfies AgentResponse;
    });

    const responses = await Promise.all(agentPromises);

    const content = responses.map((r) => `[${r.agent}]: ${r.content}`).join('\n\n');

    return { content, responses };
  }
}
