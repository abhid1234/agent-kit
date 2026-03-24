// tests/store/sqlite.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SQLiteStore } from '../../src/store/sqlite';
import { createMessage, createSummary } from '../../src/types';
import { existsSync, unlinkSync } from 'fs';

const TEST_DB = './test-agent-memory.db';

describe('SQLiteStore', () => {
  let store: SQLiteStore;

  beforeEach(() => {
    store = new SQLiteStore(TEST_DB);
  });

  afterEach(() => {
    store.close();
    if (existsSync(TEST_DB)) unlinkSync(TEST_DB);
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
      expect(result[1].content).toBe('hi there');
    });

    it('respects limit parameter', async () => {
      const msgs = Array.from({ length: 5 }, (_, i) =>
        createMessage({ role: 'user', content: `msg-${i}` }),
      );
      await store.saveMessages('agent-1', msgs);
      const result = await store.getRecentMessages('agent-1', 2);
      expect(result).toHaveLength(2);
      expect(result[0].content).toBe('msg-3');
    });

    it('preserves tool call data', async () => {
      const msg = createMessage({
        role: 'assistant',
        content: '',
        toolCalls: [{ id: 'tc1', name: 'search', arguments: '{"q":"test"}' }],
      });
      await store.saveMessages('agent-1', [msg]);
      const result = await store.getRecentMessages('agent-1', 1);
      expect(result[0].toolCalls).toEqual([
        { id: 'tc1', name: 'search', arguments: '{"q":"test"}' },
      ]);
    });

    it('persists across instances', async () => {
      await store.saveMessages('agent-1', [
        createMessage({ role: 'user', content: 'remember me' }),
      ]);
      store.close();

      const store2 = new SQLiteStore(TEST_DB);
      const result = await store2.getRecentMessages('agent-1', 10);
      expect(result).toHaveLength(1);
      expect(result[0].content).toBe('remember me');
      store2.close();
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
  });

  describe('embeddings', () => {
    it('saves and retrieves embedding, returning most similar summary first', async () => {
      const summaryA = createSummary({ content: 'neural network discussion' });
      const summaryB = createSummary({ content: 'gardening tips' });
      await store.saveSummary('agent-1', summaryA);
      await store.saveSummary('agent-1', summaryB);

      await store.saveEmbedding('agent-1', summaryA.id, [1, 0, 0]);
      await store.saveEmbedding('agent-1', summaryB.id, [0, 1, 0]);

      const results = await store.searchByEmbedding('agent-1', [1, 0, 0], 1);
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe(summaryA.id);
    });

    it('returns top N results ranked by cosine similarity', async () => {
      const s1 = createSummary({ content: 'alpha' });
      const s2 = createSummary({ content: 'beta' });
      const s3 = createSummary({ content: 'gamma' });
      for (const s of [s1, s2, s3]) await store.saveSummary('agent-1', s);

      await store.saveEmbedding('agent-1', s1.id, [0.9, 0.1]);
      await store.saveEmbedding('agent-1', s2.id, [0.8, 0.2]);
      await store.saveEmbedding('agent-1', s3.id, [0.1, 0.9]);

      const results = await store.searchByEmbedding('agent-1', [1, 0], 2);
      expect(results).toHaveLength(2);
      const ids = results.map((r) => r.id);
      expect(ids).toContain(s1.id);
      expect(ids).toContain(s2.id);
    });

    it('returns empty array when no embeddings exist', async () => {
      const results = await store.searchByEmbedding('agent-1', [1, 0], 5);
      expect(results).toEqual([]);
    });

    it('isolates embeddings by agentId', async () => {
      const summary = createSummary({ content: 'topic A' });
      await store.saveSummary('agent-1', summary);
      await store.saveEmbedding('agent-1', summary.id, [1, 0, 0]);

      const results = await store.searchByEmbedding('agent-2', [1, 0, 0], 5);
      expect(results).toEqual([]);
    });

    it('persists embeddings across store instances', async () => {
      const summary = createSummary({ content: 'persistent embedding test' });
      await store.saveSummary('agent-1', summary);
      await store.saveEmbedding('agent-1', summary.id, [0.5, 0.5, 0.0]);
      // Close and reopen (afterEach will also close, but better-sqlite3 is idempotent on closed db)
      store.close();

      const store2 = new SQLiteStore(TEST_DB);
      const results = await store2.searchByEmbedding('agent-1', [1, 1, 0], 1);
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe(summary.id);
      store2.close();
    });

    it('upserts embedding on duplicate summaryId', async () => {
      const summary = createSummary({ content: 'upsert test' });
      await store.saveSummary('agent-1', summary);
      await store.saveEmbedding('agent-1', summary.id, [1, 0]);
      await store.saveEmbedding('agent-1', summary.id, [0, 1]); // overwrite

      const results = await store.searchByEmbedding('agent-1', [0, 1], 1);
      expect(results).toHaveLength(1);
      // Score should be 1 (identical) now that we stored [0,1]
      expect(results[0].id).toBe(summary.id);
    });
  });
});
