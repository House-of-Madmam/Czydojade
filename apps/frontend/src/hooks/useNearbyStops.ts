import { useEffect, useState } from 'react';
import { getStops } from '../api/queries/stops';
import type { Stop, StopsQueryParams } from '../api/queries/stops';

interface UseNearbyStopsParams {
  latitude: number | null;
  longitude: number | null;
  radiusMeters?: number;
  name?: string;
}

interface UseNearbyStopsResult {
  stops: Stop[];
  total: number;
  loading: boolean;
  error: string | null;
}

export const useNearbyStops = ({ latitude, longitude, radiusMeters, name }: UseNearbyStopsParams): UseNearbyStopsResult => {
  const [stops, setStops] = useState<Stop[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStops = async () => {
      setLoading(true);
      setError(null);

      try {
        const params: StopsQueryParams = {};

        if (latitude && longitude) {
          params.latitude = latitude;
          params.longitude = longitude;
          if (radiusMeters) {
            params.radiusMeters = radiusMeters;
          }
        }

        if (name) {
          params.name = name;
        }

        const result = await getStops(params);
        setStops(result.data);
        setTotal(result.total);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    if (latitude || longitude || name) {
      fetchStops();
    }
  }, [latitude, longitude, radiusMeters, name]);

  return { stops, total, loading, error };
};