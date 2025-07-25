
import { useState } from 'react';
import { NewCar } from '@/pages/NewCarArrivals/types';

interface FilterState {
  status: string;
  category: string;
  search: string;
  model: string;
}

export const useNewCarArrivalsFilters = () => {
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    category: 'all',
    search: '',
    model: 'all'
  });

  const updateFilter = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const filterCars = (cars: NewCar[]) => {
    return cars.filter(car => {
      const matchesStatus = filters.status === 'all' || car.status === filters.status;
      const matchesCategory = filters.category === 'all' || car.category === filters.category || car.vehicleCategory === filters.category;
      const matchesModel = filters.model === 'all' || car.model?.toLowerCase().includes(filters.model.toLowerCase());
      const matchesSearch = filters.search === '' || 
        car.vin?.toLowerCase().includes(filters.search.toLowerCase()) ||
        car.vinNumber?.toLowerCase().includes(filters.search.toLowerCase()) ||
        car.model?.toLowerCase().includes(filters.search.toLowerCase()) ||
        car.brand?.toLowerCase().includes(filters.search.toLowerCase());
      
      return matchesStatus && matchesCategory && matchesModel && matchesSearch;
    });
  };

  return {
    filters,
    updateFilter,
    filterCars
  };
};
