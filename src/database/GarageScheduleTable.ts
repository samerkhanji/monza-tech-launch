import { supabase } from '@/integrations/supabase/client';

export interface GarageScheduleItem {
  id: string;
  car_id: string;
  vin: string;
  model: string;
  year: number;
  color: string;
  brand: string;
  vehicle_type: string;
  status: string;
  scheduled_date: string;
  scheduled_time: string;
  service_type: string;
  technician: string;
  notes: string;
  priority: string;
  estimated_duration: number;
  actual_start_time: string;
  actual_end_time: string;
  completion_status: string;
  created_at: string;
  updated_at: string;
}

export class GarageScheduleTable {
  // Get all scheduled cars
  static async getAllScheduledCars(): Promise<GarageScheduleItem[]> {
    try {
      const { data, error } = await supabase
        .from('garage_schedule')
        .select('*')
        .order('scheduled_date', { ascending: true });
      
      if (error) {
        console.error('Error fetching garage schedule:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getAllScheduledCars:', error);
      return [];
    }
  }

  // Get scheduled car count
  static async getScheduledCarCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('garage_schedule')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.error('Error getting garage schedule count:', error);
        return 0;
      }
      
      return count || 0;
    } catch (error) {
      console.error('Error in getScheduledCarCount:', error);
      return 0;
    }
  }

  // Add a car to garage schedule
  static async addCarToSchedule(carData: any, notes?: string): Promise<boolean> {
    try {
      const scheduleItem = {
        car_id: carData.id,
        vin: carData.vinNumber || carData.vin,
        model: carData.model,
        year: carData.year,
        color: carData.color,
        brand: carData.brand,
        vehicle_type: carData.category || carData.vehicle_type,
        status: 'scheduled',
        scheduled_date: new Date().toISOString().split('T')[0],
        scheduled_time: new Date().toLocaleTimeString(),
        service_type: 'PDI Check',
        technician: '',
        notes: notes || `Added to garage schedule on ${new Date().toLocaleDateString()}`,
        priority: 'medium',
        estimated_duration: 120, // 2 hours default
        completion_status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('garage_schedule')
        .insert([scheduleItem]);
      
      if (error) {
        console.error('Error adding car to garage schedule:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error in addCarToSchedule:', error);
      return false;
    }
  }

  // Remove a car from garage schedule
  static async removeCarFromSchedule(scheduleId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('garage_schedule')
        .delete()
        .eq('id', scheduleId);
      
      if (error) {
        console.error('Error removing car from garage schedule:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error in removeCarFromSchedule:', error);
      return false;
    }
  }

  // Update schedule item
  static async updateScheduleItem(scheduleId: string, updates: Partial<GarageScheduleItem>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('garage_schedule')
        .update({ 
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', scheduleId);
      
      if (error) {
        console.error('Error updating garage schedule item:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error in updateScheduleItem:', error);
      return false;
    }
  }

  // Get schedule items for a specific date
  static async getScheduleForDate(date: string): Promise<GarageScheduleItem[]> {
    try {
      const { data, error } = await supabase
        .from('garage_schedule')
        .select('*')
        .eq('scheduled_date', date)
        .order('scheduled_time', { ascending: true });
      
      if (error) {
        console.error('Error fetching schedule for date:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getScheduleForDate:', error);
      return [];
    }
  }

  // Clear all scheduled cars
  static async clearAllScheduledCars(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('garage_schedule')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all but keep table structure
      
      if (error) {
        console.error('Error clearing garage schedule:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error in clearAllScheduledCars:', error);
      return false;
    }
  }
}
