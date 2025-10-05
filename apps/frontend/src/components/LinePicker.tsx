import React, { useState } from 'react';
import Autocomplete from './ui/Autocomplete';
import { useLines } from '../hooks/useLines';
import type { Line } from '../api/queries/getLines';

const LinePicker: React.FC<{ type?: 'bus' | 'tram'; onSelect: (line: Line) => void; value?: string }> = ({ type, onSelect }) => {
  const [searchText, setSearchText] = useState('');
  const { lines, loading, error } = useLines({
    type,
    number: searchText === '' ? undefined : searchText,
  });

  const handleSelect = (option: { id: string; label: string }) => {
    const selectedLine = lines.find(line => line.id === option.id);
    if (selectedLine) {
      onSelect(selectedLine);
    }
  };

  return (
    <div className="line-picker">
      <Autocomplete
        options={lines.map(line => ({ id: line.id, label: line.number }))}
        onSelect={handleSelect}
        onChange={setSearchText}
        value={searchText}
        loading={loading}
        forceClose={searchText.length === 0}
        placeholder="Wyszukaj linię"
        className="dark-input"
      />
      {error && <p className="text-sm text-red-400">Error: {error}</p>}
    </div>
  );
};

export default LinePicker;
