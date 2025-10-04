# Workflow interpolacji punktów trasy transportu publicznego

## 📋 Spis treści
1. [Workflow krok po kroku](#workflow-krok-po-kroku)
2. [Funkcje implementacji](#funkcje-implementacji)
3. [Przykłady użycia](#przykłady-użycia)
4. [Porównanie dokładności](#porównanie-dokładności)

---

## Workflow krok po kroku

### 1. Wysyłanie zapytania do Directions API

```typescript
const directionsService = new google.maps.DirectionsService();

directionsService.route({
  origin: "Rynek Główny, Kraków",
  destination: "Dworzec Główny, Kraków",
  travelMode: google.maps.TravelMode.TRANSIT,
}, (result, status) => {
  // Obsługa odpowiedzi
});
```

### 2. Wyciąganie overview_polyline z odpowiedzi

```typescript
const polyline = result.routes[0].overview_polyline; // Zakodowany string
```

### 3. Dekodowanie polyline na współrzędne

```typescript
const decodedPoints = decodePolyline(polyline);
// Wynik: google.maps.LatLng[]
```

### 4. Interpolacja punktów co 100 metrów

```typescript
const interpolatedPoints = interpolatePointsOnRoute(decodedPoints, 100);
// Wynik: gęstsza siatka punktów co 100 metrów
```

### 5. Sprawdzanie bliskości punktów

```typescript
const isNear = isPointNearInterpolatedRoute(
  { lat: 50.0614, lng: 19.9366 },
  interpolatedPoints,
  50 // maksymalna odległość w metrach
);
```

---

## Funkcje implementacji

### 1. `decodePolyline(encoded: string): google.maps.LatLng[]`

Dekoduje zakodowany string polyline na tablicę współrzędnych.

**Algorytm:**
- Przetwarza każdy bajt zakodowanego stringu
- Dekoduje delta-encoding dla latitude i longitude
- Konwertuje na współrzędne geograficzne

### 2. `interpolatePointsOnRoute(points: google.maps.LatLng[], interval: number)`

Tworzy gęstszą siatkę punktów co określoną odległość.

**Algorytm:**
- Przechodzi przez kolejne segmenty trasy
- Dla każdego segmentu dłuższej niż `interval`:
  - Oblicza współrzędne interpolowane
  - Dodaje punkt do wyniku
- Dla segmentów krótszych - dodaje oryginalny punkt końcowy

### 3. `isPointNearInterpolatedRoute(point, points, maxDistance)`

Sprawdza odległość punktu od najbliższego punktu gęstszej siatki.

**Zwraca:**
```typescript
{
  isNear: boolean,
  nearestPoint?: google.maps.LatLng,
  distance?: number
}
```

### 4. `getInterpolatedRoutePoints(origin, destination, interval)`

Główna funkcja workflow - wykonuje cały proces w jednej funkcji.

---

## Przykłady użycia

### Przykład 1: Podstawowe użycie

```typescript
import { getInterpolatedRoutePoints } from './utils/polylineUtils';

const result = await getInterpolatedRoutePoints(
  "Rynek Główny, Kraków",
  "Dworzec Główny, Kraków",
  100 // punkty co 100 metrów
);

if (result.success) {
  console.log(`Liczba punktów: ${result.points.length}`);
  console.log(`Dystans: ${result.routeInfo.totalDistance}`);

  // Sprawdź bliskosć punktu
  const hospital = { lat: 50.0614, lng: 19.9366 };
  const isNear = isPointNearInterpolatedRoute(hospital, result.points, 50);

  console.log(`Szpital jest ${isNear.distance.toFixed(1)}m od trasy`);
}
```

### Przykład 2: Monitorowanie obiektów w czasie rzeczywistym

```typescript
function trackObjectsNearRoute(routePoints: google.maps.LatLng[]) {
  const objects = [
    { id: 'obj1', lat: 50.0614, lng: 19.9366 },
    { id: 'obj2', lat: 50.0524, lng: 19.9440 },
  ];

  objects.forEach(obj => {
    const proximity = isPointNearInterpolatedRoute(obj, routePoints, 100);

    if (proximity.isNear) {
      console.log(`${obj.id} jest blisko trasy (${proximity.distance.toFixed(1)}m)`);
      // Wyślij powiadomienie lub wykonaj akcję
    }
  });
}
```

### Przykład 3: Wizualizacja gęstszej siatki punktów

```typescript
function visualizeInterpolatedPoints(points: google.maps.LatLng[]) {
  points.forEach((point, index) => {
    new google.maps.Marker({
      position: point,
      map: map,
      title: `Punkt ${index} (${point.lat().toFixed(6)}, ${point.lng().toFixed(6)})`,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 3,
        fillColor: '#FF0000',
        fillOpacity: 0.7,
        strokeWeight: 1
      }
    });
  });
}
```

---

## Porównanie dokładności

### Oryginalna trasa (overview_polyline)
- **Liczba punktów**: ~20-50 na trasę
- **Odległość między punktami**: 100-500 metrów
- **Dokładność sprawdzania**: ±200 metrów

### Interpolowana trasa (co 100 metrów)
- **Liczba punktów**: 50-200+ na trasę
- **Odległość między punktami**: dokładnie 100 metrów
- **Dokładność sprawdzania**: ±50 metrów

### Porównanie dla przykładowej trasy:

| Metoda | Punkty trasy | Dokładność | Czas wykonania |
|--------|-------------|------------|----------------|
| Oryginalna | ~30 punktów | ±200m | Natychmiast |
| Interpolowana | ~80 punktów | ±50m | ~100ms |

---

## ⚡ Optymalizacje wydajności

### 1. Cache'owanie wyników

```typescript
const routeCache = new Map<string, google.maps.LatLng[]>();

function getCachedInterpolatedRoute(key: string, origin: string, destination: string) {
  if (routeCache.has(key)) {
    return routeCache.get(key);
  }

  // Pobierz nową trasę
  getInterpolatedRoutePoints(origin, destination).then(result => {
    if (result.success && result.points) {
      routeCache.set(key, result.points);
    }
  });
}
```

### 2. Progresywna interpolacja

```typescript
// Dla bardzo długich tras - interpoluj tylko widoczny obszar
function interpolateVisibleSection(points: google.maps.LatLng[], bounds: google.maps.LatLngBounds) {
  return points.filter(point => bounds.contains(point));
}
```

### 3. Worker threads dla ciężkich obliczeń

```typescript
// Dla bardzo gęstych siatek (>1000 punktów) użyj Web Worker
const interpolationWorker = new Worker('./interpolation-worker.js');
```

---

## 🔧 Konfiguracja

### Parametry interpolacji:

```typescript
const CONFIG = {
  DEFAULT_INTERVAL: 100,      // Punkty co 100 metrów
  MAX_DISTANCE: 50,           // Maksymalna odległość do sprawdzenia
  CACHE_TTL: 1000 * 60 * 30, // Cache na 30 minut
};
```

### Obsługa błędów:

```typescript
try {
  const result = await getInterpolatedRoutePoints(origin, destination);

  if (!result.success) {
    console.error('Błąd interpolacji:', result.error);
    // Fallback do oryginalnej metody
    return isPointNearRoute(point, originalPolyline);
  }
} catch (error) {
  // Obsługa błędów sieciowych
}
```

---

## 📊 Metryki i monitoring

### Śledzenie wydajności:

```typescript
const metrics = {
  routeRequests: 0,
  interpolationTime: 0,
  proximityChecks: 0,
};

function trackMetrics(operation: string, timeMs: number) {
  console.log(`${operation}: ${timeMs}ms`);
  metrics.interpolationTime += timeMs;
}
```

### Debugowanie:

```typescript
// Włącz debugowanie dla rozwoju
const DEBUG = true;

if (DEBUG) {
  console.log('Decoded points:', decodedPoints.length);
  console.log('Interpolated points:', interpolatedPoints.length);
  console.log('Distance check:', proximity);
}
```
