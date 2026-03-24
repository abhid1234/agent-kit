---
id: examples
sidebar_position: 6
title: Examples
---

# Examples

Runnable examples are in the [`examples/`](https://github.com/avee1234/ai-agent-framework/tree/main/examples) directory of the repository.

## research-assistant

**Path:** `examples/research-assistant/`

A single agent that uses tools to simulate web searches and save notes. Demonstrates:

- Tool use with `Tool.create()`
- Persistent memory with `SQLiteStore`
- Multi-turn conversations with tool-call loops
- Event listeners for observability

```typescript
import { Agent, Tool, Memory } from '@avee1234/agent-kit';
import { searchTool, saveTool } from './tools';

const agent = new Agent({
  name: 'researcher',
  model: { provider: 'ollama', model: 'llama3.2' },
  memory: new Memory({ store: 'sqlite', path: './research.db' }),
  tools: [searchTool, saveTool],
  system: `You are a research assistant. Search for information and save relevant findings.`,
});

agent.on('tool:start', (e) => console.log(`[tool] ${e.data.toolName}`));
agent.on('tool:end', (e) => console.log(`[tool] done (${e.data.latencyMs}ms)`));

const response = await agent.chat('Research the current state of TypeScript agent frameworks');
console.log(response.content);
```

**Run it:**
```bash
cd examples/research-assistant
npm install
npx tsx index.ts
```

---

## research-team

**Path:** `examples/research-team/`

A two-agent team using the `sequential` strategy: a researcher agent followed by a writer agent. Demonstrates:

- `Team` with `strategy: 'sequential'`
- Output chaining between agents (writer gets researcher's output as context)
- Team-level event listeners

```typescript
import { Agent, Team, Tool, Memory } from '@avee1234/agent-kit';

const researcher = new Agent({
  name: 'researcher',
  model: { provider: 'ollama', model: 'llama3.2' },
  tools: [searchTool],
  system: 'You research topics and compile detailed findings.',
});

const writer = new Agent({
  name: 'writer',
  model: { provider: 'ollama', model: 'llama3.2' },
  system: 'You write concise, well-structured reports from research findings.',
});

const team = new Team({
  agents: [researcher, writer],
  strategy: 'sequential',
});

team.on('team:agent:end', (e) => {
  console.log(`\n[${e.data.agentName}] finished (${e.latencyMs}ms)`);
});

const result = await team.run(
  'Research the top TypeScript AI agent frameworks and write a comparison report.'
);
console.log(result.content);
```

**Run it:**
```bash
cd examples/research-team
npm install
npx tsx index.ts
```

---

## What to build next

Looking for more patterns? Here are common use cases to try:

- **Customer support bot** — `Agent` + `Memory` + CRM tools + streaming output
- **Code reviewer** — sequential `Team`: analyzer → commenter → summarizer
- **Data analyst** — `Agent` with SQL tool + charting tool
- **Personal assistant** — `Agent` + long-term SQLite memory + calendar/email tools
- **Debate evaluator** — `Team` with `strategy: 'debate'` + a judge agent
