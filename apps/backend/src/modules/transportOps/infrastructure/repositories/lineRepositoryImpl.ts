import { and, asc, eq, ilike, type SQL } from 'drizzle-orm';

import type { Database } from '../../../../infrastructure/database/database.ts';
import { lineStops, lines, stops } from '../../../../infrastructure/database/schema.ts';
import type { LineRepository, LineStopDetails, ListLinesFilters } from '../../domain/repositories/lineRepository.ts';
import type { Line } from '../../domain/types/line.ts';
import type { Stop } from '../../domain/types/stop.ts';

export class LineRepositoryImpl implements LineRepository {
  public constructor(private readonly database: Database) {}

  public async list(filters: ListLinesFilters): Promise<Line[]> {
    const conditions: SQL[] = [];

    if (filters.type) {
      conditions.push(eq(lines.type, filters.type));
    }

    if (filters.number) {
      conditions.push(ilike(lines.number, `%${filters.number}%`));
    }

    const baseQuery = this.database.db.select().from(lines);

    const filteredQuery = conditions.length > 0 ? baseQuery.where(and(...conditions)) : baseQuery;

    const result = await filteredQuery.orderBy(asc(lines.number));

    return result.map((row) => this.mapLine(row));
  }

  public async findById(id: string): Promise<Line | null> {
    const [row] = await this.database.db.select().from(lines).where(eq(lines.id, id)).limit(1);

    return row ? this.mapLine(row) : null;
  }

  public async listStops(lineId: string): Promise<LineStopDetails[]> {
    const result = await this.database.db
      .select({
        lineStopId: lineStops.id,
        sequence: lineStops.sequence,
        stopId: stops.id,
        stopName: stops.name,
        stopLatitude: stops.latitude,
        stopLongitude: stops.longitude,
        stopType: stops.type,
      })
      .from(lineStops)
      .innerJoin(stops, eq(lineStops.stopId, stops.id))
      .where(eq(lineStops.lineId, lineId))
      .orderBy(asc(lineStops.sequence));

    return result.map((row) => ({
      stop: this.mapStop({
        id: row.stopId,
        name: row.stopName,
        latitude: row.stopLatitude,
        longitude: row.stopLongitude,
        type: row.stopType,
      }),
      sequence: row.sequence,
    }));
  }

  private mapLine(row: typeof lines.$inferSelect): Line {
    return {
      id: row.id,
      number: row.number,
      type: row.type,
    };
  }

  private mapStop(row: {
    id: string;
    name: string;
    latitude: string | number;
    longitude: string | number;
    type: Stop['type'];
  }): Stop {
    return {
      id: row.id,
      name: row.name,
      latitude: typeof row.latitude === 'string' ? Number(row.latitude) : row.latitude,
      longitude: typeof row.longitude === 'string' ? Number(row.longitude) : row.longitude,
      type: row.type,
    };
  }
}
