// tests/memory.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Memory } from '../src/memory';
import { createMessage, createSummary } from '../src/types';
import type { ModelAdapter } from '../src/model/adapter';
import type { EmbeddingAdapter } from '../src/model/embedding-adapter';

// A mock model for summarization
const mockModel: ModelAdapter = {
  chat: vi.fn().mockResolvedValue({ content: '[Summary] conversation about testing' }),
  async *stream() {
    yield { text: '', done: true };
  },
};

describe('Memory', () => {
  describe('with default in-memory store', () => {
    it('creates with no arguments', () => {
      const memory = new Memory();
      expect(memory).toBeDefined();
    });

    it('saves and retrieves messages', async () => {
      const memory = new Memory();
      const msgs = [
        createMessage({ role: 'user', content: 'hello' }),
        createMessage({ role: 'assistant', content: 'hi' }),
      ];
      await memory.saveExchange('agent-1', msgs);
      const recent = await memory.getContext('agent-1', 'next question');
      expect(recent.recentMessages).toHaveLength(2);
    });

    it('respects window size', async () => {
      const memory = new Memory({ windowSize: 3 });
      for (let i = 0; i < 5; i++) {
        await memory.saveExchange('agent-1', [
          createMessage({ role: 'user', content: `msg-${i}` }),
        ]);
      }
      const ctx = await memory.getContext('agent-1', 'test');
      expect(ctx.recentMessages.length).toBeLessThanOrEqual(3);
    });
  });

  describe('with SQLite store', () => {
    it('creates with sqlite config', async () => {
      const memory = new Memory({ store: 'sqlite', path: './test-memory.db' });
      expect(memory).toBeDefined();
      memory.close();
      const { unlinkSync, existsSync } = await import('fs');
      if (existsSync('./test-memory.db')) unlinkSync('./test-memory.db');
    });
  });

  describe('summarization', () => {
    it('triggers summarization when messages exceed summarizeAfter threshold', async () => {
      const memory = new Memory({ windowSize: 5, summarizeAfter: 5 });
      memory.setModel(mockModel);
      for (let i = 0; i < 7; i++) {
        await memory.saveExchange('agent-1', [
          createMessage({ role: 'user', content: `message ${i}` }),
        ]);
      }
      expect(mockModel.chat).toHaveBeenCalled();
    });
  });

  describe('context retrieval', () => {
    it('returns relevant summaries alongside recent messages', async () => {
      const memory = new Memory();
      await memory.getStore().saveSummary('agent-1', {
        id: 'test-summary',
        content: 'discussed transformer architectures',
        timestamp: Date.now(),
        messageRange: { from: 0, to: 0 },
      });
      await memory.saveExchange('agent-1', [createMessage({ role: 'user', content: 'hello' })]);
      const ctx = await memory.getContext('agent-1', 'transformer');
      expect(ctx.relevantSummaries).toHaveLength(1);
      expect(ctx.relevantSummaries[0].content).toContain('transformer');
    });
  });

  describe('embedding-based retrieval', () => {
    let mockEmbedding: EmbeddingAdapter;

    beforeEach(() => {
      mockEmbedding = {
        embed: vi.fn(),
        embedBatch: vi.fn(),
      };
    });

    it('uses searchByEmbedding when embedding adapter is configured', async () => {
      const queryVector = [1, 0, 0];
      (mockEmbedding.embed as ReturnType<typeof vi.fn>).mockResolvedValue(queryVector);

      const memory = new Memory({ embedding: mockEmbedding });
      const store = memory.getStore();

      const summary = createSummary({ content: 'semantic content' });
      await store.saveSummary('agent-1', summary);
      await store.saveEmbedding!('agent-1', summary.id, [1, 0, 0]);

      const ctx = await memory.getContext('agent-1', 'some query');
      expect(mockEmbedding.embed).toHaveBeenCalledWith('some query');
      expect(ctx.relevantSummaries).toHaveLength(1);
      expect(ctx.relevantSummaries[0].id).toBe(summary.id);
    });

    it('falls back to keyword search when no embedding adapter is set', async () => {
      const memory = new Memory(); // no embedding adapter
      const store = memory.getStore();

      await store.saveSummary('agent-1', createSummary({ content: 'keyword match content' }));

      const ctx = await memory.getContext('agent-1', 'keyword');
      expect(ctx.relevantSummaries).toHaveLength(1);
    });

    it('generates and stores embedding when summarizing with an embedding adapter', async () => {
      const embeddingVector = [0.1, 0.9, 0.0];
      (mockEmbedding.embed as ReturnType<typeof vi.fn>).mockResolvedValue(embeddingVector);

      const memory = new Memory({
        windowSize: 5,
        summarizeAfter: 3,
        embedding: mockEmbedding,
      });
      memory.setModel(mockModel);

      for (let i = 0; i < 4; i++) {
        await memory.saveExchange('agent-1', [
          createMessage({ role: 'user', content: `message ${i}` }),
        ]);
      }

      // embed should have been called for the summary content
      expect(mockEmbedding.embed).toHaveBeenCalled();

      // The embedding should be retrievable via searchByEmbedding
      const store = memory.getStore();
      const results = await store.searchByEmbedding!('agent-1', embeddingVector, 1);
      expect(results).toHaveLength(1);
    });

    it('does not call embed during getContext when store lacks searchByEmbedding', async () => {
      // A bare-minimum store that does NOT implement searchByEmbedding
      const minimalStore = {
        saveMessages: vi.fn().mockResolvedValue(undefined),
        getRecentMessages: vi.fn().mockResolvedValue([]),
        saveSummary: vi.fn().mockResolvedValue(undefined),
        searchSummaries: vi.fn().mockResolvedValue([]),
        // no saveEmbedding / searchByEmbedding
      };

      const memory = new Memory({ store: minimalStore, embedding: mockEmbedding });
      await memory.getContext('agent-1', 'query');

      // Falls back to keyword search since store doesn't implement searchByEmbedding
      expect(minimalStore.searchSummaries).toHaveBeenCalledWith('agent-1', 'query', 3);
      expect(mockEmbedding.embed).not.toHaveBeenCalled();
    });
  });
});
