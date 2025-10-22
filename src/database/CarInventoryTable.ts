import { supabase } from '@/integrations/supabase/client';

export interface CarInventoryItem {
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
  created_at: string;
  updated_at: string;
}

export class CarInventoryTable {
  // Get all cars in main inventory (cars NOT on showroom floors or garage)
  static async getAllCars(): Promise<CarInventoryItem[]> {
    try {
      const { data, error } = await supabase
        .from('car_inventory')
        .select('*')
        .not('current_floor', 'in', ['SHOWROOM_1', 'SHOWROOM_2', 'GARAGE']);
      
      if (error) {
        console.error('Error fetching car inventory:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getAllCars:', error);
      return [];
    }
  }

  // Get car count in main inventory (cars NOT on showroom floors or garage)
  static async getCarCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('car_inventory')
        .select('*', { count: 'exact', head: true })
        .not('current_floor', 'in', ['SHOWROOM_1', 'SHOWROOM_2', 'GARAGE']);
      
      if (error) {
        console.error('Error getting car inventory count:', error);
        return 0;
      }
      
      return count || 0;
    } catch (error) {
      console.error('Error in getCarCount:', error);
      return 0;
    }
  }

  // Get total car count (all cars regardless of location)
  static async getTotalCarCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('car_inventory')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.error('Error getting total car count:', error);
        return 0;
      }
      
      return count || 0;
    } catch (error) {
      console.error('Error in getTotalCarCount:', error);
      return 0;
    }
  }

  // Move a car from inventory to another location
  static async moveCar(carId: string, destination: string, notes?: string): Promise<boolean> {
    try {
      let newFloor: string;
      switch (destination) {
        case 'floor1':
          newFloor = 'SHOWROOM_1';
          break;
        case 'floor2':
          newFloor = 'SHOWROOM_2';
          break;
        case 'garage':
        case 'garage-schedule':
          newFloor = 'GARAGE';
          break;
        default:
          newFloor = 'INVENTORY';
      }

      const { error } = await supabase
        .from('car_inventory')
        .update({ 
          current_floor: newFloor,
          notes: notes || `Moved to ${newFloor} on ${new Date().toLocaleDateString()}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', carId);
      
      if (error) {
        console.error('Error moving car:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error in moveCar:', error);
      return false;
    }
  }

  // Get car by ID
  static async getCarById(carId: string): Promise<CarInventoryItem | null> {
    try {
      const { data, error } = await supabase
        .from('car_inventory')
        .select('*')
        .eq('id', carId)
        .single();
      
      if (error) {
        console.error('Error fetching car by ID:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error in getCarById:', error);
      return null;
    }
  }

  // Search cars by various criteria (cars NOT on showroom floors or garage)
  static async searchCars(searchTerm: string): Promise<CarInventoryItem[]> {
    try {
      const { data, error } = await supabase
        .from('car_inventory')
        .select('*')
        .not('current_floor', 'in', ['SHOWROOM_1', 'SHOWROOM_2', 'GARAGE'])
        .or(`model.ilike.%${searchTerm}%,vin.ilike.%${searchTerm}%,brand.ilike.%${searchTerm}%`);
      
      if (error) {
        console.error('Error searching cars:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in searchCars:', error);
      return [];
    }
  }
}
