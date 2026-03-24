// src/model/mock.ts
import type { ModelAdapter } from './adapter';
import type { Message, ModelResponse, ModelChunk, ToolDefinition } from '../types';

export class MockAdapter implements ModelAdapter {
  async chat(messages: Message[], tools?: ToolDefinition[]): Promise<ModelResponse> {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    const content = lastUserMsg?.content ?? '';

    // Check if this is a summarization request
    const systemMsg = messages.find((m) => m.role === 'system');
    if (systemMsg?.content.toLowerCase().includes('summarize')) {
      const conversationContent = messages
        .filter((m) => m.role !== 'system')
        .map((m) => m.content)
        .join(' ');
      return { content: `[Mock Summary] ${conversationContent.slice(0, 200)}` };
    }

    // Check if user message matches any tool
    if (tools?.length) {
      for (const tool of tools) {
        const toolNameWords = tool.name.replace(/_/g, ' ').split(' ');
        const matches = toolNameWords.some((word) =>
          content.toLowerCase().includes(word.toLowerCase()),
        );
        if (matches) {
          return {
            content: '',
            toolCalls: [
              {
                id: `mock-tc-${Date.now()}`,
                name: tool.name,
                arguments: JSON.stringify(
                  Object.fromEntries(Object.keys(tool.parameters).map((key) => [key, content])),
                ),
              },
            ],
          };
        }
      }
    }

    return {
      content: `[Mock] Received: "${content}". Tools available: ${tools?.map((t) => t.name).join(', ') ?? 'none'}.`,
    };
  }

  async *stream(messages: Message[], tools?: ToolDefinition[]): AsyncIterable<ModelChunk> {
    const response = await this.chat(messages, tools);
    const words = response.content.split(' ');
    for (let i = 0; i < words.length; i++) {
      yield {
        text: (i > 0 ? ' ' : '') + words[i],
        done: i === words.length - 1,
        ...(i === words.length - 1 && response.toolCalls ? { toolCalls: response.toolCalls } : {}),
      };
    }
  }
}
