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

// Funkcja do pobierania przystanków w okolicy aktualnej pozycji
export const getNearbyStops = async (
  radiusMeters: number = 5000,
  maxResults: number = 20
): Promise<Stop[]> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolokalizacja nie jest wspierana przez tę przeglądarkę'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          // Pobierz przystanki w promieniu od aktualnej pozycji
          const response = await getStops({
            latitude,
            longitude,
            radiusMeters,
            pageSize: maxResults,
          });

          resolve(response.data);
        } catch (error) {
          reject(error);
        }
      },
      (error) => {
        let errorMessage = 'Nie udało się uzyskać pozycji';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Użytkownik odmówił dostępu do geolokalizacji';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Pozycja jest niedostępna';
            break;
          case error.TIMEOUT:
            errorMessage = 'Przekroczono czas oczekiwania na pozycję';
            break;
        }
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minut cache
      }
    );
  });
};

// Funkcja do wyszukiwania przystanków po nazwie
export const searchStopsByName = async (
  query: string,
  limit: number = 10
): Promise<Stop[]> => {
  if (!query.trim()) return [];

  try {
    const response = await getStops({
      name: query.trim(),
      pageSize: limit,
    });
    return response.data;
  } catch (error) {
    console.error('Błąd podczas wyszukiwania przystanków:', error);
    return [];
  }
};
