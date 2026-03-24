// src/memory.ts
import type { Message, Summary } from './types';
import { createSummary } from './types';
import type { MemoryStore } from './store/interface';
import { InMemoryStore } from './store/in-memory';
import { SQLiteStore } from './store/sqlite';
import { PostgresStore } from './store/postgres';
import type { ModelAdapter } from './model/adapter';
import type { EmbeddingAdapter } from './model/embedding-adapter';

export interface MemoryConfig {
  store?: 'memory' | 'sqlite' | 'postgres' | MemoryStore;
  path?: string;
  /** Connection string for PostgreSQL (e.g., process.env.DATABASE_URL). Used when store: 'postgres'. */
  url?: string;
  windowSize?: number;
  summarizeAfter?: number;
  /** Optional embedding adapter for semantic (vector) search. Falls back to keyword search if not set. */
  embedding?: EmbeddingAdapter;
}

export interface MemoryContext {
  recentMessages: Message[];
  relevantSummaries: Summary[];
}

export class Memory {
  private store: MemoryStore;
  private windowSize: number;
  private summarizeAfter: number;
  private model?: ModelAdapter;
  private embeddingAdapter?: EmbeddingAdapter;
  private messageCount = new Map<string, number>();

  constructor(config: MemoryConfig = {}) {
    this.windowSize = config.windowSize ?? 20;
    this.summarizeAfter = config.summarizeAfter ?? 20;
    this.embeddingAdapter = config.embedding;

    if (!config.store || config.store === 'memory') {
      this.store = new InMemoryStore();
    } else if (config.store === 'sqlite') {
      this.store = new SQLiteStore(config.path ?? './agent-memory.db');
    } else if (config.store === 'postgres') {
      const connectionString = config.url ?? config.path;
      if (!connectionString) {
        throw new Error(
          "Memory store 'postgres' requires a connection string via the 'url' config option.",
        );
      }
      this.store = new PostgresStore({ connectionString });
    } else {
      this.store = config.store;
    }
  }

  setModel(model: ModelAdapter): void {
    this.model = model;
  }

  getStore(): MemoryStore {
    return this.store;
  }

  async saveExchange(agentId: string, messages: Message[]): Promise<void> {
    await this.store.saveMessages(agentId, messages);
    const count = (this.messageCount.get(agentId) ?? 0) + messages.length;
    this.messageCount.set(agentId, count);
    if (count >= this.summarizeAfter && this.model) {
      await this.summarize(agentId);
      this.messageCount.set(agentId, 0);
    }
  }

  async getContext(agentId: string, query: string): Promise<MemoryContext> {
    const recentMessages = await this.store.getRecentMessages(agentId, this.windowSize);

    let relevantSummaries: Summary[];
    if (this.embeddingAdapter && this.store.searchByEmbedding) {
      const queryEmbedding = await this.embeddingAdapter.embed(query);
      relevantSummaries = await this.store.searchByEmbedding(agentId, queryEmbedding, 3);
    } else {
      relevantSummaries = await this.store.searchSummaries(agentId, query, 3);
    }

    return { recentMessages, relevantSummaries };
  }

  private async summarize(agentId: string): Promise<void> {
    if (!this.model) return;
    const allRecent = await this.store.getRecentMessages(agentId, this.summarizeAfter);
    if (allRecent.length === 0) return;
    const summaryResponse = await this.model.chat([
      {
        role: 'system',
        content:
          'Summarize the following conversation concisely. Focus on key topics, decisions, and facts discussed.',
        timestamp: Date.now(),
      },
      ...allRecent,
    ]);
    const summary = createSummary({
      content: summaryResponse.content,
      messageRange: {
        from: allRecent[0].timestamp,
        to: allRecent[allRecent.length - 1].timestamp,
      },
    });
    await this.store.saveSummary(agentId, summary);

    // Generate and persist embedding when adapter + store both support it
    if (this.embeddingAdapter && this.store.saveEmbedding) {
      const embedding = await this.embeddingAdapter.embed(summary.content);
      await this.store.saveEmbedding(agentId, summary.id, embedding);
    }
  }

  close(): void {
    if (
      'close' in this.store &&
      typeof (this.store as { close: () => void }).close === 'function'
    ) {
      (this.store as { close: () => void }).close();
    }
  }
}
