import { Tool } from '@avee1234/agent-kit';

export const webSearch = Tool.create({
  name: 'web_search',
  description: 'Search the web for information on a topic',
  parameters: { query: { type: 'string', description: 'The search query' } },
  execute: async ({ query }) => {
    const encoded = encodeURIComponent(query as string);

    // Brave Search API — real web results
    const braveKey = process.env.BRAVE_SEARCH_API_KEY;
    if (braveKey) {
      try {
        const response = await fetch(
          `https://api.search.brave.com/res/v1/web/search?q=${encoded}&count=5`,
          { headers: { 'X-Subscription-Token': braveKey, Accept: 'application/json' } },
        );
        if (response.ok) {
          const data = await response.json();
          const results: string[] = [];
          if (data.web?.results) {
            for (const r of data.web.results.slice(0, 5)) {
              results.push(`${r.title}: ${r.description}`);
            }
          }
          if (results.length > 0) return results.join('\n\n');
        }
      } catch {
        /* fall through to Wikipedia */
      }
    }

    // Fallback: Wikipedia
    try {
      const wikiResponse = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}`,
        { headers: { 'User-Agent': 'agent-kit-playground/1.0' } },
      );
      if (wikiResponse.ok) {
        const wikiData = await wikiResponse.json();
        if (wikiData.extract) return `Wikipedia: ${wikiData.extract}`;
      }

      const searchResponse = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encoded}&format=json&srlimit=3`,
        { headers: { 'User-Agent': 'agent-kit-playground/1.0' } },
      );
      const searchData = await searchResponse.json();
      if (searchData.query?.search?.length) {
        return searchData.query.search
          .map(
            (item: { title: string; snippet: string }) =>
              `${item.title}: ${item.snippet.replace(/<[^>]*>/g, '')}`,
          )
          .join('\n\n');
      }
    } catch {
      /* fall through */
    }

    return `No results found for "${query}". Try rephrasing your search.`;
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
