---
id: intro
slug: /
sidebar_position: 1
title: Introduction
---

# agent-kit

**TypeScript-first library for building stateful, persistent AI agents.**

agent-kit gives you four simple primitives — `Agent`, `Tool`, `Memory`, `Team` — and gets out of your way. No Python required, no steep learning curve, no paid observability add-ons.

## Why agent-kit?

Most agent frameworks were designed for Python. When you bring them to TypeScript, you lose type safety, fight the API, and end up wrapping everything yourself.

agent-kit is designed for TypeScript from the ground up:

- **4 core concepts** — Agent, Tool, Memory, Team. That's the whole API.
- **Persistent memory** — conversations survive process restarts; semantic search finds relevant history
- **Reliable tool execution** — typed parameters, clean error surfaces
- **Multi-agent coordination** — sequential, parallel, debate, and hierarchical strategies built in
- **Built-in observability** — event emitter on every Agent and Team, no paid add-on
- **Model-agnostic** — works with Ollama, any OpenAI-compatible endpoint, or a mock adapter for tests

## Install

```bash
npm install @avee1234/agent-kit
```

Requires Node.js 18 or later.

## Minimal example

```typescript
import { Agent, MockAdapter } from '@avee1234/agent-kit';

const agent = new Agent({
  name: 'assistant',
  model: new MockAdapter(),
  system: 'You are a helpful assistant.',
});

const response = await agent.chat('Hello!');
console.log(response.content);
```

With a real model (Ollama):

```typescript
import { Agent } from '@avee1234/agent-kit';

const agent = new Agent({
  name: 'assistant',
  model: {
    provider: 'ollama',
    model: 'llama3.2',
  },
  system: 'You are a helpful assistant.',
});

const response = await agent.chat('Explain recursion in one sentence.');
console.log(response.content);
```

## Next steps

- [Quick Start](/quick-start) — build a working agent in 5 minutes
- [Core Concepts](/core/agent) — full API reference
- [Examples](/examples) — complete runnable examples
