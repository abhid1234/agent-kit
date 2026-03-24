# CLAUDE.md — AI Agent Infrastructure Framework

## Project Overview

**agent-kit** is an open-source TypeScript-first library for building stateful, persistent AI agents with memory, tool use, multi-agent coordination, and observability. Model-agnostic — works with any OpenAI-compatible endpoint or local models via Ollama.

## Why This Exists

Existing agent frameworks are either Python-first (LangChain, CrewAI) or focused on streaming UI (Vercel AI SDK). There's a gap for TypeScript developers who need:
- Persistent memory that works across sessions without manual setup
- Simple, reliable tool execution
- Built-in observability without paid add-ons
- Great TypeScript types and developer experience

### Design Principles
- **Model-agnostic** — no vendor lock-in. Works with any OpenAI-compatible endpoint (Ollama, OpenRouter, etc.). Users bring their own model.
- **TypeScript-first** — not a Python port. Designed for the TypeScript ecosystem.
- **Open-source** — MIT license

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

## Development Workflow

1. Design and spec
2. Implementation plan
3. Build with TDD
4. Verify quality

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
