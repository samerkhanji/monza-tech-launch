
import { toast } from '@/hooks/use-toast';
import { NewCarArrival } from '../types';
import { ScheduledCar } from '@/types';

export const useGarageScheduleIntegration = () => {
  const addCarToGarageSchedule = (
    car: NewCarArrival,
    estimatedHours: string,
    workType: 'electrical' | 'painter' | 'detailer' | 'mechanic' | 'body_work' = 'mechanic',
    priority: 'high' | 'medium' | 'low' = 'medium',
    targetDate?: string
  ) => {
    // Get current garage schedules
    const savedSchedules = localStorage.getItem('garageSchedules');
    if (!savedSchedules) {
      toast({
        title: "No Schedule Found",
        description: "Please create a garage schedule first before adding cars.",
        variant: "destructive"
      });
      return false;
    }

    const schedules = JSON.parse(savedSchedules);
    const today = new Date().toISOString().split('T')[0];
    const scheduleDate = targetDate || today;
    
    // Find the target schedule
    const targetSchedule = schedules.find((s: any) => s.date === scheduleDate);
    if (!targetSchedule) {
      toast({
        title: "Schedule Not Found",
        description: `No schedule found for ${scheduleDate}. Please create one first.`,
        variant: "destructive"
      });
      return false;
    }

    // Check capacity
    const currentCount = targetSchedule.currentCarsScheduled || 0;
    const maxCapacity = targetSchedule.maxCarsCapacity || 7;
    
    if (currentCount >= maxCapacity) {
      toast({
        title: "Schedule Full",
        description: `The schedule for ${scheduleDate} is at full capacity (${maxCapacity} cars).`,
        variant: "destructive"
      });
      return false;
    }

    // Create scheduled car entry
    const scheduledCar: ScheduledCar = {
      id: `scheduled-${Date.now()}`,
      carCode: car.vin,
      carModel: car.model,
      customerName: 'New Arrival', // Default for new arrivals
      priority,
      estimatedDuration: estimatedHours,
      workType,
      assignedMechanic: car.pdiPerformedBy || '',
      notes: car.notes || '',
      status: 'scheduled'
    };

    // Update the schedule
    const updatedSchedule = {
      ...targetSchedule,
      scheduledCars: [...(targetSchedule.scheduledCars || []), scheduledCar],
      currentCarsScheduled: currentCount + 1
    };

    // Update schedules array
    const updatedSchedules = schedules.map((s: any) => 
      s.id === targetSchedule.id ? updatedSchedule : s
    );

    // Save back to localStorage
    localStorage.setItem('garageSchedules', JSON.stringify(updatedSchedules));

    toast({
      title: "Car Added to Schedule",
      description: `${car.vin} has been scheduled for ${scheduleDate} with ${estimatedHours}h estimated time.`,
    });

    return true;
  };

  return { addCarToGarageSchedule };
};
