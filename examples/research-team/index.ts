import { Agent, Team, Tool } from 'agent-kit';

const topic = process.argv[2] ?? 'transformer alternatives in 2024';

// --- Tools ---

const webSearch = Tool.create({
  name: 'web_search',
  description: 'Search DuckDuckGo for information on a topic',
  parameters: {
    query: { type: 'string', description: 'The search query', required: true },
  },
  execute: async (params) => {
    const query = encodeURIComponent(params.query as string);
    const url = `https://api.duckduckgo.com/?q=${query}&format=json&no_redirect=1&no_html=1`;
    try {
      const res = await fetch(url);
      const json = (await res.json()) as {
        AbstractText?: string;
        RelatedTopics?: { Text?: string }[];
      };
      const abstract = json.AbstractText ?? '';
      const related = (json.RelatedTopics ?? [])
        .slice(0, 3)
        .map((t) => t.Text ?? '')
        .filter(Boolean)
        .join(' | ');
      return abstract || related || `No results found for: ${params.query}`;
    } catch {
      return `Search failed for: ${params.query}`;
    }
  },
});

// --- Agents ---

const researcher = new Agent({
  name: 'researcher',
  tools: [webSearch],
  system:
    'You are a research specialist. Use web_search to gather facts and summarize findings clearly.',
});

const writer = new Agent({
  name: 'writer',
  system:
    'You are a technical writer. Given research notes, produce a structured blog post outline with sections and bullet points.',
});

const manager = new Agent({
  name: 'manager',
  system:
    'You are a project manager. Coordinate the team: first delegate research to the researcher, then delegate outline writing to the writer using the research results.',
});

// --- Team ---

const team = new Team({
  agents: [researcher, writer],
  strategy: 'hierarchical',
  manager,
  maxDelegations: 5,
});

// --- Event logging ---

team.on('team:start', (e) => {
  console.log(`\n[team] Starting (strategy: ${e.data.strategy}, agents: ${e.data.agentCount})`);
  console.log(`[team] Task: "${e.data.task}"\n`);
});

team.on('team:delegate', (e) => {
  console.log(`[manager -> ${e.data.agentName}] Delegating: "${e.data.task}"`);
});

team.on('team:end', (e) => {
  console.log(`\n[team] Done in ${e.latencyMs}ms (${e.data.responseCount} agent responses)\n`);
});

// --- Run ---

console.log(`Research Team Demo — topic: "${topic}"`);

const result = await team.run(`Research the topic "${topic}" and produce a blog post outline.`);

console.log('=== Final Result ===\n');
console.log(result.content);

if (result.responses.length > 0) {
  console.log('\n=== Agent Responses ===\n');
  for (const r of result.responses) {
    console.log(`[${r.agent}]:\n${r.content}\n`);
  }
}
