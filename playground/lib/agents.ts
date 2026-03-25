import { Agent, Memory, OpenAICompatibleAdapter, Tool } from '@avee1234/agent-kit';
import { webSearch, saveNote } from './tools/research';
import { lookupOrder } from './tools/support';
import { analyzeCode } from './tools/code-review';
import { searchDestinations, checkWeather, saveItinerary } from './tools/travel';
import { getDbPath } from './session';
import type { AgentType } from './types';

function createModel(apiKey: string) {
  return new OpenAICompatibleAdapter({
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai',
    model: 'gemini-2.0-flash',
    apiKey,
  });
}

const agentConfigs: Record<AgentType, { tools: Tool[]; system: string }> = {
  'research-assistant': {
    tools: [webSearch, saveNote],
    system:
      'You are a research assistant. Help users find information and save notes. When you find useful information, offer to save it.',
  },
  'customer-support': {
    tools: [lookupOrder],
    system:
      'You are a customer support agent. Help with order inquiries using lookup_order. Be friendly. Demo order IDs: 1042, 1099, 1120.',
  },
  'code-reviewer': {
    tools: [analyzeCode],
    system:
      'You are a code reviewer. When users paste code, analyze it for security and style issues using analyze_code. Give clear feedback.',
  },
  'travel-planner': {
    tools: [searchDestinations, checkWeather, saveItinerary],
    system:
      'You are a travel planner. Help plan trips by searching destinations, checking weather, and saving itineraries. Be enthusiastic.',
  },
};

export function createAgent(agentType: AgentType, sessionId: string, apiKey: string): Agent {
  const config = agentConfigs[agentType];
  return new Agent({
    name: agentType,
    model: createModel(apiKey),
    memory: new Memory({ store: 'sqlite', path: getDbPath(sessionId) }),
    tools: config.tools,
    system: config.system,
  });
}
