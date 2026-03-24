---
id: team
sidebar_position: 4
title: Team
---

# Team

`Team` coordinates multiple agents on a single task. You choose a strategy, and the team handles the orchestration.

## Constructor

```typescript
import { Team } from '@avee1234/agent-kit';

const team = new Team(config: TeamConfig);
```

### `TeamConfig`

| Field | Type | Required | Description |
|---|---|---|---|
| `agents` | `Agent[]` | Yes | The worker agents. |
| `strategy` | `'sequential' \| 'parallel' \| 'debate' \| 'hierarchical'` | Yes | How the agents coordinate. |
| `manager` | `Agent` | hierarchical only | The manager agent that delegates to workers. |
| `maxRounds` | `number` | debate only | Number of debate rounds (default `3`). |
| `maxDelegations` | `number` | hierarchical only | Max tool-call rounds for the manager (default `10`). |

## `team.run(task): Promise<TeamResult>`

Run the team on a task and return when complete.

```typescript
const result = await team.run('Research TypeScript frameworks and summarize the findings.');

console.log(result.content);      // final output string
console.log(result.responses);    // AgentResponse[] — one per agent call
```

`AgentResponse`:

```typescript
interface AgentResponse {
  agent: string;     // agent name
  content: string;   // that agent's output
  round?: number;    // set for debate strategy
}
```

## Strategies

### `sequential`

Each agent runs in order. The output of each agent is passed as context to the next.

Use this for pipelines: research → draft → review.

```typescript
import { Agent, Team, Tool } from '@avee1234/agent-kit';

const researcher = new Agent({
  name: 'researcher',
  model: { provider: 'ollama', model: 'llama3.2' },
  tools: [searchTool],
  system: 'You research topics thoroughly.',
});

const writer = new Agent({
  name: 'writer',
  model: { provider: 'ollama', model: 'llama3.2' },
  system: 'You write clear, concise summaries based on research.',
});

const team = new Team({
  agents: [researcher, writer],
  strategy: 'sequential',
});

const result = await team.run('Find the top 3 TypeScript agent frameworks.');
// researcher runs first, writer gets researcher's output as context
console.log(result.content); // writer's final output
```

### `parallel`

All agents run simultaneously on the same task. Results are concatenated.

Use this when agents have independent specializations and you want all perspectives.

```typescript
const optimistAgent = new Agent({
  name: 'optimist',
  model: { provider: 'ollama', model: 'llama3.2' },
  system: 'You analyze proposals focusing on opportunities and benefits.',
});

const skepticAgent = new Agent({
  name: 'skeptic',
  model: { provider: 'ollama', model: 'llama3.2' },
  system: 'You analyze proposals focusing on risks and drawbacks.',
});

const team = new Team({
  agents: [optimistAgent, skepticAgent],
  strategy: 'parallel',
});

const result = await team.run('Should we rewrite the backend in Rust?');
// Both agents answer simultaneously
// result.content is "[optimist]: ... \n\n [skeptic]: ..."
```

### `debate`

Agents argue their positions over multiple rounds, each responding to what the others said. After all rounds, the first agent synthesizes a final answer.

Use this for decisions that benefit from adversarial critique.

```typescript
const agentA = new Agent({
  name: 'agent-a',
  model: { provider: 'ollama', model: 'llama3.2' },
  system: 'You argue in favor of microservices architecture.',
});

const agentB = new Agent({
  name: 'agent-b',
  model: { provider: 'ollama', model: 'llama3.2' },
  system: 'You argue in favor of monolithic architecture.',
});

const team = new Team({
  agents: [agentA, agentB],
  strategy: 'debate',
  maxRounds: 2,   // each agent speaks twice before synthesis
});

const result = await team.run('What is the best architecture for a new startup?');
console.log(result.content);    // agent-a's synthesis after the debate
console.log(result.responses);  // all round-by-round responses
```

### `hierarchical`

A `manager` agent directs worker agents using a built-in `delegate` tool. The manager decides which worker to call and what task to assign it.

Use this for complex tasks where routing decisions require intelligence.

```typescript
const manager = new Agent({
  name: 'manager',
  model: { provider: 'ollama', model: 'llama3.2' },
  // system is overridden by the strategy to include worker names
});

const codeReviewer = new Agent({
  name: 'code-reviewer',
  model: { provider: 'ollama', model: 'llama3.2' },
  system: 'You review TypeScript code for bugs, style, and performance issues.',
});

const docWriter = new Agent({
  name: 'doc-writer',
  model: { provider: 'ollama', model: 'llama3.2' },
  system: 'You write clear API documentation from code and context.',
});

const team = new Team({
  agents: [codeReviewer, docWriter],
  strategy: 'hierarchical',
  manager,
  maxDelegations: 5,
});

const result = await team.run(
  'Review the following code and write documentation for it:\n\n' + codeSnippet
);
console.log(result.content);
```

The manager receives a `delegate` tool with parameters `{ agentName: string, task: string }`. It calls this tool to assign sub-tasks to workers, collects their results, and produces a final answer.

## Events

`Team` emits events via `.on()` / `.off()`:

```typescript
team.on('team:start', (e) => console.log(`Team started: ${e.data.strategy}`));
team.on('team:agent:start', (e) => console.log(`Agent ${e.data.agentName} starting`));
team.on('team:agent:end', (e) => console.log(`Agent done in ${e.latencyMs}ms`));
team.on('team:round', (e) => console.log(`Debate round ${e.data.round}`));   // debate only
team.on('team:delegate', (e) => console.log(`Delegating to ${e.data.agentName}`)); // hierarchical only
team.on('team:end', (e) => console.log(`Team finished in ${e.latencyMs}ms`));
```
