import { and, count, eq, isNotNull, isNull, sql } from 'drizzle-orm';

import { UuidService } from '../../../../common/uuid/uuidService.ts';
import type { Database } from '../../../../infrastructure/database/database.ts';
import { incidents, votes } from '../../../../infrastructure/database/schema.ts';
import type {
  CreateIncidentData,
  FindIncidentsFilters,
  IncidentRepository,
  PaginatedIncidents,
} from '../../domain/repositories/incidentRepository.ts';
import type { Incident, IncidentType, IncidentWithVotes, Priority } from '../../domain/types/incident.ts';

export class IncidentRepositoryImpl implements IncidentRepository {
  private readonly database: Database;

  public constructor(database: Database) {
    this.database = database;
  }

  public async create(incidentData: CreateIncidentData): Promise<Incident> {
    const [newIncident] = await this.database.db
      .insert(incidents)
      .values({
        id: UuidService.generateUuid(),
        description: incidentData.description ?? null,
        type: incidentData.type,
        priority: incidentData.priority,
        lineId: incidentData.lineId ?? null,
        stopId: incidentData.stopId ?? null,
        latitude: incidentData.latitude ?? null,
        longitude: incidentData.longitude ?? null,
        createdBy: incidentData.createdBy,
      })
      .returning();

    if (!newIncident) {
      throw new Error('Failed to create incident');
    }

    return this.mapToIncident(newIncident);
  }

  public async findById(id: string): Promise<Incident | null> {
    const [incident] = await this.database.db.select().from(incidents).where(eq(incidents.id, id)).limit(1);

    return incident ? this.mapToIncident(incident) : null;
  }

  public async findMany(filters: FindIncidentsFilters): Promise<Incident[]> {
    const conditions = [];

    if (filters.lineId) {
      conditions.push(eq(incidents.lineId, filters.lineId));
    }

    if (filters.stopId) {
      conditions.push(eq(incidents.stopId, filters.stopId));
    }

    if (filters.isActive !== undefined) {
      if (filters.isActive) {
        conditions.push(isNull(incidents.endTime));
      } else {
        conditions.push(isNotNull(incidents.endTime));
      }
    }

    if (filters.priority) {
      conditions.push(eq(incidents.priority, filters.priority));
    }

    if (filters.latitude) {
      conditions.push(eq(incidents.latitude, filters.latitude));
    }

    if (filters.longitude) {
      conditions.push(eq(incidents.longitude, filters.longitude));
    }

    const result = await this.database.db
      .select()
      .from(incidents)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(incidents.createdAt);

    return result.map((incident) => this.mapToIncident(incident));
  }

  public async findManyWithVotes(filters: FindIncidentsFilters): Promise<PaginatedIncidents> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    const offset = (page - 1) * limit;

    const conditions = [];

    if (filters.lineId) {
      conditions.push(eq(incidents.lineId, filters.lineId));
    }

    if (filters.stopId) {
      conditions.push(eq(incidents.stopId, filters.stopId));
    }

    if (filters.isActive !== undefined) {
      if (filters.isActive) {
        conditions.push(isNull(incidents.endTime));
      } else {
        conditions.push(isNotNull(incidents.endTime));
      }
    }

    if (filters.priority) {
      conditions.push(eq(incidents.priority, filters.priority));
    }

    if (filters.latitude) {
      conditions.push(eq(incidents.latitude, filters.latitude));
    }

    if (filters.longitude) {
      conditions.push(eq(incidents.longitude, filters.longitude));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const countResult = await this.database.db.select({ total: count() }).from(incidents).where(whereClause);

    const total = countResult[0]?.total ?? 0;

    // Get incidents with vote counts
    const result = await this.database.db
      .select({
        incident: incidents,
        confirmVotes: sql<number>`CAST(COUNT(CASE WHEN ${votes.voteType} = 'confirm' THEN 1 END) AS INTEGER)`,
        rejectVotes: sql<number>`CAST(COUNT(CASE WHEN ${votes.voteType} = 'reject' THEN 1 END) AS INTEGER)`,
      })
      .from(incidents)
      .leftJoin(votes, eq(incidents.id, votes.incidentId))
      .where(whereClause)
      .groupBy(incidents.id)
      .orderBy(incidents.createdAt)
      .limit(limit)
      .offset(offset);

    const incidentsWithVotes: IncidentWithVotes[] = result.map((row) => {
      const incident = this.mapToIncident(row.incident);
      return {
        ...incident,
        confirmVotes: row.confirmVotes,
        rejectVotes: row.rejectVotes,
      };
    });

    return {
      data: incidentsWithVotes,
      total,
    };
  }

  public async close(id: string): Promise<void> {
    await this.database.db.update(incidents).set({ endTime: new Date() }).where(eq(incidents.id, id));
  }

  private mapToIncident(dbIncident: typeof incidents.$inferSelect): Incident {
    const incident: Incident = {
      id: dbIncident.id,
      description: dbIncident.description,
      type: dbIncident.type as IncidentType,
      priority: dbIncident.priority as Priority,
      startTime: dbIncident.startTime,
      endTime: dbIncident.endTime,
      lineId: dbIncident.lineId,
      stopId: dbIncident.stopId,
      latitude: dbIncident.latitude,
      longitude: dbIncident.longitude,
      createdBy: dbIncident.createdBy,
      createdAt: dbIncident.createdAt,
    };

    return incident;
  }
}
