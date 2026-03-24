# agent-kit Playground Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a live web playground where anyone can try agent-kit in their browser — chat with AI agents, see tools fire and memory persist, share sessions — all without signup or install.

**Architecture:** Next.js App Router on Google Cloud Run. React frontend with 3-panel dashboard (chat, events, memory). API routes run agent-kit server-side with SQLite per session. Gemini (Google AI Studio) as the LLM. SSE for real-time streaming.

**Tech Stack:** Next.js 14+, React 18, Tailwind CSS, agent-kit (local), better-sqlite3, Google AI Studio (Gemini), Docker, Cloud Run

**Spec:** `docs/superpowers/specs/2026-03-24-playground-design.md`

---

## File Structure

```
playground/
├── app/
│   ├── layout.tsx                  # Root layout: dark theme, Inter + JetBrains Mono fonts, metadata
│   ├── page.tsx                    # Main playground: 3-panel layout, state management, SSE consumer
│   ├── globals.css                 # Tailwind directives + custom scrollbar + animations
│   ├── s/[code]/page.tsx           # Share code redirect: lookup UUID, set cookie, redirect to /
│   └── api/
│       ├── chat/route.ts           # POST: accepts message + agentType + sessionId, returns SSE stream
│       ├── session/route.ts        # POST: create or resume session, returns sessionId + shareCode
│       └── memory/[id]/route.ts    # GET: returns message count, summary count, notes list
├── components/
│   ├── TopBar.tsx                  # Branding + agent tabs + session code
│   ├── ChatPanel.tsx               # Message list + input bar + streaming state
│   ├── MessageBubble.tsx           # Single message: user or assistant with tool call indicators
│   ├── EventsPanel.tsx             # Scrolling event stream with auto-scroll
│   ├── EventLine.tsx               # Single event row: timestamp + colored type + description
│   ├── MemoryPanel.tsx             # Stats + notes + persistence indicator + share section
│   └── ToolCallIndicator.tsx       # Inline tool call display (name, args, latency)
├── lib/
│   ├── agents.ts                   # 4 agent configs: tools, system prompts, names
│   ├── tools/
│   │   ├── research.ts             # web_search + save_note tools
│   │   ├── support.ts              # lookup_order tool
│   │   ├── code-review.ts          # analyze_code tool
│   │   └── travel.ts               # search_destinations + check_weather + save_itinerary tools
│   ├── session.ts                  # Session CRUD: create, resume by ID, resume by share code, cleanup
│   └── types.ts                    # Shared types: ChatMessage, StreamEvent, SessionInfo, AgentType
├── public/
│   └── favicon.ico
├── Dockerfile
├── .dockerignore
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
└── README.md
```

**Design decisions resolving spec reviewer notes:**
- **Share code collision:** Store share code as a separate column in a `sessions` metadata table (not derived at lookup time). Guaranteed unique.
- **Agent switching + memory:** All 4 agents share the same SQLite DB per session. Each agent has a unique `agentId` (e.g., `research-assistant`, `customer-support`), so memory is isolated per agent within the same session file.
- **Dockerfile:** Multi-stage build — build step inside Docker, no external CI dependency.
- **Session cleanup:** On-demand check at session creation time — delete any `.db` files older than 7 days.

---

## Task 1: Project Scaffolding

**Files:**
- Create: `playground/package.json`
- Create: `playground/tsconfig.json`
- Create: `playground/tailwind.config.ts`
- Create: `playground/next.config.ts`
- Create: `playground/app/layout.tsx`
- Create: `playground/app/globals.css`
- Create: `playground/app/page.tsx`

- [ ] **Step 1: Create playground directory**

```bash
mkdir -p playground
```

- [ ] **Step 2: Initialize Next.js project**

```bash
cd playground && npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --use-npm --registry https://registry.npmjs.org
```

- [ ] **Step 3: Install dependencies**

```bash
cd playground && npm install agent-kit@file:../ --registry https://registry.npmjs.org
npm install uuid --registry https://registry.npmjs.org
npm install --save-dev @types/uuid --registry https://registry.npmjs.org
```

- [ ] **Step 4: Configure tailwind.config.ts for dark theme**

Update `tailwind.config.ts`:
```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0a0a1a',
          secondary: '#0d1117',
          panel: '#111827',
          card: '#1e1e3e',
        },
        border: {
          subtle: '#1f2937',
          hover: '#2a2a4a',
        },
        accent: {
          blue: '#60a5fa',
          green: '#34d399',
          yellow: '#fbbf24',
          purple: '#a78bfa',
          red: '#e94560',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
export default config;
```

- [ ] **Step 5: Create globals.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

body {
  font-family: 'Inter', sans-serif;
  background: #0a0a1a;
  color: #e5e7eb;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #2a2a4a;
  border-radius: 3px;
}

/* Streaming cursor animation */
@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}
.streaming-cursor::after {
  content: '▊';
  animation: blink 1s infinite;
  color: #60a5fa;
}

/* Fade-in for new messages/events */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in {
  animation: fadeIn 0.2s ease-out;
}
```

- [ ] **Step 6: Create root layout.tsx**

```typescript
// app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'agent-kit playground',
  description: 'Try AI agents in your browser — persistent memory, tool execution, real-time events',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-bg-primary text-gray-200 min-h-screen">
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 7: Create placeholder page.tsx**

```typescript
// app/page.tsx
export default function Home() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold text-accent-blue">agent-kit playground</h1>
    </div>
  );
}
```

- [ ] **Step 8: Verify dev server starts**

```bash
cd playground && npm run dev
```
Open http://localhost:3000 — should show "agent-kit playground" centered on dark background.

- [ ] **Step 9: Commit**

```bash
git add playground/
git commit -m "feat(playground): scaffold Next.js project with Tailwind dark theme"
```

---

## Task 2: Shared Types + Session Management

**Files:**
- Create: `playground/lib/types.ts`
- Create: `playground/lib/session.ts`

- [ ] **Step 1: Create shared types**

```typescript
// playground/lib/types.ts
export type AgentType = 'research-assistant' | 'customer-support' | 'code-reviewer' | 'travel-planner';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  toolCalls?: ToolCallInfo[];
}

export interface ToolCallInfo {
  name: string;
  arguments: string;
  result?: string;
  latencyMs?: number;
}

export interface StreamEvent {
  type: string;
  timestamp: number;
  agentId: string;
  data: Record<string, unknown>;
  latencyMs?: number;
}

export interface SessionInfo {
  sessionId: string;
  shareCode: string;
  createdAt: number;
}

export interface MemoryStats {
  messageCount: number;
  summaryCount: number;
  tokenEstimate: number;
  notes: Array<{ title: string; content: string }>;
}

export const AGENT_LABELS: Record<AgentType, { label: string; icon: string }> = {
  'research-assistant': { label: 'Research Assistant', icon: '🔬' },
  'customer-support': { label: 'Customer Support', icon: '🛒' },
  'code-reviewer': { label: 'Code Reviewer', icon: '📝' },
  'travel-planner': { label: 'Travel Planner', icon: '✈️' },
};
```

- [ ] **Step 2: Create session management**

```typescript
// playground/lib/session.ts
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

const DATA_DIR = process.env.DATA_DIR ?? './data/sessions';

export function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function createSession(): { sessionId: string; shareCode: string } {
  ensureDataDir();
  cleanupOldSessions();
  const sessionId = uuidv4();
  const shareCode = sessionId.replace(/-/g, '').substring(0, 6).toUpperCase();
  // Write a metadata file so we can map share codes back to session IDs
  const metaPath = path.join(DATA_DIR, `${sessionId}.meta.json`);
  fs.writeFileSync(metaPath, JSON.stringify({ sessionId, shareCode, createdAt: Date.now() }));
  return { sessionId, shareCode };
}

export function getSessionByShareCode(code: string): string | null {
  ensureDataDir();
  const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith('.meta.json'));
  for (const file of files) {
    const meta = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf-8'));
    if (meta.shareCode === code.toUpperCase()) {
      return meta.sessionId;
    }
  }
  return null;
}

export function getSessionMeta(sessionId: string): { sessionId: string; shareCode: string; createdAt: number } | null {
  const metaPath = path.join(DATA_DIR, `${sessionId}.meta.json`);
  if (!fs.existsSync(metaPath)) return null;
  return JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
}

export function getDbPath(sessionId: string): string {
  ensureDataDir();
  return path.join(DATA_DIR, `${sessionId}.db`);
}

function cleanupOldSessions(): void {
  const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
  const now = Date.now();
  try {
    const files = fs.readdirSync(DATA_DIR);
    for (const file of files) {
      const filePath = path.join(DATA_DIR, file);
      const stat = fs.statSync(filePath);
      if (now - stat.mtimeMs > maxAge) {
        fs.unlinkSync(filePath);
      }
    }
  } catch {
    // Ignore cleanup errors
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add playground/lib/
git commit -m "feat(playground): add shared types and session management"
```

---

## Task 3: Agent Configurations + Tools

**Files:**
- Create: `playground/lib/tools/research.ts`
- Create: `playground/lib/tools/support.ts`
- Create: `playground/lib/tools/code-review.ts`
- Create: `playground/lib/tools/travel.ts`
- Create: `playground/lib/agents.ts`

- [ ] **Step 1: Create research tools**

```typescript
// playground/lib/tools/research.ts
import { Tool } from 'agent-kit';

export const webSearch = Tool.create({
  name: 'web_search',
  description: 'Search the web for information on a topic',
  parameters: {
    query: { type: 'string', description: 'The search query' },
  },
  execute: async ({ query }) => {
    const encoded = encodeURIComponent(query as string);
    try {
      const response = await fetch(
        `https://api.duckduckgo.com/?q=${encoded}&format=json&no_html=1`,
      );
      const data = await response.json();
      const results: string[] = [];
      if (data.AbstractText) results.push(data.AbstractText);
      if (data.RelatedTopics) {
        for (const topic of data.RelatedTopics.slice(0, 5)) {
          if (topic.Text) results.push(topic.Text);
        }
      }
      return results.length > 0
        ? results.join('\n\n')
        : `No instant results found for "${query}". Try a more specific query.`;
    } catch {
      return `Search temporarily unavailable. Try again.`;
    }
  },
});

export const saveNote = Tool.create({
  name: 'save_note',
  description: 'Save a research note for future reference',
  parameters: {
    title: { type: 'string', description: 'Title of the note' },
    content: { type: 'string', description: 'Content of the note' },
  },
  execute: async ({ title }) => `Note saved: "${title}"`,
});
```

- [ ] **Step 2: Create support tools**

```typescript
// playground/lib/tools/support.ts
import { Tool } from 'agent-kit';

const orders: Record<string, { status: string; item: string; eta: string }> = {
  '1042': { status: 'Shipped', item: 'Wireless Headphones', eta: 'March 26' },
  '1099': { status: 'Processing', item: 'Mechanical Keyboard', eta: 'March 28' },
  '1120': { status: 'Delivered', item: 'USB-C Hub', eta: 'Delivered March 22' },
};

export const lookupOrder = Tool.create({
  name: 'lookup_order',
  description: 'Look up an order by order ID',
  parameters: {
    orderId: { type: 'string', description: 'The order ID to look up' },
  },
  execute: async ({ orderId }) => {
    const order = orders[orderId as string];
    if (!order) return `Order #${orderId} not found. Valid demo orders: 1042, 1099, 1120.`;
    return JSON.stringify({ orderId, ...order });
  },
});
```

- [ ] **Step 3: Create code review tools**

```typescript
// playground/lib/tools/code-review.ts
import { Tool } from 'agent-kit';

export const analyzeCode = Tool.create({
  name: 'analyze_code',
  description: 'Analyze code for security vulnerabilities and style issues',
  parameters: {
    code: { type: 'string', description: 'The code to analyze' },
  },
  execute: async ({ code }) => {
    const issues: string[] = [];
    const codeStr = code as string;
    if (codeStr.includes('eval(')) issues.push('SECURITY: eval() usage detected — potential code injection');
    if (codeStr.includes('innerHTML')) issues.push('SECURITY: innerHTML usage — potential XSS vulnerability');
    if (/password|secret|api_key/i.test(codeStr)) issues.push('SECURITY: Possible hardcoded credential');
    if (codeStr.includes('var ')) issues.push('STYLE: Use const/let instead of var');
    if (codeStr.includes('console.log')) issues.push('STYLE: Remove console.log before production');
    if (issues.length === 0) issues.push('No issues found. Code looks clean.');
    return issues.join('\n');
  },
});
```

- [ ] **Step 4: Create travel tools**

```typescript
// playground/lib/tools/travel.ts
import { Tool } from 'agent-kit';

export const searchDestinations = Tool.create({
  name: 'search_destinations',
  description: 'Search for travel destinations matching criteria',
  parameters: {
    query: { type: 'string', description: 'What kind of trip (e.g., "beach vacation in March")' },
  },
  execute: async ({ query }) => {
    // Canned but realistic results
    const destinations = [
      { name: 'Tokyo, Japan', highlights: 'Cherry blossoms, street food, temples', avgCost: '$150/day' },
      { name: 'Barcelona, Spain', highlights: 'Architecture, beaches, nightlife', avgCost: '$120/day' },
      { name: 'Bali, Indonesia', highlights: 'Temples, rice terraces, surfing', avgCost: '$60/day' },
    ];
    return JSON.stringify(destinations);
  },
});

export const checkWeather = Tool.create({
  name: 'check_weather',
  description: 'Check weather forecast for a destination',
  parameters: {
    destination: { type: 'string', description: 'City or destination name' },
  },
  execute: async ({ destination }) => {
    return `${destination}: 24°C, partly cloudy, 10% chance of rain. Great travel weather.`;
  },
});

export const saveItinerary = Tool.create({
  name: 'save_itinerary',
  description: 'Save a trip itinerary for reference',
  parameters: {
    destination: { type: 'string', description: 'Destination' },
    days: { type: 'string', description: 'Number of days' },
    plan: { type: 'string', description: 'The itinerary plan' },
  },
  execute: async ({ destination }) => `Itinerary for ${destination} saved!`,
});
```

- [ ] **Step 5: Create agent configurations**

```typescript
// playground/lib/agents.ts
import { Agent, Memory } from 'agent-kit';
import { OpenAICompatibleAdapter } from 'agent-kit';
import { webSearch, saveNote } from './tools/research';
import { lookupOrder } from './tools/support';
import { analyzeCode } from './tools/code-review';
import { searchDestinations, checkWeather, saveItinerary } from './tools/travel';
import { getDbPath } from './session';
import type { AgentType } from './types';

function createModel() {
  return new OpenAICompatibleAdapter({
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai',
    model: 'gemini-2.0-flash',
    apiKey: process.env.GOOGLE_AI_API_KEY ?? '',
  });
}

const agentConfigs: Record<AgentType, { tools: any[]; system: string }> = {
  'research-assistant': {
    tools: [webSearch, saveNote],
    system: 'You are a research assistant. Help users find information and save notes for future reference. When you find useful information, offer to save it as a note.',
  },
  'customer-support': {
    tools: [lookupOrder],
    system: 'You are a customer support agent. Help users with order inquiries. Use the lookup_order tool to find order details. Be friendly and helpful. Demo order IDs: 1042, 1099, 1120.',
  },
  'code-reviewer': {
    tools: [analyzeCode],
    system: 'You are a code reviewer. When users paste code, analyze it for security vulnerabilities and style issues using the analyze_code tool. Provide clear, actionable feedback.',
  },
  'travel-planner': {
    tools: [searchDestinations, checkWeather, saveItinerary],
    system: 'You are a travel planner. Help users plan trips by searching destinations, checking weather, and saving itineraries. Be enthusiastic and knowledgeable about travel.',
  },
};

export function createAgent(agentType: AgentType, sessionId: string): Agent {
  const config = agentConfigs[agentType];
  const dbPath = getDbPath(sessionId);
  return new Agent({
    name: agentType,
    model: createModel(),
    memory: new Memory({ store: 'sqlite', path: dbPath }),
    tools: config.tools,
    system: config.system,
  });
}
```

- [ ] **Step 6: Commit**

```bash
git add playground/lib/
git commit -m "feat(playground): add 4 agent configs with tools (research, support, code review, travel)"
```

---

## Task 4: API Routes

**Files:**
- Create: `playground/app/api/session/route.ts`
- Create: `playground/app/api/chat/route.ts`
- Create: `playground/app/api/memory/[id]/route.ts`

- [ ] **Step 1: Create session API route**

```typescript
// playground/app/api/session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSession, getSessionMeta, getSessionByShareCode } from '@/lib/session';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { shareCode } = body as { shareCode?: string };

  // Resume by share code
  if (shareCode) {
    const sessionId = getSessionByShareCode(shareCode);
    if (!sessionId) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    const meta = getSessionMeta(sessionId);
    const cookieStore = await cookies();
    cookieStore.set('__agent_session', sessionId, { httpOnly: true, maxAge: 60 * 60 * 24 * 7 });
    return NextResponse.json(meta);
  }

  // Resume by cookie
  const cookieStore = await cookies();
  const existingId = cookieStore.get('__agent_session')?.value;
  if (existingId) {
    const meta = getSessionMeta(existingId);
    if (meta) return NextResponse.json(meta);
  }

  // Create new session
  const session = createSession();
  cookieStore.set('__agent_session', session.sessionId, { httpOnly: true, maxAge: 60 * 60 * 24 * 7 });
  return NextResponse.json(session);
}
```

- [ ] **Step 2: Create chat API route with SSE streaming**

```typescript
// playground/app/api/chat/route.ts
import { NextRequest } from 'next/server';
import { createAgent } from '@/lib/agents';
import type { AgentType } from '@/lib/types';

export async function POST(request: NextRequest) {
  const { message, agentType, sessionId } = await request.json() as {
    message: string;
    agentType: AgentType;
    sessionId: string;
  };

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const agent = createAgent(agentType, sessionId);

        // Collect events and stream them
        const events: Array<{ type: string; data: Record<string, unknown>; latencyMs?: number }> = [];

        agent.on('*', (event) => {
          const sseData = JSON.stringify({
            kind: 'event',
            event: {
              type: event.type,
              timestamp: event.timestamp,
              agentId: event.agentId,
              data: event.data,
              latencyMs: event.latencyMs,
            },
          });
          controller.enqueue(encoder.encode(`data: ${sseData}\n\n`));
        });

        const result = await agent.chat(message);

        // Send final response
        const responseData = JSON.stringify({
          kind: 'response',
          content: result.content,
        });
        controller.enqueue(encoder.encode(`data: ${responseData}\n\n`));
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (error) {
        const errorData = JSON.stringify({
          kind: 'error',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
        controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

- [ ] **Step 3: Create memory stats API route**

```typescript
// playground/app/api/memory/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDbPath } from '@/lib/session';
import { SQLiteStore } from 'agent-kit';
import fs from 'fs';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: sessionId } = await params;
  const dbPath = getDbPath(sessionId);

  if (!fs.existsSync(dbPath)) {
    return NextResponse.json({ messageCount: 0, summaryCount: 0, tokenEstimate: 0, notes: [] });
  }

  try {
    const store = new SQLiteStore(dbPath);
    // Get counts across all agent types
    const agentTypes = ['research-assistant', 'customer-support', 'code-reviewer', 'travel-planner'];
    let messageCount = 0;
    let summaryCount = 0;
    const notes: Array<{ title: string; content: string }> = [];

    for (const agentId of agentTypes) {
      const messages = await store.getRecentMessages(agentId, 1000);
      messageCount += messages.length;
      const summaries = await store.searchSummaries(agentId, '', 100);
      summaryCount += summaries.length;

      // Extract notes from tool results
      for (const msg of messages) {
        if (msg.role === 'tool' && msg.content.startsWith('Note saved:')) {
          const match = msg.content.match(/Note saved: "(.+)"/);
          if (match) notes.push({ title: match[1], content: '' });
        }
      }
    }

    store.close();

    const tokenEstimate = messageCount * 50; // rough estimate

    return NextResponse.json({ messageCount, summaryCount, tokenEstimate, notes });
  } catch {
    return NextResponse.json({ messageCount: 0, summaryCount: 0, tokenEstimate: 0, notes: [] });
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add playground/app/api/
git commit -m "feat(playground): add API routes for session, chat (SSE), and memory stats"
```

---

## Task 5: UI Components

**Files:**
- Create: `playground/components/TopBar.tsx`
- Create: `playground/components/MessageBubble.tsx`
- Create: `playground/components/ToolCallIndicator.tsx`
- Create: `playground/components/ChatPanel.tsx`
- Create: `playground/components/EventLine.tsx`
- Create: `playground/components/EventsPanel.tsx`
- Create: `playground/components/MemoryPanel.tsx`

This is the largest task. Each component is focused and independent.

- [ ] **Step 1: Create TopBar**

```typescript
// playground/components/TopBar.tsx
'use client';

import { AgentType, AGENT_LABELS } from '@/lib/types';

interface TopBarProps {
  activeAgent: AgentType;
  onAgentChange: (agent: AgentType) => void;
  shareCode: string;
}

const agentTypes: AgentType[] = ['research-assistant', 'customer-support', 'code-reviewer', 'travel-planner'];

export function TopBar({ activeAgent, onAgentChange, shareCode }: TopBarProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 bg-bg-panel border-b border-border-subtle">
      <div className="flex items-center gap-3">
        <span className="text-accent-blue font-bold text-sm">agent-kit</span>
        <span className="text-gray-600 text-xs">playground</span>
      </div>
      <div className="flex items-center gap-1.5">
        {agentTypes.map((type) => (
          <button
            key={type}
            onClick={() => onAgentChange(type)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeAgent === type
                ? 'bg-bg-card border border-border-hover text-accent-purple'
                : 'text-gray-500 hover:text-gray-300 hover:bg-bg-secondary'
            }`}
          >
            {AGENT_LABELS[type].icon} {AGENT_LABELS[type].label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-gray-600 text-xs">Session:</span>
        <span className="text-accent-yellow font-mono text-xs font-bold">{shareCode}</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create MessageBubble and ToolCallIndicator**

```typescript
// playground/components/ToolCallIndicator.tsx
'use client';

import type { ToolCallInfo } from '@/lib/types';

export function ToolCallIndicator({ toolCall }: { toolCall: ToolCallInfo }) {
  return (
    <div className="flex items-center gap-1.5 py-1 animate-fade-in">
      <div className="w-1.5 h-1.5 rounded-full bg-accent-yellow" />
      <span className="text-accent-yellow text-xs font-mono">
        {toolCall.name}({toolCall.arguments})
      </span>
      {toolCall.latencyMs !== undefined && (
        <span className="text-gray-600 text-xs">{toolCall.latencyMs}ms</span>
      )}
    </div>
  );
}
```

```typescript
// playground/components/MessageBubble.tsx
'use client';

import type { ChatMessage } from '@/lib/types';
import { ToolCallIndicator } from './ToolCallIndicator';

interface MessageBubbleProps {
  message: ChatMessage;
  isStreaming?: boolean;
}

export function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className="animate-fade-in">
      {/* Tool calls shown before assistant message */}
      {message.toolCalls?.map((tc, i) => (
        <ToolCallIndicator key={i} toolCall={tc} />
      ))}
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
        <div
          className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
            isUser
              ? 'bg-[#1e3a5f] text-gray-100 rounded-br-sm'
              : 'bg-bg-panel border border-border-subtle text-gray-300 rounded-bl-sm'
          }`}
        >
          <span className={isStreaming ? 'streaming-cursor' : ''}>
            {message.content}
          </span>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create ChatPanel**

```typescript
// playground/components/ChatPanel.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '@/lib/types';
import { MessageBubble } from './MessageBubble';

interface ChatPanelProps {
  messages: ChatMessage[];
  isLoading: boolean;
  streamingMessage: ChatMessage | null;
  onSend: (message: string) => void;
}

export function ChatPanel({ messages, isLoading, streamingMessage, onSend }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, streamingMessage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSend(input.trim());
    setInput('');
  };

  return (
    <div className="flex flex-col h-full border-r border-border-subtle">
      <div className="px-3 py-2 bg-bg-secondary border-b border-border-subtle">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Chat</span>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {streamingMessage && (
          <MessageBubble message={streamingMessage} isStreaming />
        )}
      </div>
      <form onSubmit={handleSubmit} className="p-2.5 bg-bg-secondary border-t border-border-subtle flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything..."
          disabled={isLoading}
          className="flex-1 bg-bg-panel border border-border-hover rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-accent-blue disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 4: Create EventLine and EventsPanel**

```typescript
// playground/components/EventLine.tsx
'use client';

import type { StreamEvent } from '@/lib/types';

const eventColors: Record<string, string> = {
  message: 'text-accent-blue',
  'tool:start': 'text-accent-yellow',
  'tool:end': 'text-accent-green',
  'memory:retrieve': 'text-accent-purple',
  'memory:save': 'text-accent-purple',
  error: 'text-accent-red',
};

export function EventLine({ event }: { event: StreamEvent }) {
  const time = new Date(event.timestamp).toLocaleTimeString('en-US', { hour12: false });
  const color = eventColors[event.type] ?? 'text-gray-500';
  const description = formatEventDescription(event);

  return (
    <div className="px-1.5 py-1 rounded text-[11px] font-mono animate-fade-in bg-bg-secondary">
      <span className="text-gray-600">{time}</span>{' '}
      <span className={color}>{event.type}</span>{' '}
      <span className="text-gray-500">{description}</span>
      {event.latencyMs !== undefined && (
        <span className="text-gray-600"> {event.latencyMs}ms</span>
      )}
    </div>
  );
}

function formatEventDescription(event: StreamEvent): string {
  const d = event.data;
  if (d.name) return String(d.name);
  if (d.content) return String(d.content).substring(0, 40);
  if (d.role) return String(d.role);
  return '';
}
```

```typescript
// playground/components/EventsPanel.tsx
'use client';

import { useRef, useEffect } from 'react';
import type { StreamEvent } from '@/lib/types';
import { EventLine } from './EventLine';

interface EventsPanelProps {
  events: StreamEvent[];
}

export function EventsPanel({ events }: EventsPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [events]);

  return (
    <div className="flex flex-col h-full border-r border-border-subtle">
      <div className="px-3 py-2 bg-bg-secondary border-b border-border-subtle">
        <span className="text-xs font-semibold text-accent-yellow uppercase tracking-wider">Live Events</span>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {events.length === 0 && (
          <div className="text-gray-600 text-xs text-center mt-8">Events appear here as the agent works...</div>
        )}
        {events.map((event, i) => (
          <EventLine key={i} event={event} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create MemoryPanel**

```typescript
// playground/components/MemoryPanel.tsx
'use client';

import type { MemoryStats } from '@/lib/types';
import { useState } from 'react';

interface MemoryPanelProps {
  stats: MemoryStats;
  shareCode: string;
}

export function MemoryPanel({ stats, shareCode }: MemoryPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const url = `${window.location.origin}/s/${shareCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 bg-bg-secondary border-b border-border-subtle">
        <span className="text-xs font-semibold text-accent-green uppercase tracking-wider">Memory</span>
      </div>
      <div className="flex-1 overflow-y-auto p-2.5 space-y-3">
        {/* Stats Row */}
        <div className="flex gap-2">
          <div className="flex-1 bg-bg-panel rounded-md p-2 text-center">
            <div className="text-lg font-bold text-accent-green">{stats.messageCount}</div>
            <div className="text-[10px] text-gray-500">Messages</div>
          </div>
          <div className="flex-1 bg-bg-panel rounded-md p-2 text-center">
            <div className="text-lg font-bold text-accent-yellow">{stats.summaryCount}</div>
            <div className="text-[10px] text-gray-500">Summaries</div>
          </div>
          <div className="flex-1 bg-bg-panel rounded-md p-2 text-center">
            <div className="text-lg font-bold text-accent-blue">{stats.tokenEstimate}</div>
            <div className="text-[10px] text-gray-500">Tokens</div>
          </div>
        </div>

        {/* Notes */}
        {stats.notes.length > 0 && (
          <div>
            <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Saved Notes</div>
            {stats.notes.map((note, i) => (
              <div key={i} className="bg-bg-panel rounded-md p-2 mb-1.5">
                <div className="text-xs font-semibold text-accent-green">{note.title}</div>
                {note.content && <div className="text-[11px] text-gray-500 mt-0.5">{note.content}</div>}
              </div>
            ))}
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Persistence indicator */}
        <div className="bg-[#0a1a0a] border border-[#1a3a1a] rounded-md p-2 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-accent-green" />
          <span className="text-[11px] text-accent-green">Memory persists across sessions</span>
        </div>

        {/* Share */}
        <div className="bg-bg-panel border border-border-subtle rounded-md p-2 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-gray-500">Share this session:</div>
            <div className="text-sm text-accent-yellow font-mono font-bold">{shareCode}</div>
          </div>
          <button
            onClick={handleCopy}
            className="bg-bg-card rounded px-2 py-1 text-[11px] text-accent-blue hover:bg-border-hover transition-colors"
          >
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add playground/components/
git commit -m "feat(playground): add all UI components — ChatPanel, EventsPanel, MemoryPanel, TopBar"
```

---

## Task 6: Main Page — Wire Everything Together

**Files:**
- Modify: `playground/app/page.tsx`

- [ ] **Step 1: Implement the main page with state management and SSE**

```typescript
// playground/app/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { TopBar } from '@/components/TopBar';
import { ChatPanel } from '@/components/ChatPanel';
import { EventsPanel } from '@/components/EventsPanel';
import { MemoryPanel } from '@/components/MemoryPanel';
import type { AgentType, ChatMessage, StreamEvent, MemoryStats, SessionInfo } from '@/lib/types';

export default function Home() {
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [activeAgent, setActiveAgent] = useState<AgentType>('research-assistant');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [events, setEvents] = useState<StreamEvent[]>([]);
  const [memoryStats, setMemoryStats] = useState<MemoryStats>({ messageCount: 0, summaryCount: 0, tokenEstimate: 0, notes: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState<ChatMessage | null>(null);

  // Initialize session
  useEffect(() => {
    fetch('/api/session', { method: 'POST' })
      .then((res) => res.json())
      .then((data) => setSession(data))
      .catch(console.error);
  }, []);

  // Refresh memory stats
  const refreshMemory = useCallback(async () => {
    if (!session) return;
    try {
      const res = await fetch(`/api/memory/${session.sessionId}`);
      const stats = await res.json();
      setMemoryStats(stats);
    } catch {
      // ignore
    }
  }, [session]);

  useEffect(() => {
    refreshMemory();
  }, [refreshMemory, messages]);

  // Send message
  const handleSend = async (text: string) => {
    if (!session || isLoading) return;

    const userMsg: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    const streamMsg: ChatMessage = {
      id: uuidv4(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      toolCalls: [],
    };
    setStreamingMessage(streamMsg);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          agentType: activeAgent,
          sessionId: session.sessionId,
        }),
      });

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);

            if (parsed.kind === 'event') {
              setEvents((prev) => [...prev, parsed.event]);

              // Track tool calls on streaming message
              if (parsed.event.type === 'tool:start') {
                setStreamingMessage((prev) => prev ? {
                  ...prev,
                  toolCalls: [...(prev.toolCalls ?? []), {
                    name: String(parsed.event.data.name ?? parsed.event.data.toolName ?? ''),
                    arguments: '',
                    latencyMs: undefined,
                  }],
                } : prev);
              }
              if (parsed.event.type === 'tool:end') {
                setStreamingMessage((prev) => {
                  if (!prev?.toolCalls?.length) return prev;
                  const updated = [...prev.toolCalls];
                  const last = updated[updated.length - 1];
                  updated[updated.length - 1] = { ...last, latencyMs: parsed.event.latencyMs };
                  return { ...prev, toolCalls: updated };
                });
              }
            }

            if (parsed.kind === 'response') {
              const finalMsg: ChatMessage = {
                ...streamMsg,
                content: parsed.content,
                toolCalls: streamMsg.toolCalls,
              };
              setMessages((prev) => [...prev, finalMsg]);
              setStreamingMessage(null);
            }

            if (parsed.kind === 'error') {
              setStreamingMessage(null);
              const errorMsg: ChatMessage = {
                id: uuidv4(),
                role: 'assistant',
                content: `Error: ${parsed.message}`,
                timestamp: Date.now(),
              };
              setMessages((prev) => [...prev, errorMsg]);
            }
          } catch {
            // ignore parse errors
          }
        }
      }
    } catch (error) {
      setStreamingMessage(null);
      const errorMsg: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: `Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      refreshMemory();
    }
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-accent-blue text-sm">Loading playground...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <TopBar activeAgent={activeAgent} onAgentChange={setActiveAgent} shareCode={session.shareCode} />
      <div className="flex flex-1 overflow-hidden">
        <div className="w-1/2">
          <ChatPanel
            messages={messages}
            isLoading={isLoading}
            streamingMessage={streamingMessage}
            onSend={handleSend}
          />
        </div>
        <div className="w-1/4">
          <EventsPanel events={events} />
        </div>
        <div className="w-1/4">
          <MemoryPanel stats={memoryStats} shareCode={session.shareCode} />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify the playground works locally**

```bash
cd playground && npm run dev
```
Open http://localhost:3000 — should show the full 3-panel layout. Chat won't work without a Gemini API key, but the UI should render.

- [ ] **Step 3: Commit**

```bash
git add playground/app/page.tsx
git commit -m "feat(playground): wire up main page with SSE streaming, state management, 3-panel layout"
```

---

## Task 7: Share Code Redirect

**Files:**
- Create: `playground/app/s/[code]/page.tsx`

- [ ] **Step 1: Create share code redirect page**

```typescript
// playground/app/s/[code]/page.tsx
import { redirect } from 'next/navigation';
import { getSessionByShareCode } from '@/lib/session';
import { cookies } from 'next/headers';

export default async function SharePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const sessionId = getSessionByShareCode(code);

  if (!sessionId) {
    redirect('/');
  }

  const cookieStore = await cookies();
  cookieStore.set('__agent_session', sessionId, { httpOnly: true, maxAge: 60 * 60 * 24 * 7 });
  redirect('/');
}
```

- [ ] **Step 2: Commit**

```bash
git add playground/app/s/
git commit -m "feat(playground): add share code redirect route"
```

---

## Task 8: Dockerfile + Cloud Run Config

**Files:**
- Create: `playground/Dockerfile`
- Create: `playground/.dockerignore`
- Create: `playground/README.md`

- [ ] **Step 1: Create Dockerfile (multi-stage build)**

```dockerfile
# playground/Dockerfile
FROM node:20-slim AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --registry https://registry.npmjs.org
COPY . .
RUN npm run build

FROM node:20-slim AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

# Copy built app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Create data directory for SQLite sessions
RUN mkdir -p /data/sessions

EXPOSE 8080
CMD ["node", "server.js"]
```

- [ ] **Step 2: Create .dockerignore**

```
node_modules
.next
.git
*.md
```

- [ ] **Step 3: Update next.config.ts for standalone output**

```typescript
// playground/next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['better-sqlite3'],
};

export default nextConfig;
```

- [ ] **Step 4: Create README**

```markdown
# agent-kit playground

Live demo of agent-kit — try AI agents in your browser.

## Local Development

\`\`\`bash
npm install
echo "GOOGLE_AI_API_KEY=your-key-here" > .env.local
npm run dev
\`\`\`

## Deploy to Cloud Run

\`\`\`bash
# Build and push
gcloud builds submit --tag gcr.io/PROJECT_ID/agent-kit-playground

# Deploy
gcloud run deploy agent-kit-playground \
  --image gcr.io/PROJECT_ID/agent-kit-playground \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --min-instances 1 \
  --set-env-vars GOOGLE_AI_API_KEY=your-key \
  --execution-environment gen2 \
  --mount type=volume,source=agent-data,target=/data
\`\`\`

## Environment Variables

- `GOOGLE_AI_API_KEY` — API key from [Google AI Studio](https://aistudio.google.com)
- `DATA_DIR` — SQLite session storage (default: `./data/sessions`)
```

- [ ] **Step 5: Commit**

```bash
git add playground/Dockerfile playground/.dockerignore playground/next.config.ts playground/README.md
git commit -m "feat(playground): add Dockerfile, Cloud Run config, and README"
```

---

## Task 9: End-to-End Test + Polish

- [ ] **Step 1: Set up environment variable**

Create `playground/.env.local`:
```
GOOGLE_AI_API_KEY=your-actual-key
```

- [ ] **Step 2: Run dev server and test full flow**

```bash
cd playground && npm run dev
```

Test:
1. Open http://localhost:3000
2. Select "Research Assistant" tab
3. Type "Find papers on Mamba architecture"
4. Verify: tool calls appear in chat and events panel
5. Verify: memory panel updates with message count
6. Switch to "Customer Support" tab
7. Type "Where's my order #1042?"
8. Verify: lookup_order tool fires
9. Copy share code, open in incognito → should see same session
10. Close tab, reopen → should restore session via cookie

- [ ] **Step 3: Run production build**

```bash
cd playground && npm run build
```
Expected: Build succeeds.

- [ ] **Step 4: Fix any issues found during testing**

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat(playground): complete playground with all 4 agents, streaming, memory persistence"
git push
```
