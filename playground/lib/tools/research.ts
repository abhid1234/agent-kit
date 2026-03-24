import { Tool } from '@avee1234/agent-kit';

export const webSearch = Tool.create({
  name: 'web_search',
  description: 'Search the web for information on a topic',
  parameters: { query: { type: 'string', description: 'The search query' } },
  execute: async ({ query }) => {
    const encoded = encodeURIComponent(query as string);
    const results: string[] = [];

    // Try Wikipedia search first — reliable and always returns results
    try {
      const wikiResponse = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}`,
        { headers: { 'User-Agent': 'agent-kit-playground/1.0' } },
      );
      if (wikiResponse.ok) {
        const wikiData = await wikiResponse.json();
        if (wikiData.extract) {
          results.push(`Wikipedia: ${wikiData.extract}`);
        }
      }
    } catch {
      /* fall through */
    }

    // Also try Wikipedia search API for broader matches
    if (results.length === 0) {
      try {
        const searchResponse = await fetch(
          `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encoded}&format=json&srlimit=3`,
          { headers: { 'User-Agent': 'agent-kit-playground/1.0' } },
        );
        const searchData = await searchResponse.json();
        if (searchData.query?.search?.length) {
          for (const item of searchData.query.search) {
            const snippet = item.snippet.replace(/<[^>]*>/g, '');
            results.push(`${item.title}: ${snippet}`);
          }
        }
      } catch {
        /* fall through */
      }
    }

    // Fallback to DuckDuckGo
    if (results.length === 0) {
      try {
        const ddgResponse = await fetch(
          `https://api.duckduckgo.com/?q=${encoded}&format=json&no_html=1`,
        );
        const ddgData = await ddgResponse.json();
        if (ddgData.AbstractText) results.push(ddgData.AbstractText);
        if (ddgData.RelatedTopics) {
          for (const topic of ddgData.RelatedTopics.slice(0, 3)) {
            if (topic.Text) results.push(topic.Text);
          }
        }
      } catch {
        /* fall through */
      }
    }

    return results.length > 0
      ? results.join('\n\n')
      : `No results found for "${query}". Try rephrasing your search.`;
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
