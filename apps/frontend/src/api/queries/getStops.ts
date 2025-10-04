import { simpleApiRequest } from '../apiRequest';

export interface Stop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  type: 'bus' | 'tram';
}

export interface PaginatedStopsResponse {
  data: Stop[];
  total: number;
}

export interface StopsFilters {
  type?: 'bus' | 'tram';
  name?: string;
  latitude?: number;
  longitude?: number;
  radiusMeters?: number;
  page?: number;
  pageSize?: number;
}

export const getStops = async (filters?: StopsFilters): Promise<PaginatedStopsResponse> => {
  const queryParams = new URLSearchParams();

  if (filters) {
    if (filters.type) queryParams.append('type', filters.type);
    if (filters.name) queryParams.append('name', filters.name);
    if (filters.latitude !== undefined) queryParams.append('latitude', filters.latitude.toString());
    if (filters.longitude !== undefined) queryParams.append('longitude', filters.longitude.toString());
    if (filters.radiusMeters !== undefined) queryParams.append('radiusMeters', filters.radiusMeters.toString());
    if (filters.page !== undefined) queryParams.append('page', filters.page.toString());
    if (filters.pageSize !== undefined) queryParams.append('pageSize', filters.pageSize.toString());
  }

  return simpleApiRequest<PaginatedStopsResponse>(`/stops`, {
    method: 'GET',
    params: queryParams,
  });
};
