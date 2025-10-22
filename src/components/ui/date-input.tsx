import React, { useState, useRef, useEffect } from 'react';
import { Input } from './input';

import { cn } from '@/lib/utils';

interface DateInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  min?: string;
  max?: string;
  id?: string;
  name?: string;
}

export const DateInput: React.FC<DateInputProps> = ({
  value = '',
  onChange,
  placeholder = 'YYYY-MM-DD',
  className,
  required = false,
  disabled = false,
  min,
  max,
  id,
  name
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (dateRegex.test(newValue) || newValue === '') {
      onChange?.(newValue);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    // Temporarily change to date type for better UX
    if (inputRef.current) {
      inputRef.current.type = 'date';
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Change back to text type to prevent browser interference
    if (inputRef.current) {
      inputRef.current.type = 'text';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow navigation keys
    if (['Tab', 'Escape', 'Enter'].includes(e.key)) {
      return;
    }
    
    // Allow date format characters and backspace/delete
    if (['Backspace', 'Delete', '-'].includes(e.key) || /^\d$/.test(e.key)) {
      return;
    }
    
    // Prevent other characters
    e.preventDefault();
  };

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        id={id}
        name={name}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn(
          isFocused && 'ring-2 ring-blue-500 ring-opacity-50',
          className
        )}
        required={required}
        disabled={disabled}
        pattern="\\d{4}-\\d{2}-\\d{2}"
        autoComplete="off"
      />

    </div>
  );
};
