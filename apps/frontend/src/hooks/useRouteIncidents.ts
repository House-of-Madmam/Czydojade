import { useEffect, useState, useCallback, useRef } from 'react';
import { getIncidentsOnRoute } from '../api/queries/getIncidents';
import type { IncidentWithVotes, IncidentPriority } from '../api/types/incident';

interface UseRouteIncidentsParams {
  routePoints: { lat: number; lng: number }[] | null;
  routeRadiusMeters?: number;
  isActive?: boolean;
  priority?: IncidentPriority;
  limit?: number;
  enabled?: boolean; // Czy monitorowanie jest włączone
  pollingInterval?: number; // Interwał w ms (domyślnie 10 sekund)
}

interface UseRouteIncidentsResult {
  incidents: IncidentWithVotes[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  isMonitoring: boolean;
  refetch: () => Promise<void>;
  startMonitoring: () => void;
  stopMonitoring: () => void;
}

export const useRouteIncidents = ({
  routePoints,
  routeRadiusMeters = 300,
  isActive = true,
  priority,
  limit = 50,
  enabled = true,
  pollingInterval = 10000, // 10 sekund
}: UseRouteIncidentsParams): UseRouteIncidentsResult => {
  const [incidents, setIncidents] = useState<IncidentWithVotes[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(enabled);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Funkcja do pobierania incydentów
  const fetchIncidents = useCallback(async () => {
    if (!routePoints || routePoints.length === 0) {
      setIncidents([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getIncidentsOnRoute(routePoints, routeRadiusMeters, isActive, priority, limit);

      if (isMountedRef.current) {
        setIncidents(data);
        setLastUpdated(new Date());
        console.log(`🚨 Znaleziono ${data.length} incydentów na trasie (promień: ${routeRadiusMeters}m)`);
      }
    } catch (err) {
      if (isMountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Błąd podczas pobierania incydentów na trasie';
        setError(errorMessage);
        console.error('❌ Błąd monitorowania trasy:', errorMessage);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [routePoints, routeRadiusMeters, isActive, priority, limit]);

  // Funkcja do manualnego odświeżenia
  const refetch = useCallback(async () => {
    await fetchIncidents();
  }, [fetchIncidents]);

  // Funkcje do kontrolowania monitorowania
  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
  }, []);

  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
  }, []);

  // Efekt do zarządzania pollingiem
  useEffect(() => {
    if (!enabled || !isMonitoring || !routePoints || routePoints.length === 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Natychmiastowe pierwsze pobranie
    fetchIncidents();

    // Ustawienie interwału
    intervalRef.current = setInterval(fetchIncidents, pollingInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, isMonitoring, routePoints, fetchIncidents, pollingInterval]);

  // Efekt czyszczący przy odmontowaniu komponentu
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    incidents,
    loading,
    error,
    lastUpdated,
    isMonitoring,
    refetch,
    startMonitoring,
    stopMonitoring,
  };
};
