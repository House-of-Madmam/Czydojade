import { and, asc, between, count, eq, ilike, type SQL } from 'drizzle-orm';

import type { Database } from '../../../../infrastructure/database/database.ts';
import { lineStops, stops } from '../../../../infrastructure/database/schema.ts';
import type { ListStopsFilters, PaginatedStops, StopRepository } from '../../domain/repositories/stopRepository.ts';
import type { LineStop, Stop } from '../../domain/types/stop.ts';

export class StopRepositoryImpl implements StopRepository {
  private readonly database: Database;

  public constructor(database: Database) {
    this.database = database;
  }

  public async list(filters: ListStopsFilters): Promise<PaginatedStops> {
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

    const offset = (filters.page - 1) * filters.pageSize;

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const countQuery = this.database.db.select({ count: count() }).from(stops);
    const filteredCountQuery = whereClause ? countQuery.where(whereClause) : countQuery;
    const countResult = await filteredCountQuery;
    const total = countResult[0]?.count ?? 0;

    const dataQuery = this.database.db.select().from(stops);
    const filteredQuery = whereClause ? dataQuery.where(whereClause) : dataQuery;

    const result = await filteredQuery.orderBy(asc(stops.name)).limit(filters.pageSize).offset(offset);

    const data = result.map((row) => this.mapStop(row));

    return {
      data,
      total,
    };
  }

  public async listByLine(lineId: string): Promise<LineStop[]> {
    const rows = await this.database.db
      .select({
        stop: stops,
        sequence: lineStops.sequence,
      })
      .from(lineStops)
      .innerJoin(stops, eq(lineStops.stopId, stops.id))
      .where(eq(lineStops.lineId, lineId))
      .orderBy(asc(lineStops.sequence));

    return rows.map((row) => ({
      sequence: row.sequence,
      stop: this.mapStop(row.stop),
    }));
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
