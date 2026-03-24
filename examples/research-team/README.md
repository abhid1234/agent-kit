# Research Team Example

A CLI demo showing **3 agents collaborating** via the hierarchical strategy to produce a blog post outline.

## What it does

1. A **manager** agent coordinates the team — it decides who does what and in what order.
2. A **researcher** agent uses a `web_search` tool (DuckDuckGo) to find information on the topic.
3. A **writer** agent takes the research findings and produces a structured blog post outline.

The manager delegates sub-tasks using agent-kit's built-in `delegate` tool, so you can see the coordination happen in real time.

## How to run

```bash
npm install
npm start
```

Use a custom topic:

```bash
npm start -- "state space models vs transformers"
```

Default topic: `transformer alternatives in 2024`

## What you'll see

```
Research Team Demo — topic: "transformer alternatives in 2024"

[team] Starting (strategy: hierarchical, agents: 2)
[team] Task: "Research the topic ..."

[manager -> researcher] Delegating: "Search for transformer alternatives..."
[manager -> writer]     Delegating: "Write a blog outline based on..."

[team] Done in 1234ms (2 agent responses)

=== Final Result ===
...

=== Agent Responses ===
[researcher]: ...
[writer]: ...
```

## How it maps to agent-kit concepts

| Concept | Role in this demo |
|---|---|
| `Agent` | manager, researcher, writer |
| `Tool` | `web_search` on the researcher |
| `Team` | orchestrates the 3 agents |
| `strategy: 'hierarchical'` | manager delegates via built-in `delegate` tool |
