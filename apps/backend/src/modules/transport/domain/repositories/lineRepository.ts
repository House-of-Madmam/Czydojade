import type { Line, LineType } from '../types/line.ts';

export interface ListLinesFilters {
  readonly type?: LineType | undefined;
  readonly number?: string | undefined;
  readonly page?: number | undefined;
  readonly pageSize?: number | undefined;
}

export interface PaginatedLines {
  readonly data: Line[];
  readonly total: number;
}

export interface LineRepository {
  list(filters: ListLinesFilters): Promise<PaginatedLines>;
  // findById(id: string): Promise<Line | null>;
}
