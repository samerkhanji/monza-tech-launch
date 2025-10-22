import React from 'react';
import { Label } from '@/components/ui/label';
import { Clock } from 'lucide-react';

interface DateTimeInputProps {
  label: string;
  value?: Date;
  onChange: (date: Date | undefined) => void;
  required?: boolean;
  showTime?: boolean;
}

export const DateTimeInput: React.FC<DateTimeInputProps> = ({
  label,
  value,
  onChange,
  required = false,
  showTime = true
}) => {
  const isReservation = label.toLowerCase().includes('reservation');

  const formatDateTimeLocal = (date: Date) => {
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  };

  return (
    <div className={`space-y-3 p-4 ${isReservation ? 'bg-blue-50 border-blue-500' : 'bg-green-50 border-green-500'} border-2 rounded-lg`}>
      <Label className={`text-sm font-bold ${isReservation ? 'text-blue-800' : 'text-green-800'} flex items-center gap-2`}>
        <Clock className="h-4 w-4" />
        {label} {required && <span className="text-red-500">*</span>}
      </Label>

      {/* Native datetime picker - Fixed for functionality */}
      <div className="space-y-2">
        <input
          type="datetime-local"
          value={value ? formatDateTimeLocal(value) : ''}
          onChange={(e) => {
            const dateValue = e.target.value ? new Date(e.target.value) : undefined;
            onChange(dateValue);
            console.log(`✅ ${label} selected:`, dateValue);
          }}
          className={`w-full px-4 py-3 border-2 ${isReservation ? 'border-blue-300 hover:border-blue-500 focus:border-blue-600 focus:ring-blue-200' : 'border-green-300 hover:border-green-500 focus:border-green-600 focus:ring-green-200'} rounded-lg bg-white text-gray-900 text-base font-medium cursor-pointer focus:ring-2 transition-all calendar-fix`}
          style={{ 
            minHeight: '48px', 
            fontSize: '16px'
          }}
          required={required}
        />
      </div>

      {/* Display selected date/time */}
      {value && (
        <div className={`p-3 ${isReservation ? 'bg-blue-100 border-blue-300 text-blue-800' : 'bg-green-100 border-green-300 text-green-800'} border-2 rounded-lg`}>
          <p className="text-sm font-semibold mb-1">
            ✅ SELECTED {label.toUpperCase()}:
          </p>
          <p className={`text-lg font-bold ${isReservation ? 'text-blue-900' : 'text-green-900'}`}>
            {value.toLocaleDateString()} at {value.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </p>
        </div>
      )}
    </div>
  );
}; 