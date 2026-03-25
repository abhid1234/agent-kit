---
title: I Built a TypeScript Agent Framework — Here's What I Learned
published: false
description: Most agent frameworks are Python-first or streaming-only. Here's what I built for TypeScript developers who need persistent memory and multi-agent coordination.
tags: typescript, ai, agents, opensource
cover_image:
---

Most agent frameworks are Python-first or streaming-only. I built one for TypeScript developers who need persistent memory and multi-agent coordination — and the process taught me a lot about what "production-ready" actually means for AI agents.

The result is [`@avee1234/agent-kit`](https://github.com/abhid1234/agent-kit): a TypeScript-first library built around 4 core concepts, with 138 tests and full CI. Here's what I built, why, and what I'd do differently.

---

## The Problem With Existing Tools

There are great tools out there — LangChain, Vercel AI SDK, CrewAI — and I've learned a lot from all of them. But I had a specific combination of needs that didn't exist in one place:

<div style="display: flex; gap: 12px; flex-wrap: wrap; margin: 24px 0;">
  <div style="flex: 1; min-width: 220px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 12px; padding: 20px; border: 1px solid #60a5fa;">
    <div style="font-size: 14px; font-weight: 700; color: #60a5fa; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">LangChain</div>
    <div style="font-size: 13px; color: #a0a0b0; line-height: 1.5;">Powerful and comprehensive. I wanted something more lightweight for my use case — fewer concepts to learn, memory that works out of the box.</div>
    <div style="margin-top: 12px; font-size: 12px; color: #60a5fa; font-weight: 600;">GREAT FOR: Breadth of integrations</div>
  </div>
  <div style="flex: 1; min-width: 220px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 12px; padding: 20px; border: 1px solid #60a5fa;">
    <div style="font-size: 14px; font-weight: 700; color: #60a5fa; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Vercel AI SDK</div>
    <div style="font-size: 13px; color: #a0a0b0; line-height: 1.5;">Excellent streaming UX and growing fast. I wanted zero-config persistent memory and built-in multi-agent coordination on top.</div>
    <div style="margin-top: 12px; font-size: 12px; color: #60a5fa; font-weight: 600;">GREAT FOR: Streaming chat UI</div>
  </div>
  <div style="flex: 1; min-width: 220px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 12px; padding: 20px; border: 1px solid #60a5fa;">
    <div style="font-size: 14px; font-weight: 700; color: #60a5fa; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">CrewAI</div>
    <div style="font-size: 13px; color: #a0a0b0; line-height: 1.5;">Best multi-agent coordination model I've seen. I wanted to bring that same pattern to the TypeScript ecosystem.</div>
    <div style="margin-top: 12px; font-size: 12px; color: #60a5fa; font-weight: 600;">GREAT FOR: Multi-agent in Python</div>
  </div>
</div>

So I built what I needed: zero-config persistent memory, simple tool system, multi-agent coordination, and TypeScript-first — all in one package.

---

## The 4 Core Concepts

<div style="background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%); border-radius: 16px; padding: 32px; margin: 24px 0; border: 1px solid #2a2a4a;">
  <div style="text-align: center; margin-bottom: 24px;">
    <span style="font-size: 13px; color: #888; text-transform: uppercase; letter-spacing: 2px;">Everything you need to learn</span>
  </div>
  <div style="display: flex; justify-content: center; gap: 16px; flex-wrap: wrap;">
    <div style="background: #1e1e3e; border: 2px solid #7c3aed; border-radius: 12px; padding: 16px 24px; text-align: center; min-width: 120px;">
      <div style="font-size: 28px; margin-bottom: 4px;">🤖</div>
      <div style="font-size: 16px; font-weight: 700; color: #a78bfa;">Agent</div>
      <div style="font-size: 11px; color: #888; margin-top: 4px;">Orchestrator</div>
    </div>
    <div style="display: flex; align-items: center; color: #444; font-size: 24px;">→</div>
    <div style="background: #1e1e3e; border: 2px solid #2563eb; border-radius: 12px; padding: 16px 24px; text-align: center; min-width: 120px;">
      <div style="font-size: 28px; margin-bottom: 4px;">🔧</div>
      <div style="font-size: 16px; font-weight: 700; color: #60a5fa;">Tool</div>
      <div style="font-size: 11px; color: #888; margin-top: 4px;">Actions</div>
    </div>
    <div style="display: flex; align-items: center; color: #444; font-size: 24px;">→</div>
    <div style="background: #1e1e3e; border: 2px solid #059669; border-radius: 12px; padding: 16px 24px; text-align: center; min-width: 120px;">
      <div style="font-size: 28px; margin-bottom: 4px;">🧠</div>
      <div style="font-size: 16px; font-weight: 700; color: #34d399;">Memory</div>
      <div style="font-size: 11px; color: #888; margin-top: 4px;">Persistence</div>
    </div>
    <div style="display: flex; align-items: center; color: #444; font-size: 24px;">→</div>
    <div style="background: #1e1e3e; border: 2px solid #d97706; border-radius: 12px; padding: 16px 24px; text-align: center; min-width: 120px;">
      <div style="font-size: 28px; margin-bottom: 4px;">👥</div>
      <div style="font-size: 16px; font-weight: 700; color: #fbbf24;">Team</div>
      <div style="font-size: 11px; color: #888; margin-top: 4px;">Coordination</div>
    </div>
  </div>
  <div style="text-align: center; margin-top: 20px;">
    <span style="font-size: 12px; color: #666;">That's it. 4 concepts. Not 100+ classes.</span>
  </div>
</div>

### Agent

The entry point. Give it a model, some tools, and a memory store and it's ready.

```typescript
import { Agent, Memory, Tool } from '@avee1234/agent-kit';

const agent = new Agent({
  name: 'research-assistant',
  model: { provider: 'ollama', model: 'llama3' },
  memory: new Memory({ store: 'sqlite' }),
  tools: [searchTool, saveNoteTool],
  system: 'You are a research assistant.',
});

const response = await agent.chat('Find recent papers on transformers');
```

### Tool

Tools are just functions with a schema attached:

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

### Memory

This is the piece I spent the most time on, and the one I'm most proud of.

```typescript
new Memory({ store: 'sqlite' })                    // persistent, zero-config
new Memory({ store: 'sqlite', embedding: adapter }) // + semantic search
new Memory({ store: 'postgres', url: DATABASE_URL }) // production-grade
new Memory()                                         // in-memory for tests
```

### Team

Multi-agent coordination without the boilerplate:

```typescript
const team = new Team({
  agents: [researcher, writer],
  strategy: 'sequential',
});
await team.run('Research AI frameworks and write a summary');
```

---

## The "Wow Moment": Memory That Survives Restarts

The thing that made this feel real was watching an agent remember context after a full process restart.

<div style="background: #0f0f23; border-radius: 16px; padding: 0; margin: 24px 0; overflow: hidden; border: 1px solid #2a2a4a;">
  <!-- Session 1 -->
  <div style="padding: 20px 24px; border-bottom: 1px solid #2a2a4a;">
    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
      <div style="width: 10px; height: 10px; border-radius: 50%; background: #34d399;"></div>
      <span style="font-size: 13px; color: #34d399; font-weight: 600;">SESSION 1 — Running</span>
    </div>
    <div style="font-family: monospace; font-size: 13px; line-height: 1.8;">
      <div><span style="color: #60a5fa;">❯</span> <span style="color: #e2e8f0;">agent.chat("My project uses PostgreSQL, deployed on Fly.io")</span></div>
      <div style="color: #a0a0b0; padding-left: 16px;">→ "Got it! I'll remember your stack: PostgreSQL + Fly.io"</span></div>
      <div style="margin-top: 8px;"><span style="color: #60a5fa;">❯</span> <span style="color: #e2e8f0;">process.exit(0)</span></div>
    </div>
  </div>
  <!-- Kill -->
  <div style="padding: 12px 24px; background: linear-gradient(90deg, #1a0a0a, #0f0f23); border-bottom: 1px solid #2a2a4a;">
    <div style="display: flex; align-items: center; gap: 8px;">
      <div style="width: 10px; height: 10px; border-radius: 50%; background: #e94560;"></div>
      <span style="font-size: 13px; color: #e94560; font-weight: 600;">PROCESS KILLED</span>
      <span style="font-size: 12px; color: #666; margin-left: auto;">memory.db persists on disk →</span>
    </div>
  </div>
  <!-- Session 2 -->
  <div style="padding: 20px 24px;">
    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
      <div style="width: 10px; height: 10px; border-radius: 50%; background: #34d399;"></div>
      <span style="font-size: 13px; color: #34d399; font-weight: 600;">SESSION 2 — New Process</span>
    </div>
    <div style="font-family: monospace; font-size: 13px; line-height: 1.8;">
      <div><span style="color: #60a5fa;">❯</span> <span style="color: #e2e8f0;">agent.chat("What database am I using?")</span></div>
      <div style="color: #34d399; padding-left: 16px; font-weight: 600;">→ "Based on our previous conversation, you're using PostgreSQL,</div>
      <div style="color: #34d399; padding-left: 28px; font-weight: 600;">deployed on Fly.io."</div>
    </div>
  </div>
</div>

Kill the process, restart it, same SQLite file — the agent picks up where it left off. No manual serialization, no session IDs to manage. It just works because memory is a first-class concept, not an afterthought.

<div style="background: linear-gradient(135deg, #0a1628 0%, #0f0f23 100%); border-radius: 16px; padding: 24px; margin: 24px 0; border: 1px solid #1e3a5f;">
  <div style="font-size: 13px; font-weight: 700; color: #60a5fa; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px;">How Memory Works Under the Hood</div>
  <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: stretch;">
    <div style="flex: 1; min-width: 180px; background: #111827; border-radius: 10px; padding: 16px; border: 1px solid #1f2937;">
      <div style="font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Short-Term</div>
      <div style="font-size: 14px; color: #e5e7eb; line-height: 1.5;">Sliding window of last 20 messages. Always in context.</div>
    </div>
    <div style="display: flex; align-items: center; color: #374151; font-size: 20px;">→</div>
    <div style="flex: 1; min-width: 180px; background: #111827; border-radius: 10px; padding: 16px; border: 1px solid #1f2937;">
      <div style="font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Summarization</div>
      <div style="font-size: 14px; color: #e5e7eb; line-height: 1.5;">Old messages auto-summarized by the model and stored.</div>
    </div>
    <div style="display: flex; align-items: center; color: #374151; font-size: 20px;">→</div>
    <div style="flex: 1; min-width: 180px; background: #111827; border-radius: 10px; padding: 16px; border: 1px solid #1f2937;">
      <div style="font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Long-Term</div>
      <div style="font-size: 14px; color: #e5e7eb; line-height: 1.5;">Semantic search over summaries. Keyword or embedding-based.</div>
    </div>
  </div>
</div>

---

## Multi-Agent Coordination: 4 Strategies

The `Team` class supports four coordination strategies. Each maps to a real pattern you'd use in production:

<div style="background: #0f0f23; border-radius: 16px; padding: 24px; margin: 24px 0; border: 1px solid #2a2a4a;">
  <!-- Sequential -->
  <div style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #1a1a3e;">
    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
      <span style="background: #7c3aed; color: white; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 6px; text-transform: uppercase; letter-spacing: 1px;">Sequential</span>
      <span style="color: #888; font-size: 13px;">Pipeline — each agent builds on the previous</span>
    </div>
    <div style="display: flex; align-items: center; gap: 8px; padding: 8px 0;">
      <div style="background: #1e1e3e; border: 1px solid #7c3aed; border-radius: 8px; padding: 8px 14px; font-size: 13px; color: #a78bfa; font-weight: 600;">Researcher</div>
      <span style="color: #444;">→</span>
      <div style="background: #1e1e3e; border: 1px solid #7c3aed; border-radius: 8px; padding: 8px 14px; font-size: 13px; color: #a78bfa; font-weight: 600;">Analyst</div>
      <span style="color: #444;">→</span>
      <div style="background: #1e1e3e; border: 1px solid #7c3aed; border-radius: 8px; padding: 8px 14px; font-size: 13px; color: #a78bfa; font-weight: 600;">Writer</div>
      <span style="color: #444;">→</span>
      <div style="background: #7c3aed; border-radius: 8px; padding: 8px 14px; font-size: 13px; color: white; font-weight: 600;">Output</div>
    </div>
  </div>
  <!-- Parallel -->
  <div style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #1a1a3e;">
    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
      <span style="background: #2563eb; color: white; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 6px; text-transform: uppercase; letter-spacing: 1px;">Parallel</span>
      <span style="color: #888; font-size: 13px;">Multiple perspectives on the same input</span>
    </div>
    <div style="display: flex; align-items: center; gap: 8px; padding: 8px 0;">
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <div style="background: #1e1e3e; border: 1px solid #2563eb; border-radius: 8px; padding: 6px 14px; font-size: 13px; color: #60a5fa; font-weight: 600;">Security Review</div>
        <div style="background: #1e1e3e; border: 1px solid #2563eb; border-radius: 8px; padding: 6px 14px; font-size: 13px; color: #60a5fa; font-weight: 600;">Style Review</div>
        <div style="background: #1e1e3e; border: 1px solid #2563eb; border-radius: 8px; padding: 6px 14px; font-size: 13px; color: #60a5fa; font-weight: 600;">Perf Review</div>
      </div>
      <span style="color: #444; font-size: 18px;">⟹</span>
      <div style="background: #2563eb; border-radius: 8px; padding: 8px 14px; font-size: 13px; color: white; font-weight: 600;">Merged Output</div>
    </div>
  </div>
  <!-- Debate -->
  <div style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #1a1a3e;">
    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
      <span style="background: #059669; color: white; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 6px; text-transform: uppercase; letter-spacing: 1px;">Debate</span>
      <span style="color: #888; font-size: 13px;">Adversarial refinement across rounds</span>
    </div>
    <div style="display: flex; align-items: center; gap: 8px; padding: 8px 0; flex-wrap: wrap;">
      <div style="background: #1e1e3e; border: 1px solid #059669; border-radius: 8px; padding: 6px 12px; font-size: 12px; color: #34d399;">Proposer: draft</div>
      <span style="color: #444;">→</span>
      <div style="background: #1e1e3e; border: 1px solid #059669; border-radius: 8px; padding: 6px 12px; font-size: 12px; color: #34d399;">Critic: feedback</div>
      <span style="color: #444;">→</span>
      <div style="background: #1e1e3e; border: 1px solid #059669; border-radius: 8px; padding: 6px 12px; font-size: 12px; color: #34d399;">Proposer: revise</div>
      <span style="color: #444;">→</span>
      <div style="background: #1e1e3e; border: 1px solid #059669; border-radius: 8px; padding: 6px 12px; font-size: 12px; color: #34d399;">Critic: approve</div>
      <span style="color: #444;">→</span>
      <div style="background: #059669; border-radius: 8px; padding: 6px 12px; font-size: 12px; color: white; font-weight: 600;">Final</div>
    </div>
  </div>
  <!-- Hierarchical -->
  <div>
    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
      <span style="background: #d97706; color: white; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 6px; text-transform: uppercase; letter-spacing: 1px;">Hierarchical</span>
      <span style="color: #888; font-size: 13px;">Manager delegates to specialists</span>
    </div>
    <div style="display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 8px 0;">
      <div style="background: #d97706; border-radius: 8px; padding: 8px 20px; font-size: 13px; color: white; font-weight: 600;">Manager</div>
      <div style="color: #444; font-size: 14px;">↙ ↓ ↘</div>
      <div style="display: flex; gap: 8px;">
        <div style="background: #1e1e3e; border: 1px solid #d97706; border-radius: 8px; padding: 6px 14px; font-size: 13px; color: #fbbf24; font-weight: 600;">Researcher</div>
        <div style="background: #1e1e3e; border: 1px solid #d97706; border-radius: 8px; padding: 6px 14px; font-size: 13px; color: #fbbf24; font-weight: 600;">Writer</div>
        <div style="background: #1e1e3e; border: 1px solid #d97706; border-radius: 8px; padding: 6px 14px; font-size: 13px; color: #fbbf24; font-weight: 600;">Critic</div>
      </div>
    </div>
  </div>
</div>

Each strategy is about 80–100 lines of TypeScript. They're not magic — they're just structured conversation patterns.

```typescript
// Debate strategy: proposer drafts, critic refines
const team = new Team({
  agents: [proposerAgent, criticAgent],
  strategy: 'debate',
  maxRounds: 3,
});
```

---

## Built-In Observability

One thing I didn't want to pay for: knowing what your agent is actually doing.

<div style="background: #0f0f23; border-radius: 12px; padding: 20px 24px; margin: 24px 0; font-family: monospace; font-size: 13px; line-height: 1.8; border: 1px solid #2a2a4a;">
  <div style="color: #888; margin-bottom: 4px;">// Subscribe to everything</div>
  <div style="color: #e2e8f0;">agent.on('*', (e) => console.log(e));</div>
  <div style="margin: 12px 0; border-top: 1px solid #1a1a3e;"></div>
  <div><span style="color: #fbbf24;">tool:start</span> <span style="color: #888;">web_search({ query: "mamba architecture" })</span></div>
  <div><span style="color: #34d399;">tool:end  </span> <span style="color: #888;">web_search → 340ms</span></div>
  <div><span style="color: #60a5fa;">message  </span> <span style="color: #888;">"I found 3 papers on Mamba..." → 1204ms, 87 tokens</span></div>
  <div><span style="color: #a78bfa;">memory   </span> <span style="color: #888;">retrieved 2 summaries, saved exchange</span></div>
</div>

No LangSmith, no third-party tracing service, no credit card. It's just `EventEmitter` under the hood — pipe it to whatever logging system you already use.

---

## Where Each Tool Shines

<div style="background: #0f0f23; border-radius: 16px; overflow: hidden; margin: 24px 0; border: 1px solid #2a2a4a;">
  <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
    <thead>
      <tr style="background: #1a1a3e;">
        <th style="padding: 12px 16px; text-align: left; color: #888; font-weight: 600; border-bottom: 1px solid #2a2a4a;"></th>
        <th style="padding: 12px 16px; text-align: center; color: #888; font-weight: 600; border-bottom: 1px solid #2a2a4a;">LangChain</th>
        <th style="padding: 12px 16px; text-align: center; color: #888; font-weight: 600; border-bottom: 1px solid #2a2a4a;">Vercel AI SDK</th>
        <th style="padding: 12px 16px; text-align: center; color: #888; font-weight: 600; border-bottom: 1px solid #2a2a4a;">CrewAI</th>
        <th style="padding: 12px 16px; text-align: center; color: #60a5fa; font-weight: 700; border-bottom: 1px solid #2a2a4a;">agent-kit</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="padding: 10px 16px; color: #e5e7eb; border-bottom: 1px solid #1a1a3e;">Language</td>
        <td style="padding: 10px 16px; text-align: center; color: #a0a0b0; border-bottom: 1px solid #1a1a3e;">Python-first</td>
        <td style="padding: 10px 16px; text-align: center; color: #a0a0b0; border-bottom: 1px solid #1a1a3e;">TypeScript</td>
        <td style="padding: 10px 16px; text-align: center; color: #a0a0b0; border-bottom: 1px solid #1a1a3e;">Python</td>
        <td style="padding: 10px 16px; text-align: center; color: #34d399; font-weight: 600; border-bottom: 1px solid #1a1a3e;">TypeScript-first</td>
      </tr>
      <tr>
        <td style="padding: 10px 16px; color: #e5e7eb; border-bottom: 1px solid #1a1a3e;">Learning curve</td>
        <td style="padding: 10px 16px; text-align: center; color: #e94560; border-bottom: 1px solid #1a1a3e;">Steep</td>
        <td style="padding: 10px 16px; text-align: center; color: #34d399; border-bottom: 1px solid #1a1a3e;">Low</td>
        <td style="padding: 10px 16px; text-align: center; color: #fbbf24; border-bottom: 1px solid #1a1a3e;">Medium</td>
        <td style="padding: 10px 16px; text-align: center; color: #34d399; font-weight: 600; border-bottom: 1px solid #1a1a3e;">4 concepts</td>
      </tr>
      <tr>
        <td style="padding: 10px 16px; color: #e5e7eb; border-bottom: 1px solid #1a1a3e;">Memory</td>
        <td style="padding: 10px 16px; text-align: center; color: #fbbf24; border-bottom: 1px solid #1a1a3e;">Manual setup</td>
        <td style="padding: 10px 16px; text-align: center; color: #fbbf24; border-bottom: 1px solid #1a1a3e;">Requires setup</td>
        <td style="padding: 10px 16px; text-align: center; color: #fbbf24; border-bottom: 1px solid #1a1a3e;">Basic</td>
        <td style="padding: 10px 16px; text-align: center; color: #34d399; font-weight: 600; border-bottom: 1px solid #1a1a3e;">Built-in + semantic</td>
      </tr>
      <tr>
        <td style="padding: 10px 16px; color: #e5e7eb; border-bottom: 1px solid #1a1a3e;">Multi-agent</td>
        <td style="padding: 10px 16px; text-align: center; color: #fbbf24; border-bottom: 1px solid #1a1a3e;">LangGraph (separate)</td>
        <td style="padding: 10px 16px; text-align: center; color: #e94560; border-bottom: 1px solid #1a1a3e;">None</td>
        <td style="padding: 10px 16px; text-align: center; color: #34d399; border-bottom: 1px solid #1a1a3e;">Core feature</td>
        <td style="padding: 10px 16px; text-align: center; color: #34d399; font-weight: 600; border-bottom: 1px solid #1a1a3e;">4 strategies built-in</td>
      </tr>
      <tr>
        <td style="padding: 10px 16px; color: #e5e7eb;">Observability</td>
        <td style="padding: 10px 16px; text-align: center; color: #e94560;">LangSmith (paid)</td>
        <td style="padding: 10px 16px; text-align: center; color: #e94560;">None</td>
        <td style="padding: 10px 16px; text-align: center; color: #fbbf24;">Basic</td>
        <td style="padding: 10px 16px; text-align: center; color: #34d399; font-weight: 600;">Built-in, free</td>
      </tr>
    </tbody>
  </table>
</div>

---

## What I'd Do Differently

<div style="display: flex; flex-direction: column; gap: 12px; margin: 24px 0;">
  <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 12px; padding: 20px; border-left: 4px solid #7c3aed;">
    <div style="font-size: 15px; font-weight: 700; color: #a78bfa; margin-bottom: 6px;">1. Ship the monolith first, split packages later</div>
    <div style="font-size: 14px; color: #a0a0b0; line-height: 1.6;">I initially considered a monorepo before I had a working v1. A single package got to "working" faster, and the internal plugin boundaries (like the <code>MemoryStore</code> interface) mean I can split later without breaking anyone.</div>
  </div>
  <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 12px; padding: 20px; border-left: 4px solid #2563eb;">
    <div style="font-size: 15px; font-weight: 700; color: #60a5fa; margin-bottom: 6px;">2. Keyword search before embeddings</div>
    <div style="font-size: 14px; color: #a0a0b0; line-height: 1.6;">For most use cases, keyword search over conversation summaries is fast and good enough. Embeddings add latency and an extra model dependency. I shipped keyword first, embeddings as opt-in — but only after going back and changing it.</div>
  </div>
  <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 12px; padding: 20px; border-left: 4px solid #059669;">
    <div style="font-size: 15px; font-weight: 700; color: #34d399; margin-bottom: 6px;">3. TDD from the start</div>
    <div style="font-size: 14px; color: #a0a0b0; line-height: 1.6;">The places where tests felt hard to write were places where the API design was wrong. Writing tests first would have caught those earlier. The final version has 138 tests — I wish I'd written them before the code, not after.</div>
  </div>
</div>

---

## Live Playground

I deployed a live playground so you can try it without installing anything:

<div style="background: linear-gradient(135deg, #0a1628 0%, #1a0a28 100%); border-radius: 16px; padding: 24px; margin: 24px 0; border: 1px solid #1e3a5f;">
  <div style="text-align: center; margin-bottom: 16px;">
    <a href="https://agent-kit-playground-912353176161.us-central1.run.app" style="font-size: 18px; color: #60a5fa; font-weight: 700; text-decoration: none;">Try the Live Playground →</a>
  </div>
  <div style="display: flex; justify-content: center; gap: 24px; flex-wrap: wrap; margin-top: 16px;">
    <div style="display: flex; align-items: center; gap: 8px;">
      <img src="https://www.gstatic.com/devrel-devsite/prod/v0d244f667a3683225cca86d0ecf9b9b81b1e734e55a030bdcd3f3571e8b94a70/cloud/images/favicons/onecloud/super_cloud.png" width="20" height="20" style="border-radius: 4px;" />
      <span style="font-size: 13px; color: #a0a0b0;">Hosted on <span style="color: #4285f4; font-weight: 600;">Google Cloud Run</span></span>
    </div>
    <div style="display: flex; align-items: center; gap: 8px;">
      <img src="https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg" width="20" height="20" />
      <span style="font-size: 13px; color: #a0a0b0;">Powered by <span style="color: #4285f4; font-weight: 600;">Gemini 2.0 Flash</span> via Google AI Studio</span>
    </div>
  </div>
  <div style="text-align: center; margin-top: 12px; font-size: 12px; color: #666;">Chat with 4 different AI agents. Close the tab and come back — they remember you.</div>
</div>

The playground runs on **Google Cloud Run** (scales to zero, wakes up in seconds) with **Gemini 2.0 Flash** via **Google AI Studio** powering the AI responses. The combination of Cloud Run's serverless scaling and Gemini's speed makes the demo feel instant.

### Try This: Plan a Trip in 60 Seconds

The playground opens on the **Travel Planner** agent. Try this sequence:

<div style="background: #0f0f23; border-radius: 16px; padding: 0; margin: 24px 0; overflow: hidden; border: 1px solid #2a2a4a;">
  <div style="padding: 12px 24px; background: #111827; border-bottom: 1px solid #2a2a4a;">
    <span style="font-size: 12px; color: #fbbf24; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Step-by-step demo — copy and paste each prompt</span>
  </div>
  <div style="padding: 20px 24px; font-family: monospace; font-size: 13px; line-height: 2.2;">
    <div style="margin-bottom: 16px;">
      <div style="color: #888; font-size: 11px; margin-bottom: 4px;">STEP 1 — Watch the search_destinations tool fire</div>
      <div style="background: #1e3a5f; border-radius: 8px; padding: 8px 14px; display: inline-block; color: #e2e8f0;">Plan a 5-day trip to Tokyo in April</div>
    </div>
    <div style="margin-bottom: 16px;">
      <div style="color: #888; font-size: 11px; margin-bottom: 4px;">STEP 2 — Watch the check_weather tool fire</div>
      <div style="background: #1e3a5f; border-radius: 8px; padding: 8px 14px; display: inline-block; color: #e2e8f0;">What's the weather like there?</div>
    </div>
    <div style="margin-bottom: 16px;">
      <div style="color: #888; font-size: 11px; margin-bottom: 4px;">STEP 3 — Watch the save_itinerary tool fire + memory panel updates</div>
      <div style="background: #1e3a5f; border-radius: 8px; padding: 8px 14px; display: inline-block; color: #e2e8f0;">Save this itinerary for me</div>
    </div>
    <div style="margin-bottom: 16px;">
      <div style="color: #888; font-size: 11px; margin-bottom: 4px;">STEP 4 — Close the tab. Reopen the playground. Then ask:</div>
      <div style="background: #1e3a5f; border-radius: 8px; padding: 8px 14px; display: inline-block; color: #e2e8f0;">What trip was I planning?</div>
    </div>
    <div>
      <div style="color: #34d399; font-size: 12px; font-weight: 600;">The agent remembers your Tokyo trip — that's persistent memory in action.</div>
    </div>
  </div>
</div>

**What to watch for while chatting:**
- **Left panel (Chat):** Tool call indicators appear inline, showing which tool fired and how long it took
- **Middle panel (Events):** Every framework event streams in real-time — tool:start, tool:end, memory:save
- **Right panel (Memory):** Message count and saved notes update after each exchange

---

## Try It Locally

```bash
npm install @avee1234/agent-kit
```

Or scaffold a new project:

```bash
npx @avee1234/agent-kit init my-agent
```

<div style="background: linear-gradient(135deg, #0a1628 0%, #0f0f23 100%); border-radius: 16px; padding: 24px; margin: 24px 0; border: 1px solid #1e3a5f; text-align: center;">
  <div style="font-size: 16px; color: #e5e7eb; margin-bottom: 16px;">4 examples to get started</div>
  <div style="display: flex; justify-content: center; gap: 12px; flex-wrap: wrap;">
    <div style="background: #111827; border: 1px solid #1f2937; border-radius: 8px; padding: 10px 16px;">
      <div style="font-size: 13px; color: #60a5fa; font-weight: 600;">research-assistant</div>
      <div style="font-size: 11px; color: #888;">Agent + Tool + Memory</div>
    </div>
    <div style="background: #111827; border: 1px solid #1f2937; border-radius: 8px; padding: 10px 16px;">
      <div style="font-size: 13px; color: #fbbf24; font-weight: 600;">research-team</div>
      <div style="font-size: 11px; color: #888;">Hierarchical Team</div>
    </div>
    <div style="background: #111827; border: 1px solid #1f2937; border-radius: 8px; padding: 10px 16px;">
      <div style="font-size: 13px; color: #34d399; font-weight: 600;">customer-support</div>
      <div style="font-size: 11px; color: #888;">Debate Strategy</div>
    </div>
    <div style="background: #111827; border: 1px solid #1f2937; border-radius: 8px; padding: 10px 16px;">
      <div style="font-size: 13px; color: #a78bfa; font-weight: 600;">code-reviewer</div>
      <div style="font-size: 11px; color: #888;">Parallel Strategy</div>
    </div>
  </div>
  <div style="margin-top: 16px;">
    <a href="https://github.com/abhid1234/agent-kit" style="color: #60a5fa; font-size: 14px;">github.com/abhid1234/agent-kit</a>
  </div>
</div>

If you've been frustrated with LangChain's complexity or Vercel AI SDK's lack of memory, give it a shot and let me know what you think. Issues and PRs welcome.
