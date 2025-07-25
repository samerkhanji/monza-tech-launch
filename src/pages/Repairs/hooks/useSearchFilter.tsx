
import { useState } from 'react';
import { GarageCar } from '../types';

export const useSearchFilter = (cars: GarageCar[], garageFilterTab: string) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter cars based on search term and active tab
  const filteredCars = cars.filter(car => {
    const matchesSearch = 
      car.carModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.carCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (car.issueDescription && car.issueDescription.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (car.mechanics && car.mechanics.some(m => m.toLowerCase().includes(searchTerm.toLowerCase())));
    
    const matchesTab = 
      garageFilterTab === 'all' || 
      (garageFilterTab === 'in_garage' && car.status !== 'delivered') ||
      car.status === garageFilterTab;
    
    return matchesSearch && matchesTab;
  });

  return {
    searchTerm,
    setSearchTerm,
    filteredCars
  };
};
