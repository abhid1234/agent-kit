---
id: agent
sidebar_position: 1
title: Agent
---

# Agent

The `Agent` class is the central building block. It manages the conversation loop, tool execution, memory retrieval, and event emission.

## Constructor

```typescript
import { Agent } from '@avee1234/agent-kit';

const agent = new Agent(config: AgentConfig);
```

### `AgentConfig`

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `name` | `string` | Yes | — | Unique identifier for this agent. Used as the key in memory storage. |
| `model` | `ModelAdapter \| ModelConfig` | No | `MockAdapter` | The model to use. Accepts a pre-built adapter or a `ModelConfig` object. |
| `memory` | `Memory` | No | — | Memory instance for persisting conversations. |
| `tools` | `Tool[]` | No | `[]` | List of tools available to the agent. |
| `system` | `string` | No | — | System prompt prepended to every conversation. |
| `maxToolRounds` | `number` | No | `10` | Maximum number of tool-call iterations per `chat()` call. |

### `ModelConfig`

Use this to configure an OpenAI-compatible endpoint without creating an adapter manually:

```typescript
interface ModelConfig {
  provider?: 'ollama';
  baseURL?: string;     // defaults to http://localhost:11434/v1
  apiKey?: string;
  model: string;
}
```

Example:

```typescript
// Ollama (local)
const agent = new Agent({
  name: 'my-agent',
  model: { provider: 'ollama', model: 'llama3.2' },
});

// Any OpenAI-compatible endpoint
const agent = new Agent({
  name: 'my-agent',
  model: {
    baseURL: 'https://api.openai.com/v1',
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4o-mini',
  },
});
```

## Methods

### `chat(input: string): Promise<ModelResponse>`

Send a message and wait for the complete response. Handles tool-call loops automatically.

```typescript
const response = await agent.chat('What is 2 + 2?');
console.log(response.content);   // string
console.log(response.tokens);    // { input: number, output: number } | undefined
console.log(response.toolCalls); // ToolCall[] | undefined
```

`chat()` runs the full agentic loop:
1. Retrieves memory context (summaries + recent messages)
2. Calls the model
3. If the model returns tool calls, executes them and feeds results back
4. Repeats up to `maxToolRounds` times
5. Saves the exchange to memory

### `stream(input: string): AsyncIterable<ModelChunk>`

Stream the response token by token. Does not run a tool-call loop.

```typescript
for await (const chunk of agent.stream('Tell me a story.')) {
  process.stdout.write(chunk.text);
  if (chunk.done) break;
}
```

`ModelChunk`:

```typescript
interface ModelChunk {
  text: string;
  done: boolean;
  toolCalls?: ToolCall[];
}
```

### `on(type: string, handler: (event: AgentEvent) => void): void`

Subscribe to agent events.

```typescript
agent.on('tool:start', (event) => {
  console.log(`Calling tool: ${event.data.toolName}`);
});

agent.on('tool:end', (event) => {
  console.log(`Tool finished in ${event.latencyMs}ms`);
});
```

### `off(type: string, handler: (event: AgentEvent) => void): void`

Unsubscribe from an event.

### `getModel(): ModelAdapter`

Returns the underlying model adapter. Used internally by `Team` when constructing orchestrator agents.

## Events

All events conform to the `AgentEvent` interface:

```typescript
interface AgentEvent {
  type: string;
  timestamp: number;    // Unix ms
  agentId: string;      // agent name
  data: Record<string, unknown>;
  latencyMs?: number;
  tokens?: { input: number; output: number };
}
```

| Event type | When | Key `data` fields |
|---|---|---|
| `message` | User message received or assistant message produced | `role`, `content` |
| `tool:start` | Tool call about to execute | `toolName`, `toolCallId`, `arguments` |
| `tool:end` | Tool call completed | `toolName`, `toolCallId`, `result`, `latencyMs` |
| `memory:retrieve` | Memory context loaded | `summaries`, `recentMessages` |
| `error` | Tool execution error | `message`, `toolCallId`, `toolName` |

## Full example

```typescript
import { Agent, Tool, Memory } from '@avee1234/agent-kit';

const calculator = Tool.create({
  name: 'calculate',
  description: 'Evaluate a mathematical expression',
  parameters: {
    expression: { type: 'string', description: 'e.g. "2 * (3 + 4)"', required: true },
  },
  execute: async ({ expression }) => {
    // WARNING: eval is unsafe in production — use a proper math library
    return String(eval(expression as string));
  },
});

const agent = new Agent({
  name: 'math-tutor',
  model: { provider: 'ollama', model: 'llama3.2' },
  memory: new Memory({ store: 'sqlite', path: './tutor.db' }),
  tools: [calculator],
  system: 'You are a math tutor. Use the calculator tool for all computations.',
  maxToolRounds: 5,
});

agent.on('tool:start', (e) => console.log(`[tool] ${e.data.toolName}(${e.data.arguments})`));
agent.on('tool:end',   (e) => console.log(`[tool] => ${e.data.result} (${e.data.latencyMs}ms)`));

const response = await agent.chat('What is 144 divided by 12, then multiplied by 7?');
console.log(response.content);
```
