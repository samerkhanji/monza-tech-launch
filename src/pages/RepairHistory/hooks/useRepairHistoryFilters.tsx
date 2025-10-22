
import { useState } from 'react';
import { GarageCar } from '@/pages/Repairs/types';

export const useRepairHistoryFilters = (repairHistory: GarageCar[]) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filterCars = (cars: GarageCar[]) => {
    return cars.filter(car => {
      const searchLower = searchTerm.toLowerCase();
      return (
        (car.carModel?.toLowerCase() || car.model?.toLowerCase() || '').includes(searchLower) ||
        (car.customerName?.toLowerCase() || '').includes(searchLower) ||
        (car.issueDescription?.toLowerCase() || '').includes(searchLower) ||
        (car.carCode?.toLowerCase() || '').includes(searchLower)
      );
    });
  };

  const filteredRepairs = filterCars(repairHistory);

  return {
    searchTerm,
    setSearchTerm,
    filterCars,
    filteredRepairs
  };
};
