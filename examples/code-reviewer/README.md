# Code Reviewer Example

A CLI demo showing **2 agents running in parallel** to review code from different perspectives simultaneously.

## What it does

1. A **security-reviewer** analyzes the code for vulnerabilities: SQL injection, hardcoded secrets, use of `eval`, exposed sensitive data, and insecure defaults.
2. A **style-reviewer** analyzes the code for quality issues: naming conventions, `var` vs `let`/`const`, error handling, readability, and best practices.

Both agents receive the same code and run concurrently — you get two independent reviews faster than running them sequentially.

## How to run

```bash
npm install
npm start
```

Review a specific file:

```bash
npm start -- path/to/your/file.js
```

If no file is provided, a built-in example snippet with intentional issues is used.

## What you'll see

```
Code Reviewer Demo (parallel strategy: security + style)

[team] Starting (strategy: parallel, agents: 2)
[team] Reviewing: (built-in example snippet)

  [security-reviewer] analyzing...
  [style-reviewer] analyzing...
  [security-reviewer] done (891ms)
  [style-reviewer] done (934ms)

[team] Done in 941ms

=== Code Review Results ===

--- SECURITY-REVIEWER ---
...

--- STYLE-REVIEWER ---
...
```

## How it maps to agent-kit concepts

| Concept | Role in this demo |
|---|---|
| `Agent` | security-reviewer, style-reviewer |
| `Team` | orchestrates the two agents |
| `strategy: 'parallel'` | both agents analyze the code at the same time |
