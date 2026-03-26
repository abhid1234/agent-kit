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
  <div style="flex: 1; min-width: 220px; background: #f8fafc; border-radius: 12px; padding: 20px; border: 1px solid #2563eb;">
    <div style="font-size: 14px; font-weight: 700; color: #2563eb; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">LangChain</div>
    <div style="font-size: 13px; color: #475569; line-height: 1.5;">Powerful and comprehensive. I wanted something more lightweight for my use case — fewer concepts to learn, memory that works out of the box.</div>
    <div style="margin-top: 12px; font-size: 12px; color: #2563eb; font-weight: 600;">GREAT FOR: Breadth of integrations</div>
  </div>
  <div style="flex: 1; min-width: 220px; background: #f8fafc; border-radius: 12px; padding: 20px; border: 1px solid #2563eb;">
    <div style="font-size: 14px; font-weight: 700; color: #2563eb; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Vercel AI SDK</div>
    <div style="font-size: 13px; color: #475569; line-height: 1.5;">Excellent streaming UX and growing fast. I wanted zero-config persistent memory and built-in multi-agent coordination on top.</div>
    <div style="margin-top: 12px; font-size: 12px; color: #2563eb; font-weight: 600;">GREAT FOR: Streaming chat UI</div>
  </div>
  <div style="flex: 1; min-width: 220px; background: #f8fafc; border-radius: 12px; padding: 20px; border: 1px solid #2563eb;">
    <div style="font-size: 14px; font-weight: 700; color: #2563eb; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">CrewAI</div>
    <div style="font-size: 13px; color: #475569; line-height: 1.5;">Best multi-agent coordination model I've seen. I wanted to bring that same pattern to the TypeScript ecosystem.</div>
    <div style="margin-top: 12px; font-size: 12px; color: #2563eb; font-weight: 600;">GREAT FOR: Multi-agent in Python</div>
  </div>
</div>

So I built what I needed: zero-config persistent memory, simple tool system, multi-agent coordination, and TypeScript-first — all in one package.

---

## The 4 Core Concepts

<div style="background: #f8fafc; border-radius: 16px; padding: 32px; margin: 24px 0; border: 1px solid #e2e8f0;">
  <div style="text-align: center; margin-bottom: 24px;">
    <span style="font-size: 13px; color: #64748b; text-transform: uppercase; letter-spacing: 2px;">Everything you need to learn</span>
  </div>
  <div style="display: flex; justify-content: center; gap: 16px; flex-wrap: wrap;">
    <div style="background: #ffffff; border: 2px solid #7c3aed; border-radius: 12px; padding: 16px 24px; text-align: center; min-width: 120px;">
      <div style="font-size: 28px; margin-bottom: 4px;">🤖</div>
      <div style="font-size: 16px; font-weight: 700; color: #7c3aed;">Agent</div>
      <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Orchestrator</div>
    </div>
    <div style="display: flex; align-items: center; color: #cbd5e1; font-size: 24px;">→</div>
    <div style="background: #ffffff; border: 2px solid #2563eb; border-radius: 12px; padding: 16px 24px; text-align: center; min-width: 120px;">
      <div style="font-size: 28px; margin-bottom: 4px;">🔧</div>
      <div style="font-size: 16px; font-weight: 700; color: #2563eb;">Tool</div>
      <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Actions</div>
    </div>
    <div style="display: flex; align-items: center; color: #cbd5e1; font-size: 24px;">→</div>
    <div style="background: #ffffff; border: 2px solid #059669; border-radius: 12px; padding: 16px 24px; text-align: center; min-width: 120px;">
      <div style="font-size: 28px; margin-bottom: 4px;">🧠</div>
      <div style="font-size: 16px; font-weight: 700; color: #059669;">Memory</div>
      <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Persistence</div>
    </div>
    <div style="display: flex; align-items: center; color: #cbd5e1; font-size: 24px;">→</div>
    <div style="background: #ffffff; border: 2px solid #d97706; border-radius: 12px; padding: 16px 24px; text-align: center; min-width: 120px;">
      <div style="font-size: 28px; margin-bottom: 4px;">👥</div>
      <div style="font-size: 16px; font-weight: 700; color: #d97706;">Team</div>
      <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Coordination</div>
    </div>
  </div>
  <div style="text-align: center; margin-top: 20px;">
    <span style="font-size: 12px; color: #94a3b8;">That's it. 4 concepts. Not 100+ classes.</span>
  </div>
</div>

<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 24px 0;">
  <div style="background: #ffffff; border: 2px solid #3b82f6; border-radius: 16px; padding: 24px; box-shadow: 0 1px 3px rgba(59,130,246,0.1);">
    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
      <div style="width: 36px; height: 36px; border-radius: 10px; background: #eff6ff; display: flex; align-items: center; justify-content: center; font-size: 18px;">🤖</div>
      <div>
        <div style="font-size: 16px; font-weight: 700; color: #1e293b;">Agent</div>
        <div style="font-size: 11px; color: #64748b;">The orchestrator</div>
      </div>
    </div>
    <div style="font-size: 13px; color: #475569; line-height: 1.5; margin-bottom: 12px;">Give it a model, tools, and memory. It handles the rest — tool calls, context, streaming.</div>
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; font-family: monospace; font-size: 11px; line-height: 1.6; color: #334155; overflow-x: auto;">
      <span style="color: #7c3aed;">const</span> agent = <span style="color: #7c3aed;">new</span> <span style="color: #2563eb;">Agent</span>({<br>
      &nbsp;&nbsp;name: <span style="color: #059669;">'research-assistant'</span>,<br>
      &nbsp;&nbsp;model: { provider: <span style="color: #059669;">'ollama'</span> },<br>
      &nbsp;&nbsp;memory: <span style="color: #7c3aed;">new</span> <span style="color: #2563eb;">Memory</span>({ store: <span style="color: #059669;">'sqlite'</span> }),<br>
      &nbsp;&nbsp;tools: [searchTool, noteTool],<br>
      });<br><br>
      <span style="color: #7c3aed;">await</span> agent.<span style="color: #2563eb;">chat</span>(<span style="color: #059669;">'Find papers on transformers'</span>);
    </div>
  </div>
  <div style="background: #ffffff; border: 2px solid #8b5cf6; border-radius: 16px; padding: 24px; box-shadow: 0 1px 3px rgba(139,92,246,0.1);">
    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
      <div style="width: 36px; height: 36px; border-radius: 10px; background: #f5f3ff; display: flex; align-items: center; justify-content: center; font-size: 18px;">🔧</div>
      <div>
        <div style="font-size: 16px; font-weight: 700; color: #1e293b;">Tool</div>
        <div style="font-size: 11px; color: #64748b;">Actions the agent can take</div>
      </div>
    </div>
    <div style="font-size: 13px; color: #475569; line-height: 1.5; margin-bottom: 12px;">Just a function with a schema. No decorators, no inheritance. 5 lines.</div>
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; font-family: monospace; font-size: 11px; line-height: 1.6; color: #334155; overflow-x: auto;">
      <span style="color: #7c3aed;">const</span> weatherTool = <span style="color: #2563eb;">Tool.create</span>({<br>
      &nbsp;&nbsp;name: <span style="color: #059669;">'get_weather'</span>,<br>
      &nbsp;&nbsp;description: <span style="color: #059669;">'Get weather for a city'</span>,<br>
      &nbsp;&nbsp;parameters: { city: { type: <span style="color: #059669;">'string'</span> } },<br>
      &nbsp;&nbsp;execute: <span style="color: #7c3aed;">async</span> ({ city }) => {<br>
      &nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #7c3aed;">return</span> fetch(<span style="color: #059669;">`wttr.in/${city}`</span>);<br>
      &nbsp;&nbsp;},<br>
      });
    </div>
  </div>
  <div style="background: #ffffff; border: 2px solid #10b981; border-radius: 16px; padding: 24px; box-shadow: 0 1px 3px rgba(16,185,129,0.1);">
    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
      <div style="width: 36px; height: 36px; border-radius: 10px; background: #ecfdf5; display: flex; align-items: center; justify-content: center; font-size: 18px;">🧠</div>
      <div>
        <div style="font-size: 16px; font-weight: 700; color: #1e293b;">Memory</div>
        <div style="font-size: 11px; color: #64748b;">Persistent across sessions</div>
      </div>
    </div>
    <div style="font-size: 13px; color: #475569; line-height: 1.5; margin-bottom: 12px;">SQLite, PostgreSQL, or in-memory. Auto-summarizes old conversations. Optional embedding search.</div>
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; font-family: monospace; font-size: 11px; line-height: 1.8; color: #334155; overflow-x: auto;">
      <span style="color: #7c3aed;">new</span> <span style="color: #2563eb;">Memory</span>({ store: <span style="color: #059669;">'sqlite'</span> }) <span style="color: #94a3b8;">// zero-config</span><br>
      <span style="color: #7c3aed;">new</span> <span style="color: #2563eb;">Memory</span>({ store: <span style="color: #059669;">'postgres'</span>, url }) <span style="color: #94a3b8;">// production</span><br>
      <span style="color: #7c3aed;">new</span> <span style="color: #2563eb;">Memory</span>({ embedding: adapter }) <span style="color: #94a3b8;">// semantic</span><br>
      <span style="color: #7c3aed;">new</span> <span style="color: #2563eb;">Memory</span>() <span style="color: #94a3b8;">// in-memory for tests</span>
    </div>
  </div>
  <div style="background: #ffffff; border: 2px solid #f59e0b; border-radius: 16px; padding: 24px; box-shadow: 0 1px 3px rgba(245,158,11,0.1);">
    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
      <div style="width: 36px; height: 36px; border-radius: 10px; background: #fffbeb; display: flex; align-items: center; justify-content: center; font-size: 18px;">👥</div>
      <div>
        <div style="font-size: 16px; font-weight: 700; color: #1e293b;">Team</div>
        <div style="font-size: 11px; color: #64748b;">Multi-agent coordination</div>
      </div>
    </div>
    <div style="font-size: 13px; color: #475569; line-height: 1.5; margin-bottom: 12px;">4 strategies: Sequential, Parallel, Debate, Hierarchical. Agents work together on one task.</div>
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; font-family: monospace; font-size: 11px; line-height: 1.6; color: #334155; overflow-x: auto;">
      <span style="color: #7c3aed;">const</span> team = <span style="color: #7c3aed;">new</span> <span style="color: #2563eb;">Team</span>({<br>
      &nbsp;&nbsp;agents: [researcher, writer],<br>
      &nbsp;&nbsp;strategy: <span style="color: #059669;">'sequential'</span>,<br>
      });<br><br>
      <span style="color: #7c3aed;">await</span> team.<span style="color: #2563eb;">run</span>(<span style="color: #059669;">'Research and summarize'</span>);
    </div>
  </div>
</div>

---

## The "Wow Moment": Memory That Survives Restarts

The thing that made this feel real was watching an agent remember context after a full process restart.

<div style="background: #ffffff; border-radius: 16px; padding: 0; margin: 24px 0; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
  <!-- Session 1 -->
  <div style="padding: 20px 24px; border-bottom: 1px solid #e2e8f0;">
    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
      <div style="width: 10px; height: 10px; border-radius: 50%; background: #059669;"></div>
      <span style="font-size: 13px; color: #059669; font-weight: 600;">SESSION 1 — Running</span>
    </div>
    <div style="font-family: monospace; font-size: 13px; line-height: 1.8; color: #1e293b;">
      <div><span style="color: #2563eb;">❯</span> <span style="color: #1e293b;">agent.chat("My project uses PostgreSQL, deployed on Fly.io")</span></div>
      <div style="color: #475569; padding-left: 16px;">→ "Got it! I'll remember your stack: PostgreSQL + Fly.io"</div>
      <div style="margin-top: 8px;"><span style="color: #2563eb;">❯</span> <span style="color: #1e293b;">process.exit(0)</span></div>
    </div>
  </div>
  <!-- Kill -->
  <div style="padding: 12px 24px; background: #fef2f2; border-bottom: 1px solid #fecaca;">
    <div style="display: flex; align-items: center; gap: 8px;">
      <div style="width: 10px; height: 10px; border-radius: 50%; background: #dc2626;"></div>
      <span style="font-size: 13px; color: #dc2626; font-weight: 600;">PROCESS KILLED</span>
      <span style="font-size: 12px; color: #94a3b8; margin-left: auto;">memory.db persists on disk →</span>
    </div>
  </div>
  <!-- Session 2 -->
  <div style="padding: 20px 24px;">
    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
      <div style="width: 10px; height: 10px; border-radius: 50%; background: #059669;"></div>
      <span style="font-size: 13px; color: #059669; font-weight: 600;">SESSION 2 — New Process</span>
    </div>
    <div style="font-family: monospace; font-size: 13px; line-height: 1.8; color: #1e293b;">
      <div><span style="color: #2563eb;">❯</span> <span style="color: #1e293b;">agent.chat("What database am I using?")</span></div>
      <div style="color: #059669; padding-left: 16px; font-weight: 600;">→ "Based on our previous conversation, you're using PostgreSQL,</div>
      <div style="color: #059669; padding-left: 28px; font-weight: 600;">deployed on Fly.io."</div>
    </div>
  </div>
</div>

Kill the process, restart it, same SQLite file — the agent picks up where it left off. No manual serialization, no session IDs to manage. It just works because memory is a first-class concept, not an afterthought.

<div style="background: #f8fafc; border-radius: 16px; padding: 24px; margin: 24px 0; border: 1px solid #e2e8f0;">
  <div style="font-size: 13px; font-weight: 700; color: #2563eb; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px;">How Memory Works Under the Hood</div>
  <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: stretch;">
    <div style="flex: 1; min-width: 180px; background: #ffffff; border-radius: 10px; padding: 16px; border: 1px solid #e2e8f0;">
      <div style="font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Short-Term</div>
      <div style="font-size: 14px; color: #1e293b; line-height: 1.5;">Sliding window of last 20 messages. Always in context.</div>
    </div>
    <div style="display: flex; align-items: center; color: #cbd5e1; font-size: 20px;">→</div>
    <div style="flex: 1; min-width: 180px; background: #ffffff; border-radius: 10px; padding: 16px; border: 1px solid #e2e8f0;">
      <div style="font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Summarization</div>
      <div style="font-size: 14px; color: #1e293b; line-height: 1.5;">Old messages auto-summarized by the model and stored.</div>
    </div>
    <div style="display: flex; align-items: center; color: #cbd5e1; font-size: 20px;">→</div>
    <div style="flex: 1; min-width: 180px; background: #ffffff; border-radius: 10px; padding: 16px; border: 1px solid #e2e8f0;">
      <div style="font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Long-Term</div>
      <div style="font-size: 14px; color: #1e293b; line-height: 1.5;">Semantic search over summaries. Keyword or embedding-based.</div>
    </div>
  </div>
</div>

---

## Multi-Agent Coordination: 4 Strategies

The `Team` class supports four coordination strategies. Each maps to a real pattern you'd use in production:

<div style="background: #ffffff; border-radius: 16px; padding: 24px; margin: 24px 0; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.06);">
  <!-- Sequential -->
  <div style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #f1f5f9;">
    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
      <span style="background: #7c3aed; color: white; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 6px; text-transform: uppercase; letter-spacing: 1px;">Sequential</span>
      <span style="color: #64748b; font-size: 13px;">Pipeline — each agent builds on the previous</span>
    </div>
    <div style="display: flex; align-items: center; gap: 8px; padding: 8px 0;">
      <div style="background: #faf5ff; border: 1px solid #7c3aed; border-radius: 8px; padding: 8px 14px; font-size: 13px; color: #7c3aed; font-weight: 600;">Researcher</div>
      <span style="color: #cbd5e1;">→</span>
      <div style="background: #faf5ff; border: 1px solid #7c3aed; border-radius: 8px; padding: 8px 14px; font-size: 13px; color: #7c3aed; font-weight: 600;">Analyst</div>
      <span style="color: #cbd5e1;">→</span>
      <div style="background: #faf5ff; border: 1px solid #7c3aed; border-radius: 8px; padding: 8px 14px; font-size: 13px; color: #7c3aed; font-weight: 600;">Writer</div>
      <span style="color: #cbd5e1;">→</span>
      <div style="background: #7c3aed; border-radius: 8px; padding: 8px 14px; font-size: 13px; color: white; font-weight: 600;">Output</div>
    </div>
  </div>
  <!-- Parallel -->
  <div style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #f1f5f9;">
    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
      <span style="background: #2563eb; color: white; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 6px; text-transform: uppercase; letter-spacing: 1px;">Parallel</span>
      <span style="color: #64748b; font-size: 13px;">Multiple perspectives on the same input</span>
    </div>
    <div style="display: flex; align-items: center; gap: 8px; padding: 8px 0;">
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <div style="background: #eff6ff; border: 1px solid #2563eb; border-radius: 8px; padding: 6px 14px; font-size: 13px; color: #2563eb; font-weight: 600;">Security Review</div>
        <div style="background: #eff6ff; border: 1px solid #2563eb; border-radius: 8px; padding: 6px 14px; font-size: 13px; color: #2563eb; font-weight: 600;">Style Review</div>
        <div style="background: #eff6ff; border: 1px solid #2563eb; border-radius: 8px; padding: 6px 14px; font-size: 13px; color: #2563eb; font-weight: 600;">Perf Review</div>
      </div>
      <span style="color: #cbd5e1; font-size: 18px;">⟹</span>
      <div style="background: #2563eb; border-radius: 8px; padding: 8px 14px; font-size: 13px; color: white; font-weight: 600;">Merged Output</div>
    </div>
  </div>
  <!-- Debate -->
  <div style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #f1f5f9;">
    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
      <span style="background: #059669; color: white; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 6px; text-transform: uppercase; letter-spacing: 1px;">Debate</span>
      <span style="color: #64748b; font-size: 13px;">Adversarial refinement across rounds</span>
    </div>
    <div style="display: flex; align-items: center; gap: 8px; padding: 8px 0; flex-wrap: wrap;">
      <div style="background: #ecfdf5; border: 1px solid #059669; border-radius: 8px; padding: 6px 12px; font-size: 12px; color: #059669;">Proposer: draft</div>
      <span style="color: #cbd5e1;">→</span>
      <div style="background: #ecfdf5; border: 1px solid #059669; border-radius: 8px; padding: 6px 12px; font-size: 12px; color: #059669;">Critic: feedback</div>
      <span style="color: #cbd5e1;">→</span>
      <div style="background: #ecfdf5; border: 1px solid #059669; border-radius: 8px; padding: 6px 12px; font-size: 12px; color: #059669;">Proposer: revise</div>
      <span style="color: #cbd5e1;">→</span>
      <div style="background: #ecfdf5; border: 1px solid #059669; border-radius: 8px; padding: 6px 12px; font-size: 12px; color: #059669;">Critic: approve</div>
      <span style="color: #cbd5e1;">→</span>
      <div style="background: #059669; border-radius: 8px; padding: 6px 12px; font-size: 12px; color: white; font-weight: 600;">Final</div>
    </div>
  </div>
  <!-- Hierarchical -->
  <div>
    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
      <span style="background: #d97706; color: white; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 6px; text-transform: uppercase; letter-spacing: 1px;">Hierarchical</span>
      <span style="color: #64748b; font-size: 13px;">Manager delegates to specialists</span>
    </div>
    <div style="display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 8px 0;">
      <div style="background: #d97706; border-radius: 8px; padding: 8px 20px; font-size: 13px; color: white; font-weight: 600;">Manager</div>
      <div style="color: #cbd5e1; font-size: 14px;">↙ ↓ ↘</div>
      <div style="display: flex; gap: 8px;">
        <div style="background: #fffbeb; border: 1px solid #d97706; border-radius: 8px; padding: 6px 14px; font-size: 13px; color: #d97706; font-weight: 600;">Researcher</div>
        <div style="background: #fffbeb; border: 1px solid #d97706; border-radius: 8px; padding: 6px 14px; font-size: 13px; color: #d97706; font-weight: 600;">Writer</div>
        <div style="background: #fffbeb; border: 1px solid #d97706; border-radius: 8px; padding: 6px 14px; font-size: 13px; color: #d97706; font-weight: 600;">Critic</div>
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

<div style="background: #f8fafc; border-radius: 12px; padding: 20px 24px; margin: 24px 0; font-family: monospace; font-size: 13px; line-height: 1.8; border: 1px solid #e2e8f0;">
  <div style="color: #64748b; margin-bottom: 4px;">// Subscribe to everything</div>
  <div style="color: #1e293b;">agent.on('*', (e) => console.log(e));</div>
  <div style="margin: 12px 0; border-top: 1px solid #e2e8f0;"></div>
  <div><span style="color: #d97706;">tool:start</span> <span style="color: #64748b;">web_search({ query: "mamba architecture" })</span></div>
  <div><span style="color: #059669;">tool:end  </span> <span style="color: #64748b;">web_search → 340ms</span></div>
  <div><span style="color: #2563eb;">message  </span> <span style="color: #64748b;">"I found 3 papers on Mamba..." → 1204ms, 87 tokens</span></div>
  <div><span style="color: #7c3aed;">memory   </span> <span style="color: #64748b;">retrieved 2 summaries, saved exchange</span></div>
</div>

No LangSmith, no third-party tracing service, no credit card. It's just `EventEmitter` under the hood — pipe it to whatever logging system you already use.

---

## Where Each Tool Shines

<div style="background: #ffffff; border-radius: 16px; overflow: hidden; margin: 24px 0; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.06);">
  <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
    <thead>
      <tr style="background: #f8fafc;">
        <th style="padding: 12px 16px; text-align: left; color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0;"></th>
        <th style="padding: 12px 16px; text-align: center; color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0;">LangChain</th>
        <th style="padding: 12px 16px; text-align: center; color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0;">Vercel AI SDK</th>
        <th style="padding: 12px 16px; text-align: center; color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0;">CrewAI</th>
        <th style="padding: 12px 16px; text-align: center; color: #2563eb; font-weight: 700; border-bottom: 1px solid #e2e8f0;">agent-kit</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="padding: 10px 16px; color: #1e293b; border-bottom: 1px solid #f1f5f9;">Language</td>
        <td style="padding: 10px 16px; text-align: center; color: #475569; border-bottom: 1px solid #f1f5f9;">Python-first</td>
        <td style="padding: 10px 16px; text-align: center; color: #475569; border-bottom: 1px solid #f1f5f9;">TypeScript</td>
        <td style="padding: 10px 16px; text-align: center; color: #475569; border-bottom: 1px solid #f1f5f9;">Python</td>
        <td style="padding: 10px 16px; text-align: center; color: #059669; font-weight: 600; border-bottom: 1px solid #f1f5f9;">TypeScript-first</td>
      </tr>
      <tr>
        <td style="padding: 10px 16px; color: #1e293b; border-bottom: 1px solid #f1f5f9;">Learning curve</td>
        <td style="padding: 10px 16px; text-align: center; color: #dc2626; border-bottom: 1px solid #f1f5f9;">Steep</td>
        <td style="padding: 10px 16px; text-align: center; color: #059669; border-bottom: 1px solid #f1f5f9;">Low</td>
        <td style="padding: 10px 16px; text-align: center; color: #d97706; border-bottom: 1px solid #f1f5f9;">Medium</td>
        <td style="padding: 10px 16px; text-align: center; color: #059669; font-weight: 600; border-bottom: 1px solid #f1f5f9;">4 concepts</td>
      </tr>
      <tr>
        <td style="padding: 10px 16px; color: #1e293b; border-bottom: 1px solid #f1f5f9;">Memory</td>
        <td style="padding: 10px 16px; text-align: center; color: #d97706; border-bottom: 1px solid #f1f5f9;">Manual setup</td>
        <td style="padding: 10px 16px; text-align: center; color: #d97706; border-bottom: 1px solid #f1f5f9;">Requires setup</td>
        <td style="padding: 10px 16px; text-align: center; color: #d97706; border-bottom: 1px solid #f1f5f9;">Basic</td>
        <td style="padding: 10px 16px; text-align: center; color: #059669; font-weight: 600; border-bottom: 1px solid #f1f5f9;">Built-in + semantic</td>
      </tr>
      <tr>
        <td style="padding: 10px 16px; color: #1e293b; border-bottom: 1px solid #f1f5f9;">Multi-agent</td>
        <td style="padding: 10px 16px; text-align: center; color: #d97706; border-bottom: 1px solid #f1f5f9;">LangGraph (separate)</td>
        <td style="padding: 10px 16px; text-align: center; color: #dc2626; border-bottom: 1px solid #f1f5f9;">None</td>
        <td style="padding: 10px 16px; text-align: center; color: #059669; border-bottom: 1px solid #f1f5f9;">Core feature</td>
        <td style="padding: 10px 16px; text-align: center; color: #059669; font-weight: 600; border-bottom: 1px solid #f1f5f9;">4 strategies built-in</td>
      </tr>
      <tr>
        <td style="padding: 10px 16px; color: #1e293b;">Observability</td>
        <td style="padding: 10px 16px; text-align: center; color: #dc2626;">LangSmith (paid)</td>
        <td style="padding: 10px 16px; text-align: center; color: #dc2626;">None</td>
        <td style="padding: 10px 16px; text-align: center; color: #d97706;">Basic</td>
        <td style="padding: 10px 16px; text-align: center; color: #059669; font-weight: 600;">Built-in, free</td>
      </tr>
    </tbody>
  </table>
</div>

---

## What I'd Do Differently

<div style="display: flex; flex-direction: column; gap: 12px; margin: 24px 0;">
  <div style="background: #faf5ff; border-radius: 12px; padding: 20px; border-left: 4px solid #7c3aed; border: 1px solid #e9d5ff; border-left-width: 4px;">
    <div style="font-size: 15px; font-weight: 700; color: #7c3aed; margin-bottom: 6px;">1. Ship the monolith first, split packages later</div>
    <div style="font-size: 14px; color: #475569; line-height: 1.6;">I initially considered a monorepo before I had a working v1. A single package got to "working" faster, and the internal plugin boundaries (like the <code style="background: #ede9fe; color: #7c3aed; padding: 1px 4px; border-radius: 3px;">MemoryStore</code> interface) mean I can split later without breaking anyone.</div>
  </div>
  <div style="background: #eff6ff; border-radius: 12px; padding: 20px; border-left: 4px solid #2563eb; border: 1px solid #bfdbfe; border-left-width: 4px;">
    <div style="font-size: 15px; font-weight: 700; color: #2563eb; margin-bottom: 6px;">2. Keyword search before embeddings</div>
    <div style="font-size: 14px; color: #475569; line-height: 1.6;">For most use cases, keyword search over conversation summaries is fast and good enough. Embeddings add latency and an extra model dependency. I shipped keyword first, embeddings as opt-in — but only after going back and changing it.</div>
  </div>
  <div style="background: #ecfdf5; border-radius: 12px; padding: 20px; border-left: 4px solid #059669; border: 1px solid #a7f3d0; border-left-width: 4px;">
    <div style="font-size: 15px; font-weight: 700; color: #059669; margin-bottom: 6px;">3. TDD from the start</div>
    <div style="font-size: 14px; color: #475569; line-height: 1.6;">The places where tests felt hard to write were places where the API design was wrong. Writing tests first would have caught those earlier. The final version has 138 tests — I wish I'd written them before the code, not after.</div>
  </div>
</div>

---

## Live Playground

I deployed a live playground so you can try it without installing anything:

<div style="background: #f8fafc; border-radius: 16px; padding: 24px; margin: 24px 0; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.06);">
  <div style="text-align: center; margin-bottom: 16px;">
    <a href="https://agent-kit-playground-912353176161.us-central1.run.app" style="font-size: 18px; color: #2563eb; font-weight: 700; text-decoration: none;">Try the Live Playground →</a>
  </div>
  <div style="display: flex; justify-content: center; gap: 12px; flex-wrap: wrap; margin: 16px 0;">
    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 14px; font-size: 13px; color: #475569; font-weight: 600;">✈️ Travel Planner</div>
    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 14px; font-size: 13px; color: #475569; font-weight: 600;">🔬 Research Assistant</div>
    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 14px; font-size: 13px; color: #475569; font-weight: 600;">💬 Customer Support</div>
    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 14px; font-size: 13px; color: #475569; font-weight: 600;">👨‍💻 Code Reviewer</div>
  </div>
  <div style="display: flex; justify-content: center; gap: 24px; flex-wrap: wrap; margin-top: 16px;">
    <div style="display: flex; align-items: center; gap: 8px;">
      <div style="width: 20px; height: 20px; background: #4285f4; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 12px; color: white; font-weight: 700;">G</div>
      <span style="font-size: 13px; color: #475569;">Hosted on <span style="color: #4285f4; font-weight: 600;">Google Cloud Run</span></span>
    </div>
    <div style="display: flex; align-items: center; gap: 8px;">
      <div style="width: 20px; height: 20px; background: linear-gradient(135deg, #4285f4, #7c3aed); border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 10px; color: white;">✦</div>
      <span style="font-size: 13px; color: #475569;">Powered by <span style="color: #4285f4; font-weight: 600;">Gemini 2.0 Flash</span></span>
    </div>
  </div>
  <div style="margin-top: 16px; background: #ffffff; border-radius: 8px; padding: 12px 16px; border: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center;">
    50 free messages without signup · Google Sign-in for unlimited access · "View Code" shows the agent's source · "Powered by agent-kit" banner explains the architecture
  </div>
</div>

The playground has a **light theme** (white/gray), opens on the **Travel Planner** by default with a welcome screen showing clickable prompt suggestions, and lets you switch between 4 agents using tabs. Each agent has a "View Code" toggle that shows its actual source — you can see exactly how the tools are wired up. There's also a "Powered by agent-kit" architecture banner that explains how the framework connects everything.

The playground runs on **Google Cloud Run** (scales to zero, wakes up in seconds) with **Gemini 2.0 Flash** via **Google AI Studio** powering the AI responses.

### Try This: Plan a Trip in 60 Seconds

The playground opens on the **Travel Planner** agent. Here's what happens when you use it — the agent asks questions one at a time before calling tools:

<div style="background: #ffffff; border-radius: 16px; padding: 0; margin: 24px 0; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.06);">
  <div style="padding: 12px 24px; background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
    <span style="font-size: 12px; color: #d97706; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Step-by-step demo — copy and paste each prompt</span>
  </div>
  <div style="padding: 20px 24px; font-family: monospace; font-size: 13px; line-height: 2.2;">
    <div style="margin-bottom: 16px;">
      <div style="color: #64748b; font-size: 11px; margin-bottom: 4px;">STEP 1 — Agent asks for your destination</div>
      <div style="background: #eff6ff; border-radius: 8px; padding: 8px 14px; display: inline-block; color: #1e293b; border: 1px solid #bfdbfe;">I want to plan a trip</div>
      <div style="color: #475569; font-size: 11px; margin-top: 4px; padding-left: 4px;">→ Agent asks: "Where would you like to go?"</div>
    </div>
    <div style="margin-bottom: 16px;">
      <div style="color: #64748b; font-size: 11px; margin-bottom: 4px;">STEP 2 — Give destination, agent asks for dates</div>
      <div style="background: #eff6ff; border-radius: 8px; padding: 8px 14px; display: inline-block; color: #1e293b; border: 1px solid #bfdbfe;">Tokyo in April for 5 days</div>
      <div style="color: #475569; font-size: 11px; margin-top: 4px; padding-left: 4px;">→ Agent asks for budget, then fires search_destinations + check_weather (Open-Meteo) + search_flights (Brave) + search_hotels</div>
    </div>
    <div style="margin-bottom: 16px;">
      <div style="color: #64748b; font-size: 11px; margin-bottom: 4px;">STEP 3 — Agent asks for your name before booking</div>
      <div style="background: #eff6ff; border-radius: 8px; padding: 8px 14px; display: inline-block; color: #1e293b; border: 1px solid #bfdbfe;">Budget is around $2000</div>
      <div style="color: #475569; font-size: 11px; margin-top: 4px; padding-left: 4px;">→ Agent builds itinerary, asks "What name should I use for the booking?"</div>
    </div>
    <div style="margin-bottom: 16px;">
      <div style="color: #64748b; font-size: 11px; margin-bottom: 4px;">STEP 4 — Close the tab. Reopen the playground. Then ask:</div>
      <div style="background: #eff6ff; border-radius: 8px; padding: 8px 14px; display: inline-block; color: #1e293b; border: 1px solid #bfdbfe;">What trip was I planning?</div>
    </div>
    <div>
      <div style="color: #059669; font-size: 12px; font-weight: 600;">The agent remembers your Tokyo trip — that's persistent memory in action.</div>
    </div>
  </div>
</div>

**What to watch for while chatting:**
- **Chat panel:** Tool call indicators appear inline, showing which tool fired and how long it took
- **Events panel:** Every framework event streams in real-time — tool:start, tool:end, memory:save
- **Memory panel:** Message count and saved notes update after each exchange

---

## Try It Locally

Want to build your own agent? Here's a step-by-step guide — even if you've never used a terminal before. Or if you'd rather skip the setup, just use the [live playground](https://agent-kit-playground-912353176161.us-central1.run.app) directly.

<div style="background: #ffffff; border-radius: 16px; padding: 0; margin: 24px 0; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.06);">
  <div style="padding: 12px 24px; background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
    <span style="font-size: 12px; color: #059669; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">From zero to running agent in 3 minutes</span>
  </div>
  <div style="padding: 20px 24px;">
    <div style="margin-bottom: 20px;">
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
        <div style="width: 24px; height: 24px; border-radius: 50%; background: #7c3aed; display: flex; align-items: center; justify-content: center; font-size: 12px; color: white; font-weight: 700; flex-shrink: 0;">1</div>
        <div style="font-size: 14px; color: #1e293b; font-weight: 600;">Install Node.js (if you don't have it)</div>
      </div>
      <div style="margin-left: 34px; font-size: 13px; color: #475569; line-height: 1.6;">
        Go to <a href="https://nodejs.org" style="color: #2563eb;">nodejs.org</a> and download the LTS version. Install it like any other app. To check if it's working, open Terminal (Mac) or Command Prompt (Windows) and type:
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 12px; margin-top: 8px; font-family: monospace; font-size: 12px; color: #1e293b;">node --version</div>
        <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">You should see something like v20.x.x</div>
      </div>
    </div>
    <div style="margin-bottom: 20px;">
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
        <div style="width: 24px; height: 24px; border-radius: 50%; background: #2563eb; display: flex; align-items: center; justify-content: center; font-size: 12px; color: white; font-weight: 700; flex-shrink: 0;">2</div>
        <div style="font-size: 14px; color: #1e293b; font-weight: 600;">Create your agent project</div>
      </div>
      <div style="margin-left: 34px; font-size: 13px; color: #475569; line-height: 1.6;">
        Open your terminal and run this single command. It creates a ready-to-go project:
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 12px; margin-top: 8px; font-family: monospace; font-size: 12px; color: #1e293b;">npx @avee1234/agent-kit init my-agent</div>
        <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">This creates a folder called "my-agent" with everything set up</div>
      </div>
    </div>
    <div style="margin-bottom: 20px;">
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
        <div style="width: 24px; height: 24px; border-radius: 50%; background: #059669; display: flex; align-items: center; justify-content: center; font-size: 12px; color: white; font-weight: 700; flex-shrink: 0;">3</div>
        <div style="font-size: 14px; color: #1e293b; font-weight: 600;">Install dependencies and run</div>
      </div>
      <div style="margin-left: 34px; font-size: 13px; color: #475569; line-height: 1.6;">
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 12px; margin-top: 8px; font-family: monospace; font-size: 12px; color: #1e293b;">cd my-agent<br>npm install<br>npm start "Hello, what can you do?"</div>
        <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">The agent responds using a built-in mock model — no API keys needed</div>
      </div>
    </div>
    <div>
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
        <div style="width: 24px; height: 24px; border-radius: 50%; background: #d97706; display: flex; align-items: center; justify-content: center; font-size: 12px; color: white; font-weight: 700; flex-shrink: 0;">4</div>
        <div style="font-size: 14px; color: #1e293b; font-weight: 600;">Connect a real AI model (optional)</div>
      </div>
      <div style="margin-left: 34px; font-size: 13px; color: #475569; line-height: 1.6;">
        To get real AI responses, add a model configuration. You can use <strong style="color: #4285f4;">Google AI Studio</strong> (free tier available):
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 12px; margin-top: 8px; font-family: monospace; font-size: 12px; color: #1e293b; line-height: 1.6;">
          <span style="color: #64748b;">// In your agent.ts, change the model config:</span><br>
          model: {<br>
          &nbsp;&nbsp;baseURL: '<span style="color: #4285f4;">https://generativelanguage.googleapis.com/v1beta/openai</span>',<br>
          &nbsp;&nbsp;model: '<span style="color: #4285f4;">gemini-2.0-flash</span>',<br>
          &nbsp;&nbsp;apiKey: '<span style="color: #d97706;">your-key-from-aistudio.google.com</span>',<br>
          }
        </div>
        <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">Get a free API key at <a href="https://aistudio.google.com/apikey" style="color: #2563eb;">aistudio.google.com/apikey</a></div>
      </div>
    </div>
  </div>
</div>

<div style="background: #f8fafc; border-radius: 16px; padding: 24px; margin: 24px 0; border: 1px solid #e2e8f0; text-align: center;">
  <div style="font-size: 16px; color: #1e293b; margin-bottom: 16px;">4 examples to get started</div>
  <div style="display: flex; justify-content: center; gap: 12px; flex-wrap: wrap;">
    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 16px;">
      <div style="font-size: 13px; color: #2563eb; font-weight: 600;">research-assistant</div>
      <div style="font-size: 11px; color: #64748b;">Agent + Tool + Memory</div>
    </div>
    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 16px;">
      <div style="font-size: 13px; color: #d97706; font-weight: 600;">research-team</div>
      <div style="font-size: 11px; color: #64748b;">Hierarchical Team</div>
    </div>
    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 16px;">
      <div style="font-size: 13px; color: #059669; font-weight: 600;">customer-support</div>
      <div style="font-size: 11px; color: #64748b;">Debate Strategy</div>
    </div>
    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 16px;">
      <div style="font-size: 13px; color: #7c3aed; font-weight: 600;">code-reviewer</div>
      <div style="font-size: 11px; color: #64748b;">Parallel Strategy</div>
    </div>
  </div>
  <div style="margin-top: 16px;">
    <a href="https://github.com/abhid1234/agent-kit" style="color: #2563eb; font-size: 14px;">github.com/abhid1234/agent-kit</a>
  </div>
</div>

If you've been frustrated with LangChain's complexity or Vercel AI SDK's lack of memory, give it a shot and let me know what you think. Issues and PRs welcome.
