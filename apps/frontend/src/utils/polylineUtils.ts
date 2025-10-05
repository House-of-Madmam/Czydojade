// Narzędzia do pracy z polylines i interpolacją punktów

/**
 * Oblicza odległość między dwoma punktami używając wzoru haversine (bez biblioteki geometry)
 */
const calculateDistance = (point1: google.maps.LatLng, point2: google.maps.LatLng): number => {
  const R = 6371000; // Promień Ziemi w metrach
  const lat1Rad = (point1.lat() * Math.PI) / 180;
  const lat2Rad = (point2.lat() * Math.PI) / 180;
  const deltaLatRad = ((point2.lat() - point1.lat()) * Math.PI) / 180;
  const deltaLngRad = ((point2.lng() - point1.lng()) * Math.PI) / 180;

  const a =
    Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/**
 * Dekoduje zakodowaną polyline z Google Maps API na tablicę współrzędnych
 */
export function decodePolyline(encoded: string): google.maps.LatLng[] {
  const points: google.maps.LatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let b;
    let shift = 0;
    let result = 0;

    // Dekoduj latitude
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    shift = 0;
    result = 0;

    // Dekoduj longitude
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    points.push(new google.maps.LatLng(lat * 1e-5, lng * 1e-5));
  }

  return points;
}

/**
 * Wyciąga overview_polyline z odpowiedzi Directions API
 */
export function getOverviewPolylineFromDirections(result: google.maps.DirectionsResult): string | null {
  if (!result.routes || result.routes.length === 0) return null;
  return result.routes[0].overview_polyline;
}

/**
 * Interpoluje punkty na trasie co określoną odległość (w metrach)
 */
export function interpolatePointsOnRoute(
  polylinePoints: google.maps.LatLng[],
  intervalMeters: number = 100,
): google.maps.LatLng[] {
  if (polylinePoints.length < 2) return polylinePoints;

  const interpolatedPoints: google.maps.LatLng[] = [];
  interpolatedPoints.push(polylinePoints[0]); // Pierwszy punkt

  let currentPoint = polylinePoints[0];
  let nextIndex = 1;

  while (nextIndex < polylinePoints.length) {
    const nextPoint = polylinePoints[nextIndex];
    const distanceToNext = calculateDistance(currentPoint, nextPoint);

    if (distanceToNext >= intervalMeters) {
      // Oblicz punkt interpolowany
      const ratio = intervalMeters / distanceToNext;
      const interpolatedLat = currentPoint.lat() + (nextPoint.lat() - currentPoint.lat()) * ratio;
      const interpolatedLng = currentPoint.lng() + (nextPoint.lng() - currentPoint.lng()) * ratio;

      const interpolatedPoint = new google.maps.LatLng(interpolatedLat, interpolatedLng);
      interpolatedPoints.push(interpolatedPoint);

      currentPoint = interpolatedPoint;
    } else {
      // Jeśli odległość jest mniejsza niż interval, przejdź do następnego punktu
      nextIndex++;
      currentPoint = nextPoint;
      interpolatedPoints.push(currentPoint);
    }
  }

  return interpolatedPoints;
}

/**
 * Sprawdza czy punkt jest w pobliżu gęstszej siatki punktów trasy
 */
export function isPointNearInterpolatedRoute(
  point: { lat: number; lng: number },
  interpolatedPoints: google.maps.LatLng[],
  maxDistanceMeters: number = 50,
): { isNear: boolean; nearestPoint?: google.maps.LatLng; distance?: number } {
  if (!interpolatedPoints || interpolatedPoints.length === 0) {
    return { isNear: false };
  }

  let nearestDistance = Infinity;
  let nearestPoint: google.maps.LatLng | undefined;

  for (const routePoint of interpolatedPoints) {
    const distance = calculateDistance(
      new google.maps.LatLng(point.lat, point.lng),
      routePoint,
    );

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestPoint = routePoint;
    }
  }

  return {
    isNear: nearestDistance <= maxDistanceMeters,
    nearestPoint,
    distance: nearestDistance,
  };
}

/**
 * Główna funkcja workflow: pobiera trasę, dekoduje i interpoluje punkty
 */
export async function getInterpolatedRoutePoints(
  origin: string,
  destination: string,
  intervalMeters: number = 100,
): Promise<{
  success: boolean;
  points?: google.maps.LatLng[];
  error?: string;
  routeInfo?: {
    totalDistance: string;
    totalDuration: string;
  };
}> {
  try {
    const directionsService = new google.maps.DirectionsService();

    return new Promise((resolve) => {
      directionsService.route(
        {
          origin: origin,
          destination: destination,
          travelMode: google.maps.TravelMode.TRANSIT,
        },
        (result, status) => {
          if (status === 'OK' && result) {
            const polyline = getOverviewPolylineFromDirections(result);
            if (!polyline) {
              resolve({ success: false, error: 'Nie udało się pobrać polyline' });
              return;
            }

            const decodedPoints = decodePolyline(polyline);
            const interpolatedPoints = interpolatePointsOnRoute(decodedPoints, intervalMeters);

            const route = result.routes[0];
            const leg = route.legs[0];

            resolve({
              success: true,
              points: interpolatedPoints,
              routeInfo: {
                totalDistance: leg.distance?.text || '',
                totalDuration: leg.duration?.text || '',
              },
            });
          } else {
            resolve({
              success: false,
              error: `Błąd API Directions: ${status}`,
            });
          }
        },
      );
    });
  } catch (error) {
    return {
      success: false,
      error: `Błąd: ${error instanceof Error ? error.message : 'Nieznany błąd'}`,
    };
  }
}
