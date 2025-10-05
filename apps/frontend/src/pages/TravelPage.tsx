import { APIProvider } from '@vis.gl/react-google-maps';
import PublicTransportMap, { RouteInfo, isPointNearRoute } from '../components/PublicTransportMap';
import LocationInput from '../components/LocationInput';
import IncidentForm from '../components/IncidentForm';
import { isPointNearInterpolatedRoute, getInterpolatedRoutePoints } from '../utils/polylineUtils';
import { getStops, getNearbyStops, type Stop } from '../api/queries/getStops';
import { config } from '../config';
import { useState, useCallback, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function TravelPage() {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [searchOrigin, setSearchOrigin] = useState('');
  const [searchDestination, setSearchDestination] = useState('');
  const [error, setError] = useState('');
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [showRouteDetails, setShowRouteDetails] = useState(false);
  const [allStops, setAllStops] = useState<Stop[]>([]);
  const [originSuggestions, setOriginSuggestions] = useState<Stop[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<Stop[]>([]);
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
  const [stopsLoading, setStopsLoading] = useState(false);
  const [showStops, setShowStops] = useState(false);
  const [stopsNearRoute, setStopsNearRoute] = useState<Stop[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string>('');
  const [showReportModal, setShowReportModal] = useState(false);

  const handleSearch = () => {
    if (searchOrigin && searchDestination) {
      setError('');
      setOrigin(searchOrigin);
      setDestination(searchDestination);
    }
  };

  const handleClear = () => {
    setOrigin('');
    setDestination('');
    setSearchOrigin('');
    setSearchDestination('');
    setError('');
    setRouteInfo(null);
    setShowRouteDetails(false);
    setStopsNearRoute([]);
    setShowStops(false);
  };

  // Ładowanie przystanków w okolicy użytkownika przy starcie
  const loadNearbyStops = useCallback(async () => {
    try {
      setStopsLoading(true);
      setLocationError('');

      const nearbyStops = await getNearbyStops(10000, 50); // 10km, max 50 przystanków
      setAllStops(nearbyStops);
      setUserLocation({
        lat: nearbyStops[0]?.latitude || 50.06143, // Kraków jako fallback
        lng: nearbyStops[0]?.longitude || 19.93658,
      });

      console.log(`✅ Załadowano ${nearbyStops.length} przystanków w okolicy użytkownika`);
    } catch (error) {
      console.warn('⚠️ Nie udało się pobrać przystanków w okolicy:', error);
      setLocationError(error instanceof Error ? error.message : 'Błąd geolokalizacji');

      // Fallback: pobierz wszystkie przystanki bez filtrowania lokalizacji
      try {
        const result = await getStops({ pageSize: 100 });
        setAllStops(result.data);
        console.log(`✅ Załadowano ${result.data.length} przystanków (fallback)`);
      } catch (fallbackError) {
        console.warn('⚠️ Nawet fallback się nie udał:', fallbackError);
        setAllStops([]);
      }
    } finally {
      setStopsLoading(false);
    }
  }, []);

  // Ładowanie przystanków przy montowaniu komponentu
  useEffect(() => {
    loadNearbyStops();
  }, [loadNearbyStops]);

  const handleFindStopsNearRoute = useCallback(async () => {
    if (!routeInfo?.polylinePath) return;

    // Sprawdź czy mamy przystanki załadowane
    if (allStops.length === 0) {
      console.warn('⚠️ Brak przystanków - najpierw uruchom backend');
      return;
    }

    try {
      // Znajdź przystanki w pobliżu interpolowanych punktów trasy
      const interpolatedResult = await getInterpolatedRoutePoints(origin, destination, 100);

      if (interpolatedResult.success && interpolatedResult.points) {
        const nearStops = allStops.filter((stop) => {
          const proximity = isPointNearInterpolatedRoute(
            { lat: stop.latitude, lng: stop.longitude },
            interpolatedResult.points!,
            200, // 200 metrów od trasy
          );
          return proximity.isNear;
        });

        setStopsNearRoute(nearStops);
        setShowStops(true); // Automatycznie pokaż przystanki
        console.log(`🎯 Znaleziono ${nearStops.length} przystanków w pobliżu trasy (200m)`);

        // Wyświetl szczegóły przystanków w pobliżu
        console.log('📍 Przystanki w pobliżu trasy:');
        nearStops.forEach((stop) => {
          console.log(
            `  ${stop.name} (${stop.type}) - lat:${stop.latitude.toFixed(6)}, lng:${stop.longitude.toFixed(6)}`,
          );
        });
      }
    } catch (error) {
      console.error('Błąd podczas wyszukiwania przystanków w pobliżu trasy:', error);
    }
  }, [routeInfo, origin, destination, allStops]);

  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage);
    setRouteInfo(null);
  }, []);

  const handleRouteCalculated = useCallback(
    async (info: RouteInfo) => {
      setRouteInfo(info);
      setShowRouteDetails(true);

      // Workflow: pobierz gęstszą siatkę punktów co 100 metrów
      try {
        const result = await getInterpolatedRoutePoints(
          origin,
          destination,
          100, // punkty co 100 metrów
        );

        if (result.success && result.points) {
          console.log(`✅ Uzyskano ${result.points.length} punktów trasy (co 100m)`);

          // Wyświetl wszystkie punkty interpolowane
          console.log('📍 Wszystkie punkty interpolowane:');
          result.points.forEach((point, index) => {
            console.log(`  Punkt ${index}: lat=${point.lat().toFixed(6)}, lng=${point.lng().toFixed(6)}`);
          });

          // Przykład: sprawdzenie czy punkt jest w pobliżu gęstszej siatki
          const testPoint = { lat: 50.0614, lng: 19.9366 };
          const proximityCheck = isPointNearInterpolatedRoute(testPoint, result.points, 50);
          console.log('Punkt testowy w pobliżu gęstszej trasy (50m):', proximityCheck);

          // Dodatkowe sprawdzenie z oryginalną funkcją
          const isNearOriginal = isPointNearRoute(testPoint, info.polylinePath, 100);
          console.log('Punkt testowy w pobliżu oryginalnej trasy (100m):', isNearOriginal);

          // Wyświetl również oryginalne punkty trasy dla porównania
          console.log('📍 Oryginalne punkty trasy (z Directions API):');
          info.polylinePath.forEach((point, index) => {
            console.log(`  Oryginalny punkt ${index}: lat=${point.lat().toFixed(6)}, lng=${point.lng().toFixed(6)}`);
          });
        }
      } catch (error) {
        console.error('Błąd podczas interpolacji punktów:', error);
      }
    },
    [origin, destination],
  );

  if (!config.googleMapsApiKey) {
    return (
      <div className="min-h-screen bg-black">
        <div className="bg-gray-900 border-b border-gray-700 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold text-white">Twoja podróż</h1>
          </div>
        </div>
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center p-8">
            <h2 className="text-xl font-semibold text-gray-300 mb-4">Brak klucza API Google Maps</h2>
            <p className="text-gray-400">
              Dodaj <code className="bg-gray-700 px-2 py-1 rounded text-gray-300">VITE_GOOGLE_MAPS_API_KEY</code> do
              pliku <code className="bg-gray-700 px-2 py-1 rounded text-gray-300">.env</code>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header with Route Form */}
      <div className="bg-gray-900 border-b border-gray-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-white mb-4">Twoja podróż</h1>

          {/* Route Input Form */}
          <div className="w-full flex justify-center align-middle">
            {/* Desktop layout (>=750px) */}
            <div className="hidden min-[750px]:flex flex-row gap-3 w-full">
              <LocationInput
                value={searchOrigin}
                onChange={setSearchOrigin}
                placeholder="np. Rynek Główny, Kraków lub nazwa przystanku"
                label="Punkt początkowy"
                suggestions={originSuggestions}
                showSuggestions={showOriginSuggestions}
                onShowSuggestions={setShowOriginSuggestions}
                onSuggestionsChange={setOriginSuggestions}
                enableGeolocation={true}
              />

              {/* Swap button - horizontal on desktop */}
              <div className="flex items-center justify-center px-2 pt-5">
                <button
                  onClick={() => {
                    const tempOrigin = searchOrigin;
                    setSearchOrigin(searchDestination);
                    setSearchDestination(tempOrigin);
                  }}
                  className="flex items-center justify-center px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 border border-blue-500/30"
                  title="Zamień miejscami"
                  type="button"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M16 17l4-4-4-4M8 7l-4 4 4 4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M20 12H4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>

              <LocationInput
                value={searchDestination}
                onChange={setSearchDestination}
                placeholder="np. Dworzec Główny, Kraków lub nazwa przystanku"
                label="Punkt końcowy"
                suggestions={destinationSuggestions}
                showSuggestions={showDestinationSuggestions}
                onShowSuggestions={setShowDestinationSuggestions}
                onSuggestionsChange={setDestinationSuggestions}
                enableGeolocation={false}
              />

              <div className="flex items-center gap-2 mt-[23px]">
                <button
                  onClick={handleSearch}
                  disabled={!searchOrigin || !searchDestination}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed font-medium"
                >
                  Szukaj trasy
                </button>
                {(origin || destination || searchOrigin || searchDestination) && (
                  <button
                    onClick={handleClear}
                    className="px-4 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-colors font-medium"
                  >
                    Wyczyść
                  </button>
                )}
              </div>
            </div>

            {/* Mobile layout (<750px) */}
            <div className="grid grid-cols-[3fr_auto] grid-rows-3  min-[750px]:hidden w-full gap-3">
              <div className="flex-1 ">
                <LocationInput
                  value={searchOrigin}
                  onChange={setSearchOrigin}
                  placeholder="np. Rynek Główny, Kraków lub nazwa przystanku"
                  label="Punkt początkowy"
                  suggestions={originSuggestions}
                  showSuggestions={showOriginSuggestions}
                  onShowSuggestions={setShowOriginSuggestions}
                  onSuggestionsChange={setOriginSuggestions}
                  enableGeolocation={true}
                />
              </div>

              {/* Swap button - vertical on mobile */}
              <div className="flex items-center justify-center w-12 row-span-2">
                <button
                  onClick={() => {
                    const tempOrigin = searchOrigin;
                    setSearchOrigin(searchDestination);
                    setSearchDestination(tempOrigin);
                  }}
                  className="flex items-center justify-center w-10 h-16 bg-gradient-to-b from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 border border-blue-500/30"
                  title="Zamień miejscami"
                  type="button"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M7 16l4 4 4-4M17 8l-4-4-4 4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 20V4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
              <div className="flex-1 col-start-1 row-start-2">
                <LocationInput
                  value={searchDestination}
                  onChange={setSearchDestination}
                  placeholder="np. Dworzec Główny, Kraków lub nazwa przystanku"
                  label="Punkt końcowy"
                  suggestions={destinationSuggestions}
                  showSuggestions={showDestinationSuggestions}
                  onShowSuggestions={setShowDestinationSuggestions}
                  onSuggestionsChange={setDestinationSuggestions}
                  enableGeolocation={false}
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={handleSearch}
                  disabled={!searchOrigin || !searchDestination}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed font-medium"
                >
                  Szukaj trasy
                </button>
                {(origin || destination || searchOrigin || searchDestination) && (
                  <button
                    onClick={handleClear}
                    className="px-4 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-colors font-medium"
                  >
                    Wyczyść
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Loading indicator */}
          {stopsLoading && (
            <div className="mt-3 p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
              <p className="text-blue-300 text-sm flex items-center gap-2">
                <span className="animate-spin">⏳</span>
                Pobieranie przystanków w okolicy...
              </p>
            </div>
          )}

          {/* Location error */}
          {locationError && (
            <div className="mt-3 p-3 bg-orange-900/30 border border-orange-700 rounded-lg">
              <p className="text-orange-300 text-sm">
                📍 {locationError}
                <br />
                <span className="text-xs">Używam podstawowych danych przystanków.</span>
              </p>
            </div>
          )}

          {/* Success message */}
          {!stopsLoading && allStops.length > 0 && (
            <div className="mt-3 p-3 bg-green-900/30 border border-green-700 rounded-lg">
              <p className="text-green-300 text-sm flex items-center gap-2">
                ✅ Załadowano {allStops.length} przystanków
                {userLocation && (
                  <span className="text-xs">
                    (okolica: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)})
                  </span>
                )}
              </p>
            </div>
          )}

          {/* Route Controls */}
          {routeInfo && (
            <div className="flex flex-wrap gap-3 mt-4">
              {allStops.length > 0 && (
                <>
                  <button
                    onClick={handleFindStopsNearRoute}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center gap-2"
                  >
                    🎯 Znajdź przystanki w pobliżu trasy
                  </button>

                  <button
                    onClick={() => setShowStops(!showStops)}
                    className={`px-4 py-2 rounded-lg transition-colors font-medium flex items-center gap-2 ${
                      showStops
                        ? 'bg-orange-600 text-white hover:bg-orange-700'
                        : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                    }`}
                  >
                    {showStops ? '👁️' : '🙈'} {showStops ? 'Ukryj' : 'Pokaż'} przystanki ({allStops.length})
                  </button>
                </>
              )}
            </div>
          )}

          {stopsNearRoute.length > 0 && (
            <div className="mt-3 p-3 bg-purple-900/30 border border-purple-700 rounded-lg">
              <p className="text-purple-300 text-sm">
                🎯 Znaleziono <strong>{stopsNearRoute.length}</strong> przystanków w promieniu 200m od trasy
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-3 p-3 bg-red-900/30 border border-red-700 rounded-lg">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Map Container with Route Details Panel */}
      <div className="h-[calc(100vh-180px)] relative">
        <APIProvider apiKey={config.googleMapsApiKey || ''}>
          <PublicTransportMap
            origin={origin}
            destination={destination}
            onError={handleError}
            onRouteCalculated={handleRouteCalculated}
            stops={showStops ? allStops : []}
            showStops={showStops}
            stopsNearRoute={stopsNearRoute}
          />
        </APIProvider>

        {/* Route Details Panel */}
        {routeInfo && showRouteDetails && (
          <div className="absolute top-4 right-4 w-96 bg-gray-800 rounded-lg shadow-xl max-h-[calc(100vh-240px)] overflow-hidden flex flex-col z-10 border border-gray-700">
            {/* Header */}
            <div className="p-4 border-b border-gray-600 flex justify-between items-center bg-gray-700">
              <h2 className="font-bold text-lg text-white">Szczegóły trasy</h2>
              <button
                onClick={() => setShowRouteDetails(false)}
                className="text-gray-400 hover:text-white text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Summary */}
            <div className="p-4 border-b border-gray-600 bg-gray-700">
              <div className="flex justify-between text-sm">
                <div>
                  <span className="text-gray-300">Czas:</span>
                  <span className="ml-2 font-semibold text-blue-400">{routeInfo?.totalDuration}</span>
                </div>
                <div>
                  <span className="text-gray-300">Dystans:</span>
                  <span className="ml-2 font-semibold text-blue-400">{routeInfo?.totalDistance}</span>
                </div>
              </div>
            </div>

            {/* Steps */}
            <div className="overflow-y-auto flex-1 p-4 space-y-4">
              {routeInfo?.steps?.map((step, index) => (
                <div
                  key={index}
                  className="border-l-4 border-gray-600 pl-4 pb-4"
                >
                  {step.transitDetails ? (
                    // Krok transportu publicznego
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <span className="bg-blue-600 text-white px-3 py-1 rounded-full font-bold text-sm">
                          {step.transitDetails.line}
                        </span>
                        <div className="flex-1">
                          <div className="font-semibold text-white">
                            {step.transitDetails.vehicle} - {step.transitDetails.headsign}
                          </div>
                          <div className="text-sm text-gray-300 mt-1">
                            <div>
                              🚏 <strong>Wsiądź:</strong> {step.transitDetails.departureStop}
                            </div>
                            <div className="ml-4 text-xs text-gray-400">
                              Odjazd: {step.transitDetails.departureTime}
                            </div>
                          </div>
                          <div className="text-sm text-gray-400 my-1">
                            ↓ {step.transitDetails.numStops}{' '}
                            {step.transitDetails.numStops === 1 ? 'przystanek' : 'przystanki'} ({step.duration})
                          </div>
                          <div className="text-sm text-gray-300">
                            <div>
                              🚏 <strong>Wysiądź:</strong> {step.transitDetails.arrivalStop}
                            </div>
                            <div className="ml-4 text-xs text-gray-400">
                              Przyjazd: {step.transitDetails.arrivalTime}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Krok pieszy
                    <div className="space-y-1">
                      <div
                        className="text-sm text-gray-300"
                        dangerouslySetInnerHTML={{ __html: step.instruction }}
                      />
                      <div className="text-xs text-gray-400">
                        🚶 {step.distance} • {step.duration}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Toggle button when panel is hidden */}
        {routeInfo && !showRouteDetails && (
          <button
            onClick={() => setShowRouteDetails(true)}
            className="absolute top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition-colors z-10 border border-blue-500"
          >
            Pokaż szczegóły trasy
          </button>
        )}

        {/* Report Incident Button - Fixed in bottom right */}
        <div className="bottom-4 right-[55px] z-50 fixed">
          <Button
            onClick={() => setShowReportModal(true)}
            className="bg-red-600 hover:bg-red-700 text-white p-5 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 border border-red-500"
            title="Zgłoś wypadek"
          >
            <AlertTriangle className="w-14 h-14" />
            <span className="hidden sm:inline">Zgłoś wypadek</span>
          </Button>
        </div>
      </div>

      {/* Incident Report Modal */}
      <IncidentForm
        open={showReportModal}
        onOpenChange={setShowReportModal}
      />
    </div>
  );
}
