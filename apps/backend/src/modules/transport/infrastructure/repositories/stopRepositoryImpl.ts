import { and, asc, between, eq, ilike, type SQL } from 'drizzle-orm';

import type { Database } from '../../../../infrastructure/database/database.ts';
import { stops } from '../../../../infrastructure/database/schema.ts';
import type { ListStopsFilters, StopRepository } from '../../domain/repositories/stopRepository.ts';
import type { Stop } from '../../domain/types/stop.ts';

export class StopRepositoryImpl implements StopRepository {
  public constructor(private readonly database: Database) {}

  public async list(filters: ListStopsFilters): Promise<Stop[]> {
    const conditions: SQL[] = [];

    if (filters.type) {
      conditions.push(eq(stops.type, filters.type));
    }

    if (filters.name) {
      conditions.push(ilike(stops.name, `%${filters.name}%`));
    }

    if (
      filters.latitude !== undefined &&
      filters.longitude !== undefined &&
      filters.radiusMeters !== undefined &&
      filters.radiusMeters > 0
    ) {
      const lat = filters.latitude;
      const lon = filters.longitude;
      const radius = filters.radiusMeters;
      const latDelta = radius / 111_000;
      const lonDelta = radius / (111_000 * Math.cos((lat * Math.PI) / 180) || 1);

      const minLat = (lat - latDelta).toString();
      const maxLat = (lat + latDelta).toString();
      const minLon = (lon - lonDelta).toString();
      const maxLon = (lon + lonDelta).toString();

      conditions.push(between(stops.latitude, minLat, maxLat));
      conditions.push(between(stops.longitude, minLon, maxLon));
    }

    const baseQuery = this.database.db.select().from(stops);
    const filteredQuery = conditions.length > 0 ? baseQuery.where(and(...conditions)) : baseQuery;

    const result = await filteredQuery.orderBy(asc(stops.name));

    return result.map((row) => this.mapStop(row));
  }

  public async findById(id: string): Promise<Stop | null> {
    const [row] = await this.database.db.select().from(stops).where(eq(stops.id, id)).limit(1);

    return row ? this.mapStop(row) : null;
  }

  private mapStop(row: typeof stops.$inferSelect): Stop {
    return {
      id: row.id,
      name: row.name,
      latitude: typeof row.latitude === 'string' ? Number(row.latitude) : row.latitude,
      longitude: typeof row.longitude === 'string' ? Number(row.longitude) : row.longitude,
      type: row.type,
    };
  }
}
