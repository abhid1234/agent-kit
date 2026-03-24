// tests/store/postgres.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMessage, createSummary } from '../../src/types';

// ---------------------------------------------------------------------------
// Mock the `pg` module before importing PostgresStore
// ---------------------------------------------------------------------------

const mockQuery = vi.fn();
const mockEnd = vi.fn().mockResolvedValue(undefined);

vi.mock('pg', () => {
  class Pool {
    query = mockQuery;
    end = mockEnd;
  }
  return { Pool };
});

// Also intercept the createRequire-based lazy load used inside postgres.ts
vi.mock('module', async (importOriginal) => {
  const actual = await importOriginal<typeof import('module')>();
  return {
    ...actual,
    createRequire: () => () => {
      class Pool {
        query = mockQuery;
        end = mockEnd;
      }
      return { Pool };
    },
  };
});

// Import AFTER mocks are set up
const { PostgresStore } = await import('../../src/store/postgres');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Return a resolved pg QueryResult with zero rows by default. */
function pgOk(rows: Record<string, unknown>[] = []) {
  return Promise.resolve({ rows, rowCount: rows.length });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PostgresStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: all queries succeed with no rows
    mockQuery.mockResolvedValue({ rows: [], rowCount: 0 });
  });

  // -------------------------------------------------------------------------
  // Constructor / schema init
  // -------------------------------------------------------------------------

  describe('constructor', () => {
    it('runs schema creation SQL on construction (via void init)', () => {
      new PostgresStore({ connectionString: 'postgres://localhost/test' });
      // The constructor fires void init() — mockQuery will have been scheduled
      // We check it after a tick
      return Promise.resolve().then(() => {
        expect(mockQuery).toHaveBeenCalledWith(
          expect.stringContaining('CREATE TABLE IF NOT EXISTS agent_messages'),
        );
      });
    });

    it('schema SQL includes pgvector extension creation', () => {
      new PostgresStore({ connectionString: 'postgres://localhost/test' });
      return Promise.resolve().then(() => {
        const call = mockQuery.mock.calls[0][0] as string;
        expect(call).toContain('CREATE EXTENSION IF NOT EXISTS vector');
      });
    });

    it('schema SQL includes indexes', () => {
      new PostgresStore({ connectionString: 'postgres://localhost/test' });
      return Promise.resolve().then(() => {
        const call = mockQuery.mock.calls[0][0] as string;
        expect(call).toContain('CREATE INDEX IF NOT EXISTS idx_agent_messages_agent');
        expect(call).toContain('CREATE INDEX IF NOT EXISTS idx_agent_summaries_agent');
      });
    });
  });

  // -------------------------------------------------------------------------
  // saveMessages
  // -------------------------------------------------------------------------

  describe('saveMessages', () => {
    it('inserts each message with the correct SQL and parameters', async () => {
      const store = new PostgresStore({ connectionString: 'postgres://localhost/test' });
      const msg = createMessage({ role: 'user', content: 'hello', timestamp: 1000 });
      await store.saveMessages('agent-1', [msg]);

      const insertCall = mockQuery.mock.calls.find(
        (c: unknown[]) =>
          typeof c[0] === 'string' && (c[0] as string).includes('INSERT INTO agent_messages'),
      );
      expect(insertCall).toBeDefined();
      const [sql, params] = insertCall as [string, unknown[]];
      expect(sql).toContain('INSERT INTO agent_messages');
      expect(params).toContain('agent-1');
      expect(params).toContain('user');
      expect(params).toContain('hello');
      expect(params).toContain(1000);
    });

    it('serializes toolCalls to JSON when present', async () => {
      const store = new PostgresStore({ connectionString: 'postgres://localhost/test' });
      const msg = createMessage({
        role: 'assistant',
        content: '',
        timestamp: 1000,
        toolCalls: [{ id: 'tc1', name: 'search', arguments: '{}' }],
      });
      await store.saveMessages('agent-1', [msg]);

      const insertCall = mockQuery.mock.calls.find(
        (c: unknown[]) =>
          typeof c[0] === 'string' && (c[0] as string).includes('INSERT INTO agent_messages'),
      );
      const params = (insertCall as [string, unknown[]])[1];
      expect(params[4]).toBe(JSON.stringify(msg.toolCalls));
    });

    it('uses null for toolCalls when not present', async () => {
      const store = new PostgresStore({ connectionString: 'postgres://localhost/test' });
      const msg = createMessage({ role: 'user', content: 'plain', timestamp: 1000 });
      await store.saveMessages('agent-1', [msg]);

      const insertCall = mockQuery.mock.calls.find(
        (c: unknown[]) =>
          typeof c[0] === 'string' && (c[0] as string).includes('INSERT INTO agent_messages'),
      );
      const params = (insertCall as [string, unknown[]])[1];
      expect(params[4]).toBeNull();
    });

    it('inserts multiple messages with separate queries', async () => {
      const store = new PostgresStore({ connectionString: 'postgres://localhost/test' });
      const msgs = [
        createMessage({ role: 'user', content: 'a', timestamp: 1 }),
        createMessage({ role: 'assistant', content: 'b', timestamp: 2 }),
      ];
      await store.saveMessages('agent-1', msgs);

      const insertCalls = mockQuery.mock.calls.filter(
        (c: unknown[]) =>
          typeof c[0] === 'string' && (c[0] as string).includes('INSERT INTO agent_messages'),
      );
      expect(insertCalls).toHaveLength(2);
    });
  });

  // -------------------------------------------------------------------------
  // getRecentMessages
  // -------------------------------------------------------------------------

  describe('getRecentMessages', () => {
    it('queries with ORDER BY id DESC and LIMIT', async () => {
      const store = new PostgresStore({ connectionString: 'postgres://localhost/test' });
      await store.getRecentMessages('agent-1', 10);

      const selectCall = mockQuery.mock.calls.find(
        (c: unknown[]) =>
          typeof c[0] === 'string' && (c[0] as string).includes('FROM agent_messages'),
      );
      expect(selectCall).toBeDefined();
      const [sql, params] = selectCall as [string, unknown[]];
      expect(sql).toContain('ORDER BY id DESC');
      expect(sql).toContain('LIMIT');
      expect(params).toContain('agent-1');
      expect(params).toContain(10);
    });

    it('maps rows to Message objects and reverses order', async () => {
      const rows = [
        {
          role: 'assistant',
          content: 'hi',
          timestamp: '200',
          tool_calls: null,
          tool_call_id: null,
        },
        { role: 'user', content: 'hello', timestamp: '100', tool_calls: null, tool_call_id: null },
      ];
      mockQuery.mockImplementation((sql: string) => {
        if (typeof sql === 'string' && sql.includes('FROM agent_messages')) {
          return Promise.resolve({ rows, rowCount: rows.length });
        }
        return Promise.resolve({ rows: [], rowCount: 0 });
      });
      const store = new PostgresStore({ connectionString: 'postgres://localhost/test' });
      // Let init complete before we call the method
      await Promise.resolve();

      const result = await store.getRecentMessages('agent-1', 2);
      // reversed: oldest first
      expect(result[0].content).toBe('hello');
      expect(result[1].content).toBe('hi');
      expect(result[0].timestamp).toBe(100);
    });

    it('deserializes JSONB tool_calls correctly', async () => {
      const toolCalls = [{ id: 'tc1', name: 'search', arguments: '{}' }];
      const rows = [
        {
          role: 'assistant',
          content: '',
          timestamp: '100',
          tool_calls: toolCalls,
          tool_call_id: null,
        },
      ];
      mockQuery.mockImplementation((sql: string) => {
        if (typeof sql === 'string' && sql.includes('FROM agent_messages')) {
          return Promise.resolve({ rows, rowCount: rows.length });
        }
        return Promise.resolve({ rows: [], rowCount: 0 });
      });
      const store = new PostgresStore({ connectionString: 'postgres://localhost/test' });
      await Promise.resolve();

      const result = await store.getRecentMessages('agent-1', 1);
      expect(result[0].toolCalls).toEqual(toolCalls);
    });
  });

  // -------------------------------------------------------------------------
  // saveSummary
  // -------------------------------------------------------------------------

  describe('saveSummary', () => {
    it('inserts summary with correct SQL and parameters', async () => {
      const store = new PostgresStore({ connectionString: 'postgres://localhost/test' });
      const summary = createSummary({
        id: 'sum-1',
        content: 'test summary',
        timestamp: 5000,
        messageRange: { from: 100, to: 200 },
      });
      await store.saveSummary('agent-1', summary);

      const insertCall = mockQuery.mock.calls.find(
        (c: unknown[]) =>
          typeof c[0] === 'string' && (c[0] as string).includes('INSERT INTO agent_summaries'),
      );
      expect(insertCall).toBeDefined();
      const [sql, params] = insertCall as [string, unknown[]];
      expect(sql).toContain('INSERT INTO agent_summaries');
      expect(params).toEqual(['sum-1', 'agent-1', 'test summary', 5000, 100, 200]);
    });
  });

  // -------------------------------------------------------------------------
  // searchSummaries
  // -------------------------------------------------------------------------

  describe('searchSummaries', () => {
    it('uses ILIKE with %query% pattern', async () => {
      const store = new PostgresStore({ connectionString: 'postgres://localhost/test' });
      await store.searchSummaries('agent-1', 'transformer', 5);

      const selectCall = mockQuery.mock.calls.find(
        (c: unknown[]) =>
          typeof c[0] === 'string' && (c[0] as string).includes('FROM agent_summaries'),
      );
      expect(selectCall).toBeDefined();
      const [sql, params] = selectCall as [string, unknown[]];
      expect(sql).toContain('ILIKE');
      expect(params).toContain('%transformer%');
      expect(params).toContain('agent-1');
      expect(params).toContain(5);
    });

    it('orders results by timestamp DESC', async () => {
      const store = new PostgresStore({ connectionString: 'postgres://localhost/test' });
      await store.searchSummaries('agent-1', 'test', 5);

      const selectCall = mockQuery.mock.calls.find(
        (c: unknown[]) =>
          typeof c[0] === 'string' && (c[0] as string).includes('FROM agent_summaries'),
      );
      const [sql] = selectCall as [string, unknown[]];
      expect(sql).toContain('ORDER BY timestamp DESC');
    });

    it('maps rows to Summary objects', async () => {
      const summaryRows = [
        {
          id: 'sum-1',
          content: 'transformer discussion',
          timestamp: '3000',
          message_range_from: '100',
          message_range_to: '200',
        },
      ];
      mockQuery.mockImplementation((sql: string) => {
        if (typeof sql === 'string' && sql.includes('ILIKE')) {
          return Promise.resolve({ rows: summaryRows, rowCount: summaryRows.length });
        }
        return Promise.resolve({ rows: [], rowCount: 0 });
      });
      const store = new PostgresStore({ connectionString: 'postgres://localhost/test' });
      await Promise.resolve();

      const result = await store.searchSummaries('agent-1', 'transformer', 5);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('sum-1');
      expect(result[0].content).toBe('transformer discussion');
      expect(result[0].timestamp).toBe(3000);
      expect(result[0].messageRange).toEqual({ from: 100, to: 200 });
    });
  });

  // -------------------------------------------------------------------------
  // saveEmbedding
  // -------------------------------------------------------------------------

  describe('saveEmbedding', () => {
    it('UPDATEs the embedding column on the summary row', async () => {
      const store = new PostgresStore({ connectionString: 'postgres://localhost/test' });
      await store.saveEmbedding('agent-1', 'sum-1', [0.1, 0.2, 0.3]);

      const updateCall = mockQuery.mock.calls.find(
        (c: unknown[]) =>
          typeof c[0] === 'string' && (c[0] as string).includes('UPDATE agent_summaries'),
      );
      expect(updateCall).toBeDefined();
      const [sql, params] = updateCall as [string, unknown[]];
      expect(sql).toContain('SET embedding = $1');
      expect(params[0]).toBe('[0.1,0.2,0.3]');
      expect(params[1]).toBe('sum-1');
      expect(params[2]).toBe('agent-1');
    });

    it('formats embedding as pgvector literal string', async () => {
      const store = new PostgresStore({ connectionString: 'postgres://localhost/test' });
      await store.saveEmbedding('agent-1', 'sum-1', [1, 0, 0]);

      const updateCall = mockQuery.mock.calls.find(
        (c: unknown[]) =>
          typeof c[0] === 'string' && (c[0] as string).includes('UPDATE agent_summaries'),
      );
      const params = (updateCall as [string, unknown[]])[1];
      expect(params[0]).toBe('[1,0,0]');
    });
  });

  // -------------------------------------------------------------------------
  // searchByEmbedding
  // -------------------------------------------------------------------------

  describe('searchByEmbedding', () => {
    it('uses the pgvector <=> cosine distance operator', async () => {
      const store = new PostgresStore({ connectionString: 'postgres://localhost/test' });
      await store.searchByEmbedding('agent-1', [1, 0, 0], 3);

      const selectCall = mockQuery.mock.calls.find(
        (c: unknown[]) => typeof c[0] === 'string' && (c[0] as string).includes('embedding <=>'),
      );
      expect(selectCall).toBeDefined();
      const [sql, params] = selectCall as [string, unknown[]];
      expect(sql).toContain('ORDER BY embedding <=>');
      expect(params).toContain('agent-1');
      expect(params).toContain('[1,0,0]');
      expect(params).toContain(3);
    });

    it('filters out rows where embedding IS NULL', async () => {
      const store = new PostgresStore({ connectionString: 'postgres://localhost/test' });
      await store.searchByEmbedding('agent-1', [1, 0], 5);

      const selectCall = mockQuery.mock.calls.find(
        (c: unknown[]) => typeof c[0] === 'string' && (c[0] as string).includes('embedding <=>'),
      );
      const [sql] = selectCall as [string, unknown[]];
      expect(sql).toContain('embedding IS NOT NULL');
    });

    it('maps rows to Summary objects', async () => {
      const embeddingRows = [
        {
          id: 'sum-42',
          content: 'semantic result',
          timestamp: '9000',
          message_range_from: '50',
          message_range_to: '150',
        },
      ];
      mockQuery.mockImplementation((sql: string) => {
        if (typeof sql === 'string' && sql.includes('embedding <=>')) {
          return Promise.resolve({ rows: embeddingRows, rowCount: embeddingRows.length });
        }
        return Promise.resolve({ rows: [], rowCount: 0 });
      });
      const store = new PostgresStore({ connectionString: 'postgres://localhost/test' });
      await Promise.resolve();

      const result = await store.searchByEmbedding('agent-1', [0.5, 0.5], 1);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('sum-42');
      expect(result[0].content).toBe('semantic result');
      expect(result[0].timestamp).toBe(9000);
      expect(result[0].messageRange).toEqual({ from: 50, to: 150 });
    });

    it('returns empty array when no rows match', async () => {
      const store = new PostgresStore({ connectionString: 'postgres://localhost/test' });
      // default mock returns []
      const result = await store.searchByEmbedding('agent-1', [1, 0], 5);
      expect(result).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // close
  // -------------------------------------------------------------------------

  describe('close', () => {
    it('calls pool.end()', async () => {
      const store = new PostgresStore({ connectionString: 'postgres://localhost/test' });
      await store.close();
      expect(mockEnd).toHaveBeenCalledOnce();
    });
  });
});
