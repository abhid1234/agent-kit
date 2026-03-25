// src/strategy/hierarchical.ts
import { Agent } from '../agent';
import { Tool } from '../tool';
import type { AgentEventEmitter } from '../events';
import type { Strategy, StrategyOptions, TeamResult, AgentResponse } from './interface';
import type { Memory } from '../memory';

export class HierarchicalStrategy implements Strategy {
  async execute(
    agents: Agent[],
    task: string,
    options: StrategyOptions,
    emitter: AgentEventEmitter,
  ): Promise<TeamResult> {
    const { manager, maxDelegations = 10 } = options;

    if (!manager) {
      throw new Error('HierarchicalStrategy requires a manager agent');
    }

    // Build a lookup map from agent name to Agent instance
    const agentMap = new Map<string, Agent>(agents.map((a) => [a.name, a]));

    const responses: AgentResponse[] = [];

    // Create a delegate tool that calls worker agents
    const delegateTool = Tool.create({
      name: 'delegate',
      description: 'Delegate a sub-task to a specialist agent. Use this to assign work to workers.',
      parameters: {
        agentName: {
          type: 'string',
          description: `The name of the agent to delegate to. Available: ${[...agents.map((a) => a.name)].join(', ')}`,
        },
        task: {
          type: 'string',
          description: 'The task to assign to the agent',
        },
      },
      execute: async (params) => {
        const agentName = params.agentName as string;
        const subTask = params.task as string;

        const worker = agentMap.get(agentName);
        if (!worker) {
          return `Error: No agent named "${agentName}" found. Available agents: ${[...agentMap.keys()].join(', ')}`;
        }

        emitter.emit({
          type: 'team:delegate',
          timestamp: Date.now(),
          agentId: 'team',
          data: { agentName, task: subTask },
        });

        const result = await worker.chat(subTask);

        const response: AgentResponse = { agent: agentName, content: result.content };
        responses.push(response);

        return result.content;
      },
    });

    // Create a fresh Agent with the manager's model adapter + the delegate tool
    // Preserve the manager's memory so conversation history persists across runs
    // Use the manager's own system prompt so it retains its personality and instructions
    // Append delegate tool instructions so it knows how to use the tool
    const managerSystem = manager.getSystem() ?? '';
    const delegateInstructions = `\nYou have a "delegate" tool to assign sub-tasks to specialist agents: ${[...agentMap.keys()].join(', ')}.`;

    const orchestratorAgent = new Agent({
      name: manager.name,
      model: manager.getModel(),
      memory: manager.getMemory(),
      tools: [delegateTool],
      system: managerSystem + delegateInstructions,
      maxToolRounds: maxDelegations,
    });

    const finalResult = await orchestratorAgent.chat(task);

    return {
      content: finalResult.content,
      responses,
    };
  }
}
