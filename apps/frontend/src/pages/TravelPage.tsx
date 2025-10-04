import { APIProvider } from '@vis.gl/react-google-maps';
import PublicTransportMap, { RouteInfo, isPointNearRoute } from '../components/PublicTransportMap';
import { isPointNearInterpolatedRoute, getInterpolatedRoutePoints } from '../utils/polylineUtils';
import { getStops, type Stop } from '../api/queries/getStops';
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

  // Ładowanie wszystkich przystanków przy starcie (opcjonalne)
  const loadAllStops = useCallback(async () => {
    try {
      setStopsLoading(true);
      const result = await getStops({
        pageSize: 100, // Pobierz więcej przystanków dla lepszego wyszukiwania
      });
      setAllStops(result.data);
      console.log(`✅ Załadowano ${result.data.length} przystanków do autouzupełniania`);
    } catch (error) {
      console.warn('⚠️ Backend niedostępny - autouzupełnianie przystanków wyłączone:', error);
      console.warn('💡 Uruchom backend komendą: npm run dev w katalogu apps/backend');
      // Nie ustawiamy błędu - aplikacja działa bez przystanków
      setAllStops([]); // Pusta tablica, żeby filtry działały
    } finally {
      setStopsLoading(false);
    }
  }, []);

  // Filtrowanie sugestii przystanków
  const filterStops = useCallback((query: string): Stop[] => {
    if (!query.trim()) return [];

    const normalizedQuery = query.toLowerCase().trim();
    return allStops
      .filter(stop =>
        stop.name.toLowerCase().includes(normalizedQuery) ||
        stop.type.toLowerCase().includes(normalizedQuery)
      )
      .slice(0, 10); // Maksymalnie 10 sugestii
  }, [allStops]);

  // Obsługa zmiany tekstu w polu origin
  const handleOriginChange = useCallback((value: string) => {
    setSearchOrigin(value);
    if (value.length >= 2) {
      const suggestions = filterStops(value);
      setOriginSuggestions(suggestions);
      setShowOriginSuggestions(suggestions.length > 0);
    } else {
      setOriginSuggestions([]);
      setShowOriginSuggestions(false);
    }
  }, [filterStops]);

  // Obsługa zmiany tekstu w polu destination
  const handleDestinationChange = useCallback((value: string) => {
    setSearchDestination(value);
    if (value.length >= 2) {
      const suggestions = filterStops(value);
      setDestinationSuggestions(suggestions);
      setShowDestinationSuggestions(suggestions.length > 0);
    } else {
      setDestinationSuggestions([]);
      setShowDestinationSuggestions(false);
    }
  }, [filterStops]);

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
    loadAllStops();
  }, [loadAllStops]);

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
      <div className="min-h-screen bg-gray-100">
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold text-gray-800">Twoja podróż</h1>
          </div>
        </div>
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center p-8">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Brak klucza API Google Maps</h2>
            <p className="text-gray-600">
              Dodaj <code className="bg-gray-200 px-2 py-1 rounded">VITE_GOOGLE_MAPS_API_KEY</code> do pliku <code className="bg-gray-200 px-2 py-1 rounded">.env</code>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header with Route Form */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Twoja podróż</h1>
          
          {/* Route Input Form */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Punkt początkowy
              </label>
              <input
                type="text"
                value={searchOrigin}
                onChange={(e) => handleOriginChange(e.target.value)}
                placeholder="np. Rynek Główny, Kraków lub nazwa przystanku"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto mt-1">
                  {originSuggestions.map((stop) => (
                    <button
                      key={stop.id}
                      onClick={() => selectStopSuggestion(stop, 'origin')}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-medium text-gray-900">{stop.name}</div>
                        <div className="text-sm text-gray-500">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Punkt końcowy
              </label>
              <input
                type="text"
                value={searchDestination}
                onChange={(e) => handleDestinationChange(e.target.value)}
                placeholder="np. Dworzec Główny, Kraków lub nazwa przystanku"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto mt-1">
                  {destinationSuggestions.map((stop) => (
                    <button
                      key={stop.id}
                      onClick={() => selectStopSuggestion(stop, 'destination')}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-medium text-gray-900">{stop.name}</div>
                        <div className="text-sm text-gray-500">
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
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
              >
                Szukaj trasy
              </button>
              {(origin || destination || searchOrigin || searchDestination) && (
                <button
                  onClick={handleClear}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Wyczyść
                </button>
              )}
            </div>
          </div>

          {/* Loading indicator */}
          {stopsLoading && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 text-sm flex items-center gap-2">
                <span className="animate-spin">⏳</span>
                Ładowanie przystanków...
              </p>
            </div>
          )}

          {/* Backend not available warning */}
          {!stopsLoading && allStops.length === 0 && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">
                ⚠️ Backend niedostępny - autouzupełnianie przystanków wyłączone.
                <br />
                Uruchom backend: <code className="bg-yellow-100 px-1 rounded">cd apps/backend && npm run dev</code>
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
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {showStops ? '👁️' : '🙈'} {showStops ? 'Ukryj' : 'Pokaż'} przystanki ({allStops.length})
                  </button>
                </>
              )}
            </div>
          )}

          {stopsNearRoute.length > 0 && (
            <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-purple-800 text-sm">
                🎯 Znaleziono <strong>{stopsNearRoute.length}</strong> przystanków w promieniu 200m od trasy
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
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
          <div className="absolute top-4 right-4 w-96 bg-white rounded-lg shadow-xl max-h-[calc(100vh-240px)] overflow-hidden flex flex-col z-10">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-blue-50">
              <h2 className="font-bold text-lg text-gray-800">Szczegóły trasy</h2>
              <button 
                onClick={() => setShowRouteDetails(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Summary */}
            <div className="p-4 border-b border-gray-200 bg-blue-50">
              <div className="flex justify-between text-sm">
                <div>
                  <span className="text-gray-600">Czas:</span>
                  <span className="ml-2 font-semibold text-blue-600">{routeInfo?.totalDuration}</span>
                </div>
                <div>
                  <span className="text-gray-600">Dystans:</span>
                  <span className="ml-2 font-semibold text-blue-600">{routeInfo?.totalDistance}</span>
                </div>
              </div>
            </div>

            {/* Steps */}
            <div className="overflow-y-auto flex-1 p-4 space-y-4">
              {routeInfo?.steps?.map((step, index) => (
                <div key={index} className="border-l-4 border-gray-300 pl-4 pb-4">
                  {step.transitDetails ? (
                    // Krok transportu publicznego
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <span className="bg-blue-600 text-white px-3 py-1 rounded-full font-bold text-sm">
                          {step.transitDetails.line}
                        </span>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-800">
                            {step.transitDetails.vehicle} - {step.transitDetails.headsign}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            <div>🚏 <strong>Wsiądź:</strong> {step.transitDetails.departureStop}</div>
                            <div className="ml-4 text-xs text-gray-500">Odjazd: {step.transitDetails.departureTime}</div>
                          </div>
                          <div className="text-sm text-gray-500 my-1">
                            ↓ {step.transitDetails.numStops} {step.transitDetails.numStops === 1 ? 'przystanek' : 'przystanki'} ({step.duration})
                          </div>
                          <div className="text-sm text-gray-600">
                            <div>🚏 <strong>Wysiądź:</strong> {step.transitDetails.arrivalStop}</div>
                            <div className="ml-4 text-xs text-gray-500">Przyjazd: {step.transitDetails.arrivalTime}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Krok pieszy
                    <div className="space-y-1">
                      <div className="text-sm text-gray-700" dangerouslySetInnerHTML={{ __html: step.instruction }} />
                      <div className="text-xs text-gray-500">
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
            className="absolute top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition-colors z-10"
          >
            Pokaż szczegóły trasy
          </button>
        )}
      </div>
    </div>
  );
}


