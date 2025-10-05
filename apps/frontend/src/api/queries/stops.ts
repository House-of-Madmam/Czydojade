import { apiRequest } from '../apiRequest';

export interface Stop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  type: 'bus' | 'tram';
}

interface PaginatedStops {
  data: Stop[];
  total: number;
}

export interface StopsQueryParams {
  type?: 'bus' | 'tram';
  name?: string;
  latitude?: number;
  longitude?: number;
  radiusMeters?: number;
  page?: number;
  pageSize?: number;
}

export const getStops = async (params: StopsQueryParams): Promise<PaginatedStops> => {
  const searchParams = new URLSearchParams();

  if (params.type) searchParams.append('type', params.type);
  if (params.name) searchParams.append('name', params.name);
  if (params.latitude) searchParams.append('latitude', params.latitude.toString());
  if (params.longitude) searchParams.append('longitude', params.longitude.toString());
  if (params.radiusMeters) searchParams.append('radiusMeters', params.radiusMeters.toString());
  if (params.page) searchParams.append('page', params.page.toString());
  if (params.pageSize) searchParams.append('pageSize', params.pageSize.toString());

  return apiRequest<PaginatedStops>('/stops', {
    method: 'GET',
    params: searchParams,
  });
};