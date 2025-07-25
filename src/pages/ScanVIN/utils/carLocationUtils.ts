
import { Car } from '../../CarInventory/types';

export const updateCarLocation = (carId: string, updates: Partial<Car>): Car | null => {
  const savedInventory = localStorage.getItem('carInventory');
  if (!savedInventory) return null;
  
  const cars: Car[] = JSON.parse(savedInventory);
  const carIndex = cars.findIndex(car => car.id === carId);
  
  if (carIndex === -1) return null;
  
  const updatedCar = { ...cars[carIndex], ...updates };
  cars[carIndex] = updatedCar;
  
  localStorage.setItem('carInventory', JSON.stringify(cars));
  return updatedCar;
};

export const getLocationUpdatesForDestination = (destination: string): { updates: Partial<Car>; destinationName: string } => {
  switch (destination) {
    case 'repairs':
      return {
        updates: {
          currentFloor: undefined,
          inShowroom: false,
          showroomNote: '',
          showroomEntryDate: undefined
        },
        destinationName: 'Repairs'
      };
    
    case 'schedule':
      return {
        updates: {
          currentFloor: undefined,
          inShowroom: false,
          showroomNote: '',
          showroomEntryDate: undefined
        },
        destinationName: 'Garage Schedule'
      };
    
    case 'showroom1':
      return {
        updates: {
          currentFloor: 'Showroom 1',
          inShowroom: true,
          showroomEntryDate: new Date().toISOString(),
          showroomNote: ''
        },
        destinationName: 'Showroom Floor 1'
      };
    
    case 'showroom2':
      return {
        updates: {
          currentFloor: 'Showroom 2',
          inShowroom: true,
          showroomEntryDate: new Date().toISOString(),
          showroomNote: ''
        },
        destinationName: 'Showroom Floor 2'
      };
    
    default:
      return {
        updates: {},
        destinationName: ''
      };
  }
};
