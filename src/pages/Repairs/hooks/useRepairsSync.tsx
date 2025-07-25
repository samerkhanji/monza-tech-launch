
import { GarageCar } from '../types';

export const useRepairsSync = (
  cars: GarageCar[], 
  setCars: React.Dispatch<React.SetStateAction<GarageCar[]>>
) => {
  const handleRefresh = () => {
    // Load cars from localStorage
    const savedGarageCars = localStorage.getItem('garageCars');
    if (savedGarageCars) {
      try {
        const loadedCars: GarageCar[] = JSON.parse(savedGarageCars);
        setCars(loadedCars);
      } catch (error) {
        console.error('Error loading garage cars:', error);
      }
    }
  };

  return {
    handleRefresh
  };
};
