import { useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { searchStopsByName, getStops, type Stop } from '../api/queries/getStops';

interface LocationInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
  suggestions: Stop[];
  showSuggestions: boolean;
  onShowSuggestions: (show: boolean) => void;
  onSuggestionsChange: (suggestions: Stop[]) => void;
  enableGeolocation?: boolean; // Czy włączyć geolokalizację dla tego inputa
  id?: string; // Opcjonalne ID dla inputa
}

export default function LocationInput({
  value,
  onChange,
  placeholder,
  label,
  suggestions,
  showSuggestions,
  onShowSuggestions,
  onSuggestionsChange,
  enableGeolocation = false, // Domyślnie wyłączona
  id,
}: LocationInputProps) {
  // Generuj unikalne ID jeśli nie zostało podane
  const inputId = id || `location-input-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  const inputName = `location-${inputId}`;
  const { latitude, longitude } = useSelector((state: RootState) => state.geolocation);

  // Stan dla modalu z pytaniem o geolokalizację
  const [showGeolocationModal, setShowGeolocationModal] = useState(false);
  const [isLoadingStops, setIsLoadingStops] = useState(false);
  // Stan do śledzenia czy już pytano o geolokalizację przy wprowadzaniu tekstu
  const [hasAskedForGeolocation, setHasAskedForGeolocation] = useState(false);

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

  // Obsługa zmiany tekstu w polu
  const handleInputChange = useCallback(async (inputValue: string) => {
    onChange(inputValue);

    if (inputValue.length >= 2) {
      const newSuggestions = await searchStopsForAutocomplete(inputValue);
      onSuggestionsChange(newSuggestions);
      onShowSuggestions(newSuggestions.length > 0);
    } else {
      onSuggestionsChange([]);
      onShowSuggestions(false);
    }
  }, [onChange, searchStopsForAutocomplete, onSuggestionsChange, onShowSuggestions]);

  // Wybór sugestii przystanku
  const selectStopSuggestion = useCallback((stop: Stop) => {
    const stopAddress = `${stop.name}, Kraków`;
    onChange(stopAddress);
    onShowSuggestions(false);
  }, [onChange, onShowSuggestions]);

  // Obsługa kliknięcia w przycisk geolokalizacji - pokazuje modal z pytaniem
  const handleLocationClick = useCallback(() => {
    if (latitude !== null && longitude !== null) {
      setShowGeolocationModal(true);
    }
  }, [latitude, longitude]);

  // Obsługa potwierdzenia użycia geolokalizacji
  const handleConfirmGeolocation = useCallback(async () => {
    if (latitude === null || longitude === null) return;

    setShowGeolocationModal(false);
    setIsLoadingStops(true);

    try {
      let foundStops: Stop[] = [];
      let currentRadius = 50; // Zaczynamy od 50m
      const maxRadius = 1000; // Maksymalny promień 1km
      const radiusIncrement = 50; // Zwiększamy co 50m

      console.log(`🔍 Rozpoczynam wyszukiwanie przystanków od ${currentRadius}m...`);

      while (currentRadius <= maxRadius && foundStops.length === 0) {
        const response = await getStops({
          latitude,
          longitude,
          radiusMeters: currentRadius,
          pageSize: 20
        });

        foundStops = response.data;
        console.log(`📍 Promień ${currentRadius}m: znaleziono ${foundStops.length} przystanków`);

        if (foundStops.length === 0) {
          currentRadius += radiusIncrement;
        }
      }

      // Ustaw pierwszą sugestię jako wartość inputa
      if (foundStops.length > 0) {
        const nearestStop = foundStops[0];
        onChange(`${nearestStop.name}, Kraków`);
        onSuggestionsChange(foundStops);
        onShowSuggestions(true);
        console.log(`✅ Znaleziono ${foundStops.length} przystanków w promieniu ${currentRadius}m`);
      } else {
        console.log(`❌ Nie znaleziono przystanków w promieniu do ${maxRadius}m`);
      }
    } catch (error) {
      console.error('❌ Błąd podczas pobierania przystanków:', error);
    } finally {
      setIsLoadingStops(false);
      // Ustaw focus na inpucie po zakończeniu operacji
      setTimeout(() => {
        const inputElement = document.getElementById(inputId);
        if (inputElement) {
          inputElement.focus();
        }
      }, 100);
    }
  }, [latitude, longitude, onChange, onSuggestionsChange, onShowSuggestions, inputId]);

  // Obsługa anulowania geolokalizacji
  const handleCancelGeolocation = useCallback(() => {
    setShowGeolocationModal(false);
    // Ustaw focus na inpucie po anulowaniu
    setTimeout(() => {
      const inputElement = document.getElementById(inputId);
      if (inputElement) {
        inputElement.focus();
      }
    }, 100);
  }, [inputId]);

  return (
    <div className="flex-1">
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-300 mb-1">
        {label}
      </label>
      <div className="relative">
        {/* Input field z eleganckimi stylami */}
        <input
          id={inputId}
          name={inputName}
          type="text"
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full px-4 py-3 bg-gray-800/80 backdrop-blur-sm border border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 focus:bg-gray-800 transition-all duration-200 shadow-lg rounded-lg ${
            enableGeolocation && latitude !== null && longitude !== null
              ? 'pr-12'  // Dodatkowe miejsce na przycisk geolokalizacji
              : ''
          } ${
            isLoadingStops ? 'opacity-75' : ''
          }`}
          onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
          onBlur={() => setTimeout(() => onShowSuggestions(false), 200)}
          onFocus={() => {
            // Sprawdź czy zapytać o geolokalizację przy pierwszym focusie (tylko jeśli nie pytano wcześniej)
            if (enableGeolocation && latitude !== null && longitude !== null && !hasAskedForGeolocation) {
              setHasAskedForGeolocation(true);
              setShowGeolocationModal(true);
            }

            // Pokaż sugestie jeśli są dostępne
            if (suggestions.length > 0) {
              onShowSuggestions(true);
            }
          }}
          disabled={isLoadingStops}
        />

        {/* Geolocation button - pozycjonowany absolutnie w prawym rogu inputa */}
        {enableGeolocation && latitude !== null && longitude !== null 
        && (
          <button
            onClick={handleLocationClick}
            disabled={isLoadingStops}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 text-white hover:text-blue-300 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Znajdź najbliższe przystanki"
            type="button"
          >
            {isLoadingStops ? (
              <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-white"
              >
                {/* Globus */}
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                <path d="M2 12h20" stroke="currentColor" strokeWidth="2" />
                <path d="M12 2C12 2 7 6 7 12s5 10 5 10" stroke="currentColor" strokeWidth="2" />
                <path d="M12 2C12 2 17 6 17 12s-5 10-5 10" stroke="currentColor" strokeWidth="2" />
                {/* Lupa */}
                <circle cx="17" cy="17" r="4" stroke="currentColor" strokeWidth="2" fill="none" />
                <path d="M20 20l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            )}
          </button>
        )
        }

        {/* Loading indicator overlay */}
        {isLoadingStops && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800/50 backdrop-blur-sm rounded-lg">
            <div className="flex items-center space-x-2 text-blue-400">
              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Szukam przystanków...</span>
            </div>
          </div>
        )}

        {/* Dropdown z sugestiami przystanków */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 bg-gray-800/95 backdrop-blur-md border border-gray-600 rounded-lg shadow-2xl max-h-60 overflow-y-auto mt-2">
            {suggestions.map((stop, index) => (
              <button
                key={stop.id}
                onClick={() => selectStopSuggestion(stop)}
                className="w-full px-4 py-3 text-left hover:bg-blue-900/30 border-b border-gray-700/50 last:border-b-0 flex items-center justify-between transition-colors duration-150 group"
              >
                <div className="flex-1">
                  <div className="font-medium text-white group-hover:text-blue-300 transition-colors">
                    {stop.name}
                  </div>
                  <div className="text-sm text-gray-400 flex items-center space-x-2">
                    <span>{stop.latitude.toFixed(4)}, {stop.longitude.toFixed(4)}</span>
                    {index === 0 && (
                      <span className="px-2 py-0.5 bg-blue-900/50 text-blue-300 rounded-full text-xs font-medium">
                        Najbliższy
                      </span>
                    )}
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${
                  stop.type === 'bus'
                    ? 'bg-green-900/30 text-green-300 border border-green-700/50'
                    : 'bg-blue-900/30 text-blue-300 border border-blue-700/50'
                }`}>
                  <span>{stop.type === 'bus' ? '🚌' : '🚊'}</span>
                  <span>{stop.type}</span>
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Modal z pytaniem o geolokalizację - renderowany przez Portal */}
        {showGeolocationModal && createPortal(
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[9999] p-4">
            <div className="bg-gray-800 border border-gray-600 rounded-xl shadow-2xl max-w-md w-full p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-blue-900/50 rounded-full flex items-center justify-center">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-blue-400"
                  >
                    <path
                      d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                      fill="currentColor"
                      opacity="0.9"
                    />
                    <circle
                      cx="12"
                      cy="9"
                      r="2.5"
                      fill="currentColor"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Użyć mojej lokalizacji?</h3>
                  <p className="text-sm text-gray-400">Znajdziemy najbliższe przystanki transportu publicznego</p>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={handleCancelGeolocation}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors duration-200"
                >
                  Anuluj
                </button>
                <button
                  onClick={handleConfirmGeolocation}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                      fill="currentColor"
                    />
                    <circle cx="12" cy="9" r="2.5" fill="currentColor" />
                  </svg>
                  <span>Użyj lokalizacji</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    </div>
  );
}
