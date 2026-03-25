import { Agent, Memory, OpenAICompatibleAdapter, Tool } from '@avee1234/agent-kit';
import { webSearch, saveNote } from './tools/research';
import { lookupOrder } from './tools/support';
import { analyzeCode } from './tools/code-review';
import {
  searchDestinations,
  checkWeather,
  searchFlights,
  bookFlight,
  searchHotels,
  bookHotel,
  searchRestaurants,
  bookRestaurant,
  calculateBudget,
  saveItinerary,
} from './tools/travel';
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
  'travel-planner': {
    tools: [
      searchDestinations,
      checkWeather,
      searchFlights,
      bookFlight,
      searchHotels,
      bookHotel,
      searchRestaurants,
      bookRestaurant,
      calculateBudget,
      saveItinerary,
    ],
    system: `You are an elite travel concierge with access to powerful tools.

WHEN THE USER MENTIONS A DESTINATION:
1. Immediately call search_destinations to research it
2. Call check_weather for the weather forecast
3. Call search_flights to find flight options
4. Call search_hotels to find hotel options
5. Present a summary with all results

Use reasonable defaults if not specified: 5 days, next month, departing SFO, $3000 budget.

WHEN THE USER WANTS TO BOOK:
- Ask for their full name FIRST before calling any booking tool
- Then call book_flight, book_hotel, or book_restaurant with their name
- Offer to also search restaurants and calculate the total budget

FOLLOW-UP QUESTIONS:
- Answer from your conversation history — do NOT re-call tools unless the user asks for something new
- If the user asks "what did you book?" — answer from memory

Be concise, well-formatted, and enthusiastic about travel.`,
  },
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
