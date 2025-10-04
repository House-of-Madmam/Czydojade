import type { Line } from '../types/line.ts';
import type { Stop } from '../types/stop.ts';

export interface ListLinesFilters {
  readonly type?: Line['type'];
  readonly number?: string;
}

export interface LineStopDetails {
  readonly stop: Stop;
  readonly sequence: number;
}

export interface LineRepository {
  list(filters: ListLinesFilters): Promise<Line[]>;
  findById(id: string): Promise<Line | null>;
  listStops(lineId: string): Promise<LineStopDetails[]>;
}
