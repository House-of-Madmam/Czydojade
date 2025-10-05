// Pomocnicze funkcje do pracy z mapą Google Maps

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
 * Oblicza centrum i maksymalny promień dla danego bounds mapy
 */
export const calculateViewBounds = (bounds: google.maps.LatLngBounds): {
  center: { lat: number; lng: number };
  radiusMeters: number;
} => {
  const center = bounds.getCenter();
  const northEast = bounds.getNorthEast();
  const southWest = bounds.getSouthWest();

  // Oblicz odległość między północno-wschodnim a południowo-zachodnim rogiem
  const distance = calculateDistance(northEast, southWest);

  // Maksymalny promień to połowa przekątnej bounds
  // Dodajemy 10% marginesu bezpieczeństwa
  const radiusMeters = Math.ceil((distance / 2) * 1.1);

  return {
    center: {
      lat: center.lat(),
      lng: center.lng(),
    },
    radiusMeters,
  };
};

/**
 * Bezpiecznie pobiera bounds mapy
 */
export const getVisibleBounds = (map: google.maps.Map): google.maps.LatLngBounds | null => {
  try {
    return map.getBounds() || null;
  } catch {
    return null;
  }
};

/**
 * Sprawdza czy punkt znajduje się w widocznych granicach mapy
 */
export const isPointVisible = (point: { lat: number; lng: number }, map: google.maps.Map): boolean => {
  const bounds = getVisibleBounds(map);
  if (!bounds) return false;

  return bounds.contains(new google.maps.LatLng(point.lat, point.lng));
};

/**
 * Konwertuje poziom zoom na przybliżony promień w metrach
 * (przydatne gdy nie mamy dostępu do bounds)
 */
export const zoomToRadiusMeters = (zoom: number): number => {
  // Przybliżone wartości dla różnych poziomów zoom
  // Na zoom 15: ~5km, zoom 16: ~2.5km, zoom 17: ~1.2km, zoom 18: ~600m
  const zoomLevels = {
    10: 50000,  // ~50km
    11: 25000,  // ~25km
    12: 12000,  // ~12km
    13: 6000,   // ~6km
    14: 3000,   // ~3km
    15: 1500,   // ~1.5km
    16: 750,    // ~750m
    17: 375,    // ~375m
    18: 190,    // ~190m
    19: 95,     // ~95m
    20: 50,     // ~50m
  };

  return zoomLevels[zoom as keyof typeof zoomLevels] || 1000; // domyślnie 1km
};

/**
 * Oblicza optymalny promień na podstawie zoom level i rozmiaru mapy
 */
export const calculateOptimalRadius = (zoom: number, mapWidth: number = 800): number => {
  const baseRadius = zoomToRadiusMeters(zoom);

  // Dostosuj promień na podstawie szerokości mapy
  // Dla szerszych map zwiększamy promień
  const widthMultiplier = Math.max(1, mapWidth / 600);

  return Math.ceil(baseRadius * widthMultiplier);
};
