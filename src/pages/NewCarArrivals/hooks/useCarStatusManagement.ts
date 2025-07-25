
import { useState } from 'react';
import { NewCarArrival } from '../types';
import { toast } from '@/hooks/use-toast';

export const useCarStatusManagement = (
  newCars: NewCarArrival[],
  setNewCars: React.Dispatch<React.SetStateAction<NewCarArrival[]>>
) => {
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);

  const handleUpdateStatus = (carId: string, newStatus: NewCarArrival['status']) => {
    setNewCars((prevCars) => 
      prevCars.map((car) => 
        car.id === carId 
          ? { ...car, status: newStatus }
          : car
      )
    );

    toast({
      title: 'Car Status Updated',
      description: `Car status changed to ${newStatus.replace('_', ' ')}`
    });
  };

  return {
    selectedCarId,
    setSelectedCarId,
    handleUpdateStatus
  };
};
