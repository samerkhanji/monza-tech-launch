
import { useState, useEffect } from 'react';
import { dateUtils, numberUtils, stringUtils, validationUtils } from '@/lib/utils';
import { GarageCar } from '@/pages/Repairs/types';
import { GarageSchedule } from '@/types';

export const useRepairHistoryData = () => {
  const [completedCars, setCompletedCars] = useState<GarageCar[]>([]);
  const [garageSchedule, setGarageSchedule] = useState<GarageSchedule[]>([]);

  useEffect(() => {
    // Load cars from garage overview (completed/delivered cars)
    const savedGarageCars = localStorage.getItem('garageCars');
    if (savedGarageCars) {
      try {
        const allCars: GarageCar[] = JSON.parse(savedGarageCars);
        const completed = allCars.filter(car => 
          car.status === 'delivered' || car.endTimestamp
        );
        setCompletedCars(completed);
      } catch (error) {
        console.error('Error parsing garage cars:', error);
      }
    }

    // Load garage schedule for additional context
    const savedSchedule = localStorage.getItem('garageSchedules');
    if (savedSchedule) {
      try {
        setGarageSchedule(JSON.parse(savedSchedule));
      } catch (error) {
        console.error('Error parsing garage schedule:', error);
      }
    }
  }, []);

  // Removed local formatDateTime - using dateUtils.formatDateTime from utils

  return { 
    repairHistory: completedCars, 
    formatDateTime: dateUtils.formatDateTime,
    completedCars, 
    garageSchedule 
  };
};
