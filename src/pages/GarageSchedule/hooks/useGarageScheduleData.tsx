
import { useState, useEffect } from 'react';
import { format, addDays } from 'date-fns';
import { GarageSchedule, ScheduledCar } from '@/types';
import { useToast } from '@/hooks/use-toast';

// Mock data for scheduled cars
const generateMockScheduledCars = (): ScheduledCar[] => [
  {
    id: '1',
    carCode: 'MONZA-001',
    carModel: 'Voyah Free 2024',
    customerName: 'Ahmed Al Mansouri',
    priority: 'high',
    estimatedDuration: '4',
    workType: 'electrical',
    assignedMechanic: 'Mohammed Hassan',
    notes: 'Battery system check and software update required',
    status: 'in_progress',
    testDriveStatus: 'not_available'
  },
  {
    id: '2',
    carCode: 'MONZA-002',
    carModel: 'Voyah Dreamer 2024',
    customerName: 'Sarah Johnson',
    priority: 'medium',
    estimatedDuration: '2',
    workType: 'detailer',
    assignedMechanic: 'Ali Ahmed',
    notes: 'Interior cleaning and exterior detailing',
    status: 'scheduled',
    testDriveStatus: 'available'
  },
  {
    id: '3',
    carCode: 'MONZA-003',
    carModel: 'Voyah Free 2023',
    customerName: 'David Chen',
    priority: 'high',
    estimatedDuration: '6',
    workType: 'mechanic',
    assignedMechanic: 'Omar Khalil',
    notes: 'Engine diagnostic and brake system repair',
    status: 'pending',
    testDriveStatus: 'not_available'
  },
  {
    id: '4',
    carCode: 'MONZA-004',
    carModel: 'Voyah Dreamer 2024',
    customerName: 'Fatima Al Zahra',
    priority: 'low',
    estimatedDuration: '1.5',
    workType: 'painter',
    assignedMechanic: 'Hassan Ali',
    notes: 'Minor paint touch-up on front bumper',
    status: 'completed',
    testDriveStatus: 'available'
  },
  {
    id: '5',
    carCode: 'MONZA-005',
    carModel: 'Voyah Free 2024',
    customerName: 'Michael Rodriguez',
    priority: 'medium',
    estimatedDuration: '3',
    workType: 'body_work',
    assignedMechanic: 'Youssef Mahmoud',
    notes: 'Door panel replacement and alignment',
    status: 'scheduled',
    testDriveStatus: 'not_available'
  },
  {
    id: '6',
    carCode: 'MONZA-006',
    carModel: 'Voyah Dreamer 2023',
    customerName: 'Aisha Al Qasimi',
    priority: 'high',
    estimatedDuration: '5',
    workType: 'electrical',
    assignedMechanic: 'Khalid Omar',
    notes: 'Complete electrical system overhaul',
    status: 'delayed',
    testDriveStatus: 'not_available'
  },
  {
    id: '7',
    carCode: 'MONZA-007',
    carModel: 'Voyah Free 2024',
    customerName: 'Robert Wilson',
    priority: 'low',
    estimatedDuration: '2',
    workType: 'detailer',
    assignedMechanic: 'Ahmed Hassan',
    notes: 'Full interior and exterior detailing',
    status: 'scheduled',
    testDriveStatus: 'available'
  }
];

export const useGarageScheduleData = () => {
  const [schedules, setSchedules] = useState<GarageSchedule[]>([]);
  const [todaySchedule, setTodaySchedule] = useState<GarageSchedule | null>(null);
  const [tomorrowSchedule, setTomorrowSchedule] = useState<GarageSchedule | null>(null);
  const { toast } = useToast();

  const today = format(new Date(), 'yyyy-MM-dd');
  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');

  useEffect(() => {
    // Load garage schedules from DatabaseManager
    const loadSchedulesFromDatabase = async () => {
      try {
        console.log('Garage Schedule: Loading schedules from DatabaseManager...');
        
        const { DatabaseManager } = await import('@/database/DatabaseManager');
        
        // Get scheduled cars count from database
        const scheduledCount = await DatabaseManager.getScheduledCount();
        
        // Create schedule structure based on database data
        const todaySchedule: GarageSchedule = {
          id: 'today',
          date: today,
          startTime: '09:00',
          endTime: '17:00',
          available: true,
          notes: scheduledCount > 0 ? `${scheduledCount} cars scheduled` : 'No scheduled cars',
          maxCarsCapacity: 7,
          currentCarsScheduled: scheduledCount,
          scheduledCars: []
        };
        
        const tomorrowSchedule: GarageSchedule = {
          id: 'tomorrow',
          date: tomorrow,
          startTime: '09:00',
          endTime: '17:00',
          available: true,
          notes: 'No scheduled cars for tomorrow',
          maxCarsCapacity: 5,
          currentCarsScheduled: 0,
          scheduledCars: []
        };
        
        const schedules = [todaySchedule, tomorrowSchedule];
        setSchedules(schedules);
        setTodaySchedule(todaySchedule);
        setTomorrowSchedule(tomorrowSchedule);
        
        console.log(`Garage Schedule: Loaded ${scheduledCount} scheduled cars from DatabaseManager`);
      } catch (error) {
        console.error('Error loading schedules from DatabaseManager:', error);
        
        // Fallback to empty schedules
        const emptyTodaySchedule: GarageSchedule = {
          id: 'empty-today',
          date: today,
          startTime: '09:00',
          endTime: '17:00',
          available: true,
          notes: 'Error loading data',
          maxCarsCapacity: 7,
          currentCarsScheduled: 0,
          scheduledCars: []
        };
        
        const emptyTomorrowSchedule: GarageSchedule = {
          id: 'empty-tomorrow',
          date: tomorrow,
          startTime: '09:00',
          endTime: '17:00',
          available: true,
          notes: 'Error loading data',
          maxCarsCapacity: 5,
          currentCarsScheduled: 0,
          scheduledCars: []
        };
        
        const emptySchedules = [emptyTodaySchedule, emptyTomorrowSchedule];
        setSchedules(emptySchedules);
        setTodaySchedule(emptyTodaySchedule);
        setTomorrowSchedule(emptyTomorrowSchedule);
      }
    };
    
    loadSchedulesFromDatabase();
  }, [today, tomorrow]);

  const saveSchedules = (newSchedules: GarageSchedule[]) => {
    // No more localStorage - just update state
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
      startTime: '09:00', // Changed from 08:00 to 09:00
      endTime: '17:00', // Changed from 16:00 to 17:00
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
