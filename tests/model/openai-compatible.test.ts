// tests/model/openai-compatible.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OpenAICompatibleAdapter } from '../../src/model/openai-compatible';
import { createMessage } from '../../src/types';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('OpenAICompatibleAdapter', () => {
  let adapter: OpenAICompatibleAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new OpenAICompatibleAdapter({
      baseURL: 'http://localhost:11434/v1',
      model: 'llama3',
    });
  });

  describe('chat', () => {
    it('sends correct request format', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { role: 'assistant', content: 'Hello!' } }],
          usage: { prompt_tokens: 10, completion_tokens: 5 },
        }),
      });
      const messages = [createMessage({ role: 'user', content: 'hi' })];
      await adapter.chat(messages);
      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toBe('http://localhost:11434/v1/chat/completions');
      const body = JSON.parse(opts.body);
      expect(body.model).toBe('llama3');
      expect(body.messages).toEqual([{ role: 'user', content: 'hi' }]);
    });

    it('parses text response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { role: 'assistant', content: 'Hello!' } }],
          usage: { prompt_tokens: 10, completion_tokens: 5 },
        }),
      });
      const result = await adapter.chat([createMessage({ role: 'user', content: 'hi' })]);
      expect(result.content).toBe('Hello!');
      expect(result.tokens).toEqual({ input: 10, output: 5 });
    });

    it('parses tool call response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                role: 'assistant',
                content: '',
                tool_calls: [
                  {
                    id: 'tc1',
                    type: 'function',
                    function: { name: 'web_search', arguments: '{"query":"test"}' },
                  },
                ],
              },
            },
          ],
          usage: { prompt_tokens: 10, completion_tokens: 5 },
        }),
      });
      const result = await adapter.chat([createMessage({ role: 'user', content: 'search test' })]);
      expect(result.toolCalls).toEqual([
        { id: 'tc1', name: 'web_search', arguments: '{"query":"test"}' },
      ]);
    });

    it('sends tools in OpenAI format', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { role: 'assistant', content: 'ok' } }],
        }),
      });
      const tools = [
        { name: 'search', description: 'Search', parameters: { q: { type: 'string' } } },
      ];
      await adapter.chat([createMessage({ role: 'user', content: 'hi' })], tools);
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.tools[0].type).toBe('function');
      expect(body.tools[0].function.name).toBe('search');
    });

    it('sends API key in Authorization header when provided', async () => {
      const authAdapter = new OpenAICompatibleAdapter({
        baseURL: 'http://example.com/v1',
        model: 'test',
        apiKey: 'sk-test-key',
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [{ message: { role: 'assistant', content: 'ok' } }] }),
      });
      await authAdapter.chat([createMessage({ role: 'user', content: 'hi' })]);
      const headers = mockFetch.mock.calls[0][1].headers;
      expect(headers['Authorization']).toBe('Bearer sk-test-key');
    });

    it('throws on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'server error',
      });
      await expect(
        adapter.chat([createMessage({ role: 'user', content: 'hi' })]),
      ).rejects.toThrow();
    });
  });
});
