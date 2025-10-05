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
  className?: string;
}

function Autocomplete({
  options,
  onSelect,
  onChange,
  placeholder = 'Type to search...',
  value = '',
  loading = false,
  forceClose = false,
  className = '',
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
    onSelect({ id: '', label: '' }); // Reset selected value
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
    <div className="relative w-full">
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
            'border border-gray-300 rounded-md px-3 h-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full text-black',
            className === 'dark-input' &&
              'bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-400 focus:border-white focus:ring-white/20',
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
          className={cn(
            'absolute z-10 mt-1 w-full border rounded-md shadow-lg max-h-60 overflow-auto',
            className === 'dark-input' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300',
          )}
        >
          {filteredOptions.map((option, index) => (
            <div
              key={option.id}
              onClick={() => handleOptionClick(option)}
              className={cn(
                'px-3 py-2 text-sm cursor-pointer text-black',
                className === 'dark-input' && 'text-white',
                index === highlightedIndex
                  ? className === 'dark-input'
                    ? 'bg-gray-700'
                    : 'bg-blue-100'
                  : className === 'dark-input'
                    ? 'hover:bg-gray-700'
                    : 'hover:bg-gray-100',
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
