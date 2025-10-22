// ========================================
// SCAN USAGE EXAMPLES
// ========================================
// Examples showing how to use the universal scan handler in different pages

import { 
  handleVinScan, 
  moveCar, 
  getAvailableMoveLocations, 
  getCarCountByLocation,
  getCarsByLocation,
  getAllLocationCounts,
  Location,
  ALL_LOCATIONS
} from '@/services/universalScanHandler';
import { toast } from '@/hooks/use-toast';

// ========================================
// FLOOR 1 PAGE INTEGRATION EXAMPLE
// ========================================

/**
 * Example: Floor 1 page with VIN scanning and car movement
 */
export async function onFloor1Scan(vin: string) {
  try {
    const result = await handleVinScan(vin, 'FLOOR_1');
    
    if (result.ok) {
      toast({
        title: "Car moved to Floor 1",
        description: result.message,
      });
      
      // Refresh the Floor 1 car list
      await refreshFloor1Cars();
      
      // Update car counts
      await updateAllCounts();
    }
  } catch (error) {
    toast({
      title: "Scan failed",
      description: error instanceof Error ? error.message : "Failed to process scan",
      variant: "destructive",
    });
  }
}

/**
 * Example: Floor 1 page - move car to another location
 */
export async function onFloor1MoveCar(vin: string, targetLocation: Location) {
  try {
    const result = await moveCar(vin, targetLocation);
    
    if (result.ok) {
      toast({
        title: "Car moved successfully",
        description: result.message,
      });
      
      // Refresh both locations
      await refreshFloor1Cars();
      await refreshTargetLocation(targetLocation);
      await updateAllCounts();
    }
  } catch (error) {
    toast({
      title: "Move failed",
      description: error instanceof Error ? error.message : "Failed to move car",
      variant: "destructive",
    });
  }
}

/**
 * Example: Get available move options for Floor 1
 */
export function getFloor1MoveOptions(): Location[] {
  return getAvailableMoveLocations('FLOOR_1');
  // Returns: ['FLOOR_2', 'CAR_INVENTORY', 'GARAGE_INVENTORY', 'SCHEDULE', 'ORDERED_CARS']
}

// ========================================
// FLOOR 2 PAGE INTEGRATION EXAMPLE
// ========================================

export async function onFloor2Scan(vin: string) {
  try {
    const result = await handleVinScan(vin, 'FLOOR_2');
    
    if (result.ok) {
      toast({
        title: "Car moved to Floor 2",
        description: result.message,
      });
      
      await refreshFloor2Cars();
      await updateAllCounts();
    }
  } catch (error) {
    toast({
      title: "Scan failed",
      description: error instanceof Error ? error.message : "Failed to process scan",
      variant: "destructive",
    });
  }
}

export function getFloor2MoveOptions(): Location[] {
  return getAvailableMoveLocations('FLOOR_2');
  // Returns: ['FLOOR_1', 'CAR_INVENTORY', 'GARAGE_INVENTORY', 'SCHEDULE', 'ORDERED_CARS']
}

// ========================================
// GARAGE INVENTORY PAGE INTEGRATION EXAMPLE
// ========================================

export async function onGarageInventoryScan(vin: string) {
  try {
    const result = await handleVinScan(vin, 'GARAGE_INVENTORY');
    
    if (result.ok) {
      toast({
        title: "Car moved to Garage Inventory",
        description: result.message,
      });
      
      await refreshGarageInventoryCars();
      await updateAllCounts();
    }
  } catch (error) {
    toast({
      title: "Scan failed",
      description: error instanceof Error ? error.message : "Failed to process scan",
      variant: "destructive",
    });
  }
}

export function getGarageInventoryMoveOptions(): Location[] {
  return getAvailableMoveLocations('GARAGE_INVENTORY');
  // Returns: ['FLOOR_1', 'FLOOR_2', 'CAR_INVENTORY', 'SCHEDULE', 'ORDERED_CARS']
}

// ========================================
// CAR INVENTORY PAGE INTEGRATION EXAMPLE
// ========================================

export async function onCarInventoryScan(vin: string) {
  try {
    const result = await handleVinScan(vin, 'CAR_INVENTORY');
    
    if (result.ok) {
      toast({
        title: "Car moved to Car Inventory",
        description: result.message,
      });
      
      await refreshCarInventoryCars();
      await updateAllCounts();
    }
  } catch (error) {
    toast({
      title: "Scan failed",
      description: error instanceof Error ? error.message : "Failed to process scan",
      variant: "destructive",
    });
  }
}

export function getCarInventoryMoveOptions(): Location[] {
  return getAvailableMoveLocations('CAR_INVENTORY');
  // Returns: ['FLOOR_1', 'FLOOR_2', 'GARAGE_INVENTORY', 'SCHEDULE', 'ORDERED_CARS']
}

// ========================================
// SCHEDULE PAGE INTEGRATION EXAMPLE
// ========================================

export async function onScheduleScan(vin: string) {
  try {
    const result = await handleVinScan(vin, 'SCHEDULE');
    
    if (result.ok) {
      toast({
        title: "Car moved to Schedule",
        description: result.message,
      });
      
      await refreshScheduleCars();
      await updateAllCounts();
    }
  } catch (error) {
    toast({
      title: "Scan failed",
      description: error instanceof Error ? error.message : "Failed to process scan",
      variant: "destructive",
    });
  }
}

export function getScheduleMoveOptions(): Location[] {
  return getAvailableMoveLocations('SCHEDULE');
  // Returns: ['FLOOR_1', 'FLOOR_2', 'CAR_INVENTORY', 'GARAGE_INVENTORY', 'ORDERED_CARS']
}

// ========================================
// ORDERED CARS PAGE INTEGRATION EXAMPLE
// ========================================

export async function onOrderedCarsScan(vin: string) {
  try {
    const result = await handleVinScan(vin, 'ORDERED_CARS');
    
    if (result.ok) {
      toast({
        title: "Car moved to Ordered Cars",
        description: result.message,
      });
      
      await refreshOrderedCars();
      await updateAllCounts();
    }
  } catch (error) {
    toast({
      title: "Scan failed",
      description: error instanceof Error ? error.message : "Failed to process scan",
      variant: "destructive",
    });
  }
}

export function getOrderedCarsMoveOptions(): Location[] {
  return getAvailableMoveLocations('ORDERED_CARS');
  // Returns: ['FLOOR_1', 'FLOOR_2', 'CAR_INVENTORY', 'GARAGE_INVENTORY', 'SCHEDULE']
}

// ========================================
// GENERIC UTILITY FUNCTIONS
// ========================================

/**
 * Generic scan handler for any location
 */
export async function genericScanHandler(vin: string, location: Location) {
  try {
    const result = await handleVinScan(vin, location);
    
    if (result.ok) {
      toast({
        title: `Car moved to ${getLocationLabel(location)}`,
        description: result.message,
      });
      
      return result;
    }
  } catch (error) {
    toast({
      title: "Scan failed",
      description: error instanceof Error ? error.message : "Failed to process scan",
      variant: "destructive",
    });
    throw error;
  }
}

/**
 * Generic move handler for any location
 */
export async function genericMoveHandler(vin: string, fromLocation: Location, toLocation: Location) {
  try {
    const result = await moveCar(vin, toLocation);
    
    if (result.ok) {
      toast({
        title: "Car moved successfully",
        description: result.message,
      });
      
      return result;
    }
  } catch (error) {
    toast({
      title: "Move failed",
      description: error instanceof Error ? error.message : "Failed to move car",
      variant: "destructive",
    });
    throw error;
  }
}

/**
 * Batch scan handler for multiple VINs
 */
export async function batchScanHandler(vins: string[], targetLocation: Location) {
  const results = [];
  
  for (const vin of vins) {
    try {
      const result = await handleVinScan(vin, targetLocation);
      results.push({ vin, success: true, result });
    } catch (error) {
      results.push({ 
        vin, 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  }
  
  const successCount = results.filter(r => r.success).length;
  const failureCount = results.length - successCount;
  
  if (successCount > 0) {
    toast({
      title: "Batch scan completed",
      description: `${successCount} cars moved successfully${failureCount > 0 ? `, ${failureCount} failed` : ''}`,
    });
  }
  
  return results;
}

// ========================================
// HELPER FUNCTIONS (IMPLEMENT IN YOUR PAGES)
// ========================================

// These functions should be implemented in your actual page components
// to refresh the UI after operations

async function refreshFloor1Cars() {
  // Implement: refresh cars list on Floor 1 page
  console.log('Refreshing Floor 1 cars...');
}

async function refreshFloor2Cars() {
  // Implement: refresh cars list on Floor 2 page
  console.log('Refreshing Floor 2 cars...');
}

async function refreshGarageInventoryCars() {
  // Implement: refresh cars list on Garage Inventory page
  console.log('Refreshing Garage Inventory cars...');
}

async function refreshCarInventoryCars() {
  // Implement: refresh cars list on Car Inventory page
  console.log('Refreshing Car Inventory cars...');
}

async function refreshScheduleCars() {
  // Implement: refresh cars list on Schedule page
  console.log('Refreshing Schedule cars...');
}

async function refreshOrderedCars() {
  // Implement: refresh cars list on Ordered Cars page
  console.log('Refreshing Ordered Cars...');
}

async function refreshTargetLocation(location: Location) {
  // Implement: refresh cars list for any target location
  console.log(`Refreshing ${location} cars...`);
}

async function updateAllCounts() {
  // Implement: update car count displays across all pages
  console.log('Updating all car counts...');
}

function getLocationLabel(location: Location): string {
  const labels: Record<Location, string> = {
    'FLOOR_1': 'Floor 1',
    'FLOOR_2': 'Floor 2',
    'CAR_INVENTORY': 'Car Inventory',
    'GARAGE_INVENTORY': 'Garage Inventory',
    'SCHEDULE': 'Schedule',
    'ORDERED_CARS': 'Ordered Cars'
  };
  
  return labels[location] || location;
}
