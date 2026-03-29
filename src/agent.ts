// src/agent.ts
import type { ModelAdapter } from './model/adapter';
import { MockAdapter } from './model/mock';
import { OpenAICompatibleAdapter } from './model/openai-compatible';
import type { Memory } from './memory';
import type { Tool } from './tool';
import { AgentEventEmitter } from './events';
import { createMessage, isToolCallMessage } from './types';
import type { Message, ModelConfig, ModelResponse, ModelChunk, AgentEvent } from './types';

export interface AgentConfig {
  name: string;
  model?: ModelAdapter | ModelConfig;
  memory?: Memory;
  tools?: Tool[];
  system?: string;
  maxToolRounds?: number;
}

export class Agent {
  readonly name: string;
  private model: ModelAdapter;
  private memory?: Memory;
  private tools: Tool[];
  private toolMap: Map<string, Tool>;
  private system?: string;
  private maxToolRounds: number;
  private emitter: AgentEventEmitter;

  constructor(config: AgentConfig) {
    this.name = config.name;
    this.memory = config.memory;
    this.tools = config.tools ?? [];
    this.system = config.system;
    this.maxToolRounds = config.maxToolRounds ?? 10;
    this.emitter = new AgentEventEmitter();

    // Build tool map for quick lookup
    this.toolMap = new Map(this.tools.map((t) => [t.name, t]));

    // Resolve model adapter
    if (!config.model) {
      this.model = new MockAdapter();
    } else if (this.isModelAdapter(config.model)) {
      this.model = config.model;
    } else {
      // ModelConfig object — create OpenAICompatibleAdapter
      const cfg = config.model as ModelConfig;
      const baseURL =
        cfg.provider === 'ollama'
          ? (cfg.baseURL ?? 'http://localhost:11434/v1')
          : (cfg.baseURL ?? 'http://localhost:11434/v1');
      this.model = new OpenAICompatibleAdapter({
        baseURL,
        model: cfg.model,
        apiKey: cfg.apiKey,
      });
    }

    // Wire memory model for summarization
    if (this.memory) {
      this.memory.setModel(this.model);
    }
  }

  private isModelAdapter(obj: ModelAdapter | ModelConfig): obj is ModelAdapter {
    return typeof (obj as ModelAdapter).chat === 'function';
  }

  getModel(): ModelAdapter {
    return this.model;
  }

  getMemory(): Memory | undefined {
    return this.memory;
  }

  getSystem(): string | undefined {
    return this.system;
  }

  on(type: string, handler: (event: AgentEvent) => void): void {
    this.emitter.on(type, handler);
  }

  off(type: string, handler: (event: AgentEvent) => void): void {
    this.emitter.off(type, handler);
  }

  private emit(type: string, data: Record<string, unknown>, extras?: Partial<AgentEvent>): void {
    this.emitter.emit({
      type,
      timestamp: Date.now(),
      agentId: this.name,
      data,
      ...extras,
    });
  }

  async chat(input: string): Promise<ModelResponse> {
    const toolDefs = this.tools.map((t) => t.definition);

    // Build initial messages
    const messages: Message[] = [];

    // Add system prompt
    if (this.system) {
      messages.push(createMessage({ role: 'system', content: this.system }));
    }

    // Add memory context (summaries + recent messages)
    if (this.memory) {
      const ctx = await this.memory.getContext(this.name, input);
      this.emit('memory:retrieve', {
        summaries: ctx.relevantSummaries.length,
        recentMessages: ctx.recentMessages.length,
      });

      // Add relevant summaries as system context
      for (const summary of ctx.relevantSummaries) {
        messages.push(
          createMessage({
            role: 'system',
            content: `[Previous conversation summary]: ${summary.content}`,
            timestamp: summary.timestamp,
          }),
        );
      }

      // Add recent messages — filter out tool result messages from memory
      // as they may lack the tool name field required by some providers (e.g., Gemini)
      const filteredRecent = ctx.recentMessages.filter((m) => m.role !== 'tool');
      // Also filter out assistant messages that only contain tool calls (no text content)
      // since without the corresponding tool results they break the conversation flow
      const cleanRecent = filteredRecent.filter(
        (m) => !(m.role === 'assistant' && !m.content && m.toolCalls?.length),
      );
      messages.push(...cleanRecent);
    }

    // Add current user message
    const userMessage = createMessage({ role: 'user', content: input });
    messages.push(userMessage);

    // Emit user message event
    this.emit('message', { role: 'user', content: input });

    // Main tool loop
    let response: ModelResponse = { content: '' };
    let toolRoundsUsed = 0;

    // First model call
    response = await this.model.chat(messages, toolDefs.length ? toolDefs : undefined);

    // Tool call loop
    while (
      isToolCallMessage({ ...response, role: 'assistant', timestamp: Date.now() }) &&
      toolRoundsUsed < this.maxToolRounds
    ) {
      // Append assistant's tool-calling message
      const assistantMsg = createMessage({
        role: 'assistant',
        content: response.content,
        toolCalls: response.toolCalls,
      });
      messages.push(assistantMsg);

      // Execute each tool call
      for (const toolCall of response.toolCalls ?? []) {
        const tool = this.toolMap.get(toolCall.name);
        const startTime = Date.now();

        this.emit('tool:start', {
          toolName: toolCall.name,
          toolCallId: toolCall.id,
          arguments: toolCall.arguments,
        });

        let toolResult: string;
        if (!tool) {
          toolResult = `Error: tool "${toolCall.name}" not found`;
          this.emit('error', {
            message: `Tool not found: ${toolCall.name}`,
            toolCallId: toolCall.id,
          });
        } else {
          try {
            let parsedArgs: Record<string, unknown> = {};
            try {
              parsedArgs = JSON.parse(toolCall.arguments) as Record<string, unknown>;
            } catch {
              parsedArgs = {};
            }
            const result = await tool.execute(parsedArgs);
            toolResult = typeof result === 'string' ? result : JSON.stringify(result);
          } catch (err) {
            const error = err as Error;
            toolResult = `Error: ${error.message}`;
            this.emit('error', {
              message: error.message,
              toolCallId: toolCall.id,
              toolName: toolCall.name,
            });
          }
        }

        const latencyMs = Date.now() - startTime;
        this.emit('tool:end', {
          toolName: toolCall.name,
          toolCallId: toolCall.id,
          result: toolResult,
          latencyMs,
        });

        // Append tool result message
        messages.push(
          createMessage({
            role: 'tool',
            content: toolResult,
            toolCallId: toolCall.id,
          }),
        );
      }

      toolRoundsUsed++;

      // Call model again with tool results
      response = await this.model.chat(messages, toolDefs.length ? toolDefs : undefined);
    }

    // Emit final assistant message event
    this.emit('message', { role: 'assistant', content: response.content });

    // Save exchange to memory — include tool messages so results (bookings, notes) are persisted
    if (this.memory) {
      // Find index of user message in the messages array
      const userIdx = messages.indexOf(userMessage);
      // Everything after the user message = new tool interactions from this turn
      const newMessages = userIdx >= 0 ? messages.slice(userIdx) : [userMessage];
      // Append final assistant response
      newMessages.push(
        createMessage({
          role: 'assistant',
          content: response.content,
          toolCalls: response.toolCalls,
        }),
      );
      await this.memory.saveExchange(this.name, newMessages);
    }

    return response;
  }

  async *stream(input: string): AsyncIterable<ModelChunk> {
    const toolDefs = this.tools.map((t) => t.definition);

    // Build messages
    const messages: Message[] = [];

    if (this.system) {
      messages.push(createMessage({ role: 'system', content: this.system }));
    }

    if (this.memory) {
      const ctx = await this.memory.getContext(this.name, input);
      for (const summary of ctx.relevantSummaries) {
        messages.push(
          createMessage({
            role: 'system',
            content: `[Previous conversation summary]: ${summary.content}`,
            timestamp: summary.timestamp,
          }),
        );
      }
      messages.push(...ctx.recentMessages);
    }

    const userMessage = createMessage({ role: 'user', content: input });
    messages.push(userMessage);

    this.emit('message', { role: 'user', content: input });

    // Stream response
    let fullText = '';
    for await (const chunk of this.model.stream(messages, toolDefs.length ? toolDefs : undefined)) {
      fullText += chunk.text;
      yield chunk;
    }

    this.emit('message', { role: 'assistant', content: fullText });

    // Save to memory
    if (this.memory) {
      await this.memory.saveExchange(this.name, [
        userMessage,
        createMessage({ role: 'assistant', content: fullText }),
      ]);
    }
  }
}
