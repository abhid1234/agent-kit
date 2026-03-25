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
    name: '🔍 Destination Research',
    model: createModel(apiKey),
    tools: [searchDestinations],
    system:
      "You are a destination research specialist. Search for destinations matching the user's criteria and return detailed options.",
  });

  const weatherAgent = new Agent({
    name: '🌤️ Weather Check',
    model: createModel(apiKey),
    tools: [checkWeather],
    system:
      'You are a weather specialist. Check weather conditions for the destination and travel dates. Give packing advice.',
  });

  const flightAgent = new Agent({
    name: '✈️ Flight Booking',
    model: createModel(apiKey),
    tools: [searchFlights, bookFlight],
    system:
      'You are a flight booking specialist. Search for flights, compare options, and book the best one. Always search first, then book the recommended option.',
  });

  const hotelAgent = new Agent({
    name: '🏨 Hotel Booking',
    model: createModel(apiKey),
    tools: [searchHotels, bookHotel],
    system:
      'You are a hotel booking specialist. Search for hotels, compare options, and book the best value option. Always search first, then book.',
  });

  const budgetAgent = new Agent({
    name: '💰 Budget Calculator',
    model: createModel(apiKey),
    tools: [calculateBudget],
    system:
      'You are a budget specialist. Calculate the total trip budget based on flights, hotel, food, activities, and transport costs.',
  });

  const manager = new Agent({
    name: '🧭 Travel Manager',
    model: createModel(apiKey),
    memory: new Memory({ store: 'sqlite', path: dbPath }),
    system: `You are a travel planning manager coordinating a team of specialists.
For each trip request, delegate to your team in this order:
1. First, delegate to "🔍 Destination Research" to find destination options
2. Then delegate to "🌤️ Weather Check" to check weather
3. Then delegate to "✈️ Flight Booking" to search and book flights
4. Then delegate to "🏨 Hotel Booking" to search and book a hotel
5. Finally delegate to "💰 Budget Calculator" to calculate the total budget

After all agents report back, compile a beautiful final itinerary with all the details.
Always delegate to at least 3 agents to show the team in action.`,
  });

  const team = new Team({
    agents: [destinationAgent, weatherAgent, flightAgent, hotelAgent, budgetAgent],
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
