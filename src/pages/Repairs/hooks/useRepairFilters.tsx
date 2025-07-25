
import { useState, useMemo } from 'react';
import { dateUtils, numberUtils, stringUtils, validationUtils } from '@/lib/utils';
import { GarageCar } from '../types';

export const useRepairFilters = (cars: GarageCar[], searchTerm: string) => {
  // Format date and time from timestamp
  // Removed local formatDateTime - using dateUtils.formatDateTime from utils

  // Filter cars based on search term
  const filteredCars = useMemo(() => cars.filter(car => {
    return car.carModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.carCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (car.mechanics && car.mechanics.some(mechanic => mechanic.toLowerCase().includes(searchTerm.toLowerCase())));
  }), [cars, searchTerm]);

  return {
    formatDateTime,
    filteredCars
  };
};
