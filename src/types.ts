// src/types.ts

// --- Messages ---

export interface ToolCall {
  id: string;
  name: string;
  arguments: string; // JSON string
}

export interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  timestamp: number;
  toolCalls?: ToolCall[];
  toolCallId?: string; // for role: 'tool' — links to ToolCall.id
}

export function createMessage(opts: Omit<Message, 'timestamp'> & { timestamp?: number }): Message {
  return {
    ...opts,
    timestamp: opts.timestamp ?? Date.now(),
  };
}

export function isToolCallMessage(msg: Message): boolean {
  return Array.isArray(msg.toolCalls) && msg.toolCalls.length > 0;
}

// --- Summaries ---

export interface Summary {
  id: string;
  content: string;
  timestamp: number;
  messageRange: { from: number; to: number }; // timestamps of summarized messages
}

export function createSummary(
  opts: Omit<Summary, 'id' | 'timestamp' | 'messageRange'> & {
    id?: string;
    timestamp?: number;
    messageRange?: { from: number; to: number };
  },
): Summary {
  return {
    id: opts.id ?? crypto.randomUUID(),
    content: opts.content,
    timestamp: opts.timestamp ?? Date.now(),
    messageRange: opts.messageRange ?? { from: 0, to: 0 },
  };
}

// --- Model ---

export interface ModelConfig {
  provider?: 'ollama';
  baseURL?: string;
  apiKey?: string;
  model: string;
}

export interface ModelResponse {
  content: string;
  toolCalls?: ToolCall[];
  tokens?: { input: number; output: number };
}

export interface ModelChunk {
  text: string;
  toolCalls?: ToolCall[];
  done: boolean;
}

// --- Tools ---

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, ParameterDef>;
}

export interface ParameterDef {
  type: string;
  description?: string;
  enum?: string[];
  required?: boolean;
}

// --- Events ---

export interface AgentEvent {
  type: string;
  timestamp: number;
  agentId: string;
  data: Record<string, unknown>;
  latencyMs?: number;
  tokens?: { input: number; output: number };
}
