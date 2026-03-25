import { Tool } from '@avee1234/agent-kit';

// --- Destination Research (Wikipedia API — works for ANY city) ---
export const searchDestinations = Tool.create({
  name: 'search_destinations',
  description: 'Search for travel destination information',
  parameters: { query: { type: 'string', description: 'Destination city or trip description' } },
  execute: async ({ query }) => {
    const q = String(query);
    try {
      // Try direct page summary first
      const res = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q)}`,
        { headers: { 'User-Agent': 'agent-kit-playground/1.0' } },
      );
      if (res.ok) {
        const data = await res.json();
        if (data.extract) {
          return JSON.stringify({
            name: data.title,
            summary: data.extract.slice(0, 500),
            coordinates: data.coordinates ?? null,
          });
        }
      }
      // Fallback: search Wikipedia
      const searchRes = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q + ' travel tourism')}&format=json&srlimit=3`,
        { headers: { 'User-Agent': 'agent-kit-playground/1.0' } },
      );
      const searchData = await searchRes.json();
      if (searchData.query?.search?.length) {
        return JSON.stringify(
          searchData.query.search.map((item: { title: string; snippet: string }) => ({
            name: item.title,
            summary: item.snippet.replace(/<[^>]*>/g, ''),
          })),
        );
      }
    } catch {
      /* fall through */
    }
    return `Found destination: ${q}. A great place to explore!`;
  },
});

// --- Weather (Open-Meteo API — free, global, no key needed) ---
export const checkWeather = Tool.create({
  name: 'check_weather',
  description: 'Check weather forecast for a destination',
  parameters: {
    destination: { type: 'string', description: 'City name' },
    month: { type: 'string', description: 'Travel month' },
  },
  execute: async ({ destination, month }) => {
    const dest = String(destination);
    const m = String(month || '').toLowerCase();
    try {
      // Geocode the city first
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(dest)}&count=1`,
      );
      const geoData = await geoRes.json();
      if (!geoData.results?.length)
        return `Weather for ${dest}: ~22°C, pleasant conditions. Good time to visit.`;
      const { latitude, longitude, name, country } = geoData.results[0];

      // Get current/forecast weather
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode&timezone=auto&forecast_days=7`,
      );
      const weather = await weatherRes.json();
      const daily = weather.daily;
      if (!daily) return `${name}, ${country}: Pleasant weather expected.`;

      const avgHigh = Math.round(
        daily.temperature_2m_max.reduce((a: number, b: number) => a + b, 0) /
          daily.temperature_2m_max.length,
      );
      const avgLow = Math.round(
        daily.temperature_2m_min.reduce((a: number, b: number) => a + b, 0) /
          daily.temperature_2m_min.length,
      );
      const avgRain = Math.round(
        daily.precipitation_probability_max.reduce((a: number, b: number) => a + b, 0) /
          daily.precipitation_probability_max.length,
      );

      let advice = '';
      if (avgHigh > 30) advice = 'Hot — pack light clothing, sunscreen, and stay hydrated.';
      else if (avgHigh > 22) advice = 'Warm and pleasant. Light layers recommended.';
      else if (avgHigh > 15) advice = 'Mild — bring a light jacket for evenings.';
      else if (avgHigh > 5) advice = 'Cool — pack warm layers and a coat.';
      else advice = 'Cold — bring heavy winter clothing.';
      if (avgRain > 50) advice += ' Umbrella essential — high chance of rain.';

      return `${name}, ${country} (7-day forecast):\n• High: ${avgHigh}°C / Low: ${avgLow}°C\n• Rain chance: ${avgRain}%\n• ${advice}`;
    } catch {
      return `${dest}: ~22°C, pleasant conditions expected. Pack layers to be safe.`;
    }
  },
});

// --- Flights (simulated but destination-aware) ---
export const searchFlights = Tool.create({
  name: 'search_flights',
  description: 'Search for available flights to a destination',
  parameters: {
    destination: { type: 'string', description: 'Destination city' },
    departDate: { type: 'string', description: 'Departure date' },
    returnDate: { type: 'string', description: 'Return date' },
  },
  execute: async ({ destination, departDate, returnDate }) => {
    await delay(400);
    const dest = String(destination);

    // Geocode to estimate distance and generate realistic prices
    let airportCode = 'INT';
    let baseCost = 600;
    let baseDuration = 10;
    try {
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(dest)}&count=1`,
      );
      const geoData = await geoRes.json();
      if (geoData.results?.length) {
        const { latitude, longitude, country_code } = geoData.results[0];
        // Rough distance from SFO (37.6, -122.4) in thousands of km
        const dist =
          (Math.sqrt(Math.pow(latitude - 37.6, 2) + Math.pow(longitude + 122.4, 2)) * 111) / 1000;
        baseCost = Math.round(200 + dist * 60 + Math.random() * 100);
        baseDuration = Math.round(2 + dist * 1.2);
        airportCode = (country_code || 'INT').toUpperCase();
      }
    } catch {
      /* use defaults */
    }

    const airlines = [
      { name: 'Premium Carrier', priceMult: 1.15, durationMult: 1.0, stops: 'Direct' },
      { name: 'National Carrier', priceMult: 1.0, durationMult: 1.05, stops: 'Direct' },
      { name: 'Budget Option', priceMult: 0.75, durationMult: 1.4, stops: '1 stop' },
    ];

    return JSON.stringify({
      flights: airlines.map((a) => ({
        airline: a.name,
        route: `SFO → ${airportCode}`,
        depart: departDate || 'TBD',
        return: returnDate || 'TBD',
        price: `$${Math.round(baseCost * a.priceMult)}`,
        duration: `${Math.round(baseDuration * a.durationMult)}h`,
        stops: a.stops,
      })),
      recommendation: `National Carrier direct flight at $${baseCost} offers the best balance.`,
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
    await delay(300);
    return `✅ Flight booked! ${airline} — Confirmation #TK${Math.floor(Math.random() * 90000 + 10000)}. Total: ${price}`;
  },
});

// --- Hotels (simulated but destination-aware pricing) ---
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

    // Generate price tier based on city cost level
    let priceLevel = 1.0; // multiplier
    const expensive = [
      'tokyo',
      'new york',
      'london',
      'paris',
      'zurich',
      'singapore',
      'hong kong',
      'sydney',
    ];
    const moderate = ['barcelona', 'rome', 'berlin', 'amsterdam', 'seoul', 'dubai', 'los angeles'];
    const budget = ['bali', 'bangkok', 'hanoi', 'mexico city', 'lisbon', 'prague', 'budapest'];
    const d = dest.toLowerCase();
    if (expensive.some((c) => d.includes(c))) priceLevel = 1.3;
    else if (moderate.some((c) => d.includes(c))) priceLevel = 1.0;
    else if (budget.some((c) => d.includes(c))) priceLevel = 0.6;

    const hotels = [
      {
        name: `${dest} Grand Hotel`,
        area: 'City Center',
        price: Math.round(350 * priceLevel),
        rating: '4.8/5',
        highlight: 'Luxury, full-service spa, central location',
      },
      {
        name: `${dest} Boutique Inn`,
        area: 'Historic Quarter',
        price: Math.round(180 * priceLevel),
        rating: '4.5/5',
        highlight: 'Charming, local character, walkable',
      },
      {
        name: `${dest} Budget Stay`,
        area: 'Near Transit',
        price: Math.round(90 * priceLevel),
        rating: '4.2/5',
        highlight: 'Clean, affordable, great transport links',
      },
      {
        name: `${dest} Design Hotel`,
        area: 'Trendy District',
        price: Math.round(220 * priceLevel),
        rating: '4.6/5',
        highlight: 'Modern design, rooftop bar',
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
      recommendation: `${hotels[1].name} at $${hotels[1].price}/night offers the best value in ${dest}.`,
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

// --- Budget Calculator ---
export const calculateBudget = Tool.create({
  name: 'calculate_budget',
  description: 'Calculate total trip budget',
  parameters: {
    destination: { type: 'string', description: 'Destination' },
    days: { type: 'string', description: 'Number of days' },
    flightCost: { type: 'string', description: 'Flight cost' },
    hotelCostPerNight: { type: 'string', description: 'Hotel cost per night' },
  },
  execute: async ({ destination, days, flightCost, hotelCostPerNight }) => {
    await delay(200);
    const dest = String(destination);
    const d = parseInt(String(days)) || 5;
    const flight = parseInt(String(flightCost).replace(/[^0-9]/g, '')) || 600;
    const hotel = parseInt(String(hotelCostPerNight).replace(/[^0-9]/g, '')) || 180;

    // Estimate daily costs based on destination
    let foodPerDay = 60,
      activityPerDay = 40,
      transportPerDay = 12;
    const dLower = dest.toLowerCase();
    const expensive = ['tokyo', 'new york', 'london', 'paris', 'zurich', 'singapore'];
    const budgetCities = ['bali', 'bangkok', 'hanoi', 'mexico city', 'prague', 'budapest'];
    if (expensive.some((c) => dLower.includes(c))) {
      foodPerDay = 80;
      activityPerDay = 55;
      transportPerDay = 18;
    } else if (budgetCities.some((c) => dLower.includes(c))) {
      foodPerDay = 25;
      activityPerDay = 20;
      transportPerDay = 8;
    }

    const food = d * foodPerDay;
    const activities = d * activityPerDay;
    const transport = d * transportPerDay;
    const total = flight + hotel * d + food + activities + transport;

    return JSON.stringify({
      destination: dest,
      days: d,
      breakdown: {
        flights: `$${flight}`,
        hotel: `$${hotel * d} ($${hotel}/night × ${d} nights)`,
        food: `$${food} ($${foodPerDay}/day)`,
        activities: `$${activities} ($${activityPerDay}/day)`,
        localTransport: `$${transport} ($${transportPerDay}/day)`,
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
