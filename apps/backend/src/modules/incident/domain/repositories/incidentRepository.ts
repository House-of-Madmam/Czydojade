import type { Incident, IncidentType, IncidentWithVotes, Priority } from '../types/incident.ts';

export interface CreateIncidentData {
  readonly description?: string | undefined;
  readonly type: IncidentType;
  readonly priority: Priority;
  readonly lineId?: string | undefined;
  readonly lineDirection?: string | undefined;
  readonly stopId?: string | undefined;
  readonly latitude?: string | undefined;
  readonly longitude?: string | undefined;
  readonly createdBy: string;
}

export interface FindIncidentsFilters {
  readonly lineId?: string | undefined;
  readonly lineDirection?: string | undefined;
  readonly stopId?: string | undefined;
  readonly isActive?: boolean | undefined;
  readonly priority?: Priority | undefined;
  readonly latitude?: number | undefined;
  readonly longitude?: number | undefined;
  readonly radiusMeters?: number | undefined;
  readonly page?: number | undefined;
  readonly limit?: number | undefined;
  readonly routePoints?: { lat: number; lng: number }[] | undefined;
  readonly routeRadiusMeters?: number | undefined;
}

export interface PaginatedIncidents {
  readonly data: IncidentWithVotes[];
  readonly total: number;
}

export interface IncidentRepository {
  create(incidentData: CreateIncidentData): Promise<Incident>;
  findById(id: string): Promise<Incident | null>;
  findMany(filters: FindIncidentsFilters): Promise<Incident[]>;
  findManyWithVotes(filters: FindIncidentsFilters): Promise<PaginatedIncidents>;
  close(id: string): Promise<void>;
  extendEndTime(id: string, hoursToAdd: number): Promise<void>;
}
