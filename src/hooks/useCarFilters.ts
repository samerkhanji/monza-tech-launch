
import { useState } from 'react';
import { Car } from '@/pages/CarInventory/types';

interface FilterState {
  model: string;
  vin: string;
  color: string;
  category: string;
  status: string;
  location: string;
  customs: string;
  customDuty: string; // Added this property
  notes: string;
  clientName: string;
}

export const useCarFilters = () => {
  const [filters, setFilters] = useState<FilterState>({
    model: '',
    vin: '',
    color: '',
    category: '',
    status: '',
    location: '',
    customs: '',
    customDuty: '', // Added this property
    notes: '',
    clientName: ''
  });

  const updateFilter = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const filterCars = (cars: Car[]) => {
    return cars.filter(car => {
      return (
        (filters.model === '' || car.model === filters.model) &&
        (car.vinNumber || '').toLowerCase().includes(filters.vin.toLowerCase()) &&
        (car.color || '').toLowerCase().includes(filters.color.toLowerCase()) &&
        (filters.category === '' || car.category === filters.category) &&
        (filters.status === '' || car.status === filters.status) &&
        (filters.location === '' || (car.currentFloor || 'Client') === filters.location) &&
        (filters.customs === '' || (car.customs || '').toLowerCase() === filters.customs.toLowerCase()) &&
        (filters.customDuty === '' || (car.customs || '').toLowerCase() === filters.customDuty.toLowerCase()) &&
        (filters.notes === '' || (car.notes || '').toLowerCase().includes(filters.notes.toLowerCase())) &&
        (filters.clientName === '' || (car.clientName || '').toLowerCase().includes(filters.clientName.toLowerCase()))
      );
    });
  };

  return {
    filters,
    updateFilter,
    filterCars,
  };
};
