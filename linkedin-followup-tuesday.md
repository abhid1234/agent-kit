Yesterday I shared agent-kit — an open-source AI agent framework I built. Today I want to share how the memory system works under the hood.

This was the hardest part to get right.

The problem: most AI agents treat every conversation as brand new. There's no "remember what we talked about last week." I wanted to fix that.

Here's how persistent memory works in agent-kit:

𝗦𝗵𝗼𝗿𝘁-𝘁𝗲𝗿𝗺: The last 20 messages stay in a sliding window. Always in context, always fast.

𝗦𝘂𝗺𝗺𝗮𝗿𝗶𝘇𝗮𝘁𝗶𝗼𝗻: When messages fall out of the window, the agent summarizes them automatically. "User discussed PostgreSQL deployment on Fly.io" — stored as a compressed memory.

𝗟𝗼𝗻𝗴-𝘁𝗲𝗿𝗺: On every new message, the system searches past summaries for relevant context. Keyword matching by default, vector similarity if you add an embedding model.

The whole thing fits behind one line of code:

  new Memory({ store: 'sqlite' })

That's it. The developer doesn't call save() or retrieve(). The Agent handles it invisibly.

The tricky part was deciding what NOT to build:

→ I started with keyword search, not embeddings. For 90% of use cases, substring matching on summaries is fast enough and adds zero dependencies.

→ I used SQLite as the default, not PostgreSQL. Zero config beats production-grade for a first impression.

→ I made memory optional. An agent without memory still works — useful for stateless tasks like code review.

The storage layer is a pluggable interface (MemoryStore). SQLite and PostgreSQL ship built-in. But you can implement your own — Redis, DynamoDB, whatever.

The thing I'm proudest of: you can kill the process, restart it days later, and the agent picks up the conversation naturally. No session tokens, no manual hydration.

If you want to dig into the code:
→ Memory class: ~96 lines
→ SQLiteStore: ~126 lines
→ The whole framework: under 1,000 lines of TypeScript

Sometimes the best architecture is the one that's small enough to read in an afternoon.

Try it: www.abhi-agent-kit.space (link in comments)

#AI #TypeScript #OpenSource #BuildInPublic
