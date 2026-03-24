// tests/memory.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Memory } from '../src/memory';
import { createMessage } from '../src/types';
import type { ModelAdapter } from '../src/model/adapter';

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
});
