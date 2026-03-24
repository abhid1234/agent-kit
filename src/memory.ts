// src/memory.ts
import type { Message, Summary } from './types';
import { createSummary } from './types';
import type { MemoryStore } from './store/interface';
import { InMemoryStore } from './store/in-memory';
import { SQLiteStore } from './store/sqlite';
import type { ModelAdapter } from './model/adapter';

export interface MemoryConfig {
  store?: 'memory' | 'sqlite' | MemoryStore;
  path?: string;
  windowSize?: number;
  summarizeAfter?: number;
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
  private messageCount = new Map<string, number>();

  constructor(config: MemoryConfig = {}) {
    this.windowSize = config.windowSize ?? 20;
    this.summarizeAfter = config.summarizeAfter ?? 20;

    if (!config.store || config.store === 'memory') {
      this.store = new InMemoryStore();
    } else if (config.store === 'sqlite') {
      this.store = new SQLiteStore(config.path ?? './agent-memory.db');
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
    const relevantSummaries = await this.store.searchSummaries(agentId, query, 3);
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
