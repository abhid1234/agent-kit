import { Agent, Memory } from 'agent-kit';
import { webSearch, saveNote } from './tools.js';
import * as readline from 'readline';

const agent = new Agent({
  name: 'research-assistant',
  memory: new Memory({ store: 'sqlite', path: './research.db' }),
  tools: [webSearch, saveNote],
  system: `You are a research assistant. You help users find information and keep track of their research.
When you find useful information, save notes for future reference.
When asked about past research, check your memory for relevant context.`,
});

agent.on('tool:start', (e) => {
  console.log(`\n  [${e.data.name}] searching...`);
});

agent.on('tool:end', (e) => {
  console.log(`  [${e.data.name}] done (${e.latencyMs}ms)`);
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log('Research Assistant (type "quit" to exit)\n');

function prompt() {
  rl.question('> ', async (input) => {
    const trimmed = input.trim();
    if (trimmed === 'quit' || trimmed === 'exit') {
      console.log('Goodbye!');
      rl.close();
      return;
    }
    if (!trimmed) {
      prompt();
      return;
    }
    try {
      const response = await agent.chat(trimmed);
      console.log(`\n${response.content}\n`);
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
    }
    prompt();
  });
}

prompt();
