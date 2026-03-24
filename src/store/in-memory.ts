// src/store/in-memory.ts
import type { Message, Summary } from '../types';
import type { MemoryStore } from './interface';
import { cosineSimilarity } from './cosine';

export class InMemoryStore implements MemoryStore {
  private messages = new Map<string, Message[]>();
  private summaries = new Map<string, Summary[]>();
  // agentId -> (summaryId -> embedding vector)
  private embeddings = new Map<string, Map<string, number[]>>();

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

  async saveEmbedding(agentId: string, summaryId: string, embedding: number[]): Promise<void> {
    let agentMap = this.embeddings.get(agentId);
    if (!agentMap) {
      agentMap = new Map();
      this.embeddings.set(agentId, agentMap);
    }
    agentMap.set(summaryId, embedding);
  }

  async searchByEmbedding(agentId: string, embedding: number[], limit: number): Promise<Summary[]> {
    const agentMap = this.embeddings.get(agentId);
    if (!agentMap || agentMap.size === 0) return [];

    const summaries = this.summaries.get(agentId) ?? [];
    const summaryById = new Map(summaries.map((s) => [s.id, s]));

    const scored: Array<{ summary: Summary; score: number }> = [];
    for (const [summaryId, storedEmbedding] of agentMap) {
      const summary = summaryById.get(summaryId);
      if (!summary) continue;
      const score = cosineSimilarity(embedding, storedEmbedding);
      scored.push({ summary, score });
    }

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((entry) => entry.summary);
  }
}
