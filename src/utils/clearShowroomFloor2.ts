/**
 * Utility to clear Showroom Floor 2 Cars on Display data
 */

import { toast } from '@/hooks/use-toast';

export interface ShowroomFloor2ClearOptions {
  showToast?: boolean;
  forceRefresh?: boolean;
}

/**
 * Clear all Showroom Floor 2 Cars on Display data
 */
export function clearShowroomFloor2Cars(options: ShowroomFloor2ClearOptions = {}) {
  const { showToast = true, forceRefresh = false } = options;

  try {
    // Clear localStorage data
    localStorage.removeItem('showroomFloor2Cars');
    
    // Also clear any cached or related data
    localStorage.removeItem('showroomFloor2_cache');
    localStorage.removeItem('floor2Cars');
    localStorage.removeItem('showroom_floor_2_cars');
    
    console.log('✅ Cleared Showroom Floor 2 Cars data from localStorage');

    // Trigger custom event to notify components
    window.dispatchEvent(new CustomEvent('clearShowroomFloor2Data'));
    window.dispatchEvent(new CustomEvent('showroomFloor2CarsCleared'));
    
    // Force page refresh if requested
    if (forceRefresh) {
      window.location.reload();
    }

    if (showToast) {
      toast({
        title: "Showroom Floor 2 Cleared",
        description: "All cars have been removed from Showroom Floor 2 display.",
        variant: "default",
      });
    }

    return {
      success: true,
      message: "Showroom Floor 2 cars data cleared successfully"
    };

  } catch (error) {
    console.error('❌ Error clearing Showroom Floor 2 data:', error);
    
    if (showToast) {
      toast({
        title: "Clear Failed",
        description: "Failed to clear Showroom Floor 2 data.",
        variant: "destructive",
      });
    }

    return {
      success: false,
      message: "Failed to clear Showroom Floor 2 data",
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Get count of cars in Showroom Floor 2
 */
export function getShowroomFloor2Count(): number {
  try {
    const carsData = localStorage.getItem('showroomFloor2Cars');
    if (!carsData) return 0;
    
    const cars = JSON.parse(carsData);
    return Array.isArray(cars) ? cars.length : 0;
  } catch (error) {
    console.error('Error counting Showroom Floor 2 cars:', error);
    return 0;
  }
}

/**
 * Check if Showroom Floor 2 has any data
 */
export function hasShowroomFloor2Data(): boolean {
  return getShowroomFloor2Count() > 0;
}

/**
 * Get all Showroom Floor 2 cars data for backup/export
 */
export function getShowroomFloor2Data() {
  try {
    const carsData = localStorage.getItem('showroomFloor2Cars');
    return carsData ? JSON.parse(carsData) : [];
  } catch (error) {
    console.error('Error getting Showroom Floor 2 data:', error);
    return [];
  }
}

// Make functions available globally for console debugging
(window as any).clearShowroomFloor2Cars = clearShowroomFloor2Cars;
(window as any).getShowroomFloor2Count = getShowroomFloor2Count;
(window as any).hasShowroomFloor2Data = hasShowroomFloor2Data;
(window as any).getShowroomFloor2Data = getShowroomFloor2Data;
