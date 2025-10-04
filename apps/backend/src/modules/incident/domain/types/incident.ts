export const incidentTypes = {
  vehicleBreakdown: 'vehicleBreakdown',
  infrastructureBreakdown: 'infrastructureBreakdown',
  dangerInsideVehicle: 'dangerInsideVehicle',
} as const;

export type IncidentType = (typeof incidentTypes)[keyof typeof incidentTypes];

export const priorities = {
  low: 'low',
  medium: 'medium',
  high: 'high',
  critical: 'critical',
} as const;

export type Priority = (typeof priorities)[keyof typeof priorities];

export interface Incident {
  readonly id: string;
  readonly description: string | null;
  readonly type: IncidentType;
  readonly priority: Priority;
  readonly startTime: Date;
  readonly endTime: Date | null;
  readonly lineId: string | null;
  readonly stopId: string | null;
  readonly latitude: string | null;
  readonly longitude: string | null;
  readonly createdBy: string;
  readonly createdAt: Date;
}

export interface IncidentWithVotes extends Incident {
  readonly confirmVotes: number;
  readonly rejectVotes: number;
}
