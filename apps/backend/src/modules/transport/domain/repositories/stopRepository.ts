import type { Stop } from '../types/stop.ts';

export interface ListStopsFilters {
  readonly type?: Stop['type'];
  readonly name?: string;
  readonly latitude?: number;
  readonly longitude?: number;
  readonly radiusMeters?: number;
}

export interface StopRepository {
  list(filters: ListStopsFilters): Promise<Stop[]>;
  findById(id: string): Promise<Stop | null>;
}
