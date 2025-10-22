// ========================================
// UNIVERSAL SCAN HANDLER
// ========================================
// Call this from every page that has a scanner UI. Pass the correct context from that page.

import { supabase } from '@/integrations/supabase/client';
import { isValidVin } from '@/utils/vinValidation';

// All available locations in the system
export const ALL_LOCATIONS = [
  'SHOWROOM_1',
  'SHOWROOM_2', 
  'CAR_INVENTORY',
  'GARAGE_INVENTORY',
  'SCHEDULE',
  'ORDERED_CARS'
] as const;

export type Location = typeof ALL_LOCATIONS[number];

// Scan result interface
export interface ScanResult {
  ok: boolean;
  vin: string;
  old_location?: string;
  new_location: string;
  message: string;
  noop?: boolean;
}

// Car movement result interface
export interface MoveResult {
  ok: boolean;
  vin: string;
  old_location: string;
  new_location: string;
  message: string;
}

/**
 * Universal VIN scan handler - moves car to the scan context location
 * @param vin - The VIN to scan
 * @param scanContext - Where the scan is happening (e.g., 'FLOOR_1')
 * @returns ScanResult with movement details
 */
export async function handleVinScan(vin: string, scanContext: Location): Promise<ScanResult> {
  try {
    const cleanVin = vin.trim().toUpperCase();
    
    // Validate VIN format
    if (!isValidVin(cleanVin)) {
      throw new Error('Invalid VIN format. Please scan a valid VIN (17 chars, no I/O/Q).');
    }

    // Validate scan context
    if (!ALL_LOCATIONS.includes(scanContext)) {
      throw new Error(`Invalid scan context: ${scanContext}`);
    }

    // Move the car directly using update instead of RPC
    const { data, error } = await supabase
      .from('car_inventory')
      .update({ 
        current_floor: scanContext,
        updated_at: new Date().toISOString()
      })
      .eq('vin', cleanVin)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    // Return success result
    const result = {
      ok: true,
      vin: cleanVin,
      old_location: data?.current_floor || 'Unknown',
      new_location: scanContext,
      message: `Car ${cleanVin} moved to ${scanContext}`
    };

    return result as ScanResult;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to process VIN scan');
  }
}

/**
 * Manual car movement handler
 * @param vin - The VIN to move
 * @param targetLocation - Where to move the car
 * @returns MoveResult with movement details
 */
export async function moveCar(vin: string, targetLocation: Location): Promise<MoveResult> {
  try {
    const cleanVin = vin.trim().toUpperCase();
    
    // Validate VIN format
    if (!isValidVin(cleanVin)) {
      throw new Error('Invalid VIN format. Please enter a valid VIN (17 chars, no I/O/Q).');
    }

    // Validate target location
    if (!ALL_LOCATIONS.includes(targetLocation)) {
      throw new Error(`Invalid target location: ${targetLocation}`);
    }

    // Move the car directly using update instead of RPC
    const { data, error } = await supabase
      .from('car_inventory')
      .update({ 
        current_floor: targetLocation,
        updated_at: new Date().toISOString()
      })
      .eq('vin', cleanVin)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    // Return success result
    const result = {
      ok: true,
      vin: cleanVin,
      old_location: data?.current_floor || 'Unknown',
      new_location: targetLocation,
      message: `Car ${cleanVin} manually moved to ${targetLocation}`
    };

    return result as MoveResult;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to move car');
  }
}

/**
 * Get available move locations (excluding current location)
 * @param currentLocation - Current location to exclude from options
 * @returns Array of available target locations
 */
export function getAvailableMoveLocations(currentLocation: Location): Location[] {
  return ALL_LOCATIONS.filter(location => location !== currentLocation);
}

/**
 * Get car count for a specific location
 * @param location - Location to count cars
 * @returns Number of cars at that location
 */
export async function getCarCountByLocation(location: Location): Promise<number> {
  try {
    if (!ALL_LOCATIONS.includes(location)) {
      throw new Error(`Invalid location: ${location}`);
    }

    const { data, error } = await supabase.rpc('get_car_count_by_location', {
      p_location: location
    });

    if (error) {
      throw new Error(error.message);
    }

    return data || 0;
  } catch (error) {
    console.error('Error getting car count:', error);
    return 0;
  }
}

/**
 * Get cars by location
 * @param location - Location to get cars from
 * @returns Array of cars at that location
 */
export async function getCarsByLocation(location: Location) {
  try {
    if (!ALL_LOCATIONS.includes(location)) {
      throw new Error(`Invalid location: ${location}`);
    }

    const { data, error } = await supabase.rpc('get_cars_by_location', {
      p_location: location
    });

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  } catch (error) {
    console.error('Error getting cars by location:', error);
    return [];
  }
}

/**
 * Get current location of a car
 * @param vin - VIN to check
 * @returns Current location of the car
 */
export async function getCarLocation(vin: string): Promise<string | null> {
  try {
    const cleanVin = vin.trim().toUpperCase();
    
    if (!isValidVin(cleanVin)) {
      throw new Error('Invalid VIN format');
    }

    const { data, error } = await supabase.rpc('get_car_location', {
      p_vin: cleanVin
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error('Error getting car location:', error);
    return null;
  }
}

/**
 * Get scan history for a VIN
 * @param vin - VIN to get history for
 * @returns Array of scan logs
 */
export async function getScanHistory(vin: string) {
  try {
    const cleanVin = vin.trim().toUpperCase();
    
    if (!isValidVin(cleanVin)) {
      throw new Error('Invalid VIN format');
    }

    const { data, error } = await supabase
      .from('scan_logs')
      .select('*')
      .eq('vin', cleanVin)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  } catch (error) {
    console.error('Error getting scan history:', error);
    return [];
  }
}

/**
 * Get all car counts for all locations
 * @returns Object with counts for each location
 */
export async function getAllLocationCounts(): Promise<Record<Location, number>> {
  try {
    const counts: Record<Location, number> = {} as Record<Location, number>;
    
    // Get counts for all locations in parallel
    const countPromises = ALL_LOCATIONS.map(async (location) => {
      const count = await getCarCountByLocation(location);
      return { location, count };
    });

    const results = await Promise.all(countPromises);
    
    results.forEach(({ location, count }) => {
      counts[location] = count;
    });

    return counts;
  } catch (error) {
    console.error('Error getting all location counts:', error);
    return ALL_LOCATIONS.reduce((acc, location) => {
      acc[location] = 0;
      return acc;
    }, {} as Record<Location, number>);
  }
}

/**
 * Validate if a location is valid
 * @param location - Location to validate
 * @returns True if valid, false otherwise
 */
export function isValidLocation(location: string): location is Location {
  return ALL_LOCATIONS.includes(location as Location);
}

/**
 * Get human-readable location labels
 * @param location - Location to get label for
 * @returns Human-readable label
 */
export function getLocationLabel(location: Location): string {
  const labels: Record<Location, string> = {
    'SHOWROOM_1': 'Floor 1',
    'SHOWROOM_2': 'Floor 2',
    'CAR_INVENTORY': 'Car Inventory',
    'GARAGE_INVENTORY': 'Garage Inventory',
    'SCHEDULE': 'Schedule',
    'ORDERED_CARS': 'Ordered Cars'
  };
  
  return labels[location] || location;
}

/**
 * Get all location labels
 * @returns Object with all location labels
 */
export function getAllLocationLabels(): Record<Location, string> {
  return ALL_LOCATIONS.reduce((acc, location) => {
    acc[location] = getLocationLabel(location);
    return acc;
  }, {} as Record<Location, string>);
}
