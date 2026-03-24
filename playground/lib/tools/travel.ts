import { Tool } from '@avee1234/agent-kit';

export const searchDestinations = Tool.create({
  name: 'search_destinations',
  description: 'Search for travel destinations',
  parameters: { query: { type: 'string', description: 'What kind of trip' } },
  execute: async () =>
    JSON.stringify([
      {
        name: 'Tokyo, Japan',
        highlights: 'Cherry blossoms, street food, temples',
        avgCost: '$150/day',
      },
      {
        name: 'Barcelona, Spain',
        highlights: 'Architecture, beaches, nightlife',
        avgCost: '$120/day',
      },
      {
        name: 'Bali, Indonesia',
        highlights: 'Temples, rice terraces, surfing',
        avgCost: '$60/day',
      },
    ]),
});

export const checkWeather = Tool.create({
  name: 'check_weather',
  description: 'Check weather for a destination',
  parameters: { destination: { type: 'string', description: 'City name' } },
  execute: async ({ destination }) =>
    `${destination}: 24°C, partly cloudy, 10% rain. Great travel weather.`,
});

export const saveItinerary = Tool.create({
  name: 'save_itinerary',
  description: 'Save a trip itinerary',
  parameters: {
    destination: { type: 'string', description: 'Destination' },
    days: { type: 'string', description: 'Number of days' },
    plan: { type: 'string', description: 'The itinerary' },
  },
  execute: async ({ destination }) => `Itinerary for ${destination} saved!`,
});
