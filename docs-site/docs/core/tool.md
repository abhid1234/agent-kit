---
id: tool
sidebar_position: 2
title: Tool
---

# Tool

Tools are typed functions that an agent can call during a conversation. The agent decides when and how to call them based on the user's input and the tool's description.

## `Tool.create(config)`

The only way to create a `Tool`. The constructor is private.

```typescript
import { Tool } from '@avee1234/agent-kit';

const myTool = Tool.create({
  name: 'tool_name',
  description: 'What this tool does (shown to the model)',
  parameters: {
    param1: { type: 'string', description: '...', required: true },
    param2: { type: 'number', description: '...' },
  },
  execute: async (params) => {
    // params is Record<string, unknown>
    return 'result';
  },
});
```

### Config fields

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | Yes | Snake_case identifier. The model uses this to call the tool. |
| `description` | `string` | Yes | Natural language description. Be specific — this is what guides the model to use the tool correctly. |
| `parameters` | `Record<string, ParameterDef>` | Yes | Parameter schema. Each key is a parameter name. |
| `execute` | `(params) => Promise<unknown>` | Yes | The function to run. Return value is serialized to a string if not already one. |

### `ParameterDef`

```typescript
interface ParameterDef {
  type: string;         // 'string', 'number', 'boolean', etc.
  description?: string;
  enum?: string[];      // restrict to specific values
  required?: boolean;
}
```

## Properties

```typescript
tool.name        // string — tool name
tool.description // string — tool description
tool.definition  // ToolDefinition — the schema sent to the model
```

## Execution

You typically don't call `tool.execute()` directly — the `Agent` handles this automatically when the model requests a tool call.

The agent:
1. Parses the JSON arguments returned by the model
2. Calls `tool.execute(parsedArgs)`
3. Serializes the result (non-strings become `JSON.stringify`d)
4. Feeds the result back to the model

If `execute` throws, the error message is returned to the model as the tool result, and a `error` event is emitted.

## Examples

### Simple lookup

```typescript
import { Tool } from '@avee1234/agent-kit';

const weatherTool = Tool.create({
  name: 'get_weather',
  description: 'Get current weather for a city',
  parameters: {
    city: {
      type: 'string',
      description: 'The city name, e.g. "Tokyo"',
      required: true,
    },
  },
  execute: async ({ city }) => {
    const res = await fetch(`https://wttr.in/${city}?format=3`);
    return res.text();
  },
});
```

### Enum parameter

```typescript
const createTicket = Tool.create({
  name: 'create_ticket',
  description: 'Create a support ticket',
  parameters: {
    title: {
      type: 'string',
      description: 'Short summary of the issue',
      required: true,
    },
    priority: {
      type: 'string',
      description: 'Ticket priority',
      enum: ['low', 'medium', 'high'],
      required: true,
    },
  },
  execute: async ({ title, priority }) => {
    // const ticket = await jira.create(title, priority);
    return `Ticket created: [${priority}] ${title}`;
  },
});
```

### Returning structured data

The `execute` function can return any value. Non-string values are `JSON.stringify`d before being sent to the model.

```typescript
const searchTool = Tool.create({
  name: 'search_products',
  description: 'Search the product catalog',
  parameters: {
    query: { type: 'string', required: true },
    limit: { type: 'number', description: 'Max results (default 5)' },
  },
  execute: async ({ query, limit = 5 }) => {
    const results = await db.search(query as string, limit as number);
    return results; // array — will be JSON.stringify'd
  },
});
```

## Using tools in an agent

```typescript
import { Agent, Tool } from '@avee1234/agent-kit';

const agent = new Agent({
  name: 'assistant',
  model: { provider: 'ollama', model: 'llama3.2' },
  tools: [weatherTool, createTicket, searchTool],
  system: 'You are a helpful assistant. Use tools when appropriate.',
});
```
