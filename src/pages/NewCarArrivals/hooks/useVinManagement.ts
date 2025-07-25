
import { NewCarArrival } from '../types';

export const useVinManagement = () => {
  const checkAndRemoveOrderedVin = (car: NewCarArrival) => {
    const orderedCars = JSON.parse(localStorage.getItem('orderedCars') || '[]');
    const existingOrderIndex = orderedCars.findIndex((order: any) => 
      order.vin_number === car.vin
    );
    
    if (existingOrderIndex >= 0) {
      // Remove VIN from ordered cars as it has arrived
      orderedCars.splice(existingOrderIndex, 1);
      localStorage.setItem('orderedCars', JSON.stringify(orderedCars));
      console.log(`VIN ${car.vin} removed from ordered cars - car has arrived`);
      return true;
    } else {
      // Notify about non-existing VIN
      console.warn(`Unexisting VIN ${car.vin} has been uploaded to arrivals`);
      return false;
    }
  };

  const processCarArrival = (car: NewCarArrival) => {
    if (car.status === 'arrived') {
      return checkAndRemoveOrderedVin(car);
    }
    return false;
  };

  return {
    checkAndRemoveOrderedVin,
    processCarArrival
  };
};
