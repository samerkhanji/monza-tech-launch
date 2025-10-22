
import { useState, useEffect } from 'react';
import { GarageSchedule, ScheduledCar } from '@/types';

export const useGarageScheduleData = () => {
  const [schedules, setSchedules] = useState<GarageSchedule[]>([]);
  const [allScheduledCars, setAllScheduledCars] = useState<(ScheduledCar & { 
    scheduleDate: string; 
    scheduleTime: string; 
    available: boolean;
    scheduleNotes?: string;
  })[]>([]);

  useEffect(() => {
    const loadScheduleData = () => {
      // Try both keys for backward compatibility
      let savedSchedules = localStorage.getItem('garageSchedules');
      if (!savedSchedules) {
        savedSchedules = localStorage.getItem('garageSchedule');
      }
      
      if (savedSchedules) {
        try {
          const schedulesData: GarageSchedule[] = JSON.parse(savedSchedules);
          // Ensure it's an array
          const schedulesArray = Array.isArray(schedulesData) ? schedulesData : [schedulesData];
          setSchedules(schedulesArray);

          // Flatten all scheduled cars with schedule context
          const flattenedCars = schedulesArray.flatMap(schedule => 
            (schedule.scheduledCars || []).map(car => ({
              ...car,
              scheduleDate: schedule.date,
              scheduleTime: `${schedule.startTime} - ${schedule.endTime}`,
              available: schedule.available,
              scheduleNotes: schedule.notes
            }))
          );

          setAllScheduledCars(flattenedCars);
          console.log(`Garage Schedule Data: Loaded ${flattenedCars.length} scheduled cars`);
        } catch (error) {
          console.error('Error loading garage schedules:', error);
        }
      } else {
        console.log('Garage Schedule Data: No schedules found in localStorage');
      }
    };

    loadScheduleData();

    // Listen for schedule changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'garageSchedules' || e.key === 'garageSchedule') {
        loadScheduleData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return {
    schedules,
    allScheduledCars
  };
};
