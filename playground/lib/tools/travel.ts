import { Tool } from '@avee1234/agent-kit';

// --- Destination Research Agent tools ---
export const searchDestinations = Tool.create({
  name: 'search_destinations',
  description: 'Search for travel destinations matching criteria',
  parameters: { query: { type: 'string', description: 'What kind of trip' } },
  execute: async ({ query }) => {
    await delay(300); // simulate search latency
    const q = String(query).toLowerCase();
    if (q.includes('tokyo') || q.includes('japan')) {
      return JSON.stringify([
        {
          name: 'Tokyo, Japan',
          highlights: 'Cherry blossoms, Shibuya, Tsukiji Market, temples',
          rating: '4.8/5',
        },
        {
          name: 'Kyoto, Japan',
          highlights: 'Traditional temples, geisha district, bamboo forest',
          rating: '4.9/5',
        },
      ]);
    }
    return JSON.stringify([
      {
        name: 'Tokyo, Japan',
        highlights: 'Cherry blossoms, street food, temples',
        rating: '4.8/5',
      },
      { name: 'Barcelona, Spain', highlights: 'Architecture, beaches, nightlife', rating: '4.7/5' },
      { name: 'Bali, Indonesia', highlights: 'Temples, rice terraces, surfing', rating: '4.6/5' },
    ]);
  },
});

// --- Weather Agent tools ---
export const checkWeather = Tool.create({
  name: 'check_weather',
  description: 'Check weather forecast for a destination and time period',
  parameters: {
    destination: { type: 'string', description: 'City name' },
    month: { type: 'string', description: 'Travel month' },
  },
  execute: async ({ destination, month }) => {
    await delay(200);
    const m = String(month || 'April').toLowerCase();
    const d = String(destination);
    if (d.toLowerCase().includes('tokyo')) {
      if (m.includes('apr') || m.includes('spring'))
        return `${d} in April: 15-22°C, cherry blossom season! Occasional rain. Pack layers and an umbrella.`;
      if (m.includes('jul') || m.includes('aug') || m.includes('summer'))
        return `${d} in summer: 28-35°C, hot and humid. Bring light clothing and stay hydrated.`;
      return `${d}: 20°C average, pleasant weather. Good time to visit.`;
    }
    return `${d}: 24°C, partly cloudy, 10% rain. Great travel weather.`;
  },
});

// --- Flight Booking Agent tools ---
export const searchFlights = Tool.create({
  name: 'search_flights',
  description: 'Search for available flights to a destination',
  parameters: {
    destination: { type: 'string', description: 'Destination city' },
    departDate: { type: 'string', description: 'Departure date' },
    returnDate: { type: 'string', description: 'Return date' },
  },
  execute: async ({ destination, departDate, returnDate }) => {
    await delay(500); // simulate API call
    return JSON.stringify({
      flights: [
        {
          airline: 'ANA',
          route: 'SFO → NRT',
          depart: departDate || 'Apr 10',
          return: returnDate || 'Apr 15',
          price: '$890',
          duration: '11h 15m',
          stops: 'Direct',
        },
        {
          airline: 'JAL',
          route: 'SFO → HND',
          depart: departDate || 'Apr 10',
          return: returnDate || 'Apr 15',
          price: '$920',
          duration: '11h 30m',
          stops: 'Direct',
        },
        {
          airline: 'United',
          route: 'SFO → NRT',
          depart: departDate || 'Apr 10',
          return: returnDate || 'Apr 15',
          price: '$750',
          duration: '13h 45m',
          stops: '1 stop',
        },
      ],
      recommendation: 'ANA direct flight offers the best balance of price and convenience.',
    });
  },
});

export const bookFlight = Tool.create({
  name: 'book_flight',
  description: 'Book a flight (simulation)',
  parameters: {
    airline: { type: 'string', description: 'Airline name' },
    price: { type: 'string', description: 'Flight price' },
  },
  execute: async ({ airline, price }) => {
    await delay(400);
    return `✅ Flight booked! ${airline} — Confirmation #TK${Math.floor(Math.random() * 90000 + 10000)}. Total: ${price}`;
  },
});

// --- Hotel Booking Agent tools ---
export const searchHotels = Tool.create({
  name: 'search_hotels',
  description: 'Search for hotels at a destination',
  parameters: {
    destination: { type: 'string', description: 'Destination city' },
    checkIn: { type: 'string', description: 'Check-in date' },
    checkOut: { type: 'string', description: 'Check-out date' },
  },
  execute: async ({ destination }) => {
    await delay(400);
    return JSON.stringify({
      hotels: [
        {
          name: 'Park Hyatt Tokyo',
          area: 'Shinjuku',
          price: '$350/night',
          rating: '4.9/5',
          highlight: 'Lost in Translation vibes, stunning views',
        },
        {
          name: 'Aman Tokyo',
          area: 'Otemachi',
          price: '$800/night',
          rating: '5.0/5',
          highlight: 'Ultra-luxury, zen design',
        },
        {
          name: 'MUJI Hotel Ginza',
          area: 'Ginza',
          price: '$180/night',
          rating: '4.5/5',
          highlight: 'Minimalist, great location, MUJI aesthetic',
        },
        {
          name: 'Hoshinoya Tokyo',
          area: 'Otemachi',
          price: '$450/night',
          rating: '4.8/5',
          highlight: 'Traditional ryokan experience in the city',
        },
      ],
      recommendation: `MUJI Hotel Ginza offers the best value in ${destination}.`,
    });
  },
});

export const bookHotel = Tool.create({
  name: 'book_hotel',
  description: 'Book a hotel (simulation)',
  parameters: {
    hotel: { type: 'string', description: 'Hotel name' },
    nights: { type: 'string', description: 'Number of nights' },
    pricePerNight: { type: 'string', description: 'Price per night' },
  },
  execute: async ({ hotel, nights, pricePerNight }) => {
    await delay(300);
    const n = parseInt(String(nights)) || 5;
    const p = parseInt(String(pricePerNight).replace(/[^0-9]/g, '')) || 180;
    return `✅ Hotel booked! ${hotel} — ${n} nights. Confirmation #HT${Math.floor(Math.random() * 90000 + 10000)}. Total: $${n * p}`;
  },
});

// --- Budget Agent tools ---
export const calculateBudget = Tool.create({
  name: 'calculate_budget',
  description: 'Calculate total trip budget including flights, hotel, food, activities',
  parameters: {
    destination: { type: 'string', description: 'Destination' },
    days: { type: 'string', description: 'Number of days' },
    flightCost: { type: 'string', description: 'Flight cost' },
    hotelCostPerNight: { type: 'string', description: 'Hotel cost per night' },
  },
  execute: async ({ destination, days, flightCost, hotelCostPerNight }) => {
    await delay(200);
    const d = parseInt(String(days)) || 5;
    const flight = parseInt(String(flightCost).replace(/[^0-9]/g, '')) || 890;
    const hotel = parseInt(String(hotelCostPerNight).replace(/[^0-9]/g, '')) || 180;
    const food = d * 80;
    const activities = d * 50;
    const transport = d * 15;
    const total = flight + hotel * d + food + activities + transport;
    return JSON.stringify({
      destination,
      days: d,
      breakdown: {
        flights: `$${flight}`,
        hotel: `$${hotel * d} ($${hotel}/night × ${d} nights)`,
        food: `$${food} ($80/day)`,
        activities: `$${activities} ($50/day)`,
        localTransport: `$${transport} ($15/day)`,
      },
      total: `$${total}`,
      perDay: `$${Math.round(total / d)}/day`,
    });
  },
});

// --- Itinerary Agent tools ---
export const saveItinerary = Tool.create({
  name: 'save_itinerary',
  description: 'Save the final trip itinerary',
  parameters: {
    destination: { type: 'string', description: 'Destination' },
    days: { type: 'string', description: 'Number of days' },
    plan: { type: 'string', description: 'The itinerary summary' },
  },
  execute: async ({ destination }) => {
    await delay(100);
    return `✅ Itinerary for ${destination} saved to your memory! Come back anytime to review it.`;
  },
});

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
