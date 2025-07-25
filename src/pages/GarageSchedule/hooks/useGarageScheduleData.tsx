
import { useState, useEffect } from 'react';
import { format, addDays } from 'date-fns';
import { GarageSchedule } from '@/types';
import { useToast } from '@/hooks/use-toast';

export const useGarageScheduleData = () => {
  const [schedules, setSchedules] = useState<GarageSchedule[]>([]);
  const [todaySchedule, setTodaySchedule] = useState<GarageSchedule | null>(null);
  const [tomorrowSchedule, setTomorrowSchedule] = useState<GarageSchedule | null>(null);
  const { toast } = useToast();

  const today = format(new Date(), 'yyyy-MM-dd');
  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');

  useEffect(() => {
    const savedSchedules = localStorage.getItem('garageSchedules');
    if (savedSchedules) {
      const parsedSchedules = JSON.parse(savedSchedules);
      setSchedules(parsedSchedules);
      
      // Find today's and tomorrow's schedule
      const todayEntry = parsedSchedules.find((s: GarageSchedule) => s.date === today);
      const tomorrowEntry = parsedSchedules.find((s: GarageSchedule) => s.date === tomorrow);
      setTodaySchedule(todayEntry || null);
      setTomorrowSchedule(tomorrowEntry || null);
    }
  }, [today, tomorrow]);

  const saveSchedules = (newSchedules: GarageSchedule[]) => {
    localStorage.setItem('garageSchedules', JSON.stringify(newSchedules));
    setSchedules(newSchedules);
    
    // Update today's and tomorrow's schedule if affected
    const todayEntry = newSchedules.find(s => s.date === today);
    const tomorrowEntry = newSchedules.find(s => s.date === tomorrow);
    setTodaySchedule(todayEntry || null);
    setTomorrowSchedule(tomorrowEntry || null);
  };

  const createSchedule = (formData: any, editingSchedule?: GarageSchedule | null) => {
    if (editingSchedule) {
      // Update existing schedule
      const updatedSchedules = schedules.map(schedule =>
        schedule.id === editingSchedule.id
          ? { 
              ...editingSchedule, 
              ...formData,
              maxCarsCapacity: formData.maxCarsCapacity,
              scheduledCars: editingSchedule.scheduledCars || []
            }
          : schedule
      );
      saveSchedules(updatedSchedules);
    } else {
      // Add new schedule
      const newSchedule: GarageSchedule = {
        id: Date.now().toString(),
        ...formData,
        maxCarsCapacity: formData.maxCarsCapacity,
        currentCarsScheduled: 0,
        scheduledCars: []
      };
      saveSchedules([...schedules, newSchedule]);
    }
  };

  const deleteSchedule = (scheduleId: string) => {
    const updatedSchedules = schedules.filter(s => s.id !== scheduleId);
    saveSchedules(updatedSchedules);
  };

  const createDefaultSchedule = (date: string) => {
    const newSchedule: GarageSchedule = {
      id: Date.now().toString(),
      date,
      startTime: '08:00',
      endTime: '16:00',
      available: true,
      notes: '',
      maxCarsCapacity: 7,
      currentCarsScheduled: 0,
      scheduledCars: []
    };
    saveSchedules([...schedules, newSchedule]);
  };

  return {
    schedules,
    todaySchedule,
    tomorrowSchedule,
    today,
    tomorrow,
    saveSchedules,
    createSchedule,
    deleteSchedule,
    createDefaultSchedule
  };
};
