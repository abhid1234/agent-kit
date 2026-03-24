// src/model/openai-compatible.ts
import type { ModelAdapter } from './adapter';
import type { Message, ModelResponse, ModelChunk, ToolDefinition } from '../types';

export interface OpenAIAdapterConfig {
  baseURL: string;
  model: string;
  apiKey?: string;
}

export class OpenAICompatibleAdapter implements ModelAdapter {
  private config: OpenAIAdapterConfig;

  constructor(config: OpenAIAdapterConfig) {
    this.config = config;
  }

  async chat(messages: Message[], tools?: ToolDefinition[]): Promise<ModelResponse> {
    const body: Record<string, unknown> = {
      model: this.config.model,
      messages: messages.map((m) => this.toOpenAIMessage(m)),
    };
    if (tools?.length) {
      body.tools = tools.map((t) => ({
        type: 'function' as const,
        function: {
          name: t.name,
          description: t.description,
          parameters: { type: 'object', properties: t.parameters },
        },
      }));
    }
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.config.apiKey) headers['Authorization'] = `Bearer ${this.config.apiKey}`;

    const response = await fetch(`${this.config.baseURL}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Model API error (${response.status}): ${errorText}`);
    }
    const data = await response.json();
    const choice = data.choices[0].message;
    const result: ModelResponse = { content: choice.content ?? '' };
    if (choice.tool_calls?.length) {
      result.toolCalls = choice.tool_calls.map(
        (tc: { id: string; function: { name: string; arguments: string } }) => ({
          id: tc.id,
          name: tc.function.name,
          arguments: tc.function.arguments,
        }),
      );
    }
    if (data.usage) {
      result.tokens = { input: data.usage.prompt_tokens, output: data.usage.completion_tokens };
    }
    return result;
  }

  async *stream(messages: Message[], tools?: ToolDefinition[]): AsyncIterable<ModelChunk> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.config.apiKey) headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    const body: Record<string, unknown> = {
      model: this.config.model,
      messages: messages.map((m) => this.toOpenAIMessage(m)),
      stream: true,
    };
    if (tools?.length) {
      body.tools = tools.map((t) => ({
        type: 'function' as const,
        function: {
          name: t.name,
          description: t.description,
          parameters: { type: 'object', properties: t.parameters },
        },
      }));
    }
    const response = await fetch(`${this.config.baseURL}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Model API error (${response.status}): ${errorText}`);
    }
    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') {
          yield { text: '', done: true };
          return;
        }
        const parsed = JSON.parse(data);
        const delta = parsed.choices?.[0]?.delta;
        if (delta?.content) yield { text: delta.content, done: false };
      }
    }
  }

  private toOpenAIMessage(msg: Message): Record<string, unknown> {
    const result: Record<string, unknown> = { role: msg.role, content: msg.content };
    if (msg.toolCalls) {
      result.tool_calls = msg.toolCalls.map((tc) => ({
        id: tc.id,
        type: 'function',
        function: { name: tc.name, arguments: tc.arguments },
      }));
    }
    if (msg.toolCallId) result.tool_call_id = msg.toolCallId;
    return result;
  }
}
