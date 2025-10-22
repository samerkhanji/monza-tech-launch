import { supabase } from '@/integrations/supabase/client';

/**
 * Move a car to a specific floor
 * @param carId - The ID of the car to move
 * @param newFloor - The target floor (SHOWROOM_1, SHOWROOM_2, CAR_INVENTORY, etc.)
 * @returns Promise with the updated car data
 */
export async function moveCar(carId: string, newFloor: string) {
  try {
    console.log(`🚗 Moving car ${carId} to ${newFloor}...`);
    
    const { data, error } = await supabase
      .from('car_inventory')
      .update({ 
        current_floor: newFloor,
        updated_at: new Date().toISOString()
      })
      .eq('id', carId)
      .select();

    if (error) {
      console.error('❌ Error moving car:', error);
      throw error;
    }

    console.log('✅ Car moved successfully:', data);
    return data;
  } catch (error) {
    console.error('❌ Failed to move car:', error);
    throw error;
  }
}

/**
 * Move a car by VIN to a specific floor
 * @param vin - The VIN of the car to move
 * @param newFloor - The target floor (SHOWROOM_1, SHOWROOM_2, CAR_INVENTORY, etc.)
 * @returns Promise with the updated car data
 */
export async function moveCarByVin(vin: string, newFloor: string) {
  try {
    console.log(`🚗 Moving car with VIN ${vin} to ${newFloor}...`);
    
    const { data, error } = await supabase
      .from('car_inventory')
      .update({ 
        current_floor: newFloor,
        updated_at: new Date().toISOString()
      })
      .eq('vin', vin)
      .select();

    if (error) {
      console.error('❌ Error moving car by VIN:', error);
      throw error;
    }

    console.log('✅ Car moved successfully by VIN:', data);
    return data;
  } catch (error) {
    console.error('❌ Failed to move car by VIN:', error);
    throw error;
  }
}

/**
 * Get the current floor of a car by VIN
 * @param vin - The VIN of the car
 * @returns Promise with the current floor
 */
export async function getCarFloor(vin: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('car_inventory')
      .select('current_floor')
      .eq('vin', vin)
      .single();

    if (error) {
      console.error('❌ Error getting car floor:', error);
      return null;
    }

    return data?.current_floor || null;
  } catch (error) {
    console.error('❌ Failed to get car floor:', error);
    return null;
  }
}

/**
 * Get all cars on a specific floor
 * @param floor - The floor to get cars from
 * @returns Promise with array of cars
 */
export async function getCarsOnFloor(floor: string) {
  try {
    const { data, error } = await supabase
      .from('car_inventory')
      .select('*')
      .eq('current_floor', floor)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('❌ Error getting cars on floor:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('❌ Failed to get cars on floor:', error);
    return [];
  }
}
