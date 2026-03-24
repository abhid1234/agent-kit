# Research Assistant Example

A CLI agent that searches the web, saves notes, and remembers your research across sessions.

## Quick Start

```bash
npm install
npm start
```

## Try It

```
> Find recent papers on transformer alternatives
> What did I research last time?
> Save a note about Mamba architecture
```

The agent persists memory to `research.db`. Kill the process and restart — it remembers.

## How It Works

- **Agent** orchestrates the conversation
- **web_search** tool queries DuckDuckGo (no API key needed)
- **save_note** tool structures findings for memory
- **Memory** (SQLite) persists everything across sessions

The entire example is under 100 lines of code.
