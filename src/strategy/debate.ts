// src/strategy/debate.ts
import type { Agent } from '../agent';
import type { AgentEventEmitter } from '../events';
import type { Strategy, StrategyOptions, TeamResult, AgentResponse } from './interface';

export class DebateStrategy implements Strategy {
  async execute(
    agents: Agent[],
    task: string,
    options: StrategyOptions,
    emitter: AgentEventEmitter,
  ): Promise<TeamResult> {
    const maxRounds = options.maxRounds ?? 3;
    const responses: AgentResponse[] = [];
    const priorOutputs: string[] = [];

    // Run debate rounds — each agent responds in turn, seeing all prior outputs
    for (let round = 1; round <= maxRounds; round++) {
      emitter.emit({
        type: 'team:round',
        timestamp: Date.now(),
        agentId: 'team',
        data: { round, totalRounds: maxRounds },
      });

      for (const agent of agents) {
        const context =
          priorOutputs.length > 0
            ? `${task}\n\nDebate so far:\n${priorOutputs.join('\n\n')}\n\nYour turn (Round ${round}):`
            : `${task}\n\n(Round ${round}):`;

        emitter.emit({
          type: 'team:agent:start',
          timestamp: Date.now(),
          agentId: 'team',
          data: { agentName: agent.name, round },
        });

        const startTime = Date.now();
        const result = await agent.chat(context);
        const latencyMs = Date.now() - startTime;

        emitter.emit({
          type: 'team:agent:end',
          timestamp: Date.now(),
          agentId: 'team',
          data: { agentName: agent.name, output: result.content, round },
          latencyMs,
        });

        const agentResponse: AgentResponse = {
          agent: agent.name,
          content: result.content,
          round,
        };
        responses.push(agentResponse);
        priorOutputs.push(`[${agent.name}, Round ${round}]: ${result.content}`);
      }
    }

    // Final answer: first agent synthesizes with all debate context
    const firstAgent = agents[0];
    const synthesisInput = `${task}\n\nDebate summary:\n${priorOutputs.join('\n\n')}\n\nProvide your final answer:`;

    emitter.emit({
      type: 'team:agent:start',
      timestamp: Date.now(),
      agentId: 'team',
      data: { agentName: firstAgent.name, phase: 'final' },
    });

    const finalResult = await firstAgent.chat(synthesisInput);

    emitter.emit({
      type: 'team:agent:end',
      timestamp: Date.now(),
      agentId: 'team',
      data: { agentName: firstAgent.name, output: finalResult.content, phase: 'final' },
    });

    return {
      content: finalResult.content,
      responses,
    };
  }
}
