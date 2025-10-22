import { supabase } from '@/integrations/supabase/client';

export interface GarageInventoryItem {
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

export class GarageInventoryTable {
  // Get all cars in garage inventory
  static async getAllCars(): Promise<GarageInventoryItem[]> {
    try {
      const { data, error } = await supabase
        .from('car_inventory')
        .select('*')
        .eq('current_floor', 'GARAGE');
      
      if (error) {
        console.error('Error fetching garage inventory:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getAllCars:', error);
      return [];
    }
  }

  // Get garage inventory car count
  static async getCarCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('car_inventory')
        .select('*', { count: 'exact', head: true })
        .eq('current_floor', 'GARAGE');
      
      if (error) {
        console.error('Error getting garage inventory count:', error);
        return 0;
      }
      
      return count || 0;
    } catch (error) {
      console.error('Error in getCarCount:', error);
      return 0;
    }
  }

  // Add a car to garage inventory
  static async addCar(carId: string, notes?: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('car_inventory')
        .update({ 
          current_floor: 'GARAGE',
          notes: notes || `Moved to Garage on ${new Date().toLocaleDateString()}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', carId);
      
      if (error) {
        console.error('Error adding car to garage inventory:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error in addCar:', error);
      return false;
    }
  }

  // Remove a car from garage inventory
  static async removeCar(carId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('car_inventory')
        .update({ 
          current_floor: 'INVENTORY',
          notes: `Removed from Garage on ${new Date().toLocaleDateString()}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', carId);
      
      if (error) {
        console.error('Error removing car from garage inventory:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error in removeCar:', error);
      return false;
    }
  }

  // Get cars by service status
  static async getCarsByServiceStatus(status: string): Promise<GarageInventoryItem[]> {
    try {
      const { data, error } = await supabase
        .from('car_inventory')
        .select('*')
        .eq('current_floor', 'GARAGE')
        .eq('status', status);
      
      if (error) {
        console.error('Error fetching cars by service status:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getCarsByServiceStatus:', error);
      return [];
    }
  }

  // Update car service status
  static async updateServiceStatus(carId: string, newStatus: string, notes?: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('car_inventory')
        .update({ 
          status: newStatus,
          notes: notes || `Service status updated to ${newStatus} on ${new Date().toLocaleDateString()}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', carId);
      
      if (error) {
        console.error('Error updating service status:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error in updateServiceStatus:', error);
      return false;
    }
  }

  // Get cars needing PDI
  static async getCarsNeedingPDI(): Promise<GarageInventoryItem[]> {
    try {
      const { data, error } = await supabase
        .from('car_inventory')
        .select('*')
        .eq('current_floor', 'GARAGE')
        .eq('pdi_completed', false);
      
      if (error) {
        console.error('Error fetching cars needing PDI:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getCarsNeedingPDI:', error);
      return [];
    }
  }

  // Mark PDI as completed
  static async markPDICompleted(carId: string, technician: string, notes?: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('car_inventory')
        .update({ 
          pdi_completed: true,
          pdi_technician: technician,
          pdi_date: new Date().toISOString(),
          pdi_notes: notes || `PDI completed by ${new Date().toLocaleDateString()}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', carId);
      
      if (error) {
        console.error('Error marking PDI completed:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error in markPDICompleted:', error);
      return false;
    }
  }

  // Clear all cars from garage inventory
  static async clearAllCars(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('car_inventory')
        .update({ 
          current_floor: 'INVENTORY',
          notes: `Cleared from Garage on ${new Date().toLocaleDateString()}`,
          updated_at: new Date().toISOString()
        })
        .eq('current_floor', 'GARAGE');
      
      if (error) {
        console.error('Error clearing garage inventory:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error in clearAllCars:', error);
      return false;
    }
  }
}
