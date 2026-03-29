# agent-kit

[![CI](https://github.com/abhid1234/agent-kit/actions/workflows/ci.yml/badge.svg)](https://github.com/abhid1234/agent-kit/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@avee1234/agent-kit)](https://www.npmjs.com/package/@avee1234/agent-kit)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

TypeScript-first library for building stateful, persistent AI agents.

**[Live Playground](https://www.abhi-agent-kit.space)** | **[Blog Post](https://abhid.substack.com/p/i-built-an-open-source-ai-agent-framework)** | **[npm](https://www.npmjs.com/package/@avee1234/agent-kit)** | **[Docs](https://abhid1234.github.io/agent-kit/)**

---

## Why agent-kit?

<p align="center">
  <img src="https://substack-post-media.s3.amazonaws.com/public/images/a427e237-04d0-421e-b1b7-ae2567c1d5d6_1883x981.png" alt="Comparison with LangChain, Vercel AI SDK, CrewAI" width="700" />
</p>

- **Persistent memory across sessions** — SQLite or PostgreSQL. Restart your process; the agent still remembers.
- **Simple tool system** — define a tool in 5 lines with `Tool.create`. No decorators, no class inheritance.
- **Multi-agent coordination** — 4 strategies: Sequential, Parallel, Debate, Hierarchical.
- **Built-in observability** — subscribe to `tool:start`, `tool:end`, `memory:save` events. No paid add-on.
- **TypeScript-first** — strict types throughout. Your editor autocompletes everything.

---

## 4 Core Concepts

<p align="center">
  <img src="https://substack-post-media.s3.amazonaws.com/public/images/b36d2dd8-ee82-4798-864d-e56c1801293e_1883x1267.png" alt="Agent, Tool, Memory, Team — 4 core concepts" width="700" />
</p>

<p align="center">
  <img src="https://substack-post-media.s3.amazonaws.com/public/images/6ffd48ee-59bc-4c0f-8b0f-3cae0e674a4c_1455x1470.png" alt="Agent, Tool, Memory, Team — with code examples" width="700" />
</p>

---

## Installation

```bash
npm install @avee1234/agent-kit
```

Or scaffold a new project:

```bash
npx @avee1234/agent-kit init my-agent
```

---

## Quick Start

```typescript
import { Agent, Tool, Memory } from '@avee1234/agent-kit';

const searchTool = Tool.create({
  name: 'web_search',
  description: 'Search the web',
  parameters: { query: { type: 'string' } },
  execute: async ({ query }) => fetch(`https://api.search.com?q=${query}`).then(r => r.json()),
});

const agent = new Agent({
  name: 'research-assistant',
  model: { provider: 'ollama', model: 'llama3' },
  memory: new Memory({ store: 'sqlite' }),
  tools: [searchTool],
  system: 'You are a research assistant.',
});

const response = await agent.chat('Find recent papers on transformers');
```

No model config required — ships with a built-in `MockAdapter` for development and testing without API keys.

---

## The "Wow Moment": Memory That Survives Restarts

<p align="center">
  <img src="https://substack-post-media.s3.amazonaws.com/public/images/fe5daa4c-39a6-4754-abf5-b5ec12ad3ebb_1406x768.png" alt="Agent remembers context across process restarts" width="700" />
</p>

Kill the process, restart it, same SQLite file — the agent picks up where it left off.

<p align="center">
  <img src="https://substack-post-media.s3.amazonaws.com/public/images/299b2c3f-97e2-4e85-baaf-81edd3965c7c_1406x602.png" alt="Short-term → Summarization → Long-term memory pipeline" width="700" />
</p>

---

## Multi-Agent Coordination

<p align="center">
  <img src="https://substack-post-media.s3.amazonaws.com/public/images/ec242300-00e3-47b8-a399-695c235ecf84_1406x1402.png" alt="4 coordination strategies: Sequential, Parallel, Debate, Hierarchical" width="700" />
</p>

```typescript
const team = new Team({
  agents: [researcher, writer, critic],
  strategy: 'debate',
  maxRounds: 3,
});
const result = await team.run('What is the best database for embeddings?');
```

---

## Built-In Observability

<p align="center">
  <img src="https://substack-post-media.s3.amazonaws.com/public/images/1588753c-8afa-4f9e-8e30-39090368c641_1406x471.png" alt="Real-time event stream: tool:start, tool:end, memory" width="700" />
</p>

```typescript
agent.on('*', (e) => console.log(e.type, e.data, e.latencyMs));
```

No LangSmith, no third-party service. Just `EventEmitter` — pipe it to whatever you use.

---

## Where Each Tool Shines

<p align="center">
  <img src="https://substack-post-media.s3.amazonaws.com/public/images/4ac5f833-33a0-4c48-92fe-20c27f4426e2_1406x565.png" alt="Comparison table: LangChain vs Vercel AI SDK vs CrewAI vs agent-kit" width="700" />
</p>

---

## Model Configuration

```typescript
// Mock (zero config, built-in — great for testing)
const agent = new Agent({ name: 'test' });

// Ollama (local models)
const agent = new Agent({ name: 'local', model: { provider: 'ollama', model: 'llama3' } });

// Google AI Studio (Gemini)
const agent = new Agent({
  name: 'gemini',
  model: new OpenAICompatibleAdapter({
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai',
    model: 'gemini-2.0-flash',
    apiKey: process.env.GOOGLE_AI_API_KEY,
  }),
});

// Any OpenAI-compatible endpoint (Together, OpenRouter, Groq, etc.)
const agent = new Agent({
  name: 'agent',
  model: new OpenAICompatibleAdapter({ baseURL: '...', model: '...', apiKey: '...' }),
});
```

---

## Try It Live

<p align="center">
  <img src="https://substack-post-media.s3.amazonaws.com/public/images/381c61cd-cc61-46de-9351-460ec3b78012_1405x563.png" alt="Live playground powered by Google Cloud Run and Gemini" width="700" />
</p>

**[www.abhi-agent-kit.space](https://www.abhi-agent-kit.space)**

4 pre-built agents with real-time tool execution, persistent memory, and live event streaming. Powered by Gemini Flash on Google Cloud Run.

---

## What You Can Build

<p align="center">
  <img src="https://substack-post-media.s3.amazonaws.com/public/images/97e622f7-78f6-4066-bd2b-4ce4452b78f4_1405x936.png" alt="What I'd do differently — lessons learned" width="700" />
</p>

- **Travel planner** — destination search + weather + flight/hotel booking + budget calculator
- **Research assistant** — web search + note-taking + session memory
- **Customer support** — order lookup + conversation history
- **Code reviewer** — security analysis + style checking
- **Data analyst** — SQL queries + chart generation + persistent findings
- **Personal assistant** — calendar + email + long-term preferences

---

## Read More

- **[Blog Post](https://abhid.substack.com/p/i-built-an-open-source-ai-agent-framework)** — the full story of why and how I built agent-kit
- **[Documentation](https://abhid1234.github.io/agent-kit/)** — API reference, guides, and examples
- **[npm](https://www.npmjs.com/package/@avee1234/agent-kit)** — `npm install @avee1234/agent-kit`

## Contributing

Bug reports and pull requests welcome. Open an issue to discuss changes before submitting a PR.

## License

MIT
