
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { GarageCar } from '../types';

export const useGarageActions = (
  cars: GarageCar[], 
  setCars: React.Dispatch<React.SetStateAction<GarageCar[]>> | (() => void)
) => {
  const [selectedCar, setSelectedCar] = useState<GarageCar | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  // Removed the automatic refresh useEffect that was causing data to change

  const openCarDetails = (car: GarageCar) => {
    setSelectedCar(car);
    setDetailsModalOpen(true);
  };

  const handleUpdateStatus = (id: string, newStatus: GarageCar['status']) => {
    if (typeof setCars !== 'function') return;
    
    const now = new Date().toISOString();
    
    // Update car status
    const updatedCars = cars.map(car => {
      if (car.id === id) {
        return {
          ...car,
          status: newStatus,
          lastUpdated: now,
          // Set the end timestamp if the car is ready
          endTimestamp: newStatus === 'ready' ? now : car.endTimestamp
        };
      }
      return car;
    });
    
    setCars(updatedCars);
    
    // Save to localStorage for persistence
    localStorage.setItem('garageCars', JSON.stringify(updatedCars));
    
    toast({
      title: "Status Updated",
      description: `Car status has been updated to ${newStatus.replace('_', ' ')}`
    });
  };

  const handleUpdateCarDetails = (id: string, updates: Partial<GarageCar>) => {
    if (typeof setCars !== 'function') return;
    
    const now = new Date().toISOString();
    
    // Update car details
    const updatedCars = cars.map(car => {
      if (car.id === id) {
        return {
          ...car,
          ...updates,
          lastUpdated: now
        };
      }
      return car;
    });
    
    setCars(updatedCars);
    
    // Save to localStorage for persistence
    localStorage.setItem('garageCars', JSON.stringify(updatedCars));
    
    // Close the modal and set the selected car to null
    setDetailsModalOpen(false);
    setSelectedCar(null);
    
    toast({
      title: "Car Details Updated",
      description: "Car details have been updated successfully."
    });
  };

  return {
    selectedCar,
    detailsModalOpen,
    setDetailsModalOpen,
    openCarDetails,
    handleUpdateStatus,
    handleUpdateCarDetails
  };
};
