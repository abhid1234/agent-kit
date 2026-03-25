import { Agent, Memory, OpenAICompatibleAdapter, Tool, Team } from '@avee1234/agent-kit';
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
import type { AgentEvent } from '@avee1234/agent-kit';

function createModel(apiKey: string) {
  return new OpenAICompatibleAdapter({
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai',
    model: 'gemini-2.0-flash',
    apiKey,
  });
}

// Simple agent configs (non-team agents)
const simpleAgentConfigs: Record<string, { tools: Tool[]; system: string }> = {
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

export interface AgentOrTeam {
  type: 'agent' | 'team';
  run: (message: string) => Promise<{ content: string }>;
  on: (type: string, handler: (event: AgentEvent) => void) => void;
}

export function createAgentOrTeam(
  agentType: AgentType,
  sessionId: string,
  apiKey: string,
): AgentOrTeam {
  // Non-travel agents: simple agent
  if (agentType !== 'travel-planner') {
    const config = simpleAgentConfigs[agentType];
    const agent = new Agent({
      name: agentType,
      model: createModel(apiKey),
      memory: new Memory({ store: 'sqlite', path: getDbPath(sessionId) }),
      tools: config.tools,
      system: config.system,
    });
    return {
      type: 'agent',
      run: (message: string) => agent.chat(message),
      on: (type: string, handler: (event: AgentEvent) => void) => agent.on(type, handler),
    };
  }

  // Travel Planner: hierarchical multi-agent team
  const model = createModel(apiKey);
  const dbPath = getDbPath(sessionId);

  const destinationAgent = new Agent({
    name: '🔍 Destination Research Agent',
    model: createModel(apiKey),
    tools: [searchDestinations],
    system:
      "You are a destination research specialist. Search for destinations matching the user's criteria and return detailed options with highlights.",
  });

  const weatherAgent = new Agent({
    name: '🌤️ Weather Forecast Agent',
    model: createModel(apiKey),
    tools: [checkWeather],
    system:
      'You are a weather specialist. Check weather conditions for the destination and travel dates. Provide packing advice based on the forecast.',
  });

  const flightAgent = new Agent({
    name: '✈️ Flight Booking Agent',
    model: createModel(apiKey),
    tools: [searchFlights, bookFlight],
    system:
      'You are a flight booking specialist. Search for flights, compare options, and book the best one. Always search first, then book the recommended option.',
  });

  const hotelAgent = new Agent({
    name: '🏨 Hotel Booking Agent',
    model: createModel(apiKey),
    tools: [searchHotels, bookHotel],
    system:
      'You are a hotel booking specialist. Search for hotels, compare options based on price and rating, and book the best value option.',
  });

  const dinnerAgent = new Agent({
    name: '🍽️ Dinner Reservation Agent',
    model: createModel(apiKey),
    tools: [searchRestaurants, bookRestaurant],
    system:
      "You are a dining specialist. Search for highly-rated restaurants at the destination and book a reservation at the best one. Consider local cuisine and the traveler's preferences.",
  });

  const budgetAgent = new Agent({
    name: '💰 Budget Calculator Agent',
    model: createModel(apiKey),
    tools: [calculateBudget],
    system:
      'You are a budget specialist. Calculate the total trip budget including flights, hotel, food, activities, and transport. Give a clear breakdown.',
  });

  const manager = new Agent({
    name: '🧭 Travel Concierge',
    model: createModel(apiKey),
    memory: new Memory({ store: 'sqlite', path: dbPath }),
    system: `You are an elite travel concierge coordinating a team of 6 specialist agents.

FIRST MESSAGE BEHAVIOR:
- If the user mentions a DESTINATION, IMMEDIATELY delegate to your agents. Assume defaults for missing info (5 days, next month, $3000 budget, departing SFO).
- If no destination given, ask ONE question: "Where would you like to go?"

FOLLOW-UP MESSAGES:
- CRITICAL: Before delegating, check your conversation history. If an agent already completed a task, DO NOT delegate it again.
- If the user asks a question about something already discussed (e.g., "what hotel did you book?"), answer from memory — DO NOT delegate.
- Only delegate when NEW information is needed or a NEW action is requested.

DELEGATION ORDER (first request only):
1. "🔍 Destination Research Agent" — research the destination
2. "🌤️ Weather Forecast Agent" — check weather
3. "✈️ Flight Booking Agent" — search for flights (do NOT book yet)
4. "🏨 Hotel Booking Agent" — search for hotels (do NOT book yet)

After these agents report, present the options and ask: "Would you like me to book these? I'll also need your name for the reservations."

BOOKING (only when user confirms):
- Ask for the user's name BEFORE booking anything
- Then delegate to booking agents with the user's name
- Also offer: "Want me to book a dinner reservation too?"

AVAILABLE AGENTS:
5. "🍽️ Dinner Reservation Agent" — restaurant search and booking
6. "💰 Budget Calculator Agent" — total cost calculation`,
  });

  const team = new Team({
    agents: [destinationAgent, weatherAgent, flightAgent, hotelAgent, dinnerAgent, budgetAgent],
    strategy: 'hierarchical',
    manager,
    maxDelegations: 6,
  });

  // Collect event handlers so we can forward team events
  const handlers: Array<{ type: string; handler: (event: AgentEvent) => void }> = [];

  return {
    type: 'team',
    run: async (message: string) => {
      // Subscribe to team events
      for (const { type, handler } of handlers) {
        team.on(type, handler);
      }
      const result = await team.run(message);
      return { content: result.content };
    },
    on: (type: string, handler: (event: AgentEvent) => void) => {
      handlers.push({ type, handler });
    },
  };
}

// Keep backward compat
export function createAgent(agentType: AgentType, sessionId: string, apiKey: string): Agent {
  const config = simpleAgentConfigs[agentType] ?? simpleAgentConfigs['research-assistant'];
  return new Agent({
    name: agentType,
    model: createModel(apiKey),
    memory: new Memory({ store: 'sqlite', path: getDbPath(sessionId) }),
    tools: config.tools,
    system: config.system,
  });
}
