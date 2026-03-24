// src/store/interface.ts
import type { Message, Summary } from '../types';

export interface MemoryStore {
  saveMessages(agentId: string, messages: Message[]): Promise<void>;
  getRecentMessages(agentId: string, limit: number): Promise<Message[]>;
  saveSummary(agentId: string, summary: Summary): Promise<void>;
  searchSummaries(agentId: string, query: string, limit: number): Promise<Summary[]>;

  // Optional embedding methods — stores that support vectors implement these
  saveEmbedding?(agentId: string, summaryId: string, embedding: number[]): Promise<void>;
  searchByEmbedding?(agentId: string, embedding: number[], limit: number): Promise<Summary[]>;
}
