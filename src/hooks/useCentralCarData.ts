import { useState, useEffect, useCallback } from 'react';
import { centralCarService, CentralCarRecord } from '@/services/centralCarService';
import { toast } from '@/hooks/use-toast';

export interface CarFilter {
  location?: CentralCarRecord['currentLocation'];
  status?: string;
  model?: string;
  color?: string;
  pdiStatus?: boolean;
  clientName?: string;
  priceRange?: { min: number; max: number };
  arrivalDateRange?: { start: string; end: string };
  tags?: string[];
}

// Workflow integration types
export type WorkflowLocation = 
  | 'new_arrivals'
  | 'car_inventory'
  | 'garage_inventory'
  | 'showroom_floor_1'
  | 'showroom_floor_2'
  | 'showroom_inventory'
  | 'inventory_floor_2'
  | 'inventory_garage'
  | 'repairs'
  | 'garage_schedule'
  | 'quality_control'
  | 'sold'
  | 'shipped';

export interface WorkflowEvent {
  id: string;
  vinNumber: string;
  fromLocation: WorkflowLocation;
  toLocation: WorkflowLocation;
  timestamp: Date;
  actor: string;
  reason: string;
  metadata?: Record<string, any>;
}

export function useCentralCarData(defaultLocation?: CentralCarRecord['currentLocation']) {
  const [cars, setCars] = useState<CentralCarRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workflowEvents, setWorkflowEvents] = useState<WorkflowEvent[]>([]);

  // Load cars from central service
  const loadCars = useCallback(async (filters?: CarFilter) => {
    try {
      setLoading(true);
      setError(null);

      let allCars: CentralCarRecord[];

      if (filters && Object.keys(filters).length > 0) {
        // Apply filters using search functionality
        allCars = centralCarService.searchCars({
          vin: filters.clientName, // This could be extended to search multiple fields
          model: filters.model,
          color: filters.color,
          status: filters.status,
          location: filters.location,
          clientName: filters.clientName,
          pdiStatus: filters.pdiStatus,
          priceRange: filters.priceRange,
          arrivalDateRange: filters.arrivalDateRange,
          tags: filters.tags
        });
      } else if (defaultLocation) {
        // Load cars for specific location
        allCars = centralCarService.getCarsByLocation(defaultLocation);
      } else {
        // Load all cars
        allCars = centralCarService.getAllCars();
      }

      setCars(allCars);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load cars';
      setError(errorMessage);
      toast({
        title: "Error Loading Cars",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [defaultLocation]);

  // Get all cars (for workflow integration)
  const getAllCars = useCallback((): CentralCarRecord[] => {
    return centralCarService.getAllCars();
  }, []);

  // Get car by VIN
  const getCarByVIN = useCallback((vin: string): CentralCarRecord | null => {
    return centralCarService.getCarByVIN(vin);
  }, []);

  // Enhanced move car with workflow tracking
  const moveCarWithWorkflow = useCallback(async (
    vin: string,
    fromLocation: WorkflowLocation,
    toLocation: WorkflowLocation,
    reason: string,
    actor: string = 'User',
    metadata?: Record<string, any>
  ) => {
    try {
      // Validate the move
      const car = getCarByVIN(vin);
      if (!car) {
        throw new Error(`Car with VIN ${vin} not found`);
      }

      // Create workflow event
      const workflowEvent: WorkflowEvent = {
        id: `${vin}-${Date.now()}`,
        vinNumber: vin,
        fromLocation,
        toLocation,
        timestamp: new Date(),
        actor,
        reason,
        metadata
      };

      // Update car location in central service
      centralCarService.moveCarToLocation(vin, toLocation, reason, actor);
      
      // Log workflow event
      setWorkflowEvents(prev => [workflowEvent, ...prev]);
      
      // Reload cars to reflect changes
      await loadCars();
      
      // Trigger location-specific actions
      await triggerLocationActions(vin, toLocation);
      
      toast({
        title: "Car Moved Successfully",
        description: `${car.model} (VIN: ${vin}) moved to ${toLocation.replace('_', ' ')}`,
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to move car';
      toast({
        title: "Move Failed",
        description: errorMessage,
        variant: "destructive"
      });
      return false;
    }
  }, [loadCars, getCarByVIN]);

  // Trigger location-specific actions after move
  const triggerLocationActions = useCallback(async (vin: string, location: WorkflowLocation) => {
    switch (location) {
      case 'garage_inventory':
        // Auto-assign to PDI if needed
        const car = getCarByVIN(vin);
        if (car && !car.pdiHistory?.length) {
          toast({
            title: "PDI Required",
            description: `Car ${vin} needs PDI inspection`,
            variant: "default"
          });
        }
        break;
      case 'showroom_floor_1':
      case 'showroom_floor_2':
        // Update showroom display status
        updateCar(vin, { 
          status: 'available_for_display',
          tags: [...(getCarByVIN(vin)?.tags || []), 'showroom_display']
        });
        break;
      case 'repairs':
        // Create repair schedule entry
        toast({
          title: "Repair Scheduled",
          description: `Car ${vin} added to repair queue`,
          variant: "default"
        });
        break;
      case 'sold':
        // Trigger sale completion workflows
        updateCar(vin, { 
          status: 'sold',
          tags: [...(getCarByVIN(vin)?.tags || []), 'sold']
        });
        break;
    }
  }, [getCarByVIN]);

  // Get workflow history for a specific VIN
  const getWorkflowHistory = useCallback((vin: string): WorkflowEvent[] => {
    return workflowEvents.filter(event => event.vinNumber === vin);
  }, [workflowEvents]);

  // Get location counts for workflow overview
  const getLocationCounts = useCallback((): Record<WorkflowLocation, number> => {
    const allCars = getAllCars();
    const counts: Record<WorkflowLocation, number> = {
      new_arrivals: 0,
      car_inventory: 0,
      garage_inventory: 0,
      showroom_floor_1: 0,
      showroom_floor_2: 0,
      showroom_inventory: 0,
      inventory_floor_2: 0,
      inventory_garage: 0,
      repairs: 0,
      garage_schedule: 0,
      quality_control: 0,
      sold: 0,
      shipped: 0
    };

    allCars.forEach(car => {
      const location = car.currentLocation as WorkflowLocation;
      if (location && counts.hasOwnProperty(location)) {
        counts[location]++;
      }
    });

    return counts;
  }, [getAllCars]);

  // Get recommended next action for a car
  const getRecommendedAction = useCallback((vin: string) => {
    const car = getCarByVIN(vin);
    if (!car) return null;

    // Determine recommended action based on current state
    if (!car.pdiHistory?.length && car.currentLocation !== 'garage_inventory') {
      return { action: 'Move to Garage for PDI', location: 'garage_inventory', priority: 'high' };
    }
    
    if (car.pdiHistory?.some(pdi => pdi.status === 'passed') && car.currentLocation === 'car_inventory') {
      return { action: 'Move to Showroom', location: 'showroom_floor_1', priority: 'medium' };
    }
    
    if (car.currentLocation === 'showroom_floor_1' || car.currentLocation === 'showroom_floor_2') {
      if (!car.testDriveHistory?.length) {
        return { action: 'Enable Test Drives', location: car.currentLocation, priority: 'medium' };
      }
    }
    
    return { action: 'No action needed', location: car.currentLocation, priority: 'low' };
  }, [getCarByVIN]);

  // Original methods (keeping for backward compatibility)
  const moveCarToLocation = useCallback(async (
    vin: string, 
    newLocation: CentralCarRecord['currentLocation'], 
    reason: string, 
    movedBy: string = 'User'
  ) => {
    return moveCarWithWorkflow(vin, 'car_inventory', newLocation as WorkflowLocation, reason, movedBy);
  }, [moveCarWithWorkflow]);

  // Update car information with full history tracking
  const updateCar = useCallback(async (
    vin: string, 
    updates: Partial<CentralCarRecord>, 
    modifiedBy: string = 'User'
  ) => {
    try {
      centralCarService.updateCar(vin, updates, modifiedBy);
      
      // Reload cars to reflect changes
      await loadCars();
      
      toast({
        title: "Car Updated Successfully",
        description: `Car ${vin} has been updated`,
        variant: "default"
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update car';
      toast({
        title: "Error Updating Car",
        description: errorMessage,
        variant: "destructive"
      });
      return false;
    }
  }, [loadCars]);

  // Complete PDI with full history tracking
  const completePDI = useCallback(async (
    vin: string,
    pdiData: {
      type: 'initial' | 'follow_up' | 'final';
      technician: string;
      status: 'passed' | 'failed' | 'conditional';
      checklist: Array<{
        category: string;
        item: string;
        status: 'pass' | 'fail' | 'na';
        notes?: string;
        photos?: string[];
      }>;
      photos: string[];
      notes: string;
      nextActionRequired?: string;
    }
  ) => {
    try {
      centralCarService.addPDIRecord(vin, {
        ...pdiData,
        completedAt: new Date().toISOString()
      }, pdiData.technician);

      // Auto-move car if PDI passed
      if (pdiData.status === 'passed') {
        await moveCarWithWorkflow(vin, 'garage_inventory', 'car_inventory', 'PDI Completed Successfully', pdiData.technician);
      }

      // Reload cars to reflect changes
      await loadCars();

      toast({
        title: "PDI Completed Successfully",
        description: `PDI for car ${vin} has been completed`,
        variant: "default"
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to complete PDI';
      toast({
        title: "Error Completing PDI",
        description: errorMessage,
        variant: "destructive"
      });
      return false;
    }
  }, [loadCars, moveCarWithWorkflow]);

  // Add test drive record with full tracking
  const addTestDrive = useCallback(async (
    vin: string,
    testDriveData: {
      startTime: string;
      endTime?: string;
      duration?: number;
      driverName: string;
      driverPhone: string;
      driverLicense: string;
      isClientTestDrive: boolean;
      route?: string;
      feedback?: string;
      outcome: 'interested' | 'not_interested' | 'purchased' | 'follow_up';
      followUpDate?: string;
      notes?: string;
    }
  ) => {
    try {
      centralCarService.addTestDriveRecord(vin, testDriveData);

      // Reload cars to reflect changes
      await loadCars();

      toast({
        title: "Test Drive Recorded",
        description: `Test drive for car ${vin} has been recorded`,
        variant: "default"
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to record test drive';
      toast({
        title: "Error Recording Test Drive",
        description: errorMessage,
        variant: "destructive"
      });
      return false;
    }
  }, [loadCars]);

  // Add client interaction with full tracking
  const addClientInteraction = useCallback(async (
    vin: string,
    interaction: {
      clientName: string;
      clientPhone: string;
      clientEmail?: string;
      interactionType: 'inquiry' | 'viewing' | 'test_drive' | 'negotiation' | 'purchase' | 'complaint' | 'follow_up';
      date: string;
      handledBy: string;
      summary: string;
      outcome?: string;
      nextAction?: string;
      nextActionDate?: string;
    }
  ) => {
    try {
      centralCarService.addClientInteraction(vin, interaction);

      // Reload cars to reflect changes
      await loadCars();

      toast({
        title: "Client Interaction Recorded",
        description: `Interaction for car ${vin} has been recorded`,
        variant: "default"
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to record client interaction';
      toast({
        title: "Error Recording Interaction",
        description: errorMessage,
        variant: "destructive"
      });
      return false;
    }
  }, [loadCars]);

  // Search cars with advanced filtering
  const searchCars = useCallback(async (criteria: CarFilter) => {
    await loadCars(criteria);
  }, [loadCars]);

  // Get car history and analytics
  const getCarHistory = useCallback((vin: string) => {
    const car = centralCarService.getCarByVIN(vin);
    if (!car) return null;

    return {
      car,
      locationHistory: car.locationHistory,
      statusHistory: car.statusHistory,
      pdiHistory: car.pdiHistory,
      testDriveHistory: car.testDriveHistory,
      financialHistory: car.financialHistory,
      clientInteractions: car.clientInteractions,
      documents: car.documents,
      photos: car.photos,
      serviceHistory: car.serviceHistory
    };
  }, []);

  // Get inventory statistics
  const getInventoryStats = useCallback(() => {
    const allCars = centralCarService.getAllCars();
    
    return {
      total: allCars.length,
      byLocation: {
        inventory: allCars.filter(car => car.currentLocation === 'inventory').length,
        showroom_floor_1: allCars.filter(car => car.currentLocation === 'showroom_floor_1').length,
        showroom_floor_2: allCars.filter(car => car.currentLocation === 'showroom_floor_2').length,
        garage: allCars.filter(car => car.currentLocation === 'garage').length,
        sold: allCars.filter(car => car.currentLocation === 'sold').length,
        test_drive: allCars.filter(car => car.currentLocation === 'test_drive').length
      },
      byStatus: {
        in_stock: allCars.filter(car => car.status === 'in_stock').length,
        reserved: allCars.filter(car => car.status === 'reserved').length,
        sold: allCars.filter(car => car.status === 'sold').length
      },
      pdi: {
        completed: allCars.filter(car => car.pdiCompleted).length,
        pending: allCars.filter(car => !car.pdiCompleted).length
      }
    };
  }, []);

  // Initialize data loading
  useEffect(() => {
    loadCars();
  }, [loadCars]);

  return {
    // Data
    cars,
    loading,
    error,

    // Core operations
    loadCars,
    getCarByVIN,
    updateCar,
    moveCarToLocation,

    // Specialized operations
    completePDI,
    addTestDrive,
    addClientInteraction,

    // Search and analytics
    searchCars,
    getCarHistory,
    getInventoryStats,

    // Workflow integration
    getWorkflowHistory,
    getLocationCounts,
    getRecommendedAction,

    // Utility functions
    refresh: () => loadCars()
  };
} 