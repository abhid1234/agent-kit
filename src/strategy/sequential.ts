// src/strategy/sequential.ts
import type { Agent } from '../agent';
import type { AgentEventEmitter } from '../events';
import type { Strategy, StrategyOptions, TeamResult, AgentResponse } from './interface';

export class SequentialStrategy implements Strategy {
  async execute(
    agents: Agent[],
    task: string,
    _options: StrategyOptions,
    emitter: AgentEventEmitter,
  ): Promise<TeamResult> {
    const responses: AgentResponse[] = [];
    let previousOutput: string | undefined;

    for (const agent of agents) {
      const input =
        previousOutput !== undefined
          ? `${task}\n\nPrevious agent output:\n${previousOutput}`
          : task;

      emitter.emit({
        type: 'team:agent:start',
        timestamp: Date.now(),
        agentId: 'team',
        data: { agentName: agent.name, input },
      });

      const startTime = Date.now();
      const result = await agent.chat(input);
      const latencyMs = Date.now() - startTime;

      emitter.emit({
        type: 'team:agent:end',
        timestamp: Date.now(),
        agentId: 'team',
        data: { agentName: agent.name, output: result.content },
        latencyMs,
      });

      responses.push({ agent: agent.name, content: result.content });
      previousOutput = result.content;
    }

    return {
      content: responses[responses.length - 1]?.content ?? '',
      responses,
    };
  }
}
