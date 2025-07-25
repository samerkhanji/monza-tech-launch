
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
      const savedSchedules = localStorage.getItem('garageSchedules');
      if (savedSchedules) {
        try {
          const schedulesData: GarageSchedule[] = JSON.parse(savedSchedules);
          setSchedules(schedulesData);

          // Flatten all scheduled cars with schedule context
          const flattenedCars = schedulesData.flatMap(schedule => 
            (schedule.scheduledCars || []).map(car => ({
              ...car,
              scheduleDate: schedule.date,
              scheduleTime: `${schedule.startTime} - ${schedule.endTime}`,
              available: schedule.available,
              scheduleNotes: schedule.notes
            }))
          );

          setAllScheduledCars(flattenedCars);
        } catch (error) {
          console.error('Error loading garage schedules:', error);
        }
      }
    };

    loadScheduleData();

    // Listen for schedule changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'garageSchedules') {
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
