# CLAUDE.md — AI Agent Infrastructure Framework

## Project Overview

**agent-kit** is an open-source TypeScript-first library for building stateful, persistent AI agents with memory, tool use, multi-agent coordination, and observability. Model-agnostic — works with any OpenAI-compatible endpoint or local models via Ollama.

## Why This Exists

### The Author
- **Abhi** — works at Google, targeting an AI Product Manager role at an AI model/infra startup (Anthropic, Modal, Replicate, Together, etc.)
- Built **Mindweave** (mindweave.space) — a production AI-powered knowledge hub with 30+ features, 2,700+ tests, Next.js 15 + PostgreSQL + pgvector + Google Gemini
- Built **87+ Claude Code skills** covering development, deployment, growth, security, and autonomous loops
- Deep experience with: TypeScript, Next.js, PostgreSQL, pgvector, embeddings, RAG, server actions, Drizzle ORM

### The Goal
This project is a **portfolio piece** to demonstrate AI infrastructure thinking for PM interviews at model/infra companies. It should showcase:
- Understanding of the agent infrastructure layer (not just "I built an app using AI")
- API design skills (the library IS a developer product)
- Product thinking about developer experience
- Technical depth in memory systems, tool execution, and multi-agent coordination

### Constraints
- **Model-agnostic ONLY** — no Google Gemini, no Anthropic Claude, no OpenAI GPT in defaults. Use Ollama (local Llama/Mistral) for demos. Users bring their own model.
- **No model comparison or evaluation** — Abhi works at Google, can't publicly compare models
- **TypeScript-first** — this is the differentiator vs LangChain (Python-first)
- **Open-source** — MIT license, published to npm as `@agent-kit/core` (or similar)

## Product Vision

### Positioning
"LangChain is a Swiss army knife. Agent Kit is a sharp knife."

LangChain solves for breadth (supports every model, every pattern). Agent Kit solves for depth:
- Persistent memory that just works (across sessions, semantic retrieval)
- Reliable tool execution with retry/fallback
- Multi-agent coordination as a first-class concept
- Built-in observability (no paid add-on like LangSmith)
- TypeScript-first with excellent types

### Target Users
- TypeScript/JavaScript developers building AI-powered features
- Teams moving from prototype to production with agents
- Developers who find LangChain too complex or Python-centric

### Competitive Landscape
| | LangChain | Vercel AI SDK | CrewAI | **Agent Kit** |
|---|---|---|---|---|
| Language | Python-first | TypeScript | Python | **TypeScript-first** |
| Learning curve | Steep (100+ classes) | Low (streaming focus) | Medium | **Low (4 core concepts)** |
| Memory | Manual setup | None built-in | Basic | **Built-in, persistent, semantic** |
| Multi-agent | Separate lib (LangGraph) | None | Core feature | **Built into core** |
| Observability | LangSmith (paid) | None | Basic | **Built-in, free** |
| Tool use | Extensive | Basic | Good | **Simple but powerful** |

## Planned Architecture

### 4 Core Concepts
Users only need to learn 4 things: `Agent`, `Memory`, `Tool`, `Team`

### Agent
```typescript
import { Agent, Memory, Tool } from '@agent-kit/core';

const agent = new Agent({
  name: 'research-assistant',
  model: 'ollama/llama3',  // any OpenAI-compatible endpoint
  memory: new Memory({ store: 'sqlite' }),
  tools: [searchTool, saveNoteTool],
  system: 'You are a research assistant.',
});

const response = await agent.chat('Find recent papers on transformers');
```

### Memory (persistent, semantic retrieval)
```typescript
// Zero-config local (SQLite)
new Memory({ store: 'sqlite' })

// Production (PostgreSQL + pgvector)
new Memory({ store: 'postgres', url: process.env.DATABASE_URL })

// In-memory (testing)
new Memory({ store: 'memory' })
```

Features:
- Short-term: conversation history (sliding window)
- Long-term: vector store for semantic retrieval across sessions
- Auto-summarization of old conversations to save context
- Configurable retention policies

### Tool (functions the agent can call)
```typescript
// Simple function
Tool.fromFunction('get_weather', async (city: string) => {
  return fetch(`https://wttr.in/${city}?format=j1`).then(r => r.json());
});

// With schema
Tool.create({
  name: 'create_ticket',
  description: 'Create a support ticket',
  parameters: { title: { type: 'string' }, priority: { type: 'string', enum: ['low', 'medium', 'high'] } },
  execute: async ({ title, priority }) => jira.createTicket(title, priority),
});

// From OpenAPI spec
const tools = await Tool.fromOpenAPI('https://api.example.com/openapi.json');
```

### Team (multi-agent coordination)
```typescript
const researcher = new Agent({ name: 'researcher', tools: [searchTool] });
const writer = new Agent({ name: 'writer', tools: [saveTool] });

const team = new Team({
  agents: [researcher, writer],
  strategy: 'sequential',  // or 'parallel', 'debate', 'hierarchical'
});

await team.run('Research AI frameworks and write a summary');
```

### Observability (built-in, free)
```typescript
const agent = new Agent({ trace: true });

agent.on('step', (step) => {
  console.log(`${step.type}: ${step.description} (${step.latencyMs}ms, ${step.tokens} tokens)`);
});
```

## Package Structure

```
ai-agent-framework/
├── packages/
│   ├── core/              # @agent-kit/core — Agent, Memory, Tool, Team
│   ├── memory-sqlite/     # @agent-kit/memory-sqlite — SQLite memory adapter
│   ├── memory-postgres/   # @agent-kit/memory-postgres — pgvector memory adapter
│   ├── cli/               # @agent-kit/cli — npx agent-kit init
│   └── ui/                # @agent-kit/ui — optional web dashboard for monitoring
├── examples/
│   ├── research-agent/
│   ├── customer-support/
│   ├── code-reviewer/
│   ├── data-analyst/
│   └── personal-assistant/
├── docs/                  # Documentation site
├── CLAUDE.md              # This file
└── README.md              # GitHub README
```

## Interview Pitch

> "I built Agent Kit because I saw developers struggling with two things: making agents remember context across sessions, and coordinating multiple agents on complex tasks. LangChain solves for breadth — it supports every model and every pattern. I solved for depth — persistent memory, reliable tool execution, and multi-agent coordination that actually works. It's TypeScript-first because that's where the production apps are."

## What Demonstrates PM Skills

1. **API Design** — The library IS a developer product. Every design decision (4 core concepts, progressive complexity, sensible defaults) is a product decision.
2. **Developer Experience** — Zero-config memory, type-safe tools, one-command setup. This shows you can design for developers.
3. **Architecture Thinking** — Model adapter pattern, pluggable memory stores, event-driven observability. This shows you understand infrastructure.
4. **Market Understanding** — Positioned against LangChain, Vercel AI SDK, CrewAI with clear differentiation.
5. **Shipping** — Published npm package, working examples, documentation. This shows you execute.

## Development Workflow

Use superpowers skills:
1. `/brainstorming` — Design and spec (START HERE)
2. `/writing-plans` — Implementation plan
3. `/subagent-driven-development` — Build it
4. `/verification-before-completion` — Verify quality

## Tech Stack

- **Language:** TypeScript 5.5+ (strict mode)
- **Build:** tsup or unbuild (fast, library-optimized)
- **Monorepo:** pnpm workspaces + turborepo
- **Testing:** Vitest
- **Linting:** ESLint + Prettier
- **Docs:** Docusaurus or Nextra
- **CI:** GitHub Actions
- **Package Registry:** npm

## Status

**Phase:** Pre-design. Start with `/brainstorming` to finalize the spec.
