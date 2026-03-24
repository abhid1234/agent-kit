---
id: memory
sidebar_position: 3
title: Memory
---

# Memory

`Memory` gives agents persistent, long-term recall. It stores conversation history across sessions, auto-summarizes old exchanges, and retrieves relevant context before each response.

## Constructor

```typescript
import { Memory } from '@avee1234/agent-kit';

const memory = new Memory(config?: MemoryConfig);
```

### `MemoryConfig`

| Field | Type | Default | Description |
|---|---|---|---|
| `store` | `'memory' \| 'sqlite' \| MemoryStore` | `'memory'` | Where to persist data. |
| `path` | `string` | `'./agent-memory.db'` | File path for the SQLite store. |
| `windowSize` | `number` | `20` | Number of recent messages included in each context window. |
| `summarizeAfter` | `number` | `20` | Summarize the conversation after this many messages are saved. |
| `embedding` | `EmbeddingAdapter` | — | Enables semantic (vector) search for summaries. Falls back to keyword search if not set. |

## Memory stores

### In-memory (default)

Data lives in the process. Useful for testing or short-lived agents.

```typescript
const memory = new Memory();
// or explicitly:
const memory = new Memory({ store: 'memory' });
```

### SQLite

Persists to a local file. No database server required.

```typescript
const memory = new Memory({
  store: 'sqlite',
  path: './my-agent.db',   // optional, defaults to ./agent-memory.db
});
```

The SQLite database is created automatically on first use.

### Custom store

Implement the `MemoryStore` interface to use any backend (PostgreSQL, Redis, etc.):

```typescript
import type { MemoryStore } from '@avee1234/agent-kit';

class MyStore implements MemoryStore {
  async saveMessages(agentId, messages) { /* ... */ }
  async getRecentMessages(agentId, limit) { /* ... */ }
  async saveSummary(agentId, summary) { /* ... */ }
  async searchSummaries(agentId, query, limit) { /* ... */ }
}

const memory = new Memory({ store: new MyStore() });
```

See [Custom Memory Store](/guides/custom-memory-store) for a full walkthrough.

## How memory works

Each time `agent.chat()` completes:

1. The user message and assistant response are saved to the store via `saveExchange`
2. If the accumulated message count reaches `summarizeAfter`, the recent messages are summarized by the model and stored as a `Summary`
3. If an `EmbeddingAdapter` is configured, the summary is also embedded and stored for vector search

Before each `agent.chat()` call:

1. The last `windowSize` messages are loaded as the short-term context
2. Up to 3 relevant summaries are retrieved — by embedding similarity if an `EmbeddingAdapter` is present, otherwise by keyword match
3. Relevant summaries are injected as system messages before the conversation history

## Auto-summarization

When the conversation exceeds `summarizeAfter` messages, the agent's own model is used to produce a summary. The summary is saved and used to compress context for future calls.

To tune the behavior:

```typescript
const memory = new Memory({
  store: 'sqlite',
  windowSize: 10,        // keep last 10 messages in context
  summarizeAfter: 15,    // summarize every 15 messages
});
```

## Semantic memory with embeddings

By default, summary retrieval uses simple keyword matching. For better relevance, provide an `EmbeddingAdapter`:

```typescript
import { Memory, OllamaEmbeddingAdapter } from '@avee1234/agent-kit';

const memory = new Memory({
  store: 'sqlite',
  embedding: new OllamaEmbeddingAdapter({
    model: 'nomic-embed-text',  // must be pulled in Ollama
  }),
});
```

With embeddings enabled, `memory.getContext()` performs cosine similarity search over stored summary embeddings.

See [Embeddings guide](/guides/embeddings) for setup instructions.

## Methods

These are called automatically by `Agent`. You generally won't call them directly.

### `saveExchange(agentId, messages)`

Save a batch of messages (typically `[userMsg, assistantMsg]`) and trigger summarization if needed.

### `getContext(agentId, query): Promise<MemoryContext>`

Returns `{ recentMessages: Message[], relevantSummaries: Summary[] }`.

### `close()`

Closes the underlying SQLite connection. Call this when shutting down:

```typescript
memory.close();
```

## Attaching memory to an agent

```typescript
import { Agent, Memory } from '@avee1234/agent-kit';

const agent = new Agent({
  name: 'personal-assistant',
  model: { provider: 'ollama', model: 'llama3.2' },
  memory: new Memory({
    store: 'sqlite',
    path: './assistant.db',
    windowSize: 20,
    summarizeAfter: 30,
  }),
});
```

The `name` field on `Agent` is used as the `agentId` key in the store, so different agents can share the same database without colliding.
