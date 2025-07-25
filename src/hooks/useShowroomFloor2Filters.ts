
import { useState } from 'react';
import { Car } from '@/pages/CarInventory/types';

interface FilterState {
  model: string;
  color: string;
  status: string;
}

export const useShowroomFloor2Filters = () => {
  const [filters, setFilters] = useState<FilterState>({
    model: '',
    color: '',
    status: ''
  });

  const updateFilter = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const filterCars = (cars: Car[]) => {
    return cars.filter(car => {
      return (
        (filters.model === '' || car.model === filters.model) &&
        (filters.color === '' || car.color === filters.color) &&
        (filters.status === '' || car.status === filters.status)
      );
    });
  };

  return {
    filters,
    updateFilter,
    filterCars,
  };
};
