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

YOUR APPROACH:
- If the user mentions a DESTINATION (any city or country), IMMEDIATELY start delegating to your agents. Do not ask more questions — assume reasonable defaults for anything missing (5 days, next month, $3000 budget, departing SFO).
- If the user says something vague like "help me plan a vacation" WITHOUT a destination, ask ONE short question: "Where would you like to go?" — nothing else.
- NEVER ask multiple questions at once. NEVER ask for budget, dates, party size etc. Just get the destination and GO.

Once you have a destination, delegate to ALL 6 agents in order:
1. "🔍 Destination Research Agent" — research the destination
2. "🌤️ Weather Forecast Agent" — check weather
3. "✈️ Flight Booking Agent" — find and book flights
4. "🏨 Hotel Booking Agent" — find and book a hotel
5. "🍽️ Dinner Reservation Agent" — find and book a restaurant
6. "💰 Budget Calculator Agent" — calculate total cost

After all agents report back, compile a final itinerary with all bookings and confirmations. Be concise and well-formatted.`,
  });

  const team = new Team({
    agents: [destinationAgent, weatherAgent, flightAgent, hotelAgent, dinnerAgent, budgetAgent],
    strategy: 'hierarchical',
    manager,
    maxDelegations: 8,
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
