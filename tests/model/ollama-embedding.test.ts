// tests/model/ollama-embedding.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OllamaEmbeddingAdapter } from '../../src/model/ollama-embedding';

// Mock global fetch
const mockFetch = vi.fn();

beforeEach(() => {
  mockFetch.mockClear();
  vi.stubGlobal('fetch', mockFetch);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function makeFetchResponse(embeddings: number[][]): Response {
  return {
    ok: true,
    json: async () => ({ embeddings }),
  } as unknown as Response;
}

describe('OllamaEmbeddingAdapter', () => {
  describe('construction', () => {
    it('uses defaults when no config provided', () => {
      const adapter = new OllamaEmbeddingAdapter();
      expect(adapter).toBeDefined();
    });

    it('accepts custom baseURL and model', () => {
      const adapter = new OllamaEmbeddingAdapter({
        baseURL: 'http://custom:11434',
        model: 'mxbai-embed-large',
      });
      expect(adapter).toBeDefined();
    });
  });

  describe('embed()', () => {
    it('calls Ollama /api/embed and returns a flat vector', async () => {
      const vector = [0.1, 0.2, 0.3];
      mockFetch.mockResolvedValueOnce(makeFetchResponse([vector]));

      const adapter = new OllamaEmbeddingAdapter();
      const result = await adapter.embed('hello world');

      expect(result).toEqual(vector);
      expect(mockFetch).toHaveBeenCalledOnce();

      const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe('http://localhost:11434/api/embed');
      expect(JSON.parse(init.body as string)).toEqual({
        model: 'nomic-embed-text',
        input: 'hello world',
      });
    });

    it('uses custom baseURL and model in request', async () => {
      mockFetch.mockResolvedValueOnce(makeFetchResponse([[0.5, 0.6]]));

      const adapter = new OllamaEmbeddingAdapter({
        baseURL: 'http://gpu-server:11434',
        model: 'mxbai-embed-large',
      });
      await adapter.embed('test');

      const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe('http://gpu-server:11434/api/embed');
      expect(JSON.parse(init.body as string).model).toBe('mxbai-embed-large');
    });

    it('throws on non-ok HTTP response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);

      const adapter = new OllamaEmbeddingAdapter();
      await expect(adapter.embed('fail')).rejects.toThrow('500');
    });
  });

  describe('embedBatch()', () => {
    it('returns one vector per input text', async () => {
      const vectors = [
        [0.1, 0.2],
        [0.3, 0.4],
        [0.5, 0.6],
      ];
      mockFetch.mockResolvedValueOnce(makeFetchResponse(vectors));

      const adapter = new OllamaEmbeddingAdapter();
      const result = await adapter.embedBatch(['a', 'b', 'c']);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual([0.1, 0.2]);
      expect(result[2]).toEqual([0.5, 0.6]);
    });

    it('sends all texts in a single request', async () => {
      mockFetch.mockResolvedValueOnce(makeFetchResponse([[1], [2]]));

      const adapter = new OllamaEmbeddingAdapter();
      await adapter.embedBatch(['first', 'second']);

      expect(mockFetch).toHaveBeenCalledOnce();
      const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(JSON.parse(init.body as string).input).toEqual(['first', 'second']);
    });

    it('returns empty array for empty input', async () => {
      const adapter = new OllamaEmbeddingAdapter();
      const result = await adapter.embedBatch([]);
      expect(result).toEqual([]);
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });
});
