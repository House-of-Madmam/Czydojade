import { simpleApiRequest } from '@/api/apiRequest';

export interface ListLinesFilters {
  type?: 'bus' | 'tram';
  number?: string;
  page?: number;
  pageSize?: number;
}

export interface Line {
  id: string;
  number: string;
  type: 'bus' | 'tram';
  directions: string[];
}

export interface PaginatedLines {
  data: Line[];
  total: number;
}

export const getStops = async (filters?: ListLinesFilters): Promise<PaginatedLines> => {
  const queryParams = new URLSearchParams();

  if (filters) {
    if (filters.type) queryParams.append('type', filters.type);
    if (filters.number) queryParams.append('number', filters.number);
    if (filters.page !== undefined) queryParams.append('page', filters.page.toString());
    if (filters.pageSize !== undefined) queryParams.append('pageSize', filters.pageSize.toString());
  }

  return simpleApiRequest<PaginatedLines>(`/lines`, {
    method: 'GET',
    params: queryParams,
  });
};