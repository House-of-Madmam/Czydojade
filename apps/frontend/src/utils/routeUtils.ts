// Pomocnicze funkcje do pracy z trasami transportu publicznego

import { RouteInfo } from '../components/PublicTransportMap';

/**
 * Wyciąga wszystkie linie transportu publicznego z trasy
 */
export const getTransitLines = (routeInfo: RouteInfo): string[] => {
  const lines: string[] = [];

  routeInfo.steps.forEach((step) => {
    if (step.transitDetails) {
      lines.push(step.transitDetails.line);
    }
  });

  return lines;
};

/**
 * Wyciąga wszystkie przystanki z trasy
 */
export const getAllStops = (routeInfo: RouteInfo): { name: string; type: 'departure' | 'arrival' }[] => {
  const stops: { name: string; type: 'departure' | 'arrival' }[] = [];

  routeInfo.steps.forEach((step) => {
    if (step.transitDetails) {
      stops.push({
        name: step.transitDetails.departureStop,
        type: 'departure',
      });
      stops.push({
        name: step.transitDetails.arrivalStop,
        type: 'arrival',
      });
    }
  });

  return stops;
};

/**
 * Zwraca informacje o pojazdach używanych w trasie
 */
export const getVehicleTypes = (routeInfo: RouteInfo): string[] => {
  const vehicles = new Set<string>();

  routeInfo.steps.forEach((step) => {
    if (step.transitDetails) {
      vehicles.add(step.transitDetails.vehicle);
    }
  });

  return Array.from(vehicles);
};

/**
 * Sprawdza czy obiekt znajduje się w pobliżu któregoś z przystanków
 */
export const isNearAnyStop = (
  _point: { lat: number; lng: number },
  _routeInfo: RouteInfo,
  _maxDistanceMeters: number = 100,
): { isNear: boolean; nearestStop?: string; distance?: number } => {
  // Ta funkcja wymaga dostępu do współrzędnych przystanków
  // W rzeczywistej implementacji należałoby pobrać współrzędne przystanków
  // z Directions API lub Places API

  return {
    isNear: false,
    nearestStop: undefined,
    distance: undefined,
  };
};

/**
 * Zlicza łączną liczbę przystanków na trasie
 */
export const getTotalStopsCount = (routeInfo: RouteInfo): number => {
  let total = 0;

  routeInfo.steps.forEach((step) => {
    if (step.transitDetails) {
      total += step.transitDetails.numStops;
    }
  });

  return total;
};

/**
 * Formatuje informacje o trasie do wyświetlenia
 */
export const formatRouteForDisplay = (routeInfo: RouteInfo): string => {
  const lines = getTransitLines(routeInfo);
  const vehicles = getVehicleTypes(routeInfo);
  const stops = getTotalStopsCount(routeInfo);

  return `Trasa: ${lines.join(' → ')} | Pojazdy: ${vehicles.join(', ')} | Przystanki: ${stops} | Czas: ${routeInfo.totalDuration} | Dystans: ${routeInfo.totalDistance}`;
};
