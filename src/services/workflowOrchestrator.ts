import { toast } from '@/hooks/use-toast';

// Workflow step definitions that match the complete inventory cycle
export type WorkflowLocation = 
  | 'new_arrivals'           // New Car Arrivals
  | 'car_inventory'          // Car Inventory (main)
  | 'garage_inventory'       // Garage Car Inventory
  | 'showroom_floor_1'       // Showroom Floor 1
  | 'showroom_floor_2'       // Showroom Floor 2
  | 'showroom_inventory'     // Showroom Inventory
  | 'inventory_floor_2'      // Inventory Floor 2
  | 'inventory_garage'       // Inventory Garage
  | 'repairs'                // Repairs
  | 'garage_schedule'        // Garage Schedule
  | 'quality_control'        // Quality Control
  | 'sold'                   // Sold
  | 'shipped'                // Shipped

export type WorkflowStep = 
  | 'arrival'                // Car arrives at dealership
  | 'initial_inspection'     // First inspection and data entry
  | 'pdi_pending'           // Waiting for PDI
  | 'pdi_in_progress'       // PDI being performed
  | 'pdi_completed'         // PDI completed successfully
  | 'pdi_failed'            // PDI failed, needs repair
  | 'repair_needed'         // Repair required
  | 'repair_in_progress'    // Being repaired
  | 'repair_completed'      // Repair completed
  | 'quality_check'         // Quality control inspection
  | 'showroom_ready'        // Ready for showroom display
  | 'showroom_display'      // Displayed in showroom
  | 'test_drive'            // Available for test drives
  | 'negotiation'           // In sales negotiation
  | 'sold'                  // Sold to customer
  | 'delivery_prep'         // Preparing for delivery
  | 'delivered'             // Delivered to customer

export interface WorkflowEvent {
  id: string;
  vinNumber: string;
  fromLocation: WorkflowLocation;
  toLocation: WorkflowLocation;
  fromStep: WorkflowStep;
  toStep: WorkflowStep;
  timestamp: Date;
  actor: string;
  reason: string;
  metadata?: Record<string, any>;
}

export interface LocationConfig {
  name: string;
  route: string;
  allowedSteps: WorkflowStep[];
  nextLocations: WorkflowLocation[];
  requiredData: string[];
}

// Complete workflow configuration
export const LOCATION_CONFIGS: Record<WorkflowLocation, LocationConfig> = {
  new_arrivals: {
    name: 'New Car Arrivals',
    route: '/new-car-arrivals',
    allowedSteps: ['arrival', 'initial_inspection'],
    nextLocations: ['car_inventory'],
    requiredData: ['vinNumber', 'model', 'arrivalDate']
  },
  car_inventory: {
    name: 'Car Inventory',
    route: '/inventory',
    allowedSteps: ['initial_inspection', 'pdi_pending', 'pdi_completed', 'showroom_ready'],
    nextLocations: ['garage_inventory', 'showroom_floor_1', 'showroom_floor_2', 'repairs'],
    requiredData: ['vinNumber', 'model', 'price']
  },
  garage_inventory: {
    name: 'Garage Car Inventory',
    route: '/garage-car-inventory',
    allowedSteps: ['pdi_pending', 'pdi_in_progress', 'pdi_completed', 'pdi_failed', 'repair_needed'],
    nextLocations: ['car_inventory', 'repairs', 'garage_schedule'],
    requiredData: ['vinNumber', 'pdiStatus']
  },
  showroom_floor_1: {
    name: 'Showroom Floor 1',
    route: '/showroom-floor-1',
    allowedSteps: ['showroom_display', 'test_drive', 'negotiation'],
    nextLocations: ['showroom_floor_2', 'sold'],
    requiredData: ['vinNumber', 'pdiCompleted', 'price']
  },
  showroom_floor_2: {
    name: 'Showroom Floor 2',
    route: '/showroom-floor-2',
    allowedSteps: ['showroom_display', 'test_drive', 'negotiation'],
    nextLocations: ['showroom_floor_1', 'sold'],
    requiredData: ['vinNumber', 'pdiCompleted', 'price']
  },
  showroom_inventory: {
    name: 'Showroom Inventory',
    route: '/showroom-inventory',
    allowedSteps: ['showroom_ready', 'showroom_display'],
    nextLocations: ['showroom_floor_1', 'showroom_floor_2'],
    requiredData: ['vinNumber', 'displayStatus']
  },
  inventory_floor_2: {
    name: 'Inventory Floor 2',
    route: '/inventory-floor-2',
    allowedSteps: ['pdi_completed', 'quality_check', 'showroom_ready'],
    nextLocations: ['showroom_floor_2', 'showroom_inventory'],
    requiredData: ['vinNumber', 'qualityStatus']
  },
  inventory_garage: {
    name: 'Inventory Garage',
    route: '/inventory-garage',
    allowedSteps: ['pdi_pending', 'repair_needed', 'repair_in_progress', 'repair_completed'],
    nextLocations: ['garage_inventory', 'repairs'],
    requiredData: ['vinNumber', 'repairStatus']
  },
  repairs: {
    name: 'Repairs',
    route: '/repairs',
    allowedSteps: ['repair_needed', 'repair_in_progress', 'repair_completed', 'quality_check'],
    nextLocations: ['garage_inventory', 'car_inventory', 'garage_schedule'],
    requiredData: ['vinNumber', 'repairType', 'repairStatus']
  },
  garage_schedule: {
    name: 'Garage Schedule',
    route: '/garage-schedule',
    allowedSteps: ['repair_in_progress', 'pdi_in_progress', 'quality_check'],
    nextLocations: ['repairs', 'garage_inventory'],
    requiredData: ['vinNumber', 'scheduleDate', 'workType']
  },
  quality_control: {
    name: 'Quality Control',
    route: '/quality-control',
    allowedSteps: ['quality_check', 'pdi_completed', 'repair_completed'],
    nextLocations: ['car_inventory', 'showroom_inventory'],
    requiredData: ['vinNumber', 'qualityStatus', 'inspector']
  },
  sold: {
    name: 'Sold',
    route: '/sales',
    allowedSteps: ['sold', 'delivery_prep'],
    nextLocations: ['shipped'],
    requiredData: ['vinNumber', 'salePrice', 'customerInfo', 'saleDate']
  },
  shipped: {
    name: 'Shipped',
    route: '/shipping-eta',
    allowedSteps: ['delivered'],
    nextLocations: [],
    requiredData: ['vinNumber', 'deliveryDate', 'customerInfo']
  }
};

class WorkflowOrchestrator {
  
  // Move car between locations with full validation and tracking
  async moveCarToLocation(
    vinNumber: string, 
    fromLocation: WorkflowLocation, 
    toLocation: WorkflowLocation,
    reason: string,
    actor: string,
    metadata?: Record<string, any>
  ): Promise<boolean> {
    try {
      // Validate the move is allowed
      const isValidMove = this.validateMove(fromLocation, toLocation);
      if (!isValidMove) {
        toast({
          title: "Invalid Move",
          description: `Cannot move car from ${LOCATION_CONFIGS[fromLocation].name} to ${LOCATION_CONFIGS[toLocation].name}`,
          variant: "destructive"
        });
        return false;
      }

      // Check required data is present
      const hasRequiredData = await this.validateRequiredData(vinNumber, toLocation);
      if (!hasRequiredData) {
        return false;
      }

      // Get current car data
      const carData = await this.getCarByVIN(vinNumber);
      if (!carData) {
        toast({
          title: "Car Not Found",
          description: `Car with VIN ${vinNumber} not found in system`,
          variant: "destructive"
        });
        return false;
      }

      // Determine workflow steps
      const fromStep = this.determineCurrentStep(carData, fromLocation);
      const toStep = this.determineTargetStep(toLocation, fromStep);

      // Create workflow event
      const workflowEvent: WorkflowEvent = {
        id: `${vinNumber}-${Date.now()}`,
        vinNumber,
        fromLocation,
        toLocation,
        fromStep,
        toStep,
        timestamp: new Date(),
        actor,
        reason,
        metadata
      };

      // Log the workflow event
      await this.logWorkflowEvent(workflowEvent);

      // Update car location and status in central system
      await this.updateCarLocationAndStatus(vinNumber, toLocation, toStep, workflowEvent);

      // Trigger any location-specific actions
      await this.triggerLocationActions(vinNumber, toLocation, toStep);

      // Notify other systems
      await this.notifySystemsOfMove(workflowEvent);

      toast({
        title: "Car Moved Successfully",
        description: `${carData.model} (VIN: ${vinNumber}) moved to ${LOCATION_CONFIGS[toLocation].name}`,
      });

      return true;
    } catch (error) {
      console.error('Error moving car:', error);
      toast({
        title: "Move Failed",
        description: "Failed to move car. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  }

  // Validate if a move between locations is allowed
  private validateMove(from: WorkflowLocation, to: WorkflowLocation): boolean {
    const fromConfig = LOCATION_CONFIGS[from];
    return fromConfig.nextLocations.includes(to);
  }

  // Validate required data is present for target location
  private async validateRequiredData(vinNumber: string, location: WorkflowLocation): Promise<boolean> {
    const config = LOCATION_CONFIGS[location];
    const carData = await this.getCarByVIN(vinNumber);
    
    if (!carData) return false;

    const missingData = config.requiredData.filter(field => !carData[field]);
    
    if (missingData.length > 0) {
      toast({
        title: "Missing Required Data",
        description: `Car is missing required data for ${config.name}: ${missingData.join(', ')}`,
        variant: "destructive"
      });
      return false;
    }

    return true;
  }

  // Determine current workflow step based on car data and location
  private determineCurrentStep(carData: any, location: WorkflowLocation): WorkflowStep {
    switch (location) {
      case 'new_arrivals':
        return carData.isProcessed ? 'initial_inspection' : 'arrival';
      case 'garage_inventory':
        if (carData.pdiCompleted) return 'pdi_completed';
        if (carData.pdiInProgress) return 'pdi_in_progress';
        return 'pdi_pending';
      case 'repairs':
        if (carData.repairCompleted) return 'repair_completed';
        if (carData.repairInProgress) return 'repair_in_progress';
        return 'repair_needed';
      case 'showroom_floor_1':
      case 'showroom_floor_2':
        if (carData.inNegotiation) return 'negotiation';
        if (carData.testDriveAvailable) return 'test_drive';
        return 'showroom_display';
      default:
        return 'initial_inspection';
    }
  }

  // Determine target workflow step for destination location
  private determineTargetStep(location: WorkflowLocation, currentStep: WorkflowStep): WorkflowStep {
    const allowedSteps = LOCATION_CONFIGS[location].allowedSteps;
    
    // Logic to determine appropriate next step
    switch (location) {
      case 'garage_inventory':
        return allowedSteps.includes('pdi_pending') ? 'pdi_pending' : allowedSteps[0];
      case 'showroom_floor_1':
      case 'showroom_floor_2':
        return 'showroom_display';
      case 'repairs':
        return 'repair_needed';
      case 'sold':
        return 'sold';
      default:
        return allowedSteps[0];
    }
  }

  // Get car data by VIN from central system
  private async getCarByVIN(vinNumber: string): Promise<any> {
    // This would integrate with the central car data service
    return {
      vinNumber,
      model: 'Mock Model',
      currentLocation: 'car_inventory',
      pdiCompleted: false,
      repairStatus: 'none'
    };
  }

  // Log workflow event for audit trail
  private async logWorkflowEvent(event: WorkflowEvent): Promise<void> {
    try {
      console.log('Logging workflow event:', event);
      // Store workflow events for complete traceability
    } catch (error) {
      console.error('Error logging workflow event:', error);
    }
  }

  // Update car location and status in central system
  private async updateCarLocationAndStatus(
    vinNumber: string, 
    location: WorkflowLocation, 
    step: WorkflowStep, 
    event: WorkflowEvent
  ): Promise<void> {
    try {
      const updateData = {
        currentLocation: location,
        workflowStep: step,
        lastMovedAt: new Date().toISOString(),
        lastMovedBy: event.actor,
        locationHistory: {
          location,
          movedAt: new Date().toISOString(),
          movedBy: event.actor,
          reason: event.reason
        }
      };

      console.log('Updating car location:', vinNumber, updateData);
    } catch (error) {
      console.error('Error updating car location:', error);
    }
  }

  // Trigger location-specific actions
  private async triggerLocationActions(vinNumber: string, location: WorkflowLocation, step: WorkflowStep): Promise<void> {
    switch (location) {
      case 'garage_inventory':
        if (step === 'pdi_pending') {
          await this.assignToPDISlot(vinNumber);
        }
        break;
      case 'showroom_floor_1':
      case 'showroom_floor_2':
        if (step === 'showroom_display') {
          await this.updateShowroomDisplay(vinNumber, location);
        }
        break;
      case 'repairs':
        if (step === 'repair_needed') {
          await this.scheduleRepair(vinNumber);
        }
        break;
      case 'sold':
        await this.triggerSaleCompletionActions(vinNumber);
        break;
    }
  }

  // Notify other systems of the move
  private async notifySystemsOfMove(event: WorkflowEvent): Promise<void> {
    try {
      const notifications = [
        {
          type: 'location_change',
          vinNumber: event.vinNumber,
          fromLocation: event.fromLocation,
          toLocation: event.toLocation,
          timestamp: event.timestamp
        }
      ];

      console.log('Sending system notifications:', notifications);
    } catch (error) {
      console.error('Error sending notifications:', error);
    }
  }

  // Get complete workflow history for a VIN
  async getWorkflowHistory(vinNumber: string): Promise<WorkflowEvent[]> {
    try {
      return []; // Would fetch actual workflow events
    } catch (error) {
      console.error('Error fetching workflow history:', error);
      return [];
    }
  }

  // Get current workflow status for all cars
  async getWorkflowStatus(): Promise<Record<WorkflowLocation, number>> {
    const status: Record<WorkflowLocation, number> = {} as any;
    
    for (const location of Object.keys(LOCATION_CONFIGS) as WorkflowLocation[]) {
      status[location] = 0; // Would query actual data
    }
    
    return status;
  }

  // Get recommended next action for a car
  getRecommendedAction(carData: any): { action: string; location: WorkflowLocation; priority: 'high' | 'medium' | 'low' } {
    if (!carData.pdiCompleted && carData.currentLocation !== 'garage_inventory') {
      return { action: 'Move to Garage for PDI', location: 'garage_inventory', priority: 'high' };
    }
    
    if (carData.pdiCompleted && !carData.showroomReady) {
      return { action: 'Prepare for Showroom', location: 'showroom_inventory', priority: 'medium' };
    }
    
    if (carData.showroomReady && carData.currentLocation === 'car_inventory') {
      return { action: 'Move to Showroom Display', location: 'showroom_floor_1', priority: 'medium' };
    }
    
    return { action: 'No action needed', location: carData.currentLocation, priority: 'low' };
  }

  // Helper methods for specific actions
  private async assignToPDISlot(vinNumber: string): Promise<void> {
    console.log(`Assigning ${vinNumber} to next available PDI slot`);
  }

  private async updateShowroomDisplay(vinNumber: string, location: WorkflowLocation): Promise<void> {
    console.log(`Updating showroom display for ${vinNumber} in ${location}`);
  }

  private async scheduleRepair(vinNumber: string): Promise<void> {
    console.log(`Scheduling repair for ${vinNumber}`);
  }

  private async triggerSaleCompletionActions(vinNumber: string): Promise<void> {
    console.log(`Triggering sale completion actions for ${vinNumber}`);
  }
}

// Global workflow orchestrator instance
export const workflowOrchestrator = new WorkflowOrchestrator();

// Hook for using workflow orchestrator in components
export const useWorkflowOrchestrator = () => {
  return workflowOrchestrator;
};

// Utility functions for workflow management
export const getLocationDisplayName = (location: WorkflowLocation): string => {
  return LOCATION_CONFIGS[location]?.name || location;
};

export const getLocationRoute = (location: WorkflowLocation): string => {
  return LOCATION_CONFIGS[location]?.route || '/';
};

export const getAllowedNextLocations = (currentLocation: WorkflowLocation): WorkflowLocation[] => {
  return LOCATION_CONFIGS[currentLocation]?.nextLocations || [];
};

export const isValidLocationTransition = (from: WorkflowLocation, to: WorkflowLocation): boolean => {
  return LOCATION_CONFIGS[from]?.nextLocations.includes(to) || false;
};
