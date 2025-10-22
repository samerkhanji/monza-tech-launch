import { supabase } from '@/integrations/supabase/client';

export interface CarInventoryData {
  id: string;
  vinNumber: string;
  carModel: string;
  brand: string;
  year: number;
  color: string;
  category: string;
  batteryPercentage?: number;
  range?: number;
  sellingPrice?: number;
  status: string;
  currentFloor: string;
  customerName?: string;
  assignedMechanic?: string;
  notes?: string;
  estimatedDuration?: string;
  workType?: string;
  priority?: string;
  testDriveStatus?: string;
}

export class CarInventoryService {
  // Find car by VIN across all inventory tables
  static async findCarByVIN(vinNumber: string): Promise<CarInventoryData | null> {
    try {
      // Search in Floor 1 inventory
      const { data: floor1Data, error: floor1Error } = await supabase
        .from('showroom_floor1_inventory')
        .select('*')
        .eq('vinNumber', vinNumber)
        .single();

      if (floor1Data && !floor1Error) {
        return {
          ...floor1Data,
          currentFloor: 'floor1'
        };
      }

      // Search in Floor 2 inventory
      const { data: floor2Data, error: floor2Error } = await supabase
        .from('showroom_floor2_inventory')
        .select('*')
        .eq('vinNumber', vinNumber)
        .single();

      if (floor2Data && !floor2Error) {
        return {
          ...floor2Data,
          currentFloor: 'floor2'
        };
      }

      // Search in Garage inventory
      const { data: garageData, error: garageError } = await supabase
        .from('garage_inventory')
        .select('*')
        .eq('vinNumber', vinNumber)
        .single();

      if (garageData && !garageError) {
        return {
          ...garageData,
          currentFloor: 'garage'
        };
      }

      return null;
    } catch (error) {
      console.error('Error finding car by VIN:', error);
      return null;
    }
  }

  // Update car status across all inventory tables
  static async updateCarStatus(vinNumber: string, newStatus: string): Promise<boolean> {
    try {
      const updates = [];

      // Update Floor 1 inventory
      const { error: floor1Error } = await supabase
        .from('showroom_floor1_inventory')
        .update({ status: newStatus })
        .eq('vinNumber', vinNumber);

      if (!floor1Error) {
        updates.push('Floor 1');
      }

      // Update Floor 2 inventory
      const { error: floor2Error } = await supabase
        .from('showroom_floor2_inventory')
        .update({ status: newStatus })
        .eq('vinNumber', vinNumber);

      if (!floor2Error) {
        updates.push('Floor 2');
      }

      // Update Garage inventory
      const { error: garageError } = await supabase
        .from('garage_inventory')
        .update({ status: newStatus })
        .eq('vinNumber', vinNumber);

      if (!garageError) {
        updates.push('Garage');
      }

      console.log(`Updated car status to "${newStatus}" in: ${updates.join(', ')}`);
      return updates.length > 0;
    } catch (error) {
      console.error('Error updating car status:', error);
      return false;
    }
  }

  // Add car to garage schedule
  static async addCarToSchedule(carData: CarInventoryData): Promise<boolean> {
    try {
      const scheduleData = {
        id: `schedule_${Date.now()}`,
        carCode: carData.vinNumber,
        carModel: carData.carModel,
        customerName: carData.customerName || 'Customer TBD',
        priority: carData.priority || 'medium',
        estimatedDuration: carData.estimatedDuration || '2',
        workType: carData.workType || 'mechanic',
        assignedMechanic: carData.assignedMechanic || 'Mechanic TBD',
        notes: carData.notes || 'Car added via VIN scan',
        status: 'scheduled',
        testDriveStatus: 'not_available',
        vinNumber: carData.vinNumber,
        brand: carData.brand,
        year: carData.year,
        color: carData.color,
        category: carData.category,
        batteryPercentage: carData.batteryPercentage,
        range: carData.range,
        sellingPrice: carData.sellingPrice,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('garage_schedule')
        .insert([scheduleData]);

      if (error) {
        console.error('Error adding car to schedule:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error adding car to schedule:', error);
      return false;
    }
  }

  // Get all cars from all inventory tables
  static async getAllCars(): Promise<CarInventoryData[]> {
    try {
      const cars: CarInventoryData[] = [];

      // Get Floor 1 cars
      const { data: floor1Data, error: floor1Error } = await supabase
        .from('showroom_floor1_inventory')
        .select('*');

      if (floor1Data && !floor1Error) {
        cars.push(...floor1Data.map(car => ({ ...car, currentFloor: 'floor1' })));
      }

      // Get Floor 2 cars
      const { data: floor2Data, error: floor2Error } = await supabase
        .from('showroom_floor2_inventory')
        .select('*');

      if (floor2Data && !floor2Error) {
        cars.push(...floor2Data.map(car => ({ ...car, currentFloor: 'floor2' })));
      }

      // Get Garage cars
      const { data: garageData, error: garageError } = await supabase
        .from('garage_inventory')
        .select('*');

      if (garageData && !garageError) {
        cars.push(...garageData.map(car => ({ ...car, currentFloor: 'garage' })));
      }

      return cars;
    } catch (error) {
      console.error('Error getting all cars:', error);
      return [];
    }
  }

  // Move car to specific destination
  static async moveCarToDestination(vinNumber: string, destination: string): Promise<boolean> {
    try {
      // First, find the car in any inventory table
      const carData = await this.findCarByVIN(vinNumber);
      
      if (!carData) {
        console.error(`Car with VIN ${vinNumber} not found in any inventory`);
        return false;
      }

      // Remove car from current location
      const currentFloor = carData.currentFloor;
      
      if (currentFloor === 'floor1') {
        const { error: deleteError } = await supabase
          .from('showroom_floor1_inventory')
          .delete()
          .eq('vinNumber', vinNumber);
        
        if (deleteError) {
          console.error('Error removing car from Floor 1:', deleteError);
          return false;
        }
      } else if (currentFloor === 'floor2') {
        const { error: deleteError } = await supabase
          .from('showroom_floor2_inventory')
          .delete()
          .eq('vinNumber', vinNumber);
        
        if (deleteError) {
          console.error('Error removing car from Floor 2:', deleteError);
          return false;
        }
      } else if (currentFloor === 'garage') {
        const { error: deleteError } = await supabase
          .from('garage_inventory')
          .delete()
          .eq('vinNumber', vinNumber);
        
        if (deleteError) {
          console.error('Error removing car from Garage:', deleteError);
          return false;
        }
      }

      // Add car to destination
      const carToMove = {
        ...carData,
        currentFloor: destination,
        updated_at: new Date().toISOString()
      };

      let insertError;
      
      switch (destination) {
        case 'floor1':
          const { error: floor1Error } = await supabase
            .from('showroom_floor1_inventory')
            .insert([carToMove]);
          insertError = floor1Error;
          break;
          
        case 'floor2':
          const { error: floor2Error } = await supabase
            .from('showroom_floor2_inventory')
            .insert([carToMove]);
          insertError = floor2Error;
          break;
          
        case 'garage':
          const { error: garageError } = await supabase
            .from('garage_inventory')
            .insert([carToMove]);
          insertError = garageError;
          break;
          
        case 'car_inventory':
          // For car_inventory, we'll add to Floor 1 as default
          const { error: carInventoryError } = await supabase
            .from('showroom_floor1_inventory')
            .insert([carToMove]);
          insertError = carInventoryError;
          break;
          
        default:
          console.error(`Unknown destination: ${destination}`);
          return false;
      }

      if (insertError) {
        console.error(`Error adding car to ${destination}:`, insertError);
        return false;
      }

      console.log(`Successfully moved car ${vinNumber} from ${currentFloor} to ${destination}`);
      return true;
    } catch (error) {
      console.error('Error moving car to destination:', error);
      return false;
    }
  }
} 