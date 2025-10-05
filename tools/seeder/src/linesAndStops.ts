import { drizzle } from 'drizzle-orm/node-postgres';
import { pgTable, uuid, varchar, decimal, pgEnum, index, text } from 'drizzle-orm/pg-core';
import { Pool } from 'pg';
import { v7 as uuidv7 } from 'uuid';

const databaseUrl = process.env['DATABASE_URL'];

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not defined');
}

export const vehicleTypeEnum = pgEnum('vehicle_type', ['bus', 'tram']);

export const lines = pgTable(
  'lines',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    number: varchar('number', { length: 50 }).notNull(),
    type: vehicleTypeEnum('type').notNull(),
    directions: text('directions').array().notNull(),
  },
  (table) => [index('lines_number_type_idx').on(table.number, table.type)],
);

export const stopTypeEnum = pgEnum('stop_type', ['bus', 'tram']);

export const stops = pgTable(
  'stops',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    latitude: decimal('latitude', { precision: 10, scale: 7 }).notNull(),
    longitude: decimal('longitude', { precision: 10, scale: 7 }).notNull(),
    type: stopTypeEnum('type').notNull(),
  },
  (table) => [index('stops_lat_lon_idx').on(table.latitude, table.longitude), index('stops_name_idx').on(table.name)],
);

const pool = new Pool({ connectionString: databaseUrl });
const db = drizzle(pool);
let stopsToInsert;
let linesToInsert;

interface ApiRoute {
  alerts: unknown[];
  authority: string;
  directions: string[];
  id: string;
  name: string;
  shortName: string;
}

interface ApiRouteResponse {
  routes: ApiRoute[];
}

interface ApiStop {
  id: string;
  name: string;
  lat: number;
  lon: number;
  parent: string;
}

async function fetchLinesFromApi(): Promise<ApiRoute[]> {
  const url = 'https://ttss.krakow.pl/internetservice/services/routeInfo/route';

  console.log(`Fetching lines from ${url}...`);

  const response = await fetch(url, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch lines: ${response.statusText}`);
  }

  const data = (await response.json()) as ApiRouteResponse;
  console.log(`Fetched ${data.routes.length} routes from API`);

  return data.routes;
}

async function fetchStopsFromApi(type: 'tram' | 'bus'): Promise<ApiStop[]> {
  const apiType = type === 'tram' ? 't' : 'b';
  const url = `https://api.ttss.pl/stops/?type=${apiType}`;

  console.log(`Fetching ${type} stops from ${url}...`);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${type} stops: ${response.statusText}`);
  }

  const data = (await response.json()) as ApiStop[];
  console.log(`Fetched ${data.length} ${type} stops from API`);

  return data;
}

async function seedLines(): Promise<void> {
  console.log('Seeding lines...');

  try {
    const allRoutes = await fetchLinesFromApi();

    const tramRoutes = allRoutes.filter((route) => route.authority === 'MPK');
    const busRoutes = allRoutes.filter((route) => route.authority !== 'MPK');

    console.log(`Found ${tramRoutes.length} tram routes and ${busRoutes.length} bus routes`);

    const uniqueTramLines = new Map<string, ApiRoute>();
    for (const route of tramRoutes) {
      if (!uniqueTramLines.has(route.shortName) && route.directions && route.directions.length > 0) {
        uniqueTramLines.set(route.shortName, route);
      }
    }

    const uniqueBusLines = new Map<string, ApiRoute>();
    for (const route of busRoutes) {
      if (!uniqueBusLines.has(route.shortName)) {
        uniqueBusLines.set(route.shortName, route);
      }
    }

    linesToInsert = [
      ...Array.from(uniqueTramLines.values()).map((route) => ({
        id: uuidv7(),
        number: route.shortName,
        type: 'tram' as const,
        directions: route.directions,
      })),
      ...Array.from(uniqueBusLines.values()).map((route) => ({
        id: uuidv7(),
        number: route.shortName,
        type: 'bus' as const,
        directions: route.directions && route.directions.length > 0 ? route.directions : [],
      })),
    ];

    console.log(
      `Inserting ${linesToInsert.length} unique lines (${uniqueTramLines.size} trams, ${uniqueBusLines.size} buses)...`,
    );

    await db.insert(lines).values(linesToInsert);

    console.log(`Successfully seeded ${linesToInsert.length} lines.`);
  } catch (error) {
    console.error('Error inserting lines:', error);
    throw error;
  }
}

async function seedStops(): Promise<void> {
  console.log('Seeding stops...');

  try {
    const tramStops = await fetchStopsFromApi('tram');
    const busStops = await fetchStopsFromApi('bus');

    const uniqueTramStops = new Map<string, ApiStop>();
    for (const stop of tramStops) {
      if (!uniqueTramStops.has(stop.name)) {
        uniqueTramStops.set(stop.name, stop);
      }
    }

    const uniqueBusStops = new Map<string, ApiStop>();
    for (const stop of busStops) {
      if (!uniqueBusStops.has(stop.name)) {
        uniqueBusStops.set(stop.name, stop);
      }
    }

    stopsToInsert = [
      ...Array.from(uniqueTramStops.values()).map((stop) => ({
        id: uuidv7(),
        name: stop.name,
        latitude: stop.lat.toString(),
        longitude: stop.lon.toString(),
        type: 'tram' as const,
      })),
      ...Array.from(uniqueBusStops.values()).map((stop) => ({
        id: uuidv7(),
        name: stop.name,
        latitude: stop.lat.toString(),
        longitude: stop.lon.toString(),
        type: 'bus' as const,
      })),
    ];

    console.log(
      `Inserting ${stopsToInsert.length} unique stops (${uniqueTramStops.size} trams, ${uniqueBusStops.size} buses)...`,
    );

    const batchSize = 1000;
    for (let i = 0; i < stopsToInsert.length; i += batchSize) {
      const batch = stopsToInsert.slice(i, i + batchSize);
      await db.insert(stops).values(batch);
      console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(stopsToInsert.length / batchSize)}`);
    }

    console.log(`Successfully seeded ${stopsToInsert.length} stops.`);
  } catch (error) {
    console.error('Error inserting stops:', error);
    throw error;
  }
}

async function main(): Promise<void> {
  try {
    await seedStops();
    await seedLines();
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

await main();
