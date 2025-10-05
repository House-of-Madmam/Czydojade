import { useEffect, useState } from 'react';
import { getStops } from '../api/queries/getLines';
import type { Line, ListLinesFilters, PaginatedLines } from '../api/queries/getLines';

interface UseLinesParams {
  type?: 'bus' | 'tram';
  number?: string;
  page?: number;
  pageSize?: number;
}

interface UseLinesResult {
  lines: Line[];
  total: number;
  loading: boolean;
  error: string | null;
}

export const useLines = ({ type, number, page, pageSize }: UseLinesParams): UseLinesResult => {
  const [lines, setLines] = useState<Line[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLines = async () => {
      setLoading(true);
      setError(null);

      try {
        const filters: ListLinesFilters = {};

        if (type) filters.type = type;
        if (number) filters.number = number;
        if (page !== undefined) filters.page = page;
        if (pageSize !== undefined) filters.pageSize = pageSize;

        const result: PaginatedLines = await getStops(filters);
        setLines(result.data);
        setTotal(result.total);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchLines();
  }, [type, number, page, pageSize]);

  return { lines, total, loading, error };
};
