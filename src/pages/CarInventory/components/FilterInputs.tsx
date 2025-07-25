
import React from 'react';
import { Input } from '@/components/ui/input';

interface FilterInputsProps {
  filters: {
    model: string;
    vin: string;
    color: string;
    category: string;
    status: string;
    location: string;
    customDuty: string;
    notes: string;
    clientName: string;
  };
  onFilterChange: (key: string, value: string) => void;
}

export const createFilterInputs = ({ filters, onFilterChange }: FilterInputsProps) => {
  return {
    model: (
      <Input
        placeholder="Filter model..."
        value={filters.model}
        onChange={(e) => onFilterChange('model', e.target.value)}
        className="h-8 text-xs"
        onClick={(e) => e.stopPropagation()}
      />
    ),
    vin: (
      <Input
        placeholder="Filter VIN..."
        value={filters.vin}
        onChange={(e) => onFilterChange('vin', e.target.value)}
        className="h-8 text-xs"
        onClick={(e) => e.stopPropagation()}
      />
    ),
    color: (
      <Input
        placeholder="Filter color..."
        value={filters.color}
        onChange={(e) => onFilterChange('color', e.target.value)}
        className="h-8 text-xs"
        onClick={(e) => e.stopPropagation()}
      />
    ),
    customDuty: (
      <Input
        placeholder="Filter duty..."
        value={filters.customDuty}
        onChange={(e) => onFilterChange('customDuty', e.target.value)}
        className="h-8 text-xs"
        onClick={(e) => e.stopPropagation()}
      />
    ),
    notes: (
      <Input
        placeholder="Filter notes..."
        value={filters.notes}
        onChange={(e) => onFilterChange('notes', e.target.value)}
        className="h-8 text-xs"
        onClick={(e) => e.stopPropagation()}
      />
    ),
    clientName: (
      <Input
        placeholder="Filter client..."
        value={filters.clientName}
        onChange={(e) => onFilterChange('clientName', e.target.value)}
        className="h-8 text-xs"
        onClick={(e) => e.stopPropagation()}
      />
    ),
  };
};
