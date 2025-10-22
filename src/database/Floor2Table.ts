import { supabase } from '@/integrations/supabase/client';

export interface Floor2Car {
  id: string;
  vin: string;
  model: string;
  year: number;
  color: string;
  brand: string;
  vehicle_type: string;
  selling_price: number;
  status: string;
  battery_percentage: number;
  range: number;
  delivery_date: string;
  pdi_completed: boolean;
  pdi_technician: string;
  pdi_date: string;
  pdi_notes: string;
  custom_duty: string;
  current_floor: string;
  notes: string;
  warranty_life: string | null;
  vehicle_expiry_date: string | null;
  battery_expiry_date: string | null;
  dms_deadline_date: string | null;
  created_at: string;
  updated_at: string;
}

export class Floor2Table {
  private static refreshCallback: (() => void) | null = null;

  // Set up real-time subscription for Floor 2 cars
  static setupRealtimeSubscription(refreshCallback: () => void) {
    this.refreshCallback = refreshCallback;
    
    const channel = supabase
      .channel('floor2-cars-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'car_inventory',
          filter: 'current_floor=eq.SHOWROOM_2'
        },
        (payload) => {
          console.log('🔁 Floor 2 car updated:', payload);
          if (this.refreshCallback) {
            this.refreshCallback();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'car_inventory',
          filter: 'current_floor=eq.SHOWROOM_2'
        },
        (payload) => {
          console.log('🔁 Floor 2 car added:', payload);
          if (this.refreshCallback) {
            this.refreshCallback();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'car_inventory',
          filter: 'current_floor=eq.SHOWROOM_2'
        },
        (payload) => {
          console.log('🔁 Floor 2 car removed:', payload);
          if (this.refreshCallback) {
            this.refreshCallback();
          }
        }
      )
      .subscribe();

    console.log('✅ Floor 2: Real-time subscription established');
    return channel;
  }

  // Clean up subscription
  static cleanupSubscription(channel: any) {
    if (channel) {
      supabase.removeChannel(channel);
      console.log('🔌 Floor 2: Real-time subscription cleaned up');
    }
  }

  // Get all cars on Floor 2
  static async getAllCars(): Promise<Floor2Car[]> {
    try {
      const { data, error } = await supabase
        .from('car_inventory')
        .select('*')
        .eq('current_floor', 'SHOWROOM_2');
      
      if (error) {
        console.error('Error fetching Floor 2 cars:', error);
        throw error;
      }
      
      console.log(`✅ Floor2Table: Found ${data?.length || 0} cars on Floor 2`);
      return data || [];
    } catch (error) {
      console.error('Error in getAllCars:', error);
      return [];
    }
  }

  // Get car count on Floor 2
  static async getCarCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('car_inventory')
        .select('*', { count: 'exact', head: true })
        .eq('current_floor', 'SHOWROOM_2');
      
      if (error) {
        console.error('Error getting Floor 2 car count:', error);
        return 0;
      }
      
      return count || 0;
    } catch (error) {
      console.error('Error in getCarCount:', error);
      return 0;
    }
  }

  // Add a car to Floor 2
  static async addCar(carId: string, notes?: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('car_inventory')
        .update({ 
          current_floor: 'SHOWROOM_2',
          notes: notes || `Moved to Floor 2 on ${new Date().toLocaleDateString()}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', carId);
      
      if (error) {
        console.error('Error adding car to Floor 2:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error in addCar:', error);
      return false;
    }
  }

  // Remove a car from Floor 2
  static async removeCar(carId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('car_inventory')
        .update({ 
          current_floor: 'INVENTORY',
          notes: `Removed from Floor 2 on ${new Date().toLocaleDateString()}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', carId);
      
      if (error) {
        console.error('Error removing car from Floor 2:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error in removeCar:', error);
      return false;
    }
  }

  // Clear all cars from Floor 2
  static async clearAllCars(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('car_inventory')
        .update({ 
          current_floor: 'INVENTORY',
          notes: `Cleared from Floor 2 on ${new Date().toLocaleDateString()}`,
          updated_at: new Date().toISOString()
        })
        .eq('current_floor', 'SHOWROOM_2');
      
      if (error) {
        console.error('Error clearing Floor 2:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error in clearAllCars:', error);
      return false;
    }
  }
}
