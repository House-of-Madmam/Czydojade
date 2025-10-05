import { Map, useMap } from '@vis.gl/react-google-maps';
import { config } from '../config';
import { useEffect, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './ui/Button';
import IncidentForm from './IncidentForm';

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

interface Stop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  type: 'bus' | 'tram';
}

interface PublicTransportMapProps {
  origin?: string;
  destination?: string;
  onError?: (message: string) => void;
  onRouteCalculated?: (routeInfo: RouteInfo) => void;
  stops?: Stop[];
  showStops?: boolean;
  stopsNearRoute?: Stop[];
  showReportButton?: boolean;
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

const DirectionsRenderer = ({
  origin,
  destination,
  onError,
  onRouteCalculated,
}: {
  origin: string;
  destination: string;
  onError?: (message: string) => void;
  onRouteCalculated?: (routeInfo: RouteInfo) => void;
}) => {
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

          const steps: TransitStep[] = leg.steps.map((step) => {
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
          leg.steps.forEach((step) => {
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
              errorMessage =
                'Nie znaleziono trasy transportem publicznym. Sprawdź, czy adresy są poprawne lub spróbuj innych lokalizacji.';
              break;
            case 'NOT_FOUND':
              errorMessage =
                'Nie można znaleźć jednego z adresów. Sprawdź, czy wpisałeś pełny adres z miastem (np. "Rynek Główny, Kraków").';
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
      },
    );
  }, [map, origin, destination]);

  return null;
};

const StopsMarkers = ({
  stops,
  showStops,
  stopsNearRoute,
}: {
  stops?: Stop[];
  showStops?: boolean;
  stopsNearRoute?: Stop[];
}) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !showStops || !stops) return;

    const markers: google.maps.Marker[] = [];

    // Funkcja pomocnicza do tworzenia markera
    const createMarker = (stop: Stop, isNearRoute: boolean = false) => {
      const marker = new google.maps.Marker({
        position: { lat: stop.latitude, lng: stop.longitude },
        map: map,
        title: `${stop.name} (${stop.type})`,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: isNearRoute ? 8 : 6,
          fillColor: isNearRoute ? '#FF4444' : stop.type === 'bus' ? '#00AA00' : '#4444FF',
          fillOpacity: 0.8,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
        },
        zIndex: isNearRoute ? 1000 : 500,
      });

      // Dodaj info window z szczegółami
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="font-family: Arial, sans-serif; max-width: 200px;">
            <h3 style="margin: 0 0 8px 0; color: ${stop.type === 'bus' ? '#00AA00' : '#4444FF'};">${stop.name}</h3>
            <p style="margin: 0; color: #666;">Typ: ${stop.type === 'bus' ? 'Autobus' : 'Tramwaj'}</p>
            <p style="margin: 0; color: #666; font-size: 12px;">${stop.latitude.toFixed(6)}, ${stop.longitude.toFixed(6)}</p>
            ${isNearRoute ? '<p style="margin: 4px 0 0 0; color: #FF4444; font-weight: bold;">⚠️ W pobliżu trasy!</p>' : ''}
          </div>
        `,
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      return marker;
    };

    // Dodaj markery wszystkich przystanków
    stops.forEach((stop) => {
      const isNearRoute = stopsNearRoute?.some((nearStop) => nearStop.id === stop.id) ?? false;
      const marker = createMarker(stop, isNearRoute);
      markers.push(marker);
    });

    // Dodaj specjalne markery dla przystanków w pobliżu trasy (jeśli nie są już dodane)
    if (stopsNearRoute) {
      stopsNearRoute.forEach((stop) => {
        // Sprawdź czy marker już istnieje
        const existingMarker = markers.find(
          (marker) => marker.getPosition()?.lat() === stop.latitude && marker.getPosition()?.lng() === stop.longitude,
        );

        if (!existingMarker) {
          const marker = createMarker(stop, true);
          markers.push(marker);
        }
      });
    }

    return () => {
      markers.forEach((marker) => marker.setMap(null));
    };
  }, [map, stops, showStops, stopsNearRoute]);

  return null;
};

const PublicTransportMap = ({
  origin,
  destination,
  onError,
  onRouteCalculated,
  stops,
  showStops,
  stopsNearRoute,
  showReportButton = true,
}: PublicTransportMapProps) => {
  const [showReportModal, setShowReportModal] = useState(false);
  // Dark theme styles for Google Maps
  const darkMapStyles = [
    {
      elementType: 'geometry',
      stylers: [{ color: '#1d2c4d' }],
    },
    {
      elementType: 'labels.text.fill',
      stylers: [{ color: '#8ec3b9' }],
    },
    {
      elementType: 'labels.text.stroke',
      stylers: [{ color: '#1a3646' }],
    },
    {
      featureType: 'administrative.country',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#4b6878' }],
    },
    {
      featureType: 'administrative.land_parcel',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#64779e' }],
    },
    {
      featureType: 'administrative.province',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#4b6878' }],
    },
    {
      featureType: 'landscape.man_made',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#334e87' }],
    },
    {
      featureType: 'landscape.natural',
      elementType: 'geometry',
      stylers: [{ color: '#023e58' }],
    },
    {
      featureType: 'poi',
      stylers: [{ visibility: 'off' }],
    },
    {
      featureType: 'poi.park',
      elementType: 'geometry.fill',
      stylers: [{ color: '#023e58' }],
    },
    {
      featureType: 'poi.park',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#3C7680' }],
    },
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [{ color: '#304a7d' }],
    },
    {
      featureType: 'road',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#98a5be' }],
    },
    {
      featureType: 'road',
      elementType: 'labels.text.stroke',
      stylers: [{ color: '#1d2c4d' }],
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry',
      stylers: [{ color: '#2c6675' }],
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#255763' }],
    },
    {
      featureType: 'road.highway',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#b0d5ce' }],
    },
    {
      featureType: 'road.highway',
      elementType: 'labels.text.stroke',
      stylers: [{ color: '#023e58' }],
    },
    {
      featureType: 'transit',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#98a5be' }],
    },
    {
      featureType: 'transit',
      elementType: 'labels.text.stroke',
      stylers: [{ color: '#1d2c4d' }],
    },
    {
      featureType: 'transit.line',
      elementType: 'geometry.fill',
      stylers: [{ color: '#283d6a' }],
    },
    {
      featureType: 'transit.station',
      elementType: 'geometry',
      stylers: [{ color: '#3a4762', visibility: 'on' }],
    },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#0e1626' }],
    },
    {
      featureType: 'water',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#4e6d70' }],
    },
  ];

  return (
    <div className="relative w-full h-full">
      <Map
        style={{ width: '100%', height: '100%' }}
        mapId={config.googleMapsMapId}
        defaultZoom={13}
        defaultCenter={{ lat: 50.06143, lng: 19.93658 }} // Kraków
        styles={darkMapStyles}
      >
        <TransitLayer />
        {origin && destination && (
          <DirectionsRenderer
            origin={origin}
            destination={destination}
            onError={onError}
            onRouteCalculated={onRouteCalculated}
          />
        )}
        {showStops && (
          <StopsMarkers
            stops={stops}
            showStops={showStops}
            stopsNearRoute={stopsNearRoute}
          />
        )}
      </Map>
      {showReportButton && (
        <div className="absolute bottom-4 right-4 z-10">
          <Button
            onClick={() => setShowReportModal(true)}
            className="bg-black hover:bg-gray-900 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 border border-gray-700"
            title="Zgłoś wypadek"
          >
            <AlertTriangle className="w-5 h-5" />
            <span className="hidden sm:inline">Zgłoś wypadek</span>
          </Button>
        </div>
      )}
      <IncidentForm
        open={showReportModal}
        onOpenChange={setShowReportModal}
      />
    </div>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const isPointNearRoute = (
  point: { lat: number; lng: number },
  routePath: google.maps.LatLng[],
  maxDistanceMeters: number = 100,
): boolean => {
  if (!routePath || routePath.length === 0) return false;

  for (let i = 0; i < routePath.length - 1; i++) {
    const distance = google.maps.geometry.spherical.computeDistanceBetween(
      new google.maps.LatLng(point.lat, point.lng),
      routePath[i],
    );

    if (distance <= maxDistanceMeters) {
      return true;
    }
  }

  return false;
};

export default PublicTransportMap;
