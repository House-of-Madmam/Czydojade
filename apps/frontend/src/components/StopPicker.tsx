import React, { useState } from 'react';
import { useAppSelector } from '../store/hooks';
import Autocomplete from './ui/Autocomplete';
import { useNearbyStops } from '../hooks/useNearbyStops';
import type { Stop } from '../api/queries/stops';

const StopPicker: React.FC<{ radiusMeters?: number; onSelect: (stop: Stop) => void; value?: string }> = ({ radiusMeters, onSelect }) => {
  const latitude = useAppSelector(state => state.geolocation.latitude);
  const longitude = useAppSelector(state => state.geolocation.longitude);
  const [searchText, setSearchText] = useState('');
  const { stops, loading, error } = useNearbyStops({
    latitude,
    longitude,
    radiusMeters,
    name: searchText === '' ? undefined : searchText,
  });

  const handleSelect = (option: { id: string; label: string }) => {
    const selectedStop = stops.find(stop => stop.id === option.id);
    if (selectedStop) {
      onSelect(selectedStop);
    }
  };

  return (
    <div className="stop-picker">
      <Autocomplete
        options={stops.map(stop => ({ id: stop.id, label: stop.name }))}
        onSelect={handleSelect}
        onChange={setSearchText}
        value={searchText}
        loading={loading}
        placeholder="Wyszukaj przystanek"
        className="dark-input"
      />
      {error && <p className="text-sm text-red-400">Error: {error}</p>}
    </div>
  );
};

export default StopPicker;