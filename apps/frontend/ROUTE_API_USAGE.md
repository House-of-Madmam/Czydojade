# Dokumentacja API tras transportu publicznego

## 📋 Spis treści
1. [Wyciąganie informacji o trasie](#wyciąganie-informacji-o-trasie)
2. [Sprawdzanie bliskości do trasy](#sprawdzanie-bliskości-do-trasy)
3. [Funkcje pomocnicze](#funkcje-pomocnicze)
4. [Przykłady użycia](#przykłady-użycia)

---

## Wyciąganie informacji o trasie

### Interfejs `RouteInfo`

Główny interfejs zawierający szczegółowe informacje o trasie:

```typescript
interface RouteInfo {
  steps: TransitStep[];           // Kroki trasy
  totalDistance: string;          // Całkowity dystans (np. "5.2 km")
  totalDuration: string;          // Całkowity czas (np. "25 mins")
  polylinePath: google.maps.LatLng[];  // Punkty geograficzne trasy
}
```

### Interfejs `TransitStep`

Pojedynczy krok w trasie (może być pieszym lub transportem publicznym):

```typescript
interface TransitStep {
  instruction: string;      // Instrukcja (HTML)
  distance: string;         // Dystans kroku
  duration: string;         // Czas kroku
  transitDetails?: {        // Obecne tylko dla kroków transportu publicznego
    line: string;           // Numer linii (np. "128", "18")
    vehicle: string;        // Typ pojazdu (np. "Autobus", "Tramwaj")
    departureStop: string;  // Nazwa przystanku początkowego
    arrivalStop: string;    // Nazwa przystanku końcowego
    departureTime: string;  // Czas odjazdu
    arrivalTime: string;    // Czas przyjazdu
    numStops: number;       // Liczba przystanków
    headsign: string;       // Kierunek pojazdu
  };
}
```

---

## Sprawdzanie bliskości do trasy

### Funkcja `isPointNearRoute`

Sprawdza, czy punkt geograficzny znajduje się w pobliżu trasy:

```typescript
isPointNearRoute(
  point: { lat: number; lng: number },
  routePath: google.maps.LatLng[],
  maxDistanceMeters: number = 100
): boolean
```

**Parametry:**
- `point` - Współrzędne punktu do sprawdzenia
- `routePath` - Tablica punktów geograficznych trasy (z `RouteInfo.polylinePath`)
- `maxDistanceMeters` - Maksymalna odległość w metrach (domyślnie 100m)

**Zwraca:** `true` jeśli punkt jest w pobliżu trasy, `false` w przeciwnym razie

**Przykład:**
```typescript
const testPoint = { lat: 50.0614, lng: 19.9366 };
const isNear = isPointNearRoute(testPoint, routeInfo.polylinePath, 100);
console.log('Czy punkt jest w pobliżu trasy:', isNear);
```

---

## Funkcje pomocnicze

W pliku `src/utils/routeUtils.ts` znajdują się funkcje pomocnicze:

### 1. `getTransitLines(routeInfo: RouteInfo): string[]`
Zwraca wszystkie linie transportu publicznego użyte w trasie.

```typescript
const lines = getTransitLines(routeInfo);
// Wynik: ["128", "18", "502"]
```

### 2. `getAllStops(routeInfo: RouteInfo)`
Zwraca wszystkie przystanki na trasie z typem (odjazd/przyjazd).

```typescript
const stops = getAllStops(routeInfo);
// Wynik: [
//   { name: "Rynek Główny", type: "departure" },
//   { name: "Dworzec Główny", type: "arrival" }
// ]
```

### 3. `getVehicleTypes(routeInfo: RouteInfo): string[]`
Zwraca unikalne typy pojazdów użyte w trasie.

```typescript
const vehicles = getVehicleTypes(routeInfo);
// Wynik: ["Autobus", "Tramwaj"]
```

### 4. `getTotalStopsCount(routeInfo: RouteInfo): number`
Zlicza łączną liczbę przystanków na trasie.

```typescript
const totalStops = getTotalStopsCount(routeInfo);
// Wynik: 12
```

### 5. `formatRouteForDisplay(routeInfo: RouteInfo): string`
Formatuje informacje o trasie do czytelnej postaci.

```typescript
const description = formatRouteForDisplay(routeInfo);
// Wynik: "Trasa: 128 → 18 | Pojazdy: Autobus, Tramwaj | Przystanki: 12 | Czas: 25 mins | Dystans: 5.2 km"
```

---

## Przykłady użycia

### Przykład 1: Wyświetlanie szczegółów wszystkich linii

```typescript
import { getTransitLines, getVehicleTypes } from './utils/routeUtils';

function displayRouteInfo(routeInfo: RouteInfo) {
  const lines = getTransitLines(routeInfo);
  const vehicles = getVehicleTypes(routeInfo);
  
  console.log('Linie:', lines.join(', '));
  console.log('Pojazdy:', vehicles.join(', '));
  console.log('Czas podróży:', routeInfo.totalDuration);
}
```

### Przykład 2: Sprawdzanie czy obiekt jest w pobliżu trasy

```typescript
import { isPointNearRoute } from './components/PublicTransportMap';

function checkPointsNearRoute(routeInfo: RouteInfo) {
  const pointsOfInterest = [
    { name: "Muzeum", lat: 50.0614, lng: 19.9366 },
    { name: "Park", lat: 50.0524, lng: 19.9440 },
    { name: "Szpital", lat: 50.0700, lng: 19.9450 }
  ];
  
  pointsOfInterest.forEach(poi => {
    const isNear = isPointNearRoute(
      { lat: poi.lat, lng: poi.lng },
      routeInfo.polylinePath,
      200  // 200 metrów
    );
    
    if (isNear) {
      console.log(`${poi.name} jest w pobliżu trasy!`);
    }
  });
}
```

### Przykład 3: Analiza szczegółów każdego kroku

```typescript
function analyzeRouteSteps(routeInfo: RouteInfo) {
  routeInfo.steps.forEach((step, index) => {
    if (step.transitDetails) {
      // To jest krok transportu publicznego
      console.log(`Krok ${index + 1}: Transport publiczny`);
      console.log(`  Linia: ${step.transitDetails.line}`);
      console.log(`  Pojazd: ${step.transitDetails.vehicle}`);
      console.log(`  Z: ${step.transitDetails.departureStop}`);
      console.log(`  Do: ${step.transitDetails.arrivalStop}`);
      console.log(`  Przystanków: ${step.transitDetails.numStops}`);
      console.log(`  Kierunek: ${step.transitDetails.headsign}`);
    } else {
      // To jest krok pieszy
      console.log(`Krok ${index + 1}: Pieszo`);
      console.log(`  Dystans: ${step.distance}`);
      console.log(`  Czas: ${step.duration}`);
    }
  });
}
```

### Przykład 4: Monitorowanie pozycji pojazdu względem trasy

```typescript
function trackVehiclePosition(
  vehiclePosition: { lat: number; lng: number },
  routeInfo: RouteInfo
) {
  // Sprawdź czy pojazd jest na trasie
  const isOnRoute = isPointNearRoute(
    vehiclePosition,
    routeInfo.polylinePath,
    50  // 50 metrów - ścisła tolerancja
  );
  
  if (isOnRoute) {
    console.log('✅ Pojazd jest na zaplanowanej trasie');
  } else {
    console.log('⚠️ Pojazd odbiega od zaplanowanej trasy');
  }
  
  return isOnRoute;
}
```

### Przykład 5: Integracja w komponencie React

```typescript
import { useState } from 'react';
import PublicTransportMap, { RouteInfo, isPointNearRoute } from './components/PublicTransportMap';

function MyComponent() {
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  
  const handleRouteCalculated = (info: RouteInfo) => {
    setRouteInfo(info);
    
    // Sprawdź czy konkretne miejsce jest na trasie
    const pointToCheck = { lat: 50.0614, lng: 19.9366 };
    const isNear = isPointNearRoute(pointToCheck, info.polylinePath, 100);
    
    if (isNear) {
      alert('Twoje miejsce docelowe jest w pobliżu tej trasy!');
    }
  };
  
  return (
    <PublicTransportMap
      origin="Rynek Główny, Kraków"
      destination="Dworzec Główny, Kraków"
      onRouteCalculated={handleRouteCalculated}
    />
  );
}
```

---

## 🔧 Wymagania techniczne

Aby używać funkcji sprawdzania odległości, w pliku HTML musi być załadowana biblioteka Google Maps Geometry:

```html
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=geometry"></script>
```

Lub w przypadku użycia `@vis.gl/react-google-maps`, biblioteka jest już dołączona.

---

## 📊 Dane zwracane przez API

Wszystkie dane pochodzą z Google Maps Directions API w trybie `TRANSIT`. API zwraca:

- **Szczegóły linii** - numery, nazwy, kolory
- **Typy pojazdów** - autobus, tramwaj, metro, pociąg
- **Przystanki** - nazwy, lokalizacje (współrzędne)
- **Rozkład jazdy** - czasy odjazdu i przyjazdu
- **Geometrię trasy** - dokładna ścieżka (polyline)

---

## ⚠️ Uwagi

1. **Limity API** - Google Maps API ma limity wywołań i może być płatne
2. **Dokładność** - Funkcja `isPointNearRoute` sprawdza odległość euklidesową, nie uwzględnia przeszkód
3. **Aktualizacje** - Dane rozkładu jazdy mogą się zmieniać
4. **Geolokalizacja** - Wymaga przeglądarki wspierającej Geolocation API

