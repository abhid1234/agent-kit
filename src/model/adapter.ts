// src/model/adapter.ts
import type { Message, ModelResponse, ModelChunk, ToolDefinition } from '../types';

export interface ModelAdapter {
  chat(messages: Message[], tools?: ToolDefinition[]): Promise<ModelResponse>;
  stream(messages: Message[], tools?: ToolDefinition[]): AsyncIterable<ModelChunk>;
}
