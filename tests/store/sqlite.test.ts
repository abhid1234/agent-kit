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
});
