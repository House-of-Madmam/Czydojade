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
      <div className="bg-white/80 backdrop-blur-sm p-1.5 rounded-2xl border border-slate-200/50 shadow-sm">
        {options.map((option) => (
          <button
            key={option.value}
            type='button'
            className={`px-6 py-3 text-sm font-semibold rounded-xl transition-all duration-300 cursor-pointer ${
              activeValue === option.value
                ? 'bg-white text-teal-600 shadow-lg shadow-teal-500/10 scale-105'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
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
