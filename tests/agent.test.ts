// tests/agent.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Agent } from '../src/agent';
import { Tool } from '../src/tool';
import { Memory } from '../src/memory';
import type { ModelAdapter } from '../src/model/adapter';
import type { Message, ModelResponse } from '../src/types';

function createMockModel(responses: ModelResponse[]): ModelAdapter {
  let callIndex = 0;
  return {
    chat: vi.fn(async () => responses[callIndex++] ?? { content: 'done' }),
    async *stream() {
      yield { text: 'streamed', done: true };
    },
  };
}

describe('Agent', () => {
  describe('basic chat', () => {
    it('sends a message and gets a response', async () => {
      const model = createMockModel([{ content: 'Hello back!' }]);
      const agent = new Agent({ name: 'test', model });
      const response = await agent.chat('Hello');
      expect(response.content).toBe('Hello back!');
    });

    it('includes system prompt in messages sent to model', async () => {
      const model = createMockModel([{ content: 'ok' }]);
      const agent = new Agent({ name: 'test', model, system: 'You are helpful.' });
      await agent.chat('hi');
      const sentMessages = (model.chat as ReturnType<typeof vi.fn>).mock.calls[0][0] as Message[];
      expect(sentMessages[0].role).toBe('system');
      expect(sentMessages[0].content).toBe('You are helpful.');
    });

    it('uses mock model when no model is configured', async () => {
      const agent = new Agent({ name: 'test' });
      const response = await agent.chat('hello');
      expect(response.content).toContain('hello');
    });
  });

  describe('tool execution', () => {
    it('executes tool calls and feeds results back to model', async () => {
      const model = createMockModel([
        { content: '', toolCalls: [{ id: 'tc1', name: 'greet', arguments: '{"name":"World"}' }] },
        { content: 'Greeted World successfully' },
      ]);
      const greetTool = Tool.create({
        name: 'greet',
        description: 'Greet someone',
        parameters: { name: { type: 'string' } },
        execute: async ({ name }) => `Hello, ${name}!`,
      });
      const agent = new Agent({ name: 'test', model, tools: [greetTool] });
      const response = await agent.chat('greet the world');
      expect(response.content).toBe('Greeted World successfully');
      expect(model.chat).toHaveBeenCalledTimes(2);
    });

    it('caps tool rounds at maxToolRounds', async () => {
      const infiniteToolModel: ModelAdapter = {
        chat: vi.fn(async () => ({
          content: '',
          toolCalls: [{ id: `tc-${Date.now()}`, name: 'loop', arguments: '{}' }],
        })),
        async *stream() {
          yield { text: '', done: true };
        },
      };
      const loopTool = Tool.create({
        name: 'loop',
        description: 'Loops',
        parameters: {},
        execute: async () => 'looped',
      });
      const agent = new Agent({
        name: 'test',
        model: infiniteToolModel,
        tools: [loopTool],
        maxToolRounds: 3,
      });
      const response = await agent.chat('loop forever');
      expect(infiniteToolModel.chat).toHaveBeenCalledTimes(4); // 1 initial + 3 rounds
    });
  });

  describe('memory integration', () => {
    it('saves messages to memory after chat', async () => {
      const memory = new Memory();
      const model = createMockModel([{ content: 'hi there' }]);
      const agent = new Agent({ name: 'test-agent', model, memory });
      await agent.chat('hello');
      const ctx = await memory.getContext('test-agent', 'hello');
      expect(ctx.recentMessages.length).toBeGreaterThanOrEqual(2);
    });

    it('includes memory context in model calls', async () => {
      const memory = new Memory();
      const model = createMockModel([{ content: 'first' }, { content: 'second' }]);
      const agent = new Agent({ name: 'test-agent', model, memory });
      await agent.chat('first message');
      await agent.chat('second message');
      const secondCallMessages = (model.chat as ReturnType<typeof vi.fn>).mock
        .calls[1][0] as Message[];
      const contents = secondCallMessages.map((m: Message) => m.content);
      expect(contents).toContain('first message');
    });
  });

  describe('events', () => {
    it('emits message events', async () => {
      const model = createMockModel([{ content: 'hi' }]);
      const agent = new Agent({ name: 'test', model });
      const events: string[] = [];
      agent.on('message', (e) => events.push(e.type));
      await agent.chat('hello');
      expect(events.length).toBeGreaterThan(0);
    });

    it('emits tool:start and tool:end events', async () => {
      const model = createMockModel([
        { content: '', toolCalls: [{ id: 'tc1', name: 'test_tool', arguments: '{}' }] },
        { content: 'done' },
      ]);
      const tool = Tool.create({
        name: 'test_tool',
        description: 'Test',
        parameters: {},
        execute: async () => 'result',
      });
      const agent = new Agent({ name: 'test', model, tools: [tool] });
      const events: string[] = [];
      agent.on('tool:start', (e) => events.push(e.type));
      agent.on('tool:end', (e) => events.push(e.type));
      await agent.chat('use tool');
      expect(events).toContain('tool:start');
      expect(events).toContain('tool:end');
    });

    it('emits error events on tool failure', async () => {
      const model = createMockModel([
        { content: '', toolCalls: [{ id: 'tc1', name: 'fail_tool', arguments: '{}' }] },
        { content: 'handled error' },
      ]);
      const tool = Tool.create({
        name: 'fail_tool',
        description: 'Fails',
        parameters: {},
        execute: async () => {
          throw new Error('tool error');
        },
      });
      const agent = new Agent({ name: 'test', model, tools: [tool] });
      const errors: string[] = [];
      agent.on('error', (e) => errors.push(e.data.message as string));
      await agent.chat('use tool');
      expect(errors).toContain('tool error');
    });
  });

  describe('streaming', () => {
    it('streams response chunks', async () => {
      const model: ModelAdapter = {
        chat: vi.fn(),
        async *stream() {
          yield { text: 'Hello', done: false };
          yield { text: ' World', done: true };
        },
      };
      const agent = new Agent({ name: 'test', model });
      const chunks: string[] = [];
      for await (const chunk of agent.stream('hi')) {
        chunks.push(chunk.text);
      }
      expect(chunks).toEqual(['Hello', ' World']);
    });
  });
});
