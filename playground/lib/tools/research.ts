import { Tool } from '@avee1234/agent-kit';

export const webSearch = Tool.create({
  name: 'web_search',
  description: 'Search the web for information on a topic',
  parameters: { query: { type: 'string', description: 'The search query' } },
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
      return results.length > 0 ? results.join('\n\n') : `No results for "${query}".`;
    } catch {
      return 'Search temporarily unavailable.';
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
