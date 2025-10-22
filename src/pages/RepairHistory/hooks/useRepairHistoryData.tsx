
import { useState, useEffect } from 'react';
import { dateUtils, numberUtils, stringUtils, validationUtils } from '@/lib/utils';
import { GarageCar } from '@/pages/Repairs/types';
import { GarageSchedule } from '@/types';
import { safeLocalStorageGet } from '@/utils/errorHandling';

export const useRepairHistoryData = () => {
  const [completedCars, setCompletedCars] = useState<GarageCar[]>([]);
  const [garageSchedule, setGarageSchedule] = useState<GarageSchedule[]>([]);

  useEffect(() => {
    // First, try to load from dedicated repairHistory key
    const savedRepairHistory = localStorage.getItem('repairHistory');
    if (savedRepairHistory) {
      try {
        const repairHistoryData = safeLocalStorageGet<any[]>('repairHistory', []);
        console.log(`Repair History: Loaded ${repairHistoryData.length} repairs from repairHistory`);
        
        // Convert repair history data to GarageCar format
        const convertedRepairs = repairHistoryData.map((repair: any) => ({
          id: repair.id,
          carCode: repair.carVin,
          vinNumber: repair.carVin,
          carModel: repair.carModel,
          model: repair.carModel, // Keep both for compatibility
          brand: 'Voyah',
          status: repair.status === 'completed' ? 'delivered' : repair.status,
          startTimestamp: repair.repairDate,
          endTimestamp: repair.repairDate, // Use repair date as end timestamp
          assignedMechanic: repair.mechanic,
          repairNotes: repair.issue,
          solution: repair.solution,
          cost: repair.cost,
          notes: repair.notes,
          customerName: repair.customerName || 'Unknown Customer',
          issueDescription: repair.issue,
          lastUpdated: repair.repairDate,
          entryDate: repair.repairDate, // Add missing entryDate field
          // Add other required fields
          category: 'EV',
          batteryPercentage: 85,
          range: 520,
          color: 'White',
          year: 2024,
          currentFloor: 'garage'
        }));
        
        setCompletedCars(convertedRepairs);
      } catch (error) {
        console.error('Error parsing repair history:', error);
      }
    } else {
      // Fallback: Load cars from garage overview (completed/delivered cars)
      const savedGarageCars = localStorage.getItem('garageCars');
      if (savedGarageCars) {
        try {
          const allCars: GarageCar[] = JSON.parse(savedGarageCars);
          const completed = allCars.filter(car => 
            car.status === 'delivered' || car.endTimestamp
          );
          setCompletedCars(completed);
          console.log(`Repair History: Loaded ${completed.length} completed cars from garageCars`);
        } catch (error) {
          console.error('Error parsing garage cars:', error);
        }
      }
    }

    // Load garage schedule for additional context
    let savedSchedule = localStorage.getItem('garageSchedules');
    if (!savedSchedule) {
      savedSchedule = localStorage.getItem('garageSchedule');
    }
    if (savedSchedule) {
      try {
        const scheduleData = JSON.parse(savedSchedule);
        const scheduleArray = Array.isArray(scheduleData) ? scheduleData : [scheduleData];
        setGarageSchedule(scheduleArray);
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
