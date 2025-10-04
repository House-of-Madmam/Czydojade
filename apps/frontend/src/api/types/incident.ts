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