// src/team.ts
import type { Agent } from './agent';
import { AgentEventEmitter } from './events';
import { SequentialStrategy } from './strategy/sequential';
import { ParallelStrategy } from './strategy/parallel';
import { DebateStrategy } from './strategy/debate';
import { HierarchicalStrategy } from './strategy/hierarchical';
import type { TeamResult, AgentResponse } from './strategy/interface';
import type { AgentEvent } from './types';

export type { TeamResult, AgentResponse };

export interface TeamConfig {
  agents: Agent[];
  strategy: 'sequential' | 'parallel' | 'debate' | 'hierarchical';
  manager?: Agent;
  maxRounds?: number;
  maxDelegations?: number;
}

export class Team {
  private agents: Agent[];
  private strategyName: TeamConfig['strategy'];
  private manager?: Agent;
  private maxRounds?: number;
  private maxDelegations?: number;
  private emitter: AgentEventEmitter;

  constructor(config: TeamConfig) {
    this.agents = config.agents;
    this.strategyName = config.strategy;
    this.manager = config.manager;
    this.maxRounds = config.maxRounds;
    this.maxDelegations = config.maxDelegations;
    this.emitter = new AgentEventEmitter();
  }

  on(type: string, handler: (event: AgentEvent) => void): void {
    this.emitter.on(type, handler);
  }

  off(type: string, handler: (event: AgentEvent) => void): void {
    this.emitter.off(type, handler);
  }

  async run(task: string): Promise<TeamResult> {
    this.emitter.emit({
      type: 'team:start',
      timestamp: Date.now(),
      agentId: 'team',
      data: {
        strategy: this.strategyName,
        agentCount: this.agents.length,
        task,
      },
    });

    const startTime = Date.now();

    const strategy = this.resolveStrategy();
    const result = await strategy.execute(
      this.agents,
      task,
      {
        maxRounds: this.maxRounds,
        maxDelegations: this.maxDelegations,
        manager: this.manager,
      },
      this.emitter,
    );

    const latencyMs = Date.now() - startTime;

    this.emitter.emit({
      type: 'team:end',
      timestamp: Date.now(),
      agentId: 'team',
      data: {
        strategy: this.strategyName,
        responseCount: result.responses.length,
      },
      latencyMs,
    });

    return result;
  }

  private resolveStrategy() {
    switch (this.strategyName) {
      case 'sequential':
        return new SequentialStrategy();
      case 'parallel':
        return new ParallelStrategy();
      case 'debate':
        return new DebateStrategy();
      case 'hierarchical':
        return new HierarchicalStrategy();
    }
  }
}
