// src/strategy/interface.ts
import type { Agent } from '../agent';
import type { AgentEventEmitter } from '../events';

export interface AgentResponse {
  agent: string;
  content: string;
  round?: number;
}

export interface TeamResult {
  content: string;
  responses: AgentResponse[];
}

export interface StrategyOptions {
  maxRounds?: number;
  maxDelegations?: number;
  manager?: Agent;
}

export interface Strategy {
  execute(
    agents: Agent[],
    task: string,
    options: StrategyOptions,
    emitter: AgentEventEmitter,
  ): Promise<TeamResult>;
}
