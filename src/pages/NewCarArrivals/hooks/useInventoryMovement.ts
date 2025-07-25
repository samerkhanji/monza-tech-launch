
import { NewCarArrival } from '../types';
import { toast } from '@/hooks/use-toast';

// Simple implementation of addCarToInventory function
const addCarToInventory = (carData: any) => {
  const savedInventory = localStorage.getItem('carInventory');
  const existingCars = savedInventory ? JSON.parse(savedInventory) : [];
  
  const newCar = {
    id: Date.now().toString(),
    ...carData,
    lastUpdated: new Date().toISOString()
  };
  
  const updatedInventory = [...existingCars, newCar];
  localStorage.setItem('carInventory', JSON.stringify(updatedInventory));
  
  return newCar;
};

export const useInventoryMovement = (
  newCars: NewCarArrival[],
  setNewCars: React.Dispatch<React.SetStateAction<NewCarArrival[]>>
) => {
  const handleMoveToInventory = (carId: string) => {
    const car = newCars.find((car) => car.id === carId);
    
    if (!car) {
      toast({
        title: "Error",
        description: "Car not found",
        variant: "destructive",
      });
      return;
    }
    
    // Check if VIN already exists in inventory
    const savedInventory = localStorage.getItem('carInventory');
    const existingCars = savedInventory ? JSON.parse(savedInventory) : [];
    const vinToCheck = car.vin || car.vinNumber;
    const vinExists = existingCars.some((existingCar: unknown) => {
      const car = existingCar as { vinNumber?: string; vin?: string };
      return car.vinNumber === vinToCheck || car.vin === vinToCheck;
    });
    
    if (vinExists) {
      toast({
        title: "Duplicate VIN Error",
        description: `A car with VIN ${vinToCheck} already exists in inventory. Cannot add duplicate.`,
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Create the inventory car entry from the new car arrival data
      const inventoryCar = addCarToInventory({
        model: car.model,
        year: car.year,
        color: car.color,
        arrivalDate: car.arrivalDate,
        vinNumber: car.vin || car.vinNumber,
        notes: car.notes,
        status: 'in_stock',
        batteryPercentage: car.batteryPercentage,
        damages: car.damages ? [...car.damages] : [],
        category: car.category || car.vehicleCategory || 'EV'
      });
      
      // Remove the car from new arrivals immediately after successful addition
      setNewCars((prevCars) => prevCars.filter((c) => c.id !== carId));
      
      toast({
        title: "Success",
        description: `Car ${vinToCheck} moved to inventory successfully`,
      });
      
      return inventoryCar;
    } catch (error) {
      console.error("Error moving car to inventory:", error);
      toast({
        title: "Error",
        description: "Failed to move car to inventory",
        variant: "destructive",
      });
      return null;
    }
  };

  const handleMoveToGarage = (carId: string) => {
    const car = newCars.find((car) => car.id === carId);
    
    if (!car) {
      toast({
        title: "Error",
        description: "Car not found",
        variant: "destructive",
      });
      return null;
    }

    return car;
  };
  
  return { handleMoveToInventory, handleMoveToGarage };
};
