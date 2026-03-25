import { Tool } from '@avee1234/agent-kit';

// --- City data bank ---
interface CityData {
  highlights: string;
  rating: string;
  weather: Record<string, string>;
  airports: { code: string; name: string }[];
  airlines: { name: string; price: number; duration: string; stops: string }[];
  hotels: { name: string; area: string; price: number; rating: string; highlight: string }[];
  dailyCosts: { food: number; activities: number; transport: number };
}

const cities: Record<string, CityData> = {
  tokyo: {
    highlights: 'Cherry blossoms, Shibuya, Tsukiji Market, temples, anime culture',
    rating: '4.8/5',
    weather: {
      spring: '15-22°C, cherry blossom season! Occasional rain. Pack layers.',
      summer: '28-35°C, hot and humid. Light clothing, stay hydrated.',
      fall: '15-25°C, beautiful autumn colors. Comfortable weather.',
      winter: '2-10°C, cold and dry. Good for hot springs.',
    },
    airports: [
      { code: 'NRT', name: 'Narita' },
      { code: 'HND', name: 'Haneda' },
    ],
    airlines: [
      { name: 'ANA', price: 890, duration: '11h 15m', stops: 'Direct' },
      { name: 'JAL', price: 920, duration: '11h 30m', stops: 'Direct' },
      { name: 'United', price: 750, duration: '13h 45m', stops: '1 stop' },
    ],
    hotels: [
      {
        name: 'Park Hyatt Tokyo',
        area: 'Shinjuku',
        price: 350,
        rating: '4.9/5',
        highlight: 'Lost in Translation vibes, stunning views',
      },
      {
        name: 'Aman Tokyo',
        area: 'Otemachi',
        price: 800,
        rating: '5.0/5',
        highlight: 'Ultra-luxury, zen design',
      },
      {
        name: 'MUJI Hotel Ginza',
        area: 'Ginza',
        price: 180,
        rating: '4.5/5',
        highlight: 'Minimalist, great location',
      },
      {
        name: 'Hoshinoya Tokyo',
        area: 'Otemachi',
        price: 450,
        rating: '4.8/5',
        highlight: 'Traditional ryokan experience',
      },
    ],
    dailyCosts: { food: 80, activities: 50, transport: 15 },
  },
  paris: {
    highlights: 'Eiffel Tower, Louvre, Seine River, cafés, art, fashion',
    rating: '4.7/5',
    weather: {
      spring: '10-18°C, mild and pleasant. Flowers blooming. Light jacket.',
      summer: '18-28°C, warm and sunny. Peak tourist season.',
      fall: '10-18°C, beautiful colors along the Seine. Layers recommended.',
      winter: '2-8°C, chilly but magical. Christmas markets.',
    },
    airports: [
      { code: 'CDG', name: 'Charles de Gaulle' },
      { code: 'ORY', name: 'Orly' },
    ],
    airlines: [
      { name: 'Air France', price: 680, duration: '10h 45m', stops: 'Direct' },
      { name: 'Delta', price: 720, duration: '11h', stops: 'Direct' },
      { name: 'Norwegian', price: 450, duration: '14h 20m', stops: '1 stop' },
    ],
    hotels: [
      {
        name: 'Le Marais Boutique',
        area: 'Le Marais',
        price: 220,
        rating: '4.6/5',
        highlight: 'Charming, central, historic district',
      },
      {
        name: 'Hôtel Plaza Athénée',
        area: 'Champs-Élysées',
        price: 900,
        rating: '5.0/5',
        highlight: 'Iconic luxury, Eiffel Tower views',
      },
      {
        name: 'Mama Shelter Paris',
        area: 'Belleville',
        price: 130,
        rating: '4.3/5',
        highlight: 'Trendy, rooftop bar, great value',
      },
      {
        name: 'Le Pavillon de la Reine',
        area: 'Place des Vosges',
        price: 380,
        rating: '4.8/5',
        highlight: 'Hidden gem, romantic courtyard',
      },
    ],
    dailyCosts: { food: 70, activities: 45, transport: 12 },
  },
  barcelona: {
    highlights: 'Sagrada Familia, beaches, Gaudí architecture, tapas, nightlife',
    rating: '4.7/5',
    weather: {
      spring: '14-20°C, pleasant. Perfect for sightseeing.',
      summer: '24-32°C, hot and sunny. Beach weather!',
      fall: '16-24°C, warm and less crowded. Great time to visit.',
      winter: '8-14°C, mild. Fewer tourists.',
    },
    airports: [{ code: 'BCN', name: 'El Prat' }],
    airlines: [
      { name: 'Iberia', price: 580, duration: '11h 30m', stops: 'Direct' },
      { name: 'Vueling', price: 420, duration: '14h', stops: '1 stop' },
      { name: 'Delta', price: 650, duration: '10h 45m', stops: 'Direct' },
    ],
    hotels: [
      {
        name: 'Hotel Arts Barcelona',
        area: 'Barceloneta',
        price: 320,
        rating: '4.8/5',
        highlight: 'Beachfront luxury, Frank Gehry fish',
      },
      {
        name: 'Casa Camper',
        area: 'El Raval',
        price: 180,
        rating: '4.5/5',
        highlight: 'Quirky design, rooftop terrace',
      },
      {
        name: 'Yurbban Ramblas',
        area: 'Las Ramblas',
        price: 140,
        rating: '4.4/5',
        highlight: 'Rooftop pool, central location',
      },
      {
        name: 'El Palace Barcelona',
        area: 'Eixample',
        price: 400,
        rating: '4.9/5',
        highlight: 'Grand luxury, historic palace',
      },
    ],
    dailyCosts: { food: 55, activities: 35, transport: 10 },
  },
  bali: {
    highlights: 'Temples, rice terraces, surfing, yoga, waterfalls',
    rating: '4.6/5',
    weather: {
      spring: '27-33°C, transition to dry season. Good time.',
      summer: '26-30°C, dry season. Perfect weather.',
      fall: '27-33°C, still dry. Great for outdoor activities.',
      winter: '27-33°C, wet season. Afternoon showers but lush greenery.',
    },
    airports: [{ code: 'DPS', name: 'Ngurah Rai' }],
    airlines: [
      { name: 'Singapore Airlines', price: 850, duration: '18h', stops: '1 stop' },
      { name: 'Cathay Pacific', price: 780, duration: '19h 30m', stops: '1 stop' },
      { name: 'ANA', price: 920, duration: '17h', stops: '1 stop' },
    ],
    hotels: [
      {
        name: 'Four Seasons Ubud',
        area: 'Ubud',
        price: 550,
        rating: '5.0/5',
        highlight: 'Jungle luxury, infinity pool over valley',
      },
      {
        name: 'The Mulia',
        area: 'Nusa Dua',
        price: 300,
        rating: '4.8/5',
        highlight: 'Beachfront resort, stunning pools',
      },
      {
        name: 'Komaneka Bisma',
        area: 'Ubud',
        price: 120,
        rating: '4.5/5',
        highlight: 'Boutique, rice terrace views',
      },
      {
        name: 'W Bali Seminyak',
        area: 'Seminyak',
        price: 280,
        rating: '4.7/5',
        highlight: 'Trendy beach club vibes',
      },
    ],
    dailyCosts: { food: 25, activities: 20, transport: 8 },
  },
  london: {
    highlights: 'Big Ben, British Museum, West End, pubs, royal palaces',
    rating: '4.7/5',
    weather: {
      spring: '8-15°C, mild with rain. Umbrella essential.',
      summer: '15-25°C, pleasant. Long days, parks in bloom.',
      fall: '8-15°C, crisp. Beautiful parks.',
      winter: '3-8°C, cold and grey. Festive season.',
    },
    airports: [
      { code: 'LHR', name: 'Heathrow' },
      { code: 'LGW', name: 'Gatwick' },
    ],
    airlines: [
      { name: 'British Airways', price: 620, duration: '10h 30m', stops: 'Direct' },
      { name: 'Virgin Atlantic', price: 580, duration: '10h 45m', stops: 'Direct' },
      { name: 'Norwegian', price: 400, duration: '13h', stops: '1 stop' },
    ],
    hotels: [
      {
        name: 'The Ned',
        area: 'City of London',
        price: 350,
        rating: '4.8/5',
        highlight: 'Rooftop pool, former bank building',
      },
      {
        name: 'citizenM Tower of London',
        area: 'Tower Hill',
        price: 150,
        rating: '4.4/5',
        highlight: 'Modern, tech-forward, great value',
      },
      {
        name: 'The Savoy',
        area: 'Strand',
        price: 700,
        rating: '5.0/5',
        highlight: 'Iconic luxury since 1889',
      },
      {
        name: 'Hoxton Shoreditch',
        area: 'Shoreditch',
        price: 160,
        rating: '4.5/5',
        highlight: 'Trendy, great neighborhood',
      },
    ],
    dailyCosts: { food: 65, activities: 40, transport: 18 },
  },
  'new york': {
    highlights: 'Times Square, Central Park, Statue of Liberty, Broadway, pizza',
    rating: '4.6/5',
    weather: {
      spring: '10-20°C, pleasant. Cherry blossoms in Central Park.',
      summer: '25-35°C, hot and humid. Rooftop bar season.',
      fall: '10-22°C, beautiful foliage. Best time to visit.',
      winter: '-2-5°C, cold. Holiday decorations, ice skating.',
    },
    airports: [
      { code: 'JFK', name: 'JFK' },
      { code: 'EWR', name: 'Newark' },
    ],
    airlines: [
      { name: 'JetBlue', price: 280, duration: '5h 30m', stops: 'Direct' },
      { name: 'United', price: 320, duration: '5h 45m', stops: 'Direct' },
      { name: 'Delta', price: 350, duration: '5h 30m', stops: 'Direct' },
    ],
    hotels: [
      {
        name: 'The Standard High Line',
        area: 'Meatpacking',
        price: 350,
        rating: '4.6/5',
        highlight: 'Iconic design, High Line views',
      },
      {
        name: 'Pod 51',
        area: 'Midtown',
        price: 120,
        rating: '4.2/5',
        highlight: 'Compact, central, great value',
      },
      {
        name: 'The Plaza',
        area: 'Central Park',
        price: 800,
        rating: '4.9/5',
        highlight: 'Legendary luxury',
      },
      {
        name: 'Arlo NoMad',
        area: 'NoMad',
        price: 200,
        rating: '4.5/5',
        highlight: 'Rooftop bar, trendy area',
      },
    ],
    dailyCosts: { food: 75, activities: 50, transport: 15 },
  },
};

function findCity(query: string): { key: string; data: CityData } | null {
  const q = query.toLowerCase();
  for (const [key, data] of Object.entries(cities)) {
    if (q.includes(key)) return { key, data };
  }
  return null;
}

function getSeason(month: string): string {
  const m = month.toLowerCase();
  if (['mar', 'apr', 'may', 'spring'].some((s) => m.includes(s))) return 'spring';
  if (['jun', 'jul', 'aug', 'summer'].some((s) => m.includes(s))) return 'summer';
  if (['sep', 'oct', 'nov', 'fall', 'autumn'].some((s) => m.includes(s))) return 'fall';
  return 'winter';
}

// --- Destination Research ---
export const searchDestinations = Tool.create({
  name: 'search_destinations',
  description: 'Search for travel destinations matching criteria',
  parameters: { query: { type: 'string', description: 'What kind of trip or destination' } },
  execute: async ({ query }) => {
    await delay(300);
    const match = findCity(String(query));
    if (match) {
      return JSON.stringify([
        {
          name: capitalize(match.key),
          highlights: match.data.highlights,
          rating: match.data.rating,
        },
      ]);
    }
    // Return top 3 cities if no specific match
    return JSON.stringify(
      Object.entries(cities)
        .slice(0, 3)
        .map(([key, data]) => ({
          name: capitalize(key),
          highlights: data.highlights,
          rating: data.rating,
        })),
    );
  },
});

// --- Weather ---
export const checkWeather = Tool.create({
  name: 'check_weather',
  description: 'Check weather forecast for a destination and time period',
  parameters: {
    destination: { type: 'string', description: 'City name' },
    month: { type: 'string', description: 'Travel month or season' },
  },
  execute: async ({ destination, month }) => {
    await delay(200);
    const dest = String(destination);
    const match = findCity(dest);
    const season = getSeason(String(month || 'spring'));
    if (match) {
      return `${dest}: ${match.data.weather[season]}`;
    }
    return `${dest}: 22°C average, pleasant weather. Good time to visit.`;
  },
});

// --- Flights ---
export const searchFlights = Tool.create({
  name: 'search_flights',
  description: 'Search for available flights to a destination',
  parameters: {
    destination: { type: 'string', description: 'Destination city' },
    departDate: { type: 'string', description: 'Departure date' },
    returnDate: { type: 'string', description: 'Return date' },
  },
  execute: async ({ destination, departDate, returnDate }) => {
    await delay(500);
    const dest = String(destination);
    const match = findCity(dest);
    const airport = match ? match.data.airports[0].code : 'INT';
    const airlines = match?.data.airlines ?? [
      { name: 'United', price: 600, duration: '10h', stops: 'Direct' },
      { name: 'Delta', price: 650, duration: '11h', stops: 'Direct' },
      { name: 'Budget Air', price: 420, duration: '14h', stops: '1 stop' },
    ];
    return JSON.stringify({
      flights: airlines.map((a) => ({
        airline: a.name,
        route: `SFO → ${airport}`,
        depart: departDate || 'TBD',
        return: returnDate || 'TBD',
        price: `$${a.price}`,
        duration: a.duration,
        stops: a.stops,
      })),
      recommendation: `${airlines[0].name} offers the best balance of price and convenience.`,
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

// --- Hotels ---
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
    const dest = String(destination);
    const match = findCity(dest);
    const hotels = match?.data.hotels ?? [
      {
        name: 'City Center Hotel',
        area: 'Downtown',
        price: 180,
        rating: '4.5/5',
        highlight: 'Central location, modern rooms',
      },
      {
        name: 'Boutique Inn',
        area: 'Old Town',
        price: 130,
        rating: '4.3/5',
        highlight: 'Charming, local character',
      },
      {
        name: 'Grand Palace Hotel',
        area: 'City Center',
        price: 350,
        rating: '4.8/5',
        highlight: 'Luxury, full-service spa',
      },
    ];
    return JSON.stringify({
      hotels: hotels.map((h) => ({
        name: h.name,
        area: h.area,
        price: `$${h.price}/night`,
        rating: h.rating,
        highlight: h.highlight,
      })),
      recommendation: `${hotels.sort((a, b) => a.price - b.price)[1]?.name || hotels[0].name} offers the best value in ${dest}.`,
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

// --- Budget ---
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
    const dest = String(destination);
    const match = findCity(dest);
    const d = parseInt(String(days)) || 5;
    const flight = parseInt(String(flightCost).replace(/[^0-9]/g, '')) || 600;
    const hotel = parseInt(String(hotelCostPerNight).replace(/[^0-9]/g, '')) || 180;
    const costs = match?.data.dailyCosts ?? { food: 60, activities: 40, transport: 12 };
    const food = d * costs.food;
    const activities = d * costs.activities;
    const transport = d * costs.transport;
    const total = flight + hotel * d + food + activities + transport;
    return JSON.stringify({
      destination: dest,
      days: d,
      breakdown: {
        flights: `$${flight}`,
        hotel: `$${hotel * d} ($${hotel}/night × ${d} nights)`,
        food: `$${food} ($${costs.food}/day)`,
        activities: `$${activities} ($${costs.activities}/day)`,
        localTransport: `$${transport} ($${costs.transport}/day)`,
      },
      total: `$${total}`,
      perDay: `$${Math.round(total / d)}/day`,
    });
  },
});

// --- Itinerary ---
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
    return `✅ Itinerary for ${destination} saved! Come back anytime to review it.`;
  },
});

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function capitalize(s: string): string {
  return s
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
