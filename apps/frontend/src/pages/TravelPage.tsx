import { APIProvider } from '@vis.gl/react-google-maps';
import PublicTransportMap, { RouteInfo, isPointNearRoute } from '../components/PublicTransportMap';
import { isPointNearInterpolatedRoute, getInterpolatedRoutePoints } from '../utils/polylineUtils';
import { getStops, getNearbyStops, searchStopsByName, type Stop } from '../api/queries/getStops';
import { config } from '../config';
import { useState, useCallback, useEffect } from 'react';

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
    setOriginSuggestions([]);
    setDestinationSuggestions([]);
    setShowOriginSuggestions(false);
    setShowDestinationSuggestions(false);
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

  // Wyszukiwanie przystanków po nazwie dla autouzupełniania
  const searchStopsForAutocomplete = useCallback(async (query: string): Promise<Stop[]> => {
    if (!query.trim()) return [];

    try {
      return await searchStopsByName(query, 10);
    } catch (error) {
      console.error('Błąd podczas wyszukiwania przystanków:', error);
      return [];
    }
  }, []);

  // Obsługa zmiany tekstu w polu origin
  const handleOriginChange = useCallback(async (value: string) => {
    setSearchOrigin(value);
    if (value.length >= 2) {
      const suggestions = await searchStopsForAutocomplete(value);
      setOriginSuggestions(suggestions);
      setShowOriginSuggestions(suggestions.length > 0);
    } else {
      setOriginSuggestions([]);
      setShowOriginSuggestions(false);
    }
  }, [searchStopsForAutocomplete]);

  // Obsługa zmiany tekstu w polu destination
  const handleDestinationChange = useCallback(async (value: string) => {
    setSearchDestination(value);
    if (value.length >= 2) {
      const suggestions = await searchStopsForAutocomplete(value);
      setDestinationSuggestions(suggestions);
      setShowDestinationSuggestions(suggestions.length > 0);
    } else {
      setDestinationSuggestions([]);
      setShowDestinationSuggestions(false);
    }
  }, [searchStopsForAutocomplete]);

  // Wybór sugestii przystanku
  const selectStopSuggestion = useCallback((stop: Stop, field: 'origin' | 'destination') => {
    const stopAddress = `${stop.name}, Kraków`; // Dodaj Kraków dla lepszego wyszukiwania

    if (field === 'origin') {
      setSearchOrigin(stopAddress);
      setOrigin(stopAddress);
      setShowOriginSuggestions(false);
    } else {
      setSearchDestination(stopAddress);
      setDestination(stopAddress);
      setShowDestinationSuggestions(false);
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
      const interpolatedResult = await getInterpolatedRoutePoints(
        origin,
        destination,
        100
      );

      if (interpolatedResult.success && interpolatedResult.points) {
        const nearStops = allStops.filter(stop => {
          const proximity = isPointNearInterpolatedRoute(
            { lat: stop.latitude, lng: stop.longitude },
            interpolatedResult.points!,
            200 // 200 metrów od trasy
          );
          return proximity.isNear;
        });

        setStopsNearRoute(nearStops);
        setShowStops(true); // Automatycznie pokaż przystanki
        console.log(`🎯 Znaleziono ${nearStops.length} przystanków w pobliżu trasy (200m)`);

        // Wyświetl szczegóły przystanków w pobliżu
        console.log('📍 Przystanki w pobliżu trasy:');
        nearStops.forEach(stop => {
          console.log(`  ${stop.name} (${stop.type}) - lat:${stop.latitude.toFixed(6)}, lng:${stop.longitude.toFixed(6)}`);
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

  const handleRouteCalculated = useCallback(async (info: RouteInfo) => {
    setRouteInfo(info);
    setShowRouteDetails(true);

    // Workflow: pobierz gęstszą siatkę punktów co 100 metrów
    try {
      const result = await getInterpolatedRoutePoints(
        origin,
        destination,
        100 // punkty co 100 metrów
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
  }, [origin, destination]);

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
              Dodaj <code className="bg-gray-700 px-2 py-1 rounded text-gray-300">VITE_GOOGLE_MAPS_API_KEY</code> do pliku <code className="bg-gray-700 px-2 py-1 rounded text-gray-300">.env</code>
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
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Punkt początkowy
              </label>
              <input
                type="text"
                value={searchOrigin}
                onChange={(e) => handleOriginChange(e.target.value)}
                placeholder="np. Rynek Główny, Kraków lub nazwa przystanku"
                className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-gray-800 text-white placeholder-gray-400"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                onBlur={() => setTimeout(() => setShowOriginSuggestions(false), 200)}
                onFocus={() => {
                  if (originSuggestions.length > 0) {
                    setShowOriginSuggestions(true);
                  }
                }}
              />

              {/* Dropdown z sugestiami przystanków - Origin */}
              {showOriginSuggestions && originSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto mt-1">
                  {originSuggestions.map((stop) => (
                    <button
                      key={stop.id}
                      onClick={() => selectStopSuggestion(stop, 'origin')}
                      className="w-full px-4 py-3 text-left hover:bg-gray-700 border-b border-gray-600 last:border-b-0 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-medium text-white">{stop.name}</div>
                        <div className="text-sm text-gray-400">
                          {stop.latitude.toFixed(4)}, {stop.longitude.toFixed(4)}
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        stop.type === 'bus' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {stop.type === 'bus' ? '🚌' : '🚊'} {stop.type}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex-1 relative">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Punkt końcowy
              </label>
              <input
                type="text"
                value={searchDestination}
                onChange={(e) => handleDestinationChange(e.target.value)}
                placeholder="np. Dworzec Główny, Kraków lub nazwa przystanku"
                className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-gray-800 text-white placeholder-gray-400"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                onBlur={() => setTimeout(() => setShowDestinationSuggestions(false), 200)}
                onFocus={() => {
                  if (destinationSuggestions.length > 0) {
                    setShowDestinationSuggestions(true);
                  }
                }}
              />

              {/* Dropdown z sugestiami przystanków - Destination */}
              {showDestinationSuggestions && destinationSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto mt-1">
                  {destinationSuggestions.map((stop) => (
                    <button
                      key={stop.id}
                      onClick={() => selectStopSuggestion(stop, 'destination')}
                      className="w-full px-4 py-3 text-left hover:bg-gray-700 border-b border-gray-600 last:border-b-0 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-medium text-white">{stop.name}</div>
                        <div className="text-sm text-gray-400">
                          {stop.latitude.toFixed(4)}, {stop.longitude.toFixed(4)}
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        stop.type === 'bus' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {stop.type === 'bus' ? '🚌' : '🚊'} {stop.type}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex items-end gap-2">
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
                <div key={index} className="border-l-4 border-gray-600 pl-4 pb-4">
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
                            <div>🚏 <strong>Wsiądź:</strong> {step.transitDetails.departureStop}</div>
                            <div className="ml-4 text-xs text-gray-400">Odjazd: {step.transitDetails.departureTime}</div>
                          </div>
                          <div className="text-sm text-gray-400 my-1">
                            ↓ {step.transitDetails.numStops} {step.transitDetails.numStops === 1 ? 'przystanek' : 'przystanki'} ({step.duration})
                          </div>
                          <div className="text-sm text-gray-300">
                            <div>🚏 <strong>Wysiądź:</strong> {step.transitDetails.arrivalStop}</div>
                            <div className="ml-4 text-xs text-gray-400">Przyjazd: {step.transitDetails.arrivalTime}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Krok pieszy
                    <div className="space-y-1">
                      <div className="text-sm text-gray-300" dangerouslySetInnerHTML={{ __html: step.instruction }} />
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
      </div>
    </div>
  );
}


