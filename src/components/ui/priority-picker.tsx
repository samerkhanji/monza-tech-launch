import React from 'react';

const priorities = [
  { key: 'urgent', label: 'Urgent', color: 'border-red-500 bg-red-50 text-red-700' },
  { key: 'medium', label: 'Medium', color: 'border-yellow-500 bg-yellow-50 text-yellow-700' },
  { key: 'low', label: 'Low', color: 'border-green-500 bg-green-50 text-green-700' },
];

interface PriorityPickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function PriorityPicker({ value, onChange, className = '' }: PriorityPickerProps) {
  return (
    <div className={`flex gap-2 ${className}`}>
      {priorities.map(p => (
        <button
          key={p.key}
          type="button"
          onClick={() => onChange(p.key)}
          className={[
            "px-3 py-1.5 rounded-full border text-sm font-medium transition-all",
            value === p.key ? p.color : "border-gray-300 hover:border-gray-400"
          ].join(' ')}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

export const PRIORITY_COLORS = {
  urgent: 'text-red-600 bg-red-100',
  medium: 'text-yellow-600 bg-yellow-100',
  low: 'text-green-600 bg-green-100'
};

export const PRIORITY_LABELS = {
  urgent: 'Urgent',
  medium: 'Medium',
  low: 'Low'
};
