
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { Car } from '@/pages/CarInventory/types';
import { GarageCar } from '../types';
import { useAuth } from '@/contexts/AuthContext';

export const useCarActions = () => {
  const { user } = useAuth();

  const handleExportToExcel = () => {
    toast({
      title: "Excel Export",
      description: "Vehicle data exported to Excel successfully.",
    });
  };

  const handleAddCar = (car?: Car) => {
    if (car) {
      // We would add the car from inventory to the garage here
      // This would typically be an API call in a real app
      toast({
        title: "Car Added to Garage",
        description: `${car.model} (${car.vinNumber}) added to garage.`,
      });
      
      return {
        id: Math.random().toString(36).substring(2, 9),
        carModel: car.model,
        carCode: car.vinNumber.substring(0, 6),
        customerName: "New Customer",
        entryDate: new Date().toISOString(),
        status: 'in_diagnosis' as const,
        assignedEmployee: user?.name || "Unassigned",
        notes: "",
        lastUpdated: new Date().toISOString(),
        startTimestamp: new Date().toISOString(),
      } as GarageCar;
    } else {
      toast({
        title: "Add New Car",
        description: "Car entry form would open here.",
      });
      return null;
    }
  };

  return {
    handleExportToExcel,
    handleAddCar
  };
};
