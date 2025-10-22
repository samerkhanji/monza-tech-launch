import { supabase } from '@/integrations/supabase/client';
import type { Floor } from './move-smart-helpers';

export async function moveLiveCar(carId: string, to: Floor) {
  try {
    // Try RPC first, fallback to direct update
    const { data, error } = await supabase.rpc('move_car', { p_car_id: carId, p_to: to });
    
    if (error) {
      console.log('RPC not available, using direct update:', error.message);
      // Fallback to direct update
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('car_inventory')
        .update({ current_location: to })
        .eq('id', carId)
        .select()
        .single();
      
      if (fallbackError) throw fallbackError;
      return fallbackData;
    }
    
    return data;
  } catch (error) {
    console.error('Error moving car:', error);
    throw error;
  }
}

export async function receiveOrderedCar(orderedId: string, to: Floor = 'CAR_INVENTORY') {
  try {
    const { data, error } = await supabase.rpc('receive_ordered_car', { p_ordered_id: orderedId, p_to: to });
    
    if (error) {
      console.log('RPC not available for receive, using direct update:', error.message);
      // Fallback to direct update for ordered cars
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('ordered_cars')
        .update({ status: 'RECEIVED', current_floor: to })
        .eq('id', orderedId)
        .select()
        .single();
      
      if (fallbackError) throw fallbackError;
      return fallbackData;
    }
    
    return data;
  } catch (error) {
    console.error('Error receiving ordered car:', error);
    throw error;
  }
}
