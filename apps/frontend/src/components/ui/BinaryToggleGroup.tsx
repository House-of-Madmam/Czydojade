import { useState } from 'react';
import type { HTMLAttributes } from 'react';

interface BinaryToggleGroupProps extends HTMLAttributes<HTMLDivElement> {
  options: Array<{ label: string; value: string }>;
  value?: string;
  onValueChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
}

export default function BinaryToggleGroup({ options, value, onValueChange, className, ...props }: BinaryToggleGroupProps) {
  const [activeValue, setActiveValue] = useState(value || options[0]?.value);

  const handleValueChange = (value: string) => {
    setActiveValue(value);
    if (onValueChange) {
      const event = { target: { value } } as React.ChangeEvent<HTMLSelectElement>;
      onValueChange(event);
    }
  };

  return (
    <div className={`flex justify-center ${className || ''}`} {...props}>
      <div className="bg-gray-800/90 backdrop-blur-md p-1 rounded-xl border border-gray-700 shadow-2xl">
        {options.map((option) => (
          <button
            key={option.value}
            type='button'
            className={`px-8 py-3 text-sm font-medium rounded-lg transition-all duration-300 cursor-pointer min-w-[120px] ${
              activeValue === option.value
                ? 'bg-white text-black shadow-lg scale-105 font-semibold'
                : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
            }`}
            onClick={() => handleValueChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
