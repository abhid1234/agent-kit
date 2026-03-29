import { Agent, Tool, Memory } from '@avee1234/agent-kit';

const greet = Tool.create({
  name: 'greet',
  description: 'Greet someone by name',
  parameters: {
    name: { type: 'string', description: 'Name to greet' },
  },
  execute: async ({ name }) => `Hello, ${name}!`,
});

const agent = new Agent({
  name: 'my-agent',
  model: {
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai',
    model: 'gemini-3.0-flash',
    apiKey: process.env.GOOGLE_AI_API_KEY ?? '',
  },
  memory: new Memory({ store: 'sqlite', path: './memory.db' }),
  tools: [greet],
  system: 'You are a helpful assistant.',
});

const response = await agent.chat(process.argv[2] ?? 'Hello!');
console.log(response.content);
