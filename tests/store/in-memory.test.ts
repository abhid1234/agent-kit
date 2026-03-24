// tests/store/in-memory.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryStore } from '../../src/store/in-memory';
import { createMessage, createSummary } from '../../src/types';

describe('InMemoryStore', () => {
  let store: InMemoryStore;

  beforeEach(() => {
    store = new InMemoryStore();
  });

  describe('messages', () => {
    it('saves and retrieves messages', async () => {
      const msgs = [
        createMessage({ role: 'user', content: 'hello' }),
        createMessage({ role: 'assistant', content: 'hi there' }),
      ];
      await store.saveMessages('agent-1', msgs);
      const result = await store.getRecentMessages('agent-1', 10);
      expect(result).toHaveLength(2);
      expect(result[0].content).toBe('hello');
    });

    it('respects limit parameter', async () => {
      const msgs = Array.from({ length: 5 }, (_, i) =>
        createMessage({ role: 'user', content: `msg-${i}` }),
      );
      await store.saveMessages('agent-1', msgs);
      const result = await store.getRecentMessages('agent-1', 2);
      expect(result).toHaveLength(2);
      expect(result[0].content).toBe('msg-3');
      expect(result[1].content).toBe('msg-4');
    });

    it('isolates messages by agentId', async () => {
      await store.saveMessages('agent-1', [createMessage({ role: 'user', content: 'a1' })]);
      await store.saveMessages('agent-2', [createMessage({ role: 'user', content: 'a2' })]);
      const result = await store.getRecentMessages('agent-1', 10);
      expect(result).toHaveLength(1);
      expect(result[0].content).toBe('a1');
    });
  });

  describe('summaries', () => {
    it('saves and searches summaries by keyword', async () => {
      await store.saveSummary(
        'agent-1',
        createSummary({ content: 'discussed transformer architectures' }),
      );
      await store.saveSummary(
        'agent-1',
        createSummary({ content: 'talked about cooking recipes' }),
      );
      const results = await store.searchSummaries('agent-1', 'transformer', 5);
      expect(results).toHaveLength(1);
      expect(results[0].content).toContain('transformer');
    });

    it('returns results sorted by recency', async () => {
      await store.saveSummary(
        'agent-1',
        createSummary({
          content: 'old transformer discussion',
          timestamp: 1000,
        }),
      );
      await store.saveSummary(
        'agent-1',
        createSummary({
          content: 'new transformer paper',
          timestamp: 2000,
        }),
      );
      const results = await store.searchSummaries('agent-1', 'transformer', 5);
      expect(results[0].timestamp).toBe(2000);
    });

    it('respects limit parameter', async () => {
      for (let i = 0; i < 5; i++) {
        await store.saveSummary('agent-1', createSummary({ content: `topic ${i} about AI` }));
      }
      const results = await store.searchSummaries('agent-1', 'AI', 2);
      expect(results).toHaveLength(2);
    });

    it('isolates summaries by agentId', async () => {
      await store.saveSummary('agent-1', createSummary({ content: 'agent one AI topic' }));
      await store.saveSummary('agent-2', createSummary({ content: 'agent two AI topic' }));
      const results = await store.searchSummaries('agent-1', 'AI', 10);
      expect(results).toHaveLength(1);
    });
  });

  describe('embeddings', () => {
    it('saveEmbedding and searchByEmbedding return the most similar summary', async () => {
      const summaryA = createSummary({ content: 'machine learning concepts' });
      const summaryB = createSummary({ content: 'cooking recipes' });
      await store.saveSummary('agent-1', summaryA);
      await store.saveSummary('agent-1', summaryB);

      // embedding A is close to query; embedding B is orthogonal
      const embeddingA = [1, 0, 0];
      const embeddingB = [0, 1, 0];
      await store.saveEmbedding!('agent-1', summaryA.id, embeddingA);
      await store.saveEmbedding!('agent-1', summaryB.id, embeddingB);

      const query = [1, 0, 0]; // identical to embeddingA
      const results = await store.searchByEmbedding!('agent-1', query, 1);
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe(summaryA.id);
    });

    it('returns top N results by cosine similarity', async () => {
      const summaries = [
        createSummary({ content: 'alpha' }),
        createSummary({ content: 'beta' }),
        createSummary({ content: 'gamma' }),
      ];
      const embeddings = [
        [0.9, 0.1],
        [0.8, 0.2],
        [0.1, 0.9],
      ];
      for (let i = 0; i < summaries.length; i++) {
        await store.saveSummary('agent-1', summaries[i]);
        await store.saveEmbedding!('agent-1', summaries[i].id, embeddings[i]);
      }

      const query = [1, 0]; // aligned with first two
      const results = await store.searchByEmbedding!('agent-1', query, 2);
      expect(results).toHaveLength(2);
      // The top-2 should be summaries[0] and summaries[1] (highest similarity)
      const ids = results.map((r) => r.id);
      expect(ids).toContain(summaries[0].id);
      expect(ids).toContain(summaries[1].id);
    });

    it('returns empty array when no embeddings stored', async () => {
      const results = await store.searchByEmbedding!('agent-1', [1, 0], 5);
      expect(results).toEqual([]);
    });

    it('isolates embeddings by agentId', async () => {
      const summary = createSummary({ content: 'topic' });
      await store.saveSummary('agent-1', summary);
      await store.saveEmbedding!('agent-1', summary.id, [1, 0, 0]);

      // Searching under a different agent should return nothing
      const results = await store.searchByEmbedding!('agent-2', [1, 0, 0], 5);
      expect(results).toEqual([]);
    });
  });
});
