import { drizzle } from 'drizzle-orm/node-postgres';
import { pgTable, uuid, varchar, decimal, pgEnum, index } from 'drizzle-orm/pg-core';
import { Pool } from 'pg';
import { v7 as uuidv7 } from 'uuid';

const databaseUrl = process.env['DATABASE_URL'];

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not defined');
}

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

interface ApiStop {
  id: string;
  name: string;
  lat: number;
  lon: number;
  parent: string;
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

  return data;
}

async function seedStops(): Promise<void> {
  console.log('Seeding stops...');

  try {
    const tramStops = await fetchStopsFromApi('tram');
    const busStops = await fetchStopsFromApi('bus');

    // Process tram stops with unique names
    const uniqueTramStops = new Map<string, ApiStop>();
    for (const stop of tramStops) {
      if (!uniqueTramStops.has(stop.name.trim())) {
        uniqueTramStops.set(stop.name.trim(), stop);
      }
    }

    const uniqueBusStops = new Map<string, ApiStop>();
    for (const stop of busStops) {
      if (!uniqueBusStops.has(stop.name.trim())) {
        uniqueBusStops.set(stop.name.trim(), stop);
      }
    }

    // Prepare data for insertion
    const stopsToInsert = [
      ...Array.from(uniqueTramStops.values()).map((stop) => ({
        id: uuidv7(),
        name: stop.name.trim(),
        latitude: stop.lat.toString(),
        longitude: stop.lon.toString(),
        type: 'tram' as const,
      })),
      ...Array.from(uniqueBusStops.values()).map((stop) => ({
        id: uuidv7(),
        name: stop.name.trim(),
        latitude: stop.lat.toString(),
        longitude: stop.lon.toString(),
        type: 'bus' as const,
      })),
    ];

    console.log(
      `Inserting ${stopsToInsert.length.toString()} unique stops (${uniqueTramStops.size.toString()} trams, ${uniqueBusStops.size.toString()} buses)...`,
    );

    // Insert stops in batches to avoid potential issues with large datasets
    const batchSize = 1000;
    for (let i = 0; i < stopsToInsert.length; i += batchSize) {
      const batch = stopsToInsert.slice(i, i + batchSize);
      await db.insert(stops).values(batch);
      console.log(
        `Inserted batch ${(Math.floor(i / batchSize) + 1).toString()}/${Math.ceil(stopsToInsert.length / batchSize).toString()}`,
      );
    }

    console.log(`Successfully seeded ${stopsToInsert.length.toString()} stops.`);
  } catch (error) {
    console.error('Error inserting stops:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

await seedStops();
