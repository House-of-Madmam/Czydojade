import { Map, useMap } from '@vis.gl/react-google-maps';
import { config } from '../config';
import { useEffect, useRef } from 'react';

export interface TransitStep {
  instruction: string;
  distance: string;
  duration: string;
  transitDetails?: {
    line: string;
    vehicle: string;
    departureStop: string;
    arrivalStop: string;
    departureTime: string;
    arrivalTime: string;
    numStops: number;
    headsign: string;
  };
}

export interface RouteInfo {
  steps: TransitStep[];
  totalDistance: string;
  totalDuration: string;
  polylinePath: google.maps.LatLng[];
}

interface PublicTransportMapProps {
  origin?: string;
  destination?: string;
  onError?: (message: string) => void;
  onRouteCalculated?: (routeInfo: RouteInfo) => void;
}

const TransitLayer = () => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const transitLayer = new google.maps.TransitLayer();
    transitLayer.setMap(map);

    return () => {
      transitLayer.setMap(null);
    };
  }, [map]);

  return null;
};

const DirectionsRenderer = ({ origin, destination, onError, onRouteCalculated }: { origin: string; destination: string; onError?: (message: string) => void; onRouteCalculated?: (routeInfo: RouteInfo) => void }) => {
  const map = useMap();
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const onErrorRef = useRef(onError);
  const onRouteCalculatedRef = useRef(onRouteCalculated);

  // Aktualizuj referencje do callbacków
  useEffect(() => {
    onErrorRef.current = onError;
    onRouteCalculatedRef.current = onRouteCalculated;
  }, [onError, onRouteCalculated]);

  useEffect(() => {
    if (!map) return;

    // Utwórz DirectionsService tylko raz
    if (!directionsServiceRef.current) {
      directionsServiceRef.current = new google.maps.DirectionsService();
    }

    // Utwórz DirectionsRenderer tylko raz
    if (!directionsRendererRef.current) {
      directionsRendererRef.current = new google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: false,
        polylineOptions: {
          strokeColor: '#4285F4',
          strokeWeight: 5,
        },
      });
    }

    return () => {
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
        directionsRendererRef.current = null;
      }
      directionsServiceRef.current = null;
    };
  }, [map]);

  useEffect(() => {
    if (!map || !origin || !destination || !directionsServiceRef.current || !directionsRendererRef.current) return;

    directionsServiceRef.current.route(
      {
        origin: origin,
        destination: destination,
        travelMode: google.maps.TravelMode.TRANSIT,
      },
      (result, status) => {
        if (status === 'OK' && result && directionsRendererRef.current) {
          directionsRendererRef.current.setDirections(result);
          onErrorRef.current?.(''); // Clear error on success
          
          // Wyciągnij szczegółowe informacje o trasie
          const route = result.routes[0];
          const leg = route.legs[0];
          
          const steps: TransitStep[] = leg.steps.map(step => {
            const stepInfo: TransitStep = {
              instruction: step.instructions,
              distance: step.distance?.text || '',
              duration: step.duration?.text || '',
            };

            // Jeśli krok to transport publiczny, dodaj szczegóły
            if (step.transit) {
              stepInfo.transitDetails = {
                line: step.transit.line.short_name || step.transit.line.name,
                vehicle: step.transit.line.vehicle.name,
                departureStop: step.transit.departure_stop.name,
                arrivalStop: step.transit.arrival_stop.name,
                departureTime: step.transit.departure_time.text,
                arrivalTime: step.transit.arrival_time.text,
                numStops: step.transit.num_stops,
                headsign: step.transit.headsign,
              };
            }

            return stepInfo;
          });

          // Zbierz wszystkie punkty trasy do polyline
          const polylinePath: google.maps.LatLng[] = [];
          leg.steps.forEach(step => {
            if (step.path) {
              polylinePath.push(...step.path);
            }
          });

          const routeInfo: RouteInfo = {
            steps,
            totalDistance: leg.distance?.text || '',
            totalDuration: leg.duration?.text || '',
            polylinePath,
          };

          onRouteCalculatedRef.current?.(routeInfo);
        } else {
          console.error('Błąd wyznaczania trasy:', status);
          
          let errorMessage = '';
          switch (status) {
            case 'ZERO_RESULTS':
              errorMessage = 'Nie znaleziono trasy transportem publicznym. Sprawdź, czy adresy są poprawne lub spróbuj innych lokalizacji.';
              break;
            case 'NOT_FOUND':
              errorMessage = 'Nie można znaleźć jednego z adresów. Sprawdź, czy wpisałeś pełny adres z miastem (np. "Rynek Główny, Kraków").';
              break;
            case 'INVALID_REQUEST':
              errorMessage = 'Nieprawidłowe zapytanie. Upewnij się, że oba adresy są wprowadzone poprawnie.';
              break;
            case 'OVER_QUERY_LIMIT':
              errorMessage = 'Przekroczono limit zapytań. Spróbuj ponownie za chwilę.';
              break;
            case 'REQUEST_DENIED':
              errorMessage = 'Odmowa dostępu do API. Sprawdź konfigurację klucza API Google Maps.';
              break;
            case 'UNKNOWN_ERROR':
              errorMessage = 'Nieznany błąd serwera. Spróbuj ponownie.';
              break;
            default:
              errorMessage = `Błąd: ${status}`;
          }
          
          onErrorRef.current?.(errorMessage);
        }
      }
    );
  }, [map, origin, destination]);

  return null;
};

const PublicTransportMap = ({ origin, destination, onError, onRouteCalculated }: PublicTransportMapProps) => {
  return (
    <Map
      style={{ width: '100%', height: '100%' }}
      mapId={config.googleMapsMapId}
      defaultZoom={13}
      defaultCenter={{ lat: 50.06143, lng: 19.93658 }} // Kraków
    >
      <TransitLayer />
      {origin && destination && <DirectionsRenderer origin={origin} destination={destination} onError={onError} onRouteCalculated={onRouteCalculated} />}
    </Map>
  );
};

// Funkcja pomocnicza: sprawdza czy punkt jest w pobliżu trasy
export const isPointNearRoute = (
  point: { lat: number; lng: number },
  routePath: google.maps.LatLng[],
  maxDistanceMeters: number = 100
): boolean => {
  if (!routePath || routePath.length === 0) return false;

  for (let i = 0; i < routePath.length - 1; i++) {
    const distance = google.maps.geometry.spherical.computeDistanceBetween(
      new google.maps.LatLng(point.lat, point.lng),
      routePath[i]
    );

    if (distance <= maxDistanceMeters) {
      return true;
    }
  }

  return false;
};

export default PublicTransportMap;

