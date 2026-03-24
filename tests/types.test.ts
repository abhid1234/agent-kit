import { describe, it, expect } from 'vitest';
import { createMessage, createSummary, isToolCallMessage } from '../src/types';

describe('createMessage', () => {
  it('creates a user message with defaults', () => {
    const msg = createMessage({ role: 'user', content: 'hello' });
    expect(msg.role).toBe('user');
    expect(msg.content).toBe('hello');
    expect(msg.timestamp).toBeTypeOf('number');
  });

  it('creates an assistant message with tool calls', () => {
    const msg = createMessage({
      role: 'assistant',
      content: '',
      toolCalls: [{ id: 'tc1', name: 'search', arguments: '{"q":"test"}' }],
    });
    expect(msg.toolCalls).toHaveLength(1);
  });

  it('creates a tool result message', () => {
    const msg = createMessage({
      role: 'tool',
      content: '{"results":[]}',
      toolCallId: 'tc1',
    });
    expect(msg.toolCallId).toBe('tc1');
  });
});

describe('isToolCallMessage', () => {
  it('returns true for messages with tool calls', () => {
    const msg = createMessage({
      role: 'assistant',
      content: '',
      toolCalls: [{ id: 'tc1', name: 'search', arguments: '{}' }],
    });
    expect(isToolCallMessage(msg)).toBe(true);
  });

  it('returns false for regular messages', () => {
    const msg = createMessage({ role: 'user', content: 'hi' });
    expect(isToolCallMessage(msg)).toBe(false);
  });
});

describe('createSummary', () => {
  it('creates a summary with defaults', () => {
    const summary = createSummary({ content: 'User discussed transformers' });
    expect(summary.content).toBe('User discussed transformers');
    expect(summary.timestamp).toBeTypeOf('number');
    expect(summary.id).toBeTypeOf('string');
  });
});
