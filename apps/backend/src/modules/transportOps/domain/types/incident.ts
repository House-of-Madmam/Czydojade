import type { Priority } from './priority.ts';

export type IncidentType = 'breakdown' | 'danger';

export interface Incident {
  readonly id: string;
  readonly description?: string;
  readonly type: IncidentType;
  readonly priority: Priority;
  readonly startTime: Date;
  readonly endTime?: Date | null;
  readonly lineId?: string | null;
  readonly stopId?: string | null;
  readonly latitude?: number | null;
  readonly longitude?: number | null;
  readonly createdBy: string;
  readonly createdAt: Date;
}
