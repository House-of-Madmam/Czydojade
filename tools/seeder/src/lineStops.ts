import { drizzle } from 'drizzle-orm/node-postgres';
import { pgTable, uuid, varchar, decimal, pgEnum, index, text, integer } from 'drizzle-orm/pg-core';
import { readFile } from 'node:fs/promises';
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

export const lineStops = pgTable(
  'line_stops',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    lineId: uuid('line_id')
      .notNull()
      .references(() => lines.id, { onDelete: 'cascade' }),
    stopId: uuid('stop_id')
      .notNull()
      .references(() => stops.id, { onDelete: 'cascade' }),
    sequence: integer('sequence').notNull(), // kolejność
  },
  (table) => [index('line_stops_line_id_idx').on(table.lineId), index('line_stops_stop_id_idx').on(table.stopId)],
);

const pool = new Pool({ connectionString: databaseUrl });
const db = drizzle(pool);

type LineWithExternalId = {
  id: string;
  externalId: string;
  number: string;
  type: 'bus' | 'tram';
  directions: string[];
};

type StopWithExternalId = {
  id: string;
  externalId: string;
  name: string;
  latitude: string;
  longitude: string;
  type: 'bus' | 'tram';
};

let linesToInsertWithExternalIds: LineWithExternalId[] = [];
let stopsToInsertWithExternalIds: StopWithExternalId[] = [];

interface ApiRoute {
  alerts: unknown[];
  authority: string;
  directions: string[];
  id: string;
  name: string;
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
  console.log(`Fetched ${data.routes.length.toString()} routes from API`);

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
  console.log(`Fetched ${data.length.toString()} ${type} stops from API`);

  return data;
}

async function seedLines(): Promise<void> {
  console.log('Seeding lines...');

  try {
    const allRoutes = await fetchLinesFromApi();

    const tramRoutes = allRoutes.filter((route) => route.authority === 'MPK');
    const busRoutes = allRoutes.filter((route) => route.authority !== 'MPK');

    console.log(`Found ${tramRoutes.length.toString()} tram routes and ${busRoutes.length.toString()} bus routes`);

    const uniqueTramLines = new Map<string, ApiRoute>();
    for (const route of tramRoutes) {
      if (!uniqueTramLines.has(route.name.trim()) && route.directions.length > 0) {
        uniqueTramLines.set(route.name.trim(), route);
      }
    }

    const uniqueBusLines = new Map<string, ApiRoute>();
    for (const route of busRoutes) {
      if (!uniqueBusLines.has(route.name.trim())) {
        uniqueBusLines.set(route.name.trim(), route);
      }
    }

    linesToInsertWithExternalIds = [
      ...Array.from(uniqueTramLines.values()).map((route) => ({
        id: uuidv7(),
        externalId: route.id,
        number: route.name.trim(),
        type: 'tram' as const,
        directions: route.directions,
      })),
      ...Array.from(uniqueBusLines.values()).map((route) => ({
        id: uuidv7(),
        externalId: route.id,
        number: route.name.trim(),
        type: 'bus' as const,
        directions: route.directions.length > 0 ? route.directions : [],
      })),
    ];
    const linesToInsert = linesToInsertWithExternalIds.map(({ externalId, ...line }) => line);
    console.log(
      `Inserting ${linesToInsert.length.toString()} unique lines (${uniqueTramLines.size.toString()} trams, ${uniqueBusLines.size.toString()} buses)...`,
    );

    await db.insert(lines).values(linesToInsert);

    console.log(`Successfully seeded ${linesToInsert.length.toString()} lines.`);
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

    stopsToInsertWithExternalIds = [
      ...Array.from(uniqueTramStops.values()).map((stop) => ({
        id: uuidv7(),
        externalId: stop.id,
        name: stop.name,
        latitude: stop.lat.toString(),
        longitude: stop.lon.toString(),
        type: 'tram' as const,
      })),
      ...Array.from(uniqueBusStops.values()).map((stop) => ({
        id: uuidv7(),
        externalId: stop.id,
        name: stop.name,
        latitude: stop.lat.toString(),
        longitude: stop.lon.toString(),
        type: 'bus' as const,
      })),
    ];

    const stopsToInsert = stopsToInsertWithExternalIds.map(({ externalId, ...stop }) => stop);
    console.log(
      `Inserting ${stopsToInsert.length.toString()} unique stops (${uniqueTramStops.size.toString()} trams, ${uniqueBusStops.size.toString()} buses)...`,
    );

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
  }
}

const normalizeStopName = (value: string): string => value.normalize('NFKC').trim().toLowerCase();

const extractStopNames = (fileContent: string): string[] => {
  const lines = fileContent.split(/\r?\n/);
  const stopNames: string[] = [];

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();

    if (!trimmed) {
      continue;
    }

    if (/^\d+$/.test(trimmed)) {
      continue;
    }

    if (/^\d+\s*(?:min|min\.)$/i.test(trimmed)) {
      continue;
    }

    if (stopNames.at(-1) === trimmed) {
      continue;
    }

    stopNames.push(trimmed);
  }

  return stopNames;
};

async function seedLinesStops(): Promise<void> {
  console.log('Seeding line stops...');

  try {
    if (linesToInsertWithExternalIds.length === 0) {
      console.warn('No lines data loaded. Skipping line stops seeding.');
      return;
    }

    if (stopsToInsertWithExternalIds.length === 0) {
      console.warn('No stops data loaded. Skipping line stops seeding.');
      return;
    }

    const stopsByTypeAndName = new Map<string, StopWithExternalId>();
    const stopsByName = new Map<string, StopWithExternalId>();

    for (const stop of stopsToInsertWithExternalIds) {
      const normalized = normalizeStopName(stop.name);
      const typeKey = `${stop.type}:${normalized}`;

      if (!stopsByTypeAndName.has(typeKey)) {
        stopsByTypeAndName.set(typeKey, stop);
      }

      if (!stopsByName.has(normalized)) {
        stopsByName.set(normalized, stop);
      }
    }

    let totalInserted = 0;

    for (const line of linesToInsertWithExternalIds) {
      let fileContent: string;

      try {
        fileContent = await readFile(new URL(`./data/${line.number}.txt`, import.meta.url), 'utf-8');
      } catch (error) {
        if ((error as NodeJS.ErrnoException | undefined)?.code === 'ENOENT') {
          console.warn(`No stops definition found for line ${line.number}. Skipping.`);
          continue;
        }

        throw error;
      }

      const stopNames = extractStopNames(fileContent);

      if (stopNames.length === 0) {
        console.warn(`No stop names parsed for line ${line.number}. Skipping.`);
        continue;
      }

      const values: Array<{ lineId: string; stopId: string; sequence: number }> = [];

      for (const stopName of stopNames) {
        const normalizedStopName = normalizeStopName(stopName);
        let matchedStop = stopsByTypeAndName.get(`${line.type}:${normalizedStopName}`);

        if (!matchedStop) {
          matchedStop = stopsByName.get(normalizedStopName);
        }

        if (!matchedStop) {
          console.warn(`Stop "${stopName}" for line ${line.number} not found among fetched stops. Skipping this stop.`);
          continue;
        }

        values.push({
          lineId: line.id,
          stopId: matchedStop.id,
          sequence: values.length + 1,
        });
      }

      if (values.length === 0) {
        console.warn(`No stops matched for line ${line.number}. Skipping insert.`);
        continue;
      }

      await db.insert(lineStops).values(values);
      totalInserted += values.length;
      console.log(`Seeded ${values.length.toString()} stops for line ${line.number}.`);
    }

    console.log(`Successfully seeded ${totalInserted.toString()} line stops.`);
  } catch (error) {
    console.error('Error inserting line stops:', error);
    throw error;
  }
}

async function main(): Promise<void> {
  try {
    await seedStops();
    await seedLines();
    await seedLinesStops();
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

await main();
