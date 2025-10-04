import type { Incident, IncidentType } from '../types/incident.ts';
import type { Priority } from '../types/priority.ts';

export interface ListIncidentsFilters {
  readonly lineId?: string;
  readonly stopId?: string;
  readonly isActive?: boolean;
  readonly priority?: Priority;
}

export interface CreateIncidentData {
  readonly description?: string;
  readonly type: IncidentType;
  readonly priority: Priority;
  readonly startTime?: Date;
  readonly endTime?: Date | null;
  readonly lineId?: string | null;
  readonly stopId?: string | null;
  readonly latitude?: number | null;
  readonly longitude?: number | null;
  readonly createdBy: string;
}

export interface IncidentRepository {
  list(filters: ListIncidentsFilters): Promise<Incident[]>;
  findById(id: string): Promise<Incident | null>;
  create(data: CreateIncidentData): Promise<Incident>;
}
