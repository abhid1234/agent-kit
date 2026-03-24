// src/model/ollama-embedding.ts
import type { EmbeddingAdapter } from './embedding-adapter';

export interface OllamaEmbeddingConfig {
  /** Ollama server base URL. Default: http://localhost:11434 */
  baseURL?: string;
  /** Embedding model name. Default: nomic-embed-text */
  model?: string;
}

export class OllamaEmbeddingAdapter implements EmbeddingAdapter {
  private baseURL: string;
  private model: string;

  constructor(config: OllamaEmbeddingConfig = {}) {
    this.baseURL = config.baseURL ?? 'http://localhost:11434';
    this.model = config.model ?? 'nomic-embed-text';
  }

  async embed(text: string): Promise<number[]> {
    const [vector] = await this.request(text);
    return vector;
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    return this.request(texts);
  }

  private async request(input: string | string[]): Promise<number[][]> {
    const response = await fetch(`${this.baseURL}/api/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: this.model, input }),
    });

    if (!response.ok) {
      throw new Error(`Ollama embedding request failed: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as { embeddings: number[][] };
    return data.embeddings;
  }
}
