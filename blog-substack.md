# I Built a TypeScript Agent Framework — Here's What I Learned

Most agent frameworks are Python-first or streaming-only. I built one for TypeScript developers who need persistent memory and multi-agent coordination — and the process taught me a lot about what "production-ready" actually means for AI agents.

The result is [@avee1234/agent-kit](https://github.com/abhid1234/agent-kit): a TypeScript-first library built around 4 core concepts, with 138 tests and full CI. Here's what I built, why, and what I'd do differently.

---

## The Problem With Existing Tools

There are great tools out there — LangChain, Vercel AI SDK, CrewAI — and I've learned a lot from all of them. But I had a specific combination of needs that didn't exist in one place:

[IMAGE: blog-images/01-problem-cards.png]

So I built what I needed: zero-config persistent memory, simple tool system, multi-agent coordination, and TypeScript-first — all in one package.

---

## The 4 Core Concepts

I made a deliberate choice to keep the surface area small. agent-kit has exactly 4 things to learn:

[IMAGE: blog-images/02-four-concepts.png]

Each concept is a card with an icon, a one-line description, and the actual code. Here's a closer look:

**Agent** — The orchestrator. Give it a model, tools, and memory. It handles tool calls, context, and streaming.

```typescript
const agent = new Agent({
  name: 'research-assistant',
  model: { provider: 'ollama', model: 'llama3' },
  memory: new Memory({ store: 'sqlite' }),
  tools: [searchTool, saveNoteTool],
  system: 'You are a research assistant.',
});

const response = await agent.chat('Find recent papers on transformers');
```

**Tool** — Just a function with a schema. No decorators, no inheritance. 5 lines.

```typescript
const weatherTool = Tool.create({
  name: 'get_weather',
  description: 'Get current weather for a city',
  parameters: { city: { type: 'string' } },
  execute: async ({ city }) => fetch(`https://wttr.in/${city}?format=j1`).then(r => r.json()),
});
```

**Memory** — SQLite, PostgreSQL, or in-memory. Auto-summarizes old conversations. Optional embedding search.

```typescript
new Memory({ store: 'sqlite' })                    // persistent, zero-config
new Memory({ store: 'sqlite', embedding: adapter }) // + semantic search
new Memory({ store: 'postgres', url: DATABASE_URL }) // production-grade
new Memory()                                         // in-memory for tests
```

**Team** — 4 coordination strategies: Sequential, Parallel, Debate, Hierarchical.

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

[IMAGE: blog-images/03-memory-terminal.png]

Kill the process, restart it, same SQLite file — the agent picks up where it left off. No manual serialization, no session IDs to manage. It just works because memory is a first-class concept, not an afterthought.

[IMAGE: blog-images/04-memory-pipeline.png]

---

## Multi-Agent Coordination: 4 Strategies

The Team class supports four coordination strategies. Each maps to a real pattern you'd use in production:

[IMAGE: blog-images/05-strategies.png]

**Sequential** — agents run one after another, each receiving the previous agent's output. Good for pipelines: researcher -> analyst -> writer.

**Parallel** — agents run simultaneously on the same task, results are merged. Good for multiple perspectives.

**Debate** — agents argue positions back and forth for N rounds, then a final agent synthesizes the best answer.

**Hierarchical** — a manager agent breaks the task into subtasks and delegates to specialist agents.

```typescript
const team = new Team({
  agents: [proposerAgent, criticAgent],
  strategy: 'debate',
  maxRounds: 3,
});
```

---

## Built-In Observability

One thing I didn't want to pay for: knowing what your agent is actually doing.

[IMAGE: blog-images/06-observability.png]

No LangSmith, no third-party tracing service, no credit card. It's just EventEmitter under the hood — pipe it to whatever logging system you already use.

---

## Where Each Tool Shines

[IMAGE: blog-images/07-comparison.png]

---

## Live Playground

I deployed a live playground so you can try it without installing anything:

**[Try the Live Playground ->](https://www.abhi-agent-kit.space)**

Hosted on **Google Cloud Run**. Powered by **Gemini Flash** via **Google AI Studio**.

Chat with 4 different AI agents. Close the tab and come back — they remember you.

### Try This: Plan a Trip in 60 Seconds

The playground opens on the **Travel Planner** agent. Try this sequence:

[IMAGE: blog-images/11-steps.png]

**What to watch for while chatting:**
- **Left panel (Chat):** Tool call indicators appear inline, showing which tool fired and how long it took
- **Middle panel (Events):** Every framework event streams in real-time — tool:start, tool:end, memory:save
- **Right panel (Memory):** Message count and saved notes update after each exchange

---

## Try It Locally

Want to build your own agent? Here's a step-by-step guide — even if you've never used a terminal before.

[IMAGE: blog-images/12-local-setup.png]

**Step 1:** Install Node.js from [nodejs.org](https://nodejs.org) (LTS version).

**Step 2:** Create your agent project:
```bash
npx @avee1234/agent-kit init my-agent
```

**Step 3:** Install and run:
```bash
cd my-agent
npm install
npm start "Hello, what can you do?"
```
Works instantly with built-in mock model — no API keys needed.

**Step 4 (optional):** Connect a real AI model with **Google AI Studio** (free tier):
```typescript
model: {
  baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai',
  model: 'gemini-2.0-flash',
  apiKey: 'your-key-from-aistudio.google.com',
}
```
Get a free API key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey).

---

## What I'd Do Differently

[IMAGE: blog-images/08-lessons.png]

**1. Ship the monolith first, split packages later.**
I initially considered a monorepo before I had a working v1. A single package got to "working" faster, and the internal plugin boundaries (like the MemoryStore interface) mean I can split later without breaking anyone.

**2. Keyword search before embeddings.**
For most use cases, keyword search over conversation summaries is fast and good enough. Embeddings add latency and an extra model dependency. I shipped keyword first, embeddings as opt-in.

**3. TDD from the start.**
The places where tests felt hard to write were places where the API design was wrong. Writing tests first would have caught those earlier. The final version has 138 tests.

---

## Try It

[IMAGE: blog-images/09-examples.png]

- **[Live Playground](https://www.abhi-agent-kit.space)** — try it in your browser, no install
- **[GitHub](https://github.com/abhid1234/agent-kit)** — source code, examples, docs
- **npm:** `npm install @avee1234/agent-kit`

If you've been looking for a lightweight TypeScript alternative for building AI agents, give it a shot and let me know what you think. Issues and PRs welcome.
