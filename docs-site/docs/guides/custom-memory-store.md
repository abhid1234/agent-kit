---
id: custom-memory-store
sidebar_position: 2
title: Custom Memory Store
---

# Custom Memory Store

agent-kit ships with two built-in stores: `InMemoryStore` (ephemeral) and `SQLiteStore` (file-based). For production workloads you can implement `MemoryStore` against any backend.

## The `MemoryStore` interface

```typescript
import type { Message, Summary } from '@avee1234/agent-kit';

interface MemoryStore {
  // Required
  saveMessages(agentId: string, messages: Message[]): Promise<void>;
  getRecentMessages(agentId: string, limit: number): Promise<Message[]>;
  saveSummary(agentId: string, summary: Summary): Promise<void>;
  searchSummaries(agentId: string, query: string, limit: number): Promise<Summary[]>;

  // Optional — implement for vector/semantic search
  saveEmbedding?(agentId: string, summaryId: string, embedding: number[]): Promise<void>;
  searchByEmbedding?(agentId: string, embedding: number[], limit: number): Promise<Summary[]>;
}
```

The four required methods handle the full lifecycle:

| Method | Called by | Purpose |
|---|---|---|
| `saveMessages` | `Memory.saveExchange()` | Persist user + assistant messages |
| `getRecentMessages` | `Memory.getContext()` | Load recent history for the context window |
| `saveSummary` | `Memory.summarize()` | Persist a generated summary |
| `searchSummaries` | `Memory.getContext()` | Retrieve relevant summaries by keyword |

The two optional methods unlock semantic search:

| Method | Purpose |
|---|---|
| `saveEmbedding` | Persist a vector embedding for a summary |
| `searchByEmbedding` | Retrieve summaries by cosine similarity |

If either optional method is absent, `Memory` falls back to `searchSummaries`.

## Example: PostgreSQL store

Here is a minimal PostgreSQL implementation using raw `pg`. Adapt the queries to your ORM of choice.

```typescript
import { Pool } from 'pg';
import type { MemoryStore } from '@avee1234/agent-kit';
import type { Message, Summary } from '@avee1234/agent-kit';

export class PostgresMemoryStore implements MemoryStore {
  private pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString });
  }

  async saveMessages(agentId: string, messages: Message[]): Promise<void> {
    for (const msg of messages) {
      await this.pool.query(
        `INSERT INTO agent_messages (agent_id, role, content, timestamp, tool_calls, tool_call_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          agentId,
          msg.role,
          msg.content,
          msg.timestamp,
          msg.toolCalls ? JSON.stringify(msg.toolCalls) : null,
          msg.toolCallId ?? null,
        ],
      );
    }
  }

  async getRecentMessages(agentId: string, limit: number): Promise<Message[]> {
    const { rows } = await this.pool.query(
      `SELECT role, content, timestamp, tool_calls, tool_call_id
       FROM agent_messages
       WHERE agent_id = $1
       ORDER BY timestamp DESC
       LIMIT $2`,
      [agentId, limit],
    );
    return rows.reverse().map((row) => ({
      role: row.role,
      content: row.content,
      timestamp: Number(row.timestamp),
      toolCalls: row.tool_calls ? JSON.parse(row.tool_calls) : undefined,
      toolCallId: row.tool_call_id ?? undefined,
    }));
  }

  async saveSummary(agentId: string, summary: Summary): Promise<void> {
    await this.pool.query(
      `INSERT INTO agent_summaries (id, agent_id, content, timestamp, range_from, range_to)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        summary.id,
        agentId,
        summary.content,
        summary.timestamp,
        summary.messageRange.from,
        summary.messageRange.to,
      ],
    );
  }

  async searchSummaries(agentId: string, query: string, limit: number): Promise<Summary[]> {
    // Simple keyword search — replace with full-text search for better results
    const { rows } = await this.pool.query(
      `SELECT id, content, timestamp, range_from, range_to
       FROM agent_summaries
       WHERE agent_id = $1 AND content ILIKE $2
       ORDER BY timestamp DESC
       LIMIT $3`,
      [agentId, `%${query}%`, limit],
    );
    return rows.map((row) => ({
      id: row.id,
      content: row.content,
      timestamp: Number(row.timestamp),
      messageRange: { from: Number(row.range_from), to: Number(row.range_to) },
    }));
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
```

Use it:

```typescript
import { Agent, Memory } from '@avee1234/agent-kit';
import { PostgresMemoryStore } from './postgres-store';

const memory = new Memory({
  store: new PostgresMemoryStore(process.env.DATABASE_URL!),
  windowSize: 30,
  summarizeAfter: 40,
});

const agent = new Agent({
  name: 'production-agent',
  model: { provider: 'ollama', model: 'llama3.2' },
  memory,
});
```

## Adding vector search

To unlock semantic retrieval, implement the optional `saveEmbedding` and `searchByEmbedding` methods. With PostgreSQL you can use [pgvector](https://github.com/pgvector/pgvector):

```typescript
// Requires pgvector extension: CREATE EXTENSION IF NOT EXISTS vector;

async saveEmbedding(agentId: string, summaryId: string, embedding: number[]): Promise<void> {
  await this.pool.query(
    `UPDATE agent_summaries
     SET embedding = $1
     WHERE id = $2 AND agent_id = $3`,
    [`[${embedding.join(',')}]`, summaryId, agentId],
  );
}

async searchByEmbedding(agentId: string, embedding: number[], limit: number): Promise<Summary[]> {
  const { rows } = await this.pool.query(
    `SELECT id, content, timestamp, range_from, range_to
     FROM agent_summaries
     WHERE agent_id = $1 AND embedding IS NOT NULL
     ORDER BY embedding <=> $2   -- cosine distance operator
     LIMIT $3`,
    [agentId, `[${embedding.join(',')}]`, limit],
  );
  return rows.map((row) => ({
    id: row.id,
    content: row.content,
    timestamp: Number(row.timestamp),
    messageRange: { from: Number(row.range_from), to: Number(row.range_to) },
  }));
}
```

Then pass an embedding adapter to `Memory`:

```typescript
import { OllamaEmbeddingAdapter } from '@avee1234/agent-kit';

const memory = new Memory({
  store: new PostgresMemoryStore(process.env.DATABASE_URL!),
  embedding: new OllamaEmbeddingAdapter({ model: 'nomic-embed-text' }),
});
```

`Memory` will call `saveEmbedding` automatically after each summarization, and use `searchByEmbedding` instead of `searchSummaries` when retrieving context.
