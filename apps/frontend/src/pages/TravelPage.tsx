import { APIProvider } from '@vis.gl/react-google-maps';
import PublicTransportMap, { RouteInfo, isPointNearRoute } from '../components/PublicTransportMap';
import { isPointNearInterpolatedRoute, getInterpolatedRoutePoints } from '../utils/polylineUtils';
import { config } from '../config';
import { useState, useCallback } from 'react';

export default function TravelPage() {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [searchOrigin, setSearchOrigin] = useState('');
  const [searchDestination, setSearchDestination] = useState('');
  const [error, setError] = useState('');
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [showRouteDetails, setShowRouteDetails] = useState(false);

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
  };

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
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Punkt początkowy
              </label>
              <input
                type="text"
                value={searchOrigin}
                onChange={(e) => setSearchOrigin(e.target.value)}
                placeholder="np. Rynek Główny, Kraków"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Punkt końcowy
              </label>
              <input
                type="text"
                value={searchDestination}
                onChange={(e) => setSearchDestination(e.target.value)}
                placeholder="np. Dworzec Główny, Kraków"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
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
        <APIProvider apiKey={config.googleMapsApiKey}>
          <PublicTransportMap 
            origin={origin} 
            destination={destination} 
            onError={handleError}
            onRouteCalculated={handleRouteCalculated}
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
                  <span className="ml-2 font-semibold text-blue-600">{routeInfo.totalDuration}</span>
                </div>
                <div>
                  <span className="text-gray-600">Dystans:</span>
                  <span className="ml-2 font-semibold text-blue-600">{routeInfo.totalDistance}</span>
                </div>
              </div>
            </div>

            {/* Steps */}
            <div className="overflow-y-auto flex-1 p-4 space-y-4">
              {routeInfo.steps.map((step, index) => (
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


