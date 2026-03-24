# Customer Support Example

A CLI demo showing **2 agents collaborating** via the debate strategy to handle a customer support ticket.

## What it does

1. A **support-agent** receives the customer's message, looks up order data using the `lookup_order` tool, and drafts a response.
2. A **qa-reviewer** reads the draft and reviews it for accuracy, empathy, and clear next steps — then produces a polished final response.

The agents run for 2 debate rounds, then the support-agent synthesizes the final answer incorporating the QA feedback.

## How to run

```bash
npm install
npm start
```

Use a custom customer message:

```bash
npm start -- "My order #1099 arrived damaged. I want a refund."
```

Default message: `I never received my order #1042. It's been 2 weeks — where is it?`

## What you'll see

```
Customer Support Demo (debate strategy: support-agent + qa-reviewer)

[team] Starting (strategy: debate)
[team] Customer message: "I never received my order #1042..."

[team] Round 1/2
  [support-agent] thinking...
  [support-agent] done (843ms)
  [qa-reviewer] thinking...
  [qa-reviewer] done (612ms)

[team] Round 2/2
  ...

[team] Done in 3210ms

=== Final Response to Customer ===
...

=== Draft History ===
[support-agent (round 1)]: ...
[qa-reviewer (round 1)]: ...
```

## How it maps to agent-kit concepts

| Concept | Role in this demo |
|---|---|
| `Agent` | support-agent (with tool), qa-reviewer (no tools) |
| `Tool` | `lookup_order` — returns fake order data |
| `Team` | orchestrates the two agents |
| `strategy: 'debate'` | agents take turns, each seeing the other's output |
| `maxRounds: 2` | limits the back-and-forth to 2 rounds |
