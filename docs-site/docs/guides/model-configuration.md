---
id: model-configuration
sidebar_position: 1
title: Model Configuration
---

# Model Configuration

agent-kit is model-agnostic. It ships three adapters: `MockAdapter`, `OpenAICompatibleAdapter`, and `OllamaEmbeddingAdapter`. You can also implement `ModelAdapter` yourself.

## MockAdapter

`MockAdapter` is the default when no `model` is specified. It echoes the user's message and simulates tool calls based on keyword matching — useful for unit tests.

```typescript
import { Agent, MockAdapter } from '@avee1234/agent-kit';

const agent = new Agent({
  name: 'test-agent',
  model: new MockAdapter(),
});
```

`MockAdapter` behavior:
- If the user message contains a word from a tool's name, it calls that tool
- If the system prompt contains "summarize", it returns a truncated mock summary
- Otherwise, it returns `[Mock] Received: "..."` with available tool names

## Ollama (local models)

[Ollama](https://ollama.com) runs open-source models locally with an OpenAI-compatible API.

**Setup:**
```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull a model
ollama pull llama3.2
```

**Configure via `ModelConfig`:**

```typescript
import { Agent } from '@avee1234/agent-kit';

const agent = new Agent({
  name: 'my-agent',
  model: {
    provider: 'ollama',
    model: 'llama3.2',
    // baseURL defaults to http://localhost:11434/v1
  },
});
```

**Or use the adapter directly:**

```typescript
import { Agent, OpenAICompatibleAdapter } from '@avee1234/agent-kit';

const adapter = new OpenAICompatibleAdapter({
  baseURL: 'http://localhost:11434/v1',
  model: 'llama3.2',
  // no apiKey needed for Ollama
});

const agent = new Agent({
  name: 'my-agent',
  model: adapter,
});
```

## OpenAI-compatible endpoints

Any service that exposes an OpenAI-compatible `/chat/completions` endpoint works with `OpenAICompatibleAdapter`:

```typescript
import { Agent, OpenAICompatibleAdapter } from '@avee1234/agent-kit';

// OpenAI
const openaiAdapter = new OpenAICompatibleAdapter({
  baseURL: 'https://api.openai.com/v1',
  apiKey: process.env.OPENAI_API_KEY!,
  model: 'gpt-4o-mini',
});

// Together AI
const togetherAdapter = new OpenAICompatibleAdapter({
  baseURL: 'https://api.together.xyz/v1',
  apiKey: process.env.TOGETHER_API_KEY!,
  model: 'meta-llama/Llama-3-8b-chat-hf',
});

// Groq
const groqAdapter = new OpenAICompatibleAdapter({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY!,
  model: 'llama3-8b-8192',
});

const agent = new Agent({
  name: 'my-agent',
  model: openaiAdapter,  // swap any adapter here
});
```

`OpenAICompatibleAdapter` config:

| Field | Type | Required | Description |
|---|---|---|---|
| `baseURL` | `string` | Yes | API base URL (without `/chat/completions`). |
| `model` | `string` | Yes | Model identifier. |
| `apiKey` | `string` | No | Bearer token. Omit for unauthenticated endpoints like Ollama. |

## Custom ModelAdapter

Implement the `ModelAdapter` interface to add any model not covered above:

```typescript
import type { ModelAdapter, Message, ModelResponse, ModelChunk, ToolDefinition } from '@avee1234/agent-kit';

class MyCustomAdapter implements ModelAdapter {
  async chat(messages: Message[], tools?: ToolDefinition[]): Promise<ModelResponse> {
    // Call your model API
    const response = await myModelAPI.complete(messages);
    return {
      content: response.text,
      tokens: { input: response.inputTokens, output: response.outputTokens },
    };
  }

  async *stream(messages: Message[], tools?: ToolDefinition[]): AsyncIterable<ModelChunk> {
    for await (const chunk of myModelAPI.stream(messages)) {
      yield { text: chunk.text, done: chunk.isLast };
    }
  }
}

const agent = new Agent({
  name: 'my-agent',
  model: new MyCustomAdapter(),
});
```

The `ModelAdapter` interface:

```typescript
interface ModelAdapter {
  chat(messages: Message[], tools?: ToolDefinition[]): Promise<ModelResponse>;
  stream(messages: Message[], tools?: ToolDefinition[]): AsyncIterable<ModelChunk>;
}
```
