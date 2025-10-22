import { useState, useEffect, useCallback } from 'react';
import { GarageCar } from '../types';
import { GarageSchedule, ScheduledCar } from '@/types';
import { Car } from '@/pages/CarInventory/types';

export const useGarageScheduleIntegration = () => {
  const [scheduledCars, setScheduledCars] = useState<ScheduledCar[]>([]);
  const [inventoryCarsWithIssues, setInventoryCarsWithIssues] = useState<Car[]>([]);

  useEffect(() => {
    // Load scheduled cars from garage schedule
    const loadScheduledCars = () => {
      // Try both keys for backward compatibility
      let savedSchedules = localStorage.getItem('garageSchedules');
      if (!savedSchedules) {
        savedSchedules = localStorage.getItem('garageSchedule');
      }
      
      if (savedSchedules) {
        try {
          const schedules: GarageSchedule[] = JSON.parse(savedSchedules);
          // Ensure it's an array
          const schedulesArray = Array.isArray(schedules) ? schedules : [schedules];
          const today = new Date().toISOString().split('T')[0];
          const todaySchedule = schedulesArray.find(s => s.date === today);
          
          if (todaySchedule && todaySchedule.scheduledCars) {
            setScheduledCars(todaySchedule.scheduledCars);
            console.log(`Garage Schedule Integration: Loaded ${todaySchedule.scheduledCars.length} scheduled cars for today`);
          } else {
            console.log('Garage Schedule Integration: No scheduled cars found for today');
            setScheduledCars([]);
          }
        } catch (error) {
          console.error('Error loading scheduled cars:', error);
        }
      } else {
        console.log('Garage Schedule Integration: No schedules found in localStorage');
      }
    };

    // Load inventory cars with damages or issues
    const loadInventoryCarsWithIssues = () => {
      const savedInventory = localStorage.getItem('carInventory');
      if (savedInventory) {
        try {
          const inventory: Car[] = JSON.parse(savedInventory);
          const carsWithIssues = inventory.filter(car => 
            (car.damages && car.damages.length > 0) || 
            (car.notes && car.notes.toLowerCase().includes('issue')) ||
            (car.notes && car.notes.toLowerCase().includes('problem')) ||
            (car.notes && car.notes.toLowerCase().includes('repair'))
          );
          setInventoryCarsWithIssues(carsWithIssues);
        } catch (error) {
          console.error('Error loading inventory cars:', error);
        }
      }
    };

    loadScheduledCars();
    loadInventoryCarsWithIssues();

    // Set up storage listeners
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'garageSchedules' || e.key === 'garageSchedule') {
        loadScheduledCars();
      } else if (e.key === 'carInventory') {
        loadInventoryCarsWithIssues();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Sync function to ensure data integrity between schedule and garage
  const syncScheduleWithGarage = useCallback(() => {
    // Try both keys for backward compatibility
    let schedules = localStorage.getItem('garageSchedules');
    if (!schedules) {
      schedules = localStorage.getItem('garageSchedule');
    }
    const garageCars = localStorage.getItem('garageCars');
    
    if (!schedules) return [];

    try {
      const schedulesData: GarageSchedule[] = JSON.parse(schedules);
      // Ensure it's an array
      const schedulesArray = Array.isArray(schedulesData) ? schedulesData : [schedulesData];
      const garageData: GarageCar[] = garageCars ? JSON.parse(garageCars) : [];
      
      // Get all scheduled cars from all dates
      const allScheduledCars = schedulesArray.flatMap(schedule => 
        (schedule.scheduledCars || []).map(car => ({
          ...car,
          scheduleDate: schedule.date
        }))
      );
      
      // Remove garage cars that are no longer in any schedule (except completed ones)
      const validGarageCars = garageData.filter(garageCar => 
        allScheduledCars.some(scheduledCar => scheduledCar.carCode === garageCar.carCode) ||
        garageCar.status === 'delivered' ||
        garageCar.endTimestamp
      );
      
      // Save the cleaned garage data
      localStorage.setItem('garageCars', JSON.stringify(validGarageCars));
      
      return validGarageCars;
    } catch (error) {
      console.error('Error syncing schedule with garage:', error);
      return [];
    }
  }, []);

  const convertScheduledCarToGarageCar = (scheduledCar: ScheduledCar): GarageCar => {
    return {
      id: `garage-${scheduledCar.id}`,
      carModel: scheduledCar.carModel,
      carCode: scheduledCar.carCode,
      customerName: scheduledCar.customerName,
      entryDate: new Date().toISOString(),
      status: 'in_diagnosis',
      assignedEmployee: scheduledCar.assignedMechanic || 'Unassigned',
      mechanics: scheduledCar.assignedMechanic ? [scheduledCar.assignedMechanic] : [],
      notes: scheduledCar.notes,
      workNotes: `Scheduled work: ${scheduledCar.workType} (${scheduledCar.estimatedDuration}h)`,
      issueDescription: `Category: ${scheduledCar.workType}, Priority: ${scheduledCar.priority}`,
      repairDuration: scheduledCar.estimatedDuration + 'h',
      lastUpdated: new Date().toISOString()
    };
  };

  const convertInventoryCarToGarageCar = (inventoryCar: Car): GarageCar => {
    const issueDescription = inventoryCar.damages && inventoryCar.damages.length > 0
      ? inventoryCar.damages.map(d => `${d.severity} ${d.description} at ${d.location}`).join('; ')
      : inventoryCar.notes || 'General maintenance required';

    return {
      id: `garage-inv-${inventoryCar.id}`,
      carModel: inventoryCar.model,
      carCode: inventoryCar.vinNumber,
      customerName: inventoryCar.clientName || 'Inventory Vehicle',
      entryDate: new Date().toISOString(),
      status: 'in_diagnosis',
      assignedEmployee: 'Unassigned',
      mechanics: [],
      notes: inventoryCar.notes,
      issueDescription,
      workNotes: 'Transferred from inventory due to reported issues',
      lastUpdated: new Date().toISOString()
    };
  };

  return {
    scheduledCars,
    inventoryCarsWithIssues,
    convertScheduledCarToGarageCar,
    convertInventoryCarToGarageCar,
    syncScheduleWithGarage
  };
};
