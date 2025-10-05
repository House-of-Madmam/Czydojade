export enum IncidentType {
  VehicleBreakdown = 'vehicleBreakdown',
  InfrastructureBreakdown = 'infrastructureBreakdown',
  DangerInsideVehicle = 'dangerInsideVehicle',
}

export enum IncidentPriority {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Critical = 'critical',
}

export interface ReportIncidentPayload {
  description?: string;
  type: IncidentType;
  priority: IncidentPriority;
  stopId?: string;
  lineId?: string;
  latitude?: string;
  longitude?: string;
}

export interface IncidentWithVotes {
  id: string;
  description: string | null;
  type: IncidentType;
  priority: IncidentPriority;
  startTime: string;
  endTime: string | null;
  lineId: string | null;
  lineDirection: string | null;
  stopId: string | null;
  latitude: string | null;
  longitude: string | null;
  createdBy: string;
  createdAt: string;
  confirmVotes: number;
  rejectVotes: number;
}

export interface PaginatedIncidentsResponse {
  data: IncidentWithVotes[];
  total: number;
}

export interface IncidentsFilters {
  lineId?: string;
  lineDirection?: string;
  stopId?: string;
  isActive?: boolean;
  priority?: IncidentPriority;
  latitude?: number;
  longitude?: number;
  radiusMeters?: number;
  page?: number;
  limit?: number;
}