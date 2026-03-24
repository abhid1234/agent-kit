---
title: I Built a TypeScript Agent Framework — Here's What I Learned
published: false
description: Most agent frameworks are Python-first or streaming-only. Here's what I built for TypeScript developers who need persistent memory and multi-agent coordination.
tags: typescript, ai, agents, opensource
cover_image:
---

Most agent frameworks are Python-first or streaming-only. I built one for TypeScript developers who need persistent memory and multi-agent coordination — and the process taught me a lot about what "production-ready" actually means for AI agents.

The result is [`@avee1234/agent-kit`](https://github.com/abhid1234/agent-kit): a TypeScript-first library built around 4 core concepts, with 117 tests and full CI. Here's what I built, why, and what I'd do differently.

---

## The Problem With Existing Tools

When I started building AI agents in TypeScript, I ran into the same wall most people hit:

**LangChain** is the obvious choice, but it's a Python framework that was ported to JavaScript as an afterthought. The TypeScript SDK lags behind, the abstractions are heavy (100+ classes to learn), and setting up persistent memory requires you to wire together 4–5 separate pieces. For a weekend project it's fine. For something you need to maintain, it's exhausting.

**Vercel AI SDK** is excellent — the streaming UX is genuinely great. But it's optimized for chat UI, not stateful agents. There's no built-in memory. Every conversation starts from scratch.

**CrewAI** has the multi-agent coordination model I wanted, but it's Python-only. Not an option for a TypeScript codebase.

What I needed was simple: an agent that could use tools, remember things across sessions, and coordinate with other agents — all in TypeScript, without a PhD in framework internals. So I built it.

---

## The 4 Core Concepts

I made a deliberate choice to keep the surface area small. agent-kit has exactly 4 things to learn: `Agent`, `Tool`, `Memory`, and `Team`.

### Agent

The entry point. Give it a model, some tools, and a memory store and it's ready.

```typescript
import { Agent, Memory, Tool } from '@avee1234/agent-kit';

const agent = new Agent({
  name: 'research-assistant',
  model: 'ollama/llama3',  // any OpenAI-compatible endpoint
  memory: new Memory({ store: 'sqlite' }),
  tools: [searchTool, saveNoteTool],
  system: 'You are a research assistant.',
});

const response = await agent.chat('Find recent papers on transformers');
```

### Tool

Tools are just functions with a schema attached. You can define them inline or from an existing function.

```typescript
const weatherTool = Tool.create({
  name: 'get_weather',
  description: 'Get current weather for a city',
  parameters: {
    city: { type: 'string', description: 'City name' },
  },
  execute: async ({ city }) => {
    return fetch(`https://wttr.in/${city}?format=j1`).then(r => r.json());
  },
});
```

The `execute` function gets fully-typed parameters based on the schema you define. No casting, no `any`.

### Memory

This is the piece I spent the most time on, and the one I'm most proud of.

```typescript
// Zero-config local (SQLite)
const memory = new Memory({ store: 'sqlite' });

// With semantic search (embeddings)
const memory = new Memory({
  store: 'sqlite',
  embedding: { provider: 'ollama', model: 'nomic-embed-text' },
});

// In-memory for tests
const memory = new Memory({ store: 'memory' });
```

Memory handles two things: conversation history (short-term) and a vector store for semantic retrieval across sessions (long-term). By default it uses keyword search. If you provide an embedding model, it upgrades to semantic similarity search automatically.

### Team

Multi-agent coordination without the boilerplate.

```typescript
const researcher = new Agent({ name: 'researcher', tools: [searchTool] });
const writer = new Agent({ name: 'writer', tools: [saveTool] });

const team = new Team({
  agents: [researcher, writer],
  strategy: 'sequential',
});

await team.run('Research AI frameworks and write a summary');
```

---

## The "Wow Moment": Memory That Survives Restarts

The thing that made this feel real was watching an agent remember context after a full process restart.

Here's what that looks like in practice:

```typescript
// Session 1
const agent = new Agent({
  name: 'assistant',
  memory: new Memory({ store: 'sqlite', path: './agent-memory.db' }),
});

await agent.chat("My project uses PostgreSQL and we deploy to Fly.io");
// Agent responds, stores this in long-term memory
process.exit(0);

// Session 2 — completely new process
const agent = new Agent({
  name: 'assistant',
  memory: new Memory({ store: 'sqlite', path: './agent-memory.db' }),
});

await agent.chat("What database am I using?");
// "Based on our previous conversation, you're using PostgreSQL."
```

Kill the process, restart it, same SQLite file — the agent picks up where it left off. No manual serialization, no session IDs to manage. It just works because memory is a first-class concept, not an afterthought.

With embeddings enabled, the retrieval also becomes semantic. Ask "what's my infra setup?" and it pulls the PostgreSQL + Fly.io context even though those exact words weren't in your query.

---

## Multi-Agent Coordination: 4 Strategies

The `Team` class supports four coordination strategies. Each maps to a real pattern you'd use in production:

**Sequential** — agents run one after another, each receiving the previous agent's output. Good for pipelines: researcher → analyst → writer.

**Parallel** — agents run simultaneously on the same task, results are merged. Good for tasks where multiple perspectives add value (e.g., multiple reviewers on a PR).

**Debate** — agents argue positions back and forth for N rounds, then a final agent synthesizes the best answer. Useful when you want adversarial quality checks.

**Hierarchical** — a manager agent breaks the task into subtasks and delegates to specialist agents. Closest to how you'd structure a human team.

```typescript
// Debate strategy: two agents argue, one synthesizes
const team = new Team({
  agents: [optimistAgent, skepticAgent, synthesizerAgent],
  strategy: 'debate',
  rounds: 3,
});
```

Each strategy is about 80–100 lines of TypeScript. They're not magic — they're just structured conversation patterns.

---

## Built-In Observability

One thing I didn't want to add a paid service to get: knowing what your agent is actually doing.

Every agent emits events you can subscribe to:

```typescript
agent.on('step', (step) => {
  console.log(`[${step.type}] ${step.description} — ${step.latencyMs}ms, ${step.tokens} tokens`);
});

// Output:
// [tool_call] get_weather({ city: "London" }) — 342ms, 0 tokens
// [llm_response] "The weather in London is..." — 1204ms, 87 tokens
```

No LangSmith, no third-party tracing service, no credit card required. It's just Node.js `EventEmitter` under the hood, which means you can pipe it to whatever logging/monitoring system you already use.

---

## What I'd Do Differently

**1. Ship the monolith first, split packages later.**
I started with a monorepo (separate packages for `core`, `memory-sqlite`, `memory-postgres`) before I had a working v1. That made early iteration slower than it needed to be. A single package would have gotten to working faster, and splitting is easy once the API is stable.

**2. Keyword search before embeddings.**
I added embedding-based semantic search too early. For most use cases, keyword search over conversation history is fast and good enough. Embeddings add latency and an extra model dependency. I should have shipped keyword search as the default, with embeddings as an explicit opt-in — which is now how the API works, but only after I went back and changed it.

**3. Write tests before writing the API.**
I wrote most of the implementation first, then backfilled tests. The places where tests felt hard to write were places where the API design was wrong. TDD would have caught those earlier.

---

## Try It

```bash
npm install @avee1234/agent-kit
```

Or scaffold a new project:

```bash
npx @avee1234/agent-kit init my-agent
```

The [GitHub repo](https://github.com/abhid1234/agent-kit) has examples for a research agent, customer support bot, code reviewer, and multi-agent research team.

If you've been frustrated with LangChain's complexity or Vercel AI SDK's lack of memory, give it a shot and let me know what you think. Issues and PRs welcome.
