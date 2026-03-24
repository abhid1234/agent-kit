// src/store/sqlite.ts
import { createRequire } from 'module';
import type { Message, Summary } from '../types';
import type { MemoryStore } from './interface';

const require = createRequire(import.meta.url);

export class SQLiteStore implements MemoryStore {
  private db: import('better-sqlite3').Database;

  constructor(path: string) {
    const Database = require('better-sqlite3');
    this.db = new Database(path);
    this.db.pragma('journal_mode = WAL');
    this.init();
  }

  private init(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        agent_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        tool_calls TEXT,
        tool_call_id TEXT
      );
      CREATE TABLE IF NOT EXISTS summaries (
        id TEXT PRIMARY KEY,
        agent_id TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        message_range_from INTEGER NOT NULL,
        message_range_to INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_messages_agent ON messages(agent_id);
      CREATE INDEX IF NOT EXISTS idx_summaries_agent ON summaries(agent_id);
    `);
  }

  async saveMessages(agentId: string, messages: Message[]): Promise<void> {
    const stmt = this.db.prepare(
      'INSERT INTO messages (agent_id, role, content, timestamp, tool_calls, tool_call_id) VALUES (?, ?, ?, ?, ?, ?)',
    );
    const insertMany = this.db.transaction((msgs: Message[]) => {
      for (const msg of msgs) {
        stmt.run(
          agentId,
          msg.role,
          msg.content,
          msg.timestamp,
          msg.toolCalls ? JSON.stringify(msg.toolCalls) : null,
          msg.toolCallId ?? null,
        );
      }
    });
    insertMany(messages);
  }

  async getRecentMessages(agentId: string, limit: number): Promise<Message[]> {
    const rows = this.db
      .prepare(
        `SELECT role, content, timestamp, tool_calls, tool_call_id
       FROM messages WHERE agent_id = ?
       ORDER BY id DESC LIMIT ?`,
      )
      .all(agentId, limit) as Array<{
      role: Message['role'];
      content: string;
      timestamp: number;
      tool_calls: string | null;
      tool_call_id: string | null;
    }>;

    return rows.reverse().map((row) => ({
      role: row.role,
      content: row.content,
      timestamp: row.timestamp,
      ...(row.tool_calls ? { toolCalls: JSON.parse(row.tool_calls) } : {}),
      ...(row.tool_call_id ? { toolCallId: row.tool_call_id } : {}),
    }));
  }

  async saveSummary(agentId: string, summary: Summary): Promise<void> {
    this.db
      .prepare(
        'INSERT INTO summaries (id, agent_id, content, timestamp, message_range_from, message_range_to) VALUES (?, ?, ?, ?, ?, ?)',
      )
      .run(
        summary.id,
        agentId,
        summary.content,
        summary.timestamp,
        summary.messageRange.from,
        summary.messageRange.to,
      );
  }

  async searchSummaries(agentId: string, query: string, limit: number): Promise<Summary[]> {
    const rows = this.db
      .prepare(
        `SELECT id, content, timestamp, message_range_from, message_range_to
       FROM summaries WHERE agent_id = ? AND content LIKE ?
       ORDER BY timestamp DESC LIMIT ?`,
      )
      .all(agentId, `%${query}%`, limit) as Array<{
      id: string;
      content: string;
      timestamp: number;
      message_range_from: number;
      message_range_to: number;
    }>;

    return rows.map((row) => ({
      id: row.id,
      content: row.content,
      timestamp: row.timestamp,
      messageRange: { from: row.message_range_from, to: row.message_range_to },
    }));
  }

  close(): void {
    this.db.close();
  }
}
