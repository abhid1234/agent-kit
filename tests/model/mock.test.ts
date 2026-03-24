// tests/model/mock.test.ts
import { describe, it, expect } from 'vitest';
import { MockAdapter } from '../../src/model/mock';
import { createMessage } from '../../src/types';

describe('MockAdapter', () => {
  const adapter = new MockAdapter();

  it('returns a response describing the prompt', async () => {
    const messages = [createMessage({ role: 'user', content: 'hello world' })];
    const result = await adapter.chat(messages);
    expect(result.content).toContain('hello world');
  });

  it('triggers tool call when message matches a tool name', async () => {
    const messages = [createMessage({ role: 'user', content: 'search for transformer papers' })];
    const tools = [
      {
        name: 'web_search',
        description: 'Search the web',
        parameters: { query: { type: 'string' } },
      },
    ];
    const result = await adapter.chat(messages, tools);
    expect(result.toolCalls).toBeDefined();
    expect(result.toolCalls![0].name).toBe('web_search');
  });

  it('does not trigger tool call when no tool matches', async () => {
    const messages = [createMessage({ role: 'user', content: 'hello' })];
    const tools = [
      {
        name: 'web_search',
        description: 'Search the web',
        parameters: { query: { type: 'string' } },
      },
    ];
    const result = await adapter.chat(messages, tools);
    expect(result.toolCalls).toBeUndefined();
  });

  it('handles summarization requests', async () => {
    const messages = [
      createMessage({ role: 'system', content: 'Summarize the following conversation' }),
      createMessage({ role: 'user', content: 'We discussed AI papers' }),
    ];
    const result = await adapter.chat(messages);
    expect(result.content.length).toBeGreaterThan(0);
  });

  it('streams chunks', async () => {
    const messages = [createMessage({ role: 'user', content: 'hello' })];
    const chunks: string[] = [];
    for await (const chunk of adapter.stream(messages)) {
      chunks.push(chunk.text);
      if (chunk.done) break;
    }
    expect(chunks.length).toBeGreaterThan(0);
  });
});
