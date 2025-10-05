import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import Spinner from './Spinner';

interface Option {
  id: string;
  label: string;
}

interface AutocompleteProps {
  options: Option[];
  onSelect: (option: Option) => void;
  onChange: (inputValue: string) => void;
  placeholder?: string;
  value?: string;
  loading?: boolean;
  forceClose?: boolean;
}

function Autocomplete({
  options,
  onSelect,
  onChange,
  placeholder = 'Type to search...',
  value = '',
  loading = false,
  forceClose = false,
}: AutocompleteProps) {
  const [inputValue, setInputValue] = useState<string>(value);
  const [filteredOptions, setFilteredOptions] = useState<Option[]>(options);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(value);
    setFilteredOptions(
      value.trim() === ''
        ? options
        : options.filter((option) => option.label.toLowerCase().includes(value.toLowerCase())),
    );
  }, [value, options]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setInputValue(newValue);
    onChange(newValue);

    if (newValue.trim() === '') {
      setFilteredOptions(options);
    } else {
      const filtered = options.filter((option) => option.label.toLowerCase().includes(newValue.toLowerCase()));
      setFilteredOptions(filtered);
    }
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const handleOptionClick = (option: Option) => {
    onSelect(option);
    onChange(option.label); // Update the external value
    setInputValue(option.label);
    setFilteredOptions(options);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleInputBlur = () => {
    // Delay closing to allow for option clicks
    setTimeout(() => {
      if (!dropdownRef.current?.contains(document.activeElement)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    }, 150);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || filteredOptions.length === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setHighlightedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        event.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          handleOptionClick(filteredOptions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            'border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full',
            loading && 'pr-10',
          )}
        />
        <div
          className="absolute right-3 top-1/2 transform -translate-y-1/2 transition-opacity duration-300"
          style={{ opacity: loading ? 1 : 0, visibility: loading ? 'visible' : 'hidden' }}
        >
          <Spinner size="sm" />
        </div>
      </div>
      {isOpen && filteredOptions.length > 0 && !forceClose && (
        <div
          ref={dropdownRef}
          className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {filteredOptions.map((option, index) => (
            <div
              key={option.id}
              onClick={() => handleOptionClick(option)}
              className={cn(
                'px-3 py-2 text-sm cursor-pointer',
                index === highlightedIndex ? 'bg-blue-100' : 'hover:bg-gray-100',
              )}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Autocomplete;
