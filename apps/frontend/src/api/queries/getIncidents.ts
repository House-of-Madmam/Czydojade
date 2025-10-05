import { simpleApiRequest } from '../apiRequest';
import {
  IncidentWithVotes,
  PaginatedIncidentsResponse,
  IncidentsFilters,
  IncidentPriority,
} from '../types/incident';

export type { IncidentWithVotes, IncidentsFilters };

export const getIncidents = async (filters?: IncidentsFilters): Promise<PaginatedIncidentsResponse> => {
  const queryParams = new URLSearchParams();

  if (filters) {
    if (filters.lineId) queryParams.append('lineId', filters.lineId);
    if (filters.lineDirection) queryParams.append('lineDirection', filters.lineDirection);
    if (filters.stopId) queryParams.append('stopId', filters.stopId);
    if (filters.isActive !== undefined) queryParams.append('isActive', filters.isActive.toString());
    if (filters.priority) queryParams.append('priority', filters.priority);
    if (filters.latitude !== undefined) queryParams.append('latitude', filters.latitude.toString());
    if (filters.longitude !== undefined) queryParams.append('longitude', filters.longitude.toString());
    if (filters.radiusMeters !== undefined) queryParams.append('radiusMeters', filters.radiusMeters.toString());
    if (filters.page !== undefined) queryParams.append('page', filters.page.toString());
    if (filters.limit !== undefined) queryParams.append('limit', filters.limit.toString());
  }

  return simpleApiRequest<PaginatedIncidentsResponse>(`/incidents`, {
    method: 'GET',
    params: queryParams,
  });
};

// Funkcja do pobierania incydentów w okolicy aktualnego widoku mapy
export const getIncidentsInView = async (
  centerLat: number,
  centerLng: number,
  radiusMeters: number,
  priority?: IncidentPriority,
  isActive: boolean = true
): Promise<IncidentWithVotes[]> => {
  try {
    const response = await getIncidents({
      latitude: centerLat,
      longitude: centerLng,
      radiusMeters,
      priority,
      isActive,
      limit: 100, // Maksymalnie 100 incydentów w jednym widoku
    });

    return response.data;
  } catch (error) {
    console.error('Błąd podczas pobierania incydentów w widoku:', error);
    return [];
  }
};

// Funkcja do pobierania tylko aktywnych incydentów krytycznych
export const getCriticalIncidentsInView = async (
  centerLat: number,
  centerLng: number,
  radiusMeters: number
): Promise<IncidentWithVotes[]> => {
  return getIncidentsInView(centerLat, centerLng, radiusMeters, IncidentPriority.Critical, true);
};
