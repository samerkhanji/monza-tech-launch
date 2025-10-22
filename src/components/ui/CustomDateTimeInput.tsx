import React, { useState, useRef, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Clock, Calendar, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import '@/styles/calendar-opacity-fix.css';

interface CustomDateTimeInputProps {
  label: string;
  value?: Date;
  onChange: (date: Date | undefined) => void;
  required?: boolean;
  showTime?: boolean;
}

export const CustomDateTimeInput: React.FC<CustomDateTimeInputProps> = ({
  label,
  value,
  onChange,
  required = false,
  showTime = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(value);
  const [selectedTime, setSelectedTime] = useState<string>('12:00');
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const containerRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const isReservation = label.toLowerCase().includes('reservation');

  useEffect(() => {
    if (value) {
      setSelectedDate(value);
      setSelectedTime(`${value.getHours().toString().padStart(2, '0')}:${value.getMinutes().toString().padStart(2, '0')}`);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle escape key to close popup
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handleDateSelect = (day: number) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    setSelectedDate(newDate);
  };

  const handleTimeChange = (time: string) => {
    setSelectedTime(time);
  };

  const handleConfirm = () => {
    if (selectedDate) {
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const finalDate = new Date(selectedDate);
      finalDate.setHours(hours, minutes, 0, 0);
      onChange(finalDate);
    }
    setIsOpen(false);
  };

  const handleClear = () => {
    setSelectedDate(undefined);
    setSelectedTime('12:00');
    onChange(undefined);
  };

  const formatDisplayDate = (date: Date) => {
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  };

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDayOfMonth = getFirstDayOfMonth(currentMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const today = new Date();
  const isToday = (day: number) => {
    return today.getDate() === day && 
           today.getMonth() === currentMonth.getMonth() && 
           today.getFullYear() === currentMonth.getFullYear();
  };

  const isSelected = (day: number) => {
    return selectedDate && 
           selectedDate.getDate() === day && 
           selectedDate.getMonth() === currentMonth.getMonth() && 
           selectedDate.getFullYear() === currentMonth.getFullYear();
  };

  return (
    <div className={`relative space-y-3 p-4 ${isReservation ? 'bg-blue-50 border-blue-500' : 'bg-green-50 border-green-500'} border-2 rounded-lg`} ref={containerRef}>
      <Label className={`text-sm font-bold ${isReservation ? 'text-blue-800' : 'text-green-800'} flex items-center gap-2`}>
        <Clock className="h-4 w-4" />
        {label} {required && <span className="text-red-500">*</span>}
      </Label>

      {/* Custom date picker trigger */}
      <div className="space-y-2">
        <Button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full px-4 py-3 border-2 ${isReservation ? 'border-blue-300 hover:border-blue-500 focus:border-blue-600 focus:ring-blue-200' : 'border-green-300 hover:border-green-500 focus:border-green-600 focus:ring-green-200'} rounded-lg bg-white text-gray-900 text-base font-medium cursor-pointer focus:ring-2 transition-all flex items-center justify-between`}
          style={{ minHeight: '48px', fontSize: '16px' }}
        >
          <span>
            {selectedDate ? formatDisplayDate(selectedDate) : `Select ${label}`}
          </span>
        </Button>
      </div>

      {/* Custom date picker popup - Fixed positioning and z-index */}
      {isOpen && (
        <div 
          ref={popupRef}
          className="absolute top-full left-0 right-0 z-[9999] bg-white border-2 border-gray-800 rounded-lg shadow-2xl p-4 mt-2 min-w-[300px] max-h-[400px] overflow-y-auto custom-datetime-calendar-popup"
          style={{
            position: 'absolute',
            top: '100%',
            left: '0',
            right: '0',
            zIndex: 99999,
            backgroundColor: '#ffffff !important',
            background: '#ffffff !important',
            border: '3px solid #000000',
            borderRadius: '8px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 10px 20px -5px rgba(0, 0, 0, 0.3)',
            padding: '16px',
            marginTop: '8px',
            minWidth: '300px',
            maxHeight: '400px',
            overflowY: 'auto',
            opacity: '1 !important',
            backdropFilter: 'none',
            filter: 'none'
          }}
        >
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <Button
              type="button"
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              variant="outline"
              size="sm"
            >
              ←
            </Button>
            <span className="font-semibold">
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            <Button
              type="button"
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              variant="outline"
              size="sm"
            >
              →
            </Button>
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 p-1">
                {day}
              </div>
            ))}
            {emptyDays.map((_, index) => (
              <div key={`empty-${index}`} className="p-1" />
            ))}
            {days.map(day => (
              <Button
                key={day}
                type="button"
                onClick={() => handleDateSelect(day)}
                variant={isSelected(day) ? "default" : "ghost"}
                className={`p-1 h-8 w-8 text-sm ${isToday(day) ? 'ring-2 ring-blue-500' : ''} ${isSelected(day) ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}
              >
                {day}
              </Button>
            ))}
          </div>

          {/* Time picker */}
          {showTime && (
            <div className="mb-4">
              <Label className="text-sm font-medium mb-2 block">Time</Label>
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button onClick={handleConfirm} className="flex-1">
              Confirm
            </Button>
            <Button onClick={handleClear} variant="outline" size="sm">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Display selected date/time */}
      {selectedDate && (
        <div className={`p-3 ${isReservation ? 'bg-blue-100 border-blue-300 text-blue-800' : 'bg-green-100 border-green-300 text-green-800'} border-2 rounded-lg`}>
          <p className="text-sm font-semibold mb-1">
            ✅ SELECTED {label.toUpperCase()}:
          </p>
          <p className={`text-lg font-bold ${isReservation ? 'text-blue-900' : 'text-green-900'}`}>
            {formatDisplayDate(selectedDate)}
          </p>
        </div>
      )}
    </div>
  );
}; 