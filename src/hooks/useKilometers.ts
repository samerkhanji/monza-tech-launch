import { useState, useEffect } from 'react';
import { kilometersService } from '@/services/kilometersService';

export const useKilometers = (carId: string) => {
  const [kilometers, setKilometers] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const currentKilometers = kilometersService.getKilometersDriven(carId);
    setKilometers(currentKilometers);
  }, [carId]);

  const updateKilometers = async (newKilometers: number, vinNumber: string, model: string) => {
    setLoading(true);
    try {
      await kilometersService.updateKilometersDriven(carId, vinNumber, model, newKilometers);
      setKilometers(newKilometers);
      return true;
    } catch (error) {
      console.error('Error updating kilometers:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    kilometers,
    loading,
    updateKilometers,
    refresh: () => {
      const currentKilometers = kilometersService.getKilometersDriven(carId);
      setKilometers(currentKilometers);
    }
  };
};

export const useAllKilometers = () => {
  const [allKilometers, setAllKilometers] = useState<Array<{
    carId: string;
    vinNumber: string;
    model: string;
    kilometersDriven: number;
  }>>([]);

  useEffect(() => {
    const kilometers = kilometersService.getAllCarsWithKilometers();
    setAllKilometers(kilometers);
  }, []);

  const refresh = () => {
    const kilometers = kilometersService.getAllCarsWithKilometers();
    setAllKilometers(kilometers);
  };

  return {
    allKilometers,
    refresh
  };
}; 