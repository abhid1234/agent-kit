// src/tool.ts
import type { ToolDefinition, ParameterDef } from './types';

interface ToolConfig {
  name: string;
  description: string;
  parameters: Record<string, ParameterDef>;
  execute: (params: Record<string, unknown>) => Promise<unknown>;
}

export class Tool {
  readonly name: string;
  readonly description: string;
  readonly definition: ToolDefinition;
  private executeFn: (params: Record<string, unknown>) => Promise<unknown>;

  private constructor(config: ToolConfig) {
    this.name = config.name;
    this.description = config.description;
    this.definition = {
      name: config.name,
      description: config.description,
      parameters: config.parameters,
    };
    this.executeFn = config.execute;
  }

  static create(config: ToolConfig): Tool {
    return new Tool(config);
  }

  async execute(params: Record<string, unknown>): Promise<unknown> {
    return this.executeFn(params);
  }
}
