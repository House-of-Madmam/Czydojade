import type { Stop, StopType } from '../types/stop.ts';

export interface ListStopsFilters {
  readonly type?: StopType | undefined;
  readonly name?: string | undefined;
  readonly latitude?: number | undefined;
  readonly longitude?: number | undefined;
  readonly radiusMeters?: number | undefined;
  readonly page: number;
  readonly pageSize: number;
}

export interface PaginatedStops {
  readonly data: Stop[];
  readonly total: number;
}

export interface StopRepository {
  list(filters: ListStopsFilters): Promise<PaginatedStops>;
  findById(id: string): Promise<Stop | null>;
}
