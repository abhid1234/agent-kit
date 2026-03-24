// src/store/in-memory.ts
import type { Message, Summary } from '../types';
import type { MemoryStore } from './interface';

export class InMemoryStore implements MemoryStore {
  private messages = new Map<string, Message[]>();
  private summaries = new Map<string, Summary[]>();

  async saveMessages(agentId: string, messages: Message[]): Promise<void> {
    const existing = this.messages.get(agentId) ?? [];
    existing.push(...messages);
    this.messages.set(agentId, existing);
  }

  async getRecentMessages(agentId: string, limit: number): Promise<Message[]> {
    const all = this.messages.get(agentId) ?? [];
    return all.slice(-limit);
  }

  async saveSummary(agentId: string, summary: Summary): Promise<void> {
    const existing = this.summaries.get(agentId) ?? [];
    existing.push(summary);
    this.summaries.set(agentId, existing);
  }

  async searchSummaries(agentId: string, query: string, limit: number): Promise<Summary[]> {
    const all = this.summaries.get(agentId) ?? [];
    const queryLower = query.toLowerCase();
    const matches = all
      .filter((s) => s.content.toLowerCase().includes(queryLower))
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
    return matches;
  }
}
