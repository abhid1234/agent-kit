---
id: embeddings
sidebar_position: 3
title: Embeddings
---

# Embeddings

By default, agent-kit retrieves relevant memory summaries using keyword matching. Enabling an embedding adapter switches to semantic (vector) search — finding summaries that are conceptually related to the current query, even if they share no keywords.

## How it works

When `Memory` is configured with an `EmbeddingAdapter`:

1. After summarizing a batch of messages, the summary text is embedded using `adapter.embed()`
2. The embedding vector is stored alongside the summary (via `store.saveEmbedding()`)
3. Before each `agent.chat()`, the current user query is embedded
4. `store.searchByEmbedding()` returns the top-3 summaries by cosine similarity

If the store doesn't implement `saveEmbedding` / `searchByEmbedding`, the embedding adapter is silently ignored and keyword search is used.

## `EmbeddingAdapter` interface

```typescript
interface EmbeddingAdapter {
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
}
```

## `OllamaEmbeddingAdapter`

The built-in adapter calls the Ollama `/api/embed` endpoint.

### Setup

```bash
# Ollama must be running
ollama pull nomic-embed-text
```

### Usage

```typescript
import { Memory, OllamaEmbeddingAdapter } from '@avee1234/agent-kit';

const memory = new Memory({
  store: 'sqlite',
  path: './agent.db',
  embedding: new OllamaEmbeddingAdapter({
    model: 'nomic-embed-text',   // default
    baseURL: 'http://localhost:11434',  // default
  }),
});
```

### Config options

| Field | Type | Default | Description |
|---|---|---|---|
| `model` | `string` | `'nomic-embed-text'` | The Ollama embedding model to use. |
| `baseURL` | `string` | `'http://localhost:11434'` | Ollama server URL. |

Other suitable Ollama embedding models: `mxbai-embed-large`, `bge-m3`.

### Batch embedding

```typescript
const adapter = new OllamaEmbeddingAdapter();

// Single text
const vector = await adapter.embed('TypeScript generics tutorial');

// Multiple texts in one request
const vectors = await adapter.embedBatch([
  'TypeScript generics tutorial',
  'React hooks best practices',
  'Node.js performance tips',
]);
```

## Custom embedding adapter

Implement `EmbeddingAdapter` to use any embedding service:

```typescript
import type { EmbeddingAdapter } from '@avee1234/agent-kit';

class OpenAIEmbeddingAdapter implements EmbeddingAdapter {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model = 'text-embedding-3-small') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async embed(text: string): Promise<number[]> {
    const [vector] = await this.embedBatch([text]);
    return vector;
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ model: this.model, input: texts }),
    });

    const data = await response.json() as { data: { embedding: number[] }[] };
    return data.data.map((d) => d.embedding);
  }
}

// Use it
const memory = new Memory({
  store: 'sqlite',
  embedding: new OpenAIEmbeddingAdapter(process.env.OPENAI_API_KEY!),
});
```

## Store support

Embedding persistence requires the store to implement `saveEmbedding` and `searchByEmbedding`.

| Store | Embedding support |
|---|---|
| `InMemoryStore` (built-in) | Yes — stores vectors in a `Map`, uses cosine similarity |
| `SQLiteStore` (built-in) | Yes — stores vectors as JSON blobs, uses cosine similarity computed in-process |
| Custom `MemoryStore` | Optional — implement both optional methods to enable |

The built-in `SQLiteStore` and `InMemoryStore` both support embeddings out of the box using the `cosineSimilarity` helper in `src/store/cosine.ts`.

## Full example

```typescript
import { Agent, Memory, OllamaEmbeddingAdapter } from '@avee1234/agent-kit';

const agent = new Agent({
  name: 'semantic-agent',
  model: { provider: 'ollama', model: 'llama3.2' },
  memory: new Memory({
    store: 'sqlite',
    path: './semantic-agent.db',
    windowSize: 15,
    summarizeAfter: 20,
    embedding: new OllamaEmbeddingAdapter({
      model: 'nomic-embed-text',
    }),
  }),
  system: 'You are a helpful assistant with excellent long-term memory.',
});

// Chat for a while — memory will summarize and embed automatically
await agent.chat('I work on the payments team at Acme Corp.');
await agent.chat('We use Stripe for processing and PostgreSQL for storage.');
// ... many more exchanges ...

// Later — semantic search will find the payments context even without exact keywords
const response = await agent.chat('What database does our billing system use?');
console.log(response.content);
```
