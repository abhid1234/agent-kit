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
});
