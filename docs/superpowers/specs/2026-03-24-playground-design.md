# agent-kit Playground Design Spec

## Overview

A live web playground where anyone can try agent-kit in their browser — no install, no signup. Hosted on Google Cloud Run, powered by Gemini via Google AI Studio.

**Goal:** One URL where anyone can try agent-kit in their browser — chat with an AI agent, see tools fire and memory persist, close the tab, come back, and the agent remembers them.

## Tech Stack

- **Frontend:** Next.js (React) with App Router
- **Backend:** Next.js API routes running agent-kit server-side
- **LLM:** Google AI Studio (Gemini) via OpenAI-compatible chat format
- **Storage:** SQLite (one file per session) on Cloud Run persistent volume
- **Hosting:** Google Cloud Run
- **Streaming:** Server-Sent Events (SSE) for chat responses and live events

---

## UI Layout: Full Dashboard

Three-panel layout with top navigation bar.

### Top Bar
- **Left:** "agent-kit playground" branding
- **Center:** Agent selector tabs — 4 pre-built agents (Research Assistant, Customer Support, Code Reviewer, Travel Planner)
- **Right:** Session code display (e.g., `XK3M9P`)

### Left Panel (50%) — Chat
- Message bubbles: user (right-aligned, blue) and assistant (left-aligned, dark)
- Inline tool call indicators between messages (tool name, args, latency)
- Text input bar with Send button at bottom
- Streaming responses rendered incrementally

### Middle Panel (25%) — Live Events
- Real-time event stream from agent-kit's EventEmitter
- Each event shows: timestamp, color-coded type, description
- Event types: `message` (blue), `tool:start` (yellow), `tool:end` (green), `memory:retrieve` (purple), `memory:save` (purple), `error` (red)
- Auto-scrolls to newest event

### Right Panel (25%) — Memory Inspector
- **Stats row:** Message count, Summary count, Token count
- **Saved Notes:** List of notes the agent has saved via tools
- **Persistence indicator:** Green dot + "Memory persists across sessions"
- **Share section:** Session code + "Copy Link" button

### Design Direction
- Dark theme (#0a0a1a background)
- Sleek, minimal, polished — similar to Vercel/Linear aesthetic
- Monospace font for events panel
- Subtle borders (#1f2937), no heavy chrome
- Color-coded event types for quick scanning

---

## Pre-Built Agents

Four agents, selectable via tabs. Switching tabs changes the agent but memory persists within the session.

### 1. Research Assistant (default)
- **Tools:** `web_search` (DuckDuckGo), `save_note`
- **System prompt:** Research helper that finds information and saves notes
- **Demo flow:** Search for topics → save findings → come back later and ask "what did I research?"

### 2. Customer Support
- **Tools:** `lookup_order` (returns fake order data for IDs 1042, 1099, 1120)
- **System prompt:** Support agent that looks up orders and helps with issues
- **Demo flow:** "Where's my order #1042?" → tool fires → agent responds with order details

### 3. Code Reviewer
- **Tools:** `analyze_code` (returns canned security/style analysis)
- **System prompt:** Code reviewer that finds issues in pasted code
- **Demo flow:** Paste code snippet → agent reviews for security + style issues

### 4. Travel Planner
- **Tools:** `search_destinations`, `check_weather`, `save_itinerary`
- **System prompt:** Trip planner that searches destinations, checks weather, saves plans
- **Demo flow:** "Plan a weekend in Tokyo" → searches → checks weather → saves itinerary

---

## Architecture

### API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/chat` | POST | Send message, returns SSE stream of response chunks + events |
| `/api/session` | POST | Create new session or resume existing (by cookie or share code) |
| `/api/memory/:sessionId` | GET | Get memory stats (message count, summaries, notes) |

### Chat Flow

1. User sends message via frontend
2. Frontend POSTs to `/api/chat` with `{ message, agentType, sessionId }`
3. API route creates/resumes agent-kit Agent with the session's SQLite DB
4. Agent.chat() runs — model calls, tool execution, memory save
5. All AgentEvents are streamed back via SSE as they happen
6. Frontend renders chat response incrementally + updates events panel + refreshes memory stats

### Session Management

- **Auto-session:** First visit → generate UUID → store in `__agent_session` cookie → create `sessions/{uuid}.db` SQLite file
- **Share code:** First 6 chars of session UUID (e.g., `XK3M9P`)
- **Resume by share code:** `GET /s/XK3M9P` → look up full UUID from share code → set cookie → redirect to playground
- **Cleanup:** Sessions older than 7 days auto-deleted

### Storage

- SQLite files stored in `/data/sessions/` on Cloud Run persistent volume
- One file per session: `{sessionId}.db`
- agent-kit's SQLiteStore handles all reads/writes
- Volume persists across Cloud Run instance restarts

---

## Deployment

### Cloud Run Configuration
- **Image:** Docker container with Next.js production build
- **Min instances:** 1 (eliminates cold start for demo)
- **Volume mount:** Persistent disk at `/data` for SQLite files
- **Environment variables:**
  - `GOOGLE_AI_API_KEY` — Gemini API key from Google AI Studio
  - `SESSION_SECRET` — for signing cookies

### Dockerfile
```
FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY .next .next
COPY public public
EXPOSE 8080
CMD ["node_modules/.bin/next", "start", "-p", "8080"]
```

### Domain
- Default Cloud Run URL: `agent-kit-playground-xxxxx.run.app`
- Optional custom domain later

---

## Project Structure

```
playground/
├── app/
│   ├── layout.tsx            # Root layout, dark theme, fonts
│   ├── page.tsx              # Main playground page
│   ├── s/[code]/page.tsx     # Share code redirect
│   └── api/
│       ├── chat/route.ts     # POST — chat + SSE stream
│       ├── session/route.ts  # POST — create/resume session
│       └── memory/[id]/route.ts  # GET — memory stats
├── components/
│   ├── ChatPanel.tsx         # Chat messages + input
│   ├── EventsPanel.tsx       # Live event stream
│   ├── MemoryPanel.tsx       # Memory inspector
│   ├── AgentSelector.tsx     # Tab bar for agent selection
│   ├── MessageBubble.tsx     # Single chat message
│   └── EventLine.tsx         # Single event row
├── lib/
│   ├── agents.ts             # Agent configurations (4 agents with tools)
│   ├── session.ts            # Session management (create, resume, cleanup)
│   └── types.ts              # Shared types
├── public/
│   └── favicon.ico
├── Dockerfile
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.ts
```

---

## Success Criteria

1. Visitor clicks link → playground loads in under 2 seconds
2. First message gets a streamed response with visible tool execution
3. Events panel updates in real-time as agent works
4. Memory panel shows stored messages/notes
5. Close tab → reopen → agent remembers previous conversation
6. Share code lets someone else see your session
7. Switching between 4 agent tabs works without page reload
8. Looks polished and professional (clean theme, smooth animations)
