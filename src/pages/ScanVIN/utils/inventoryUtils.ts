
import { Car } from '../../CarInventory/types';

export const addCarToInventory = (car: Car): boolean => {
  const savedInventory = localStorage.getItem('carInventory');
  const cars: Car[] = savedInventory ? JSON.parse(savedInventory) : [];
  
  // Check if car already exists
  const existingCar = cars.find(c => c.vinNumber === car.vinNumber);
  if (existingCar) {
    return false;
  }
  
  const updatedCars = [...cars, car];
  localStorage.setItem('carInventory', JSON.stringify(updatedCars));
  return true;
};

export const checkCarExistsInInventory = (vinNumber: string): boolean => {
  const savedInventory = localStorage.getItem('carInventory');
  if (!savedInventory) return false;
  
  const cars: Car[] = JSON.parse(savedInventory);
  return cars.some(car => car.vinNumber === vinNumber);
};
