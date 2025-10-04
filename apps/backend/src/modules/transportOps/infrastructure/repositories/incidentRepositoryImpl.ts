import { and, desc, eq, isNotNull, isNull, type SQL } from 'drizzle-orm';

import { UuidService } from '../../../../common/uuid/uuidService.ts';
import type { Database } from '../../../../infrastructure/database/database.ts';
import { incidents } from '../../../../infrastructure/database/schema.ts';
import type {
  CreateIncidentData,
  IncidentRepository,
  ListIncidentsFilters,
} from '../../domain/repositories/incidentRepository.ts';
import type { Incident } from '../../domain/types/incident.ts';

export class IncidentRepositoryImpl implements IncidentRepository {
  public constructor(private readonly database: Database) {}

  public async list(filters: ListIncidentsFilters): Promise<Incident[]> {
    const conditions: SQL[] = [];

    if (filters.lineId) {
      conditions.push(eq(incidents.lineId, filters.lineId));
    }

    if (filters.stopId) {
      conditions.push(eq(incidents.stopId, filters.stopId));
    }

    if (filters.priority) {
      conditions.push(eq(incidents.priority, filters.priority));
    }

    if (filters.isActive !== undefined) {
      conditions.push(filters.isActive ? isNull(incidents.endTime) : isNotNull(incidents.endTime));
    }

    const baseQuery = this.database.db.select().from(incidents);
    const filteredQuery = conditions.length > 0 ? baseQuery.where(and(...conditions)) : baseQuery;

    const result = await filteredQuery.orderBy(desc(incidents.startTime));

    return result.map((row) => this.mapIncident(row));
  }

  public async findById(id: string): Promise<Incident | null> {
    const [row] = await this.database.db.select().from(incidents).where(eq(incidents.id, id)).limit(1);

    return row ? this.mapIncident(row) : null;
  }

  public async create(data: CreateIncidentData): Promise<Incident> {
    const [row] = await this.database.db
      .insert(incidents)
      .values({
        id: UuidService.generateUuid(),
        description: data.description,
        type: data.type,
        priority: data.priority,
        startTime: data.startTime ?? new Date(),
        endTime: data.endTime ?? null,
        lineId: data.lineId ?? null,
        stopId: data.stopId ?? null,
        latitude: data.latitude !== undefined ? data.latitude?.toString() : null,
        longitude: data.longitude !== undefined ? data.longitude?.toString() : null,
        createdBy: data.createdBy,
        createdAt: new Date(),
      })
      .returning();

    if (!row) {
      throw new Error('Failed to create incident');
    }

    return this.mapIncident(row);
  }

  private mapIncident(row: typeof incidents.$inferSelect): Incident {
    return {
      id: row.id,
      ...(row.description !== null ? { description: row.description } : {}),
      type: row.type,
      priority: row.priority,
      startTime: row.startTime,
      ...(row.endTime !== null ? { endTime: row.endTime } : {}),
      ...(row.lineId !== null ? { lineId: row.lineId } : {}),
      ...(row.stopId !== null ? { stopId: row.stopId } : {}),
      ...(row.latitude !== null ? { latitude: Number(row.latitude) } : {}),
      ...(row.longitude !== null ? { longitude: Number(row.longitude) } : {}),
      createdBy: row.createdBy,
      createdAt: row.createdAt,
    } satisfies Incident;
  }
}
