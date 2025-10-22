import { supabase } from '@/integrations/supabase/client';

// Define the floor types
export type Floor = 'INVENTORY' | 'SHOWROOM_1' | 'SHOWROOM_2' | 'GARAGE';

// Clean move car function - updates only the current_floor column
export async function moveCar(carId: string, toFloor: Floor) {
  try {
    console.log(`🚗 Moving car ${carId} to ${toFloor}...`);
    
    const { data, error } = await supabase
      .from('car_inventory')
      .update({ 
        current_floor: toFloor,
        updated_at: new Date().toISOString()
      })
      .eq('id', carId)
      .select()
      .single();

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

// Move car by VIN
export async function moveCarByVin(vin: string, toFloor: Floor) {
  try {
    console.log(`🚗 Moving car with VIN ${vin} to ${toFloor}...`);
    
    const { data, error } = await supabase
      .from('car_inventory')
      .update({ 
        current_floor: toFloor,
        updated_at: new Date().toISOString()
      })
      .eq('vin', vin)
      .select()
      .single();

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

// Get cars by floor
export async function getCarsByFloor(floor: Floor) {
  try {
    const { data, error } = await supabase
      .from('car_inventory')
      .select('*')
      .eq('current_floor', floor)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('❌ Error getting cars by floor:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('❌ Failed to get cars by floor:', error);
    return [];
  }
}

// Get car floor by VIN
export async function getCarFloor(vin: string): Promise<Floor | null> {
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

    return data?.current_floor as Floor || null;
  } catch (error) {
    console.error('❌ Failed to get car floor:', error);
    return null;
  }
}

// Get floor counts
export async function getFloorCounts() {
  try {
    const { data, error } = await supabase
      .from('car_inventory')
      .select('current_floor');

    if (error) {
      console.error('❌ Error getting floor counts:', error);
      throw error;
    }

    const counts: Record<string, number> = {};
    data?.forEach(car => {
      const floor = car.current_floor || 'UNKNOWN';
      counts[floor] = (counts[floor] || 0) + 1;
    });

    return counts;
  } catch (error) {
    console.error('❌ Failed to get floor counts:', error);
    return {};
  }
}
