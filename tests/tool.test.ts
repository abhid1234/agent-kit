// tests/tool.test.ts
import { describe, it, expect, vi } from 'vitest';
import { Tool } from '../src/tool';

describe('Tool', () => {
  describe('create', () => {
    it('creates a tool with name, description, parameters, and execute', () => {
      const tool = Tool.create({
        name: 'greet',
        description: 'Greet someone',
        parameters: { name: { type: 'string', description: 'Who to greet' } },
        execute: async ({ name }) => `Hello, ${name}!`,
      });
      expect(tool.name).toBe('greet');
      expect(tool.description).toBe('Greet someone');
      expect(tool.definition.parameters).toHaveProperty('name');
    });

    it('executes with provided arguments', async () => {
      const tool = Tool.create({
        name: 'add',
        description: 'Add two numbers',
        parameters: { a: { type: 'number' }, b: { type: 'number' } },
        execute: async ({ a, b }) => (a as number) + (b as number),
      });
      const result = await tool.execute({ a: 2, b: 3 });
      expect(result).toBe(5);
    });

    it('returns JSON-serializable results', async () => {
      const tool = Tool.create({
        name: 'get_data',
        description: 'Get data',
        parameters: {},
        execute: async () => ({ key: 'value' }),
      });
      const result = await tool.execute({});
      expect(result).toEqual({ key: 'value' });
    });
  });

  describe('toDefinition', () => {
    it('returns a ToolDefinition for the model', () => {
      const tool = Tool.create({
        name: 'search',
        description: 'Search the web',
        parameters: { query: { type: 'string', description: 'Search query' } },
        execute: async () => [],
      });
      const def = tool.definition;
      expect(def.name).toBe('search');
      expect(def.description).toBe('Search the web');
      expect(def.parameters.query.type).toBe('string');
    });
  });

  describe('error handling', () => {
    it('propagates execution errors', async () => {
      const tool = Tool.create({
        name: 'fail',
        description: 'Always fails',
        parameters: {},
        execute: async () => {
          throw new Error('tool broke');
        },
      });
      await expect(tool.execute({})).rejects.toThrow('tool broke');
    });
  });
});
