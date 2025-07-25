
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Car } from '../types';

interface EditableCellProps {
  isEditing: boolean;
  value: any;
  field: keyof Car;
  onUpdate: (field: keyof Car, value: any) => void;
  children: React.ReactNode;
  className?: string;
  placeholder?: string;
  type?: 'text' | 'number' | 'select' | 'date';
  options?: { value: string; label: string }[];
  disabled?: boolean;
  min?: number;
  max?: number;
}

const EditableCell: React.FC<EditableCellProps> = ({
  isEditing,
  value,
  field,
  onUpdate,
  children,
  className,
  placeholder,
  type = 'text',
  options,
  disabled = false,
  min,
  max
}) => {
  const [inputValue, setInputValue] = useState(value || '');

  React.useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  const handleChange = (newValue: string) => {
    setInputValue(newValue);
    const processedValue = type === 'number' ? Number(newValue) : newValue;
    onUpdate(field, processedValue);
  };

  if (disabled) {
    return <div className={className}>{children}</div>;
  }

  if (isEditing) {
    if (type === 'select' && options) {
      return (
        <Select value={inputValue} onValueChange={handleChange}>
          <SelectTrigger className={className}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    return (
      <Input
        type={type === 'number' ? 'number' : type === 'date' ? 'date' : 'text'}
        value={inputValue}
        onChange={(e) => handleChange(e.target.value)}
        className={className}
        placeholder={placeholder}
        min={min}
        max={max}
      />
    );
  }

  return <div className={className}>{children}</div>;
};

export default EditableCell;
