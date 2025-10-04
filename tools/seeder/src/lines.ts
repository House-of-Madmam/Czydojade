import { drizzle } from 'drizzle-orm/node-postgres';
import { pgTable, uuid, varchar, pgEnum, index, text } from 'drizzle-orm/pg-core';
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

const pool = new Pool({ connectionString: databaseUrl });
const db = drizzle(pool);

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

async function seedLines(): Promise<void> {
  console.log('Seeding lines...');

  try {
    const allRoutes = await fetchLinesFromApi();

    const tramRoutes = allRoutes.filter((route) => route.authority === 'MPK');
    const busRoutes = allRoutes.filter((route) => route.authority !== 'MPK');

    console.log(`Found ${tramRoutes.length} tram routes and ${busRoutes.length} bus routes`);

    const uniqueTramLines = new Map<string, ApiRoute>();
    for (const route of tramRoutes) {
      if (!uniqueTramLines.has(route.shortName)) {
        uniqueTramLines.set(route.shortName, route);
      }
    }

    const uniqueBusLines = new Map<string, ApiRoute>();
    for (const route of busRoutes) {
      if (!uniqueBusLines.has(route.shortName)) {
        uniqueBusLines.set(route.shortName, route);
      }
    }

    const linesToInsert = [
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
        directions: route.directions,
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
  } finally {
    await pool.end();
  }
}

await seedLines();
