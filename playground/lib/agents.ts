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
    model: 'gemini-3.0-flash',
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

STEP 1 — GATHER KEY DETAILS (ask these ONE AT A TIME, not all at once):
When the user first mentions travel, ask these questions in order. Wait for each answer before asking the next:
1. "Where would you like to go?" (if not already mentioned)
2. "When are you planning to travel? (dates or month)"
3. "How many days?"
4. "What's your approximate budget?"
5. "How many travelers?"

If the user already provided some of these in their first message, skip those and only ask what's missing. Keep questions SHORT — one line each.

STEP 2 — SEARCH (once you have destination + dates + budget):
Call these tools and present results:
1. search_destinations — research the destination
2. check_weather — weather forecast
3. search_flights — flight options
4. search_hotels — hotel options

Present a summary and ask: "Would you like me to book these? I'll need your full name for the reservations."

STEP 3 — BOOK (only after user confirms + provides name):
- Call book_flight with their name
- Call book_hotel with their name
- Offer: "Want me to find restaurants and calculate your full budget too?"

FOLLOW-UP QUESTIONS:
- Answer from conversation history — do NOT re-call tools unless something new is needed
- If the user asks "what did you book?" — answer from memory

Be concise, enthusiastic, and well-formatted with markdown.`,
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
