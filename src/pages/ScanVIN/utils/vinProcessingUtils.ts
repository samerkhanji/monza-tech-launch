import { Car } from '@/pages/CarInventory/types';

interface VINProcessResult {
  foundCar: Car | null;
  isNewCar: boolean;
  fromDatabase: boolean;
}

export const processVINToInventory = (
  vin: string,
  model: string,
  color: string,
  year: number,
  notes?: string
): VINProcessResult => {
  const carData: Car = {
    id: crypto.randomUUID(),
    vinNumber: vin,
    model,
    color,
    year,
    arrivalDate: new Date().toISOString(),
    status: 'in_stock' as const,
    notes: notes || '',
    category: 'EV',
    customs: 'not paid' as const,
    batteryPercentage: 50,
    lastUpdated: new Date().toISOString(),
    inShowroom: false,
  };
  
  return {
    foundCar: carData,
    isNewCar: true,
    fromDatabase: false
  };
};

export const processVIN = (vin: string, category: 'EV' | 'REV'): VINProcessResult => {
  // Check if VIN exists in ordered cars or existing inventory first
  const orderedCars = JSON.parse(localStorage.getItem('orderedCars') || '[]');
  const existingCar = orderedCars.find((car: any) => car.vin_number === vin);
  
  if (existingCar) {
    // Remove from ordered cars as it has arrived
    const updatedOrderedCars = orderedCars.filter((car: any) => car.vin_number !== vin);
    localStorage.setItem('orderedCars', JSON.stringify(updatedOrderedCars));
    
    return processVINToInventory(
      vin,
      existingCar.model,
      existingCar.color || 'Unknown',
      existingCar.year,
      `Arrived from order ${existingCar.order_reference}`
    );
  }
  
  // If not found in orders, create a new entry with default values
  return processVINToInventory(
    vin,
    'Unknown Model',
    'Unknown',
    new Date().getFullYear(),
    'New arrival - please update details'
  );
};

export const saveVINToDatabase = (car: Car): boolean => {
  try {
    // In a real implementation, this would save to database
    // For now, we'll just return true to indicate success
    return true;
  } catch (error) {
    console.error('Error saving VIN to database:', error);
    return false;
  }
};

export const validateVIN = (vin: string): boolean => {
  // Basic VIN validation - 17 characters, alphanumeric
  const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/;
  return vinRegex.test(vin.toUpperCase());
};

export const formatVIN = (vin: string): string => {
  return vin.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '');
}; 