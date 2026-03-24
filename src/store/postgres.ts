// src/store/postgres.ts
import { createRequire } from 'module';
import type { Message, Summary } from '../types';
import type { MemoryStore } from './interface';

const require = createRequire(import.meta.url);

export interface PostgresConfig {
  connectionString: string; // e.g., process.env.DATABASE_URL
}

const SCHEMA_SQL = `
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS agent_messages (
  id SERIAL PRIMARY KEY,
  agent_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  tool_calls JSONB,
  tool_call_id TEXT
);

CREATE TABLE IF NOT EXISTS agent_summaries (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  message_range_from BIGINT NOT NULL,
  message_range_to BIGINT NOT NULL,
  embedding vector(768)
);

CREATE INDEX IF NOT EXISTS idx_agent_messages_agent ON agent_messages(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_summaries_agent ON agent_summaries(agent_id);
`;

export class PostgresStore implements MemoryStore {
  private pool: import('pg').Pool;

  constructor(config: PostgresConfig) {
    const { Pool } = require('pg') as typeof import('pg');
    this.pool = new Pool({ connectionString: config.connectionString });
    // init is async; callers should await PostgresStore.create() for guaranteed schema setup
    // but we also kick it off here for convenience
    void this.init();
  }

  private async init(): Promise<void> {
    await this.pool.query(SCHEMA_SQL);
  }

  /** Factory that ensures schema is ready before returning the store. */
  static async create(config: PostgresConfig): Promise<PostgresStore> {
    const store = new PostgresStore(config);
    await store.init();
    return store;
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
    const result = await this.pool.query<{
      role: Message['role'];
      content: string;
      timestamp: string;
      tool_calls: unknown;
      tool_call_id: string | null;
    }>(
      `SELECT role, content, timestamp, tool_calls, tool_call_id
       FROM agent_messages
       WHERE agent_id = $1
       ORDER BY id DESC
       LIMIT $2`,
      [agentId, limit],
    );

    return result.rows.reverse().map((row) => ({
      role: row.role,
      content: row.content,
      timestamp: Number(row.timestamp),
      ...(row.tool_calls
        ? {
            toolCalls:
              typeof row.tool_calls === 'string' ? JSON.parse(row.tool_calls) : row.tool_calls,
          }
        : {}),
      ...(row.tool_call_id ? { toolCallId: row.tool_call_id } : {}),
    }));
  }

  async saveSummary(agentId: string, summary: Summary): Promise<void> {
    await this.pool.query(
      `INSERT INTO agent_summaries (id, agent_id, content, timestamp, message_range_from, message_range_to)
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
    const result = await this.pool.query<{
      id: string;
      content: string;
      timestamp: string;
      message_range_from: string;
      message_range_to: string;
    }>(
      `SELECT id, content, timestamp, message_range_from, message_range_to
       FROM agent_summaries
       WHERE agent_id = $1 AND content ILIKE $2
       ORDER BY timestamp DESC
       LIMIT $3`,
      [agentId, `%${query}%`, limit],
    );

    return result.rows.map((row) => ({
      id: row.id,
      content: row.content,
      timestamp: Number(row.timestamp),
      messageRange: {
        from: Number(row.message_range_from),
        to: Number(row.message_range_to),
      },
    }));
  }

  async saveEmbedding(agentId: string, summaryId: string, embedding: number[]): Promise<void> {
    // Format as pgvector literal: '[0.1,0.2,...]'
    const vectorLiteral = `[${embedding.join(',')}]`;
    await this.pool.query(
      `UPDATE agent_summaries SET embedding = $1 WHERE id = $2 AND agent_id = $3`,
      [vectorLiteral, summaryId, agentId],
    );
  }

  async searchByEmbedding(agentId: string, embedding: number[], limit: number): Promise<Summary[]> {
    const vectorLiteral = `[${embedding.join(',')}]`;
    const result = await this.pool.query<{
      id: string;
      content: string;
      timestamp: string;
      message_range_from: string;
      message_range_to: string;
    }>(
      `SELECT id, content, timestamp, message_range_from, message_range_to
       FROM agent_summaries
       WHERE agent_id = $1 AND embedding IS NOT NULL
       ORDER BY embedding <=> $2
       LIMIT $3`,
      [agentId, vectorLiteral, limit],
    );

    return result.rows.map((row) => ({
      id: row.id,
      content: row.content,
      timestamp: Number(row.timestamp),
      messageRange: {
        from: Number(row.message_range_from),
        to: Number(row.message_range_to),
      },
    }));
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
