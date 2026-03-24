---
id: quick-start
sidebar_position: 2
title: Quick Start
---

# Quick Start

Get a working AI agent running in 5 minutes.

## 1. Install

```bash
npm install @avee1234/agent-kit
```

## 2. Create an agent

The simplest agent uses `MockAdapter` — useful for testing without a running model.

```typescript
import { Agent, MockAdapter } from '@avee1234/agent-kit';

const agent = new Agent({
  name: 'assistant',
  model: new MockAdapter(),
  system: 'You are a helpful assistant.',
});

const response = await agent.chat('What can you help me with?');
console.log(response.content);
```

To use a real model, point at Ollama (must be running locally):

```typescript
import { Agent } from '@avee1234/agent-kit';

const agent = new Agent({
  name: 'assistant',
  model: {
    provider: 'ollama',
    model: 'llama3.2',   // or any model you have pulled
  },
});
```

## 3. Add a tool

Tools are functions the agent can call during a conversation. Define one with `Tool.create`:

```typescript
import { Agent, Tool, MockAdapter } from '@avee1234/agent-kit';

const weatherTool = Tool.create({
  name: 'get_weather',
  description: 'Get the current weather for a city',
  parameters: {
    city: {
      type: 'string',
      description: 'The city name',
      required: true,
    },
  },
  execute: async ({ city }) => {
    // Replace with a real weather API call
    return `The weather in ${city} is sunny and 22°C.`;
  },
});

const agent = new Agent({
  name: 'weather-assistant',
  model: new MockAdapter(),
  tools: [weatherTool],
  system: 'You help users check the weather.',
});

const response = await agent.chat('What is the weather in Tokyo?');
console.log(response.content);
```

## 4. Add memory

Memory makes your agent remember conversations across messages (and across process restarts with SQLite):

```typescript
import { Agent, Memory, MockAdapter } from '@avee1234/agent-kit';

const agent = new Agent({
  name: 'stateful-assistant',
  model: new MockAdapter(),
  memory: new Memory({ store: 'sqlite', path: './agent.db' }),
  system: 'You are a helpful assistant with a good memory.',
});

// First message
await agent.chat('My name is Alice.');

// Later messages — the agent has the previous exchange in context
const response = await agent.chat('What is my name?');
console.log(response.content);

// Clean up the SQLite connection when done
agent.close?.();  // Memory.close() is exposed via agent if needed
```

For in-process testing, use the in-memory store (no persistence):

```typescript
const agent = new Agent({
  name: 'test-agent',
  model: new MockAdapter(),
  memory: new Memory({ store: 'memory' }),
});
```

## 5. Stream a response

Use `agent.stream()` to get tokens as they arrive:

```typescript
import { Agent } from '@avee1234/agent-kit';

const agent = new Agent({
  name: 'writer',
  model: { provider: 'ollama', model: 'llama3.2' },
});

process.stdout.write('Agent: ');
for await (const chunk of agent.stream('Write a haiku about TypeScript.')) {
  process.stdout.write(chunk.text);
}
console.log();
```

## Next steps

- [Agent API](/core/agent) — all constructor options, methods, and events
- [Tool API](/core/tool) — parameter schemas and execution
- [Memory API](/core/memory) — stores, summarization, embeddings
- [Team API](/core/team) — multi-agent coordination strategies
