export interface CarLocation {
  id: string;
  name: string;
  type: 'showroom' | 'garage' | 'inventory' | 'floor' | 'lot';
  capacity?: number;
  currentCount?: number;
}

export interface CarWorkflowEntry {
  carVin: string;
  carModel: string;
  currentLocation: string;
  currentStatus: string;
  priority: 'low' | 'medium' | 'high';
  lastUpdate: string;
  workflowStage: 'arrival' | 'pdi' | 'inventory' | 'showroom' | 'repair' | 'delivery' | 'sold';
  assignedTo?: string;
  estimatedCompletion?: string;
  nextAction?: string;
  notes?: string;
  history: CarMovementRecord[];
}

import { CarMovementReason } from '@/types/purposeReason';

export interface CarMovementRecord {
  id: string;
  timestamp: string;
  fromLocation: string;
  toLocation: string;
  fromStatus: string;
  toStatus: string;
  reason: CarMovementReason;
  movedBy: string;
  notes?: string;
}

export interface CarAttentionItem {
  carVin: string;
  carModel: string;
  currentLocation: string;
  attentionType: 'repair_needed' | 'parts_waiting' | 'low_battery' | 'overdue_service' | 'customer_complaint' | 'quality_issue';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description: string;
  daysWaiting: number;
  assignedTo?: string;
  estimatedHours?: number;
  lastAction?: string;
  nextDeadline?: string;
}

export class CarWorkflowService {
  private static readonly WORKFLOW_KEY = 'carWorkflow';
  private static readonly MOVEMENTS_KEY = 'carMovements';
  private static readonly ATTENTION_KEY = 'carsNeedingAttention';

  // Car locations configuration
  private static readonly LOCATIONS: CarLocation[] = [
    { id: 'new_arrivals', name: 'New Arrivals', type: 'lot', capacity: 50 },
    { id: 'pdi_bay', name: 'PDI Bay', type: 'garage', capacity: 6 },
    { id: 'inventory_garage', name: 'Inventory Garage', type: 'inventory', capacity: 100 },
    { id: 'showroom_floor1', name: 'Showroom Floor 1', type: 'showroom', capacity: 12 },
    { id: 'showroom_floor2', name: 'Showroom Floor 2', type: 'showroom', capacity: 8 },
    { id: 'inventory_floor2', name: 'Inventory Floor 2', type: 'inventory', capacity: 80 },
    { id: 'garage_repair', name: 'Garage Repair Bay', type: 'garage', capacity: 15 },
    { id: 'delivery_lot', name: 'Delivery Lot', type: 'lot', capacity: 30 }
  ];

  // Get all car workflow entries
  static getWorkflowEntries(): CarWorkflowEntry[] {
    try {
      const stored = localStorage.getItem(this.WORKFLOW_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading workflow entries:', error);
      return [];
    }
  }

  // Get workflow entry for specific car
  static getCarWorkflow(carVin: string): CarWorkflowEntry | null {
    const workflows = this.getWorkflowEntries();
    return workflows.find(entry => entry.carVin === carVin) || null;
  }

  // Move car to new location and status
  static moveCar(
    carVin: string,
    carModel: string,
    fromLocation: string,
    toLocation: string,
    fromStatus: string,
    toStatus: string,
    reason: CarMovementReason,
    movedBy: string,
    notes?: string
  ): boolean {
    try {
      const workflows = this.getWorkflowEntries();
      let workflowIndex = workflows.findIndex(entry => entry.carVin === carVin);

      // Create movement record
      const movementRecord: CarMovementRecord = {
        id: `move-${Date.now()}`,
        timestamp: new Date().toISOString(),
        fromLocation,
        toLocation,
        fromStatus,
        toStatus,
        reason,
        movedBy,
        notes
      };

      // Record work type change if status changed
      if (fromStatus !== toStatus) {
        this.recordWorkTypeChange(carVin, carModel, fromStatus, toStatus, movedBy, notes);
      }

      if (workflowIndex === -1) {
        // Create new workflow entry
        const newWorkflow: CarWorkflowEntry = {
          carVin,
          carModel,
          currentLocation: toLocation,
          currentStatus: toStatus,
          priority: 'medium',
          lastUpdate: new Date().toISOString(),
          workflowStage: this.determineWorkflowStage(toLocation, toStatus),
          history: [movementRecord]
        };
        workflows.push(newWorkflow);
      } else {
        // Update existing workflow
        workflows[workflowIndex].currentLocation = toLocation;
        workflows[workflowIndex].currentStatus = toStatus;
        workflows[workflowIndex].lastUpdate = new Date().toISOString();
        workflows[workflowIndex].workflowStage = this.determineWorkflowStage(toLocation, toStatus);
        workflows[workflowIndex].history.push(movementRecord);
      }

      // Save workflow data
      localStorage.setItem(this.WORKFLOW_KEY, JSON.stringify(workflows));

      // Save movement record separately for analytics
      this.recordMovement(movementRecord);

      // Update car data in respective tables
      this.updateCarInTables(carVin, toLocation, toStatus);

      return true;
    } catch (error) {
      console.error('Error moving car:', error);
      return false;
    }
  }

  // Determine workflow stage based on location and status
  private static determineWorkflowStage(location: string, status: string): CarWorkflowEntry['workflowStage'] {
    if (location === 'new_arrivals') return 'arrival';
    if (location === 'pdi_bay' || status.includes('pdi')) return 'pdi';
    if (location.includes('inventory')) return 'inventory';
    if (location.includes('showroom')) return 'showroom';
    if (location.includes('garage') || status.includes('repair')) return 'repair';
    if (location === 'delivery_lot') return 'delivery';
    if (status === 'sold') return 'sold';
    return 'inventory';
  }

  // Record movement for analytics
  private static recordMovement(movement: CarMovementRecord): void {
    try {
      const movements = JSON.parse(localStorage.getItem(this.MOVEMENTS_KEY) || '[]');
      movements.push(movement);
      localStorage.setItem(this.MOVEMENTS_KEY, JSON.stringify(movements));
    } catch (error) {
      console.error('Error recording movement:', error);
    }
  }

  // Record work type changes in repair history
  private static recordWorkTypeChange(
    carVin: string,
    carModel: string,
    fromStatus: string,
    toStatus: string,
    changedBy: string,
    notes?: string
  ): void {
    try {
      const workTypeChange = `${fromStatus.replace('_', ' ').toUpperCase()} → ${toStatus.replace('_', ' ').toUpperCase()}`;
      
      // Get car data to access parts and tools information
      const carData = this.getCarData(carVin);
      const partsUsed = carData?.partsUsed || [];
      const toolsUsed = carData?.toolsUsed || [];
      const totalPartsCost = this.calculatePartsCost(partsUsed);
      const totalToolsCost = this.calculateToolsCost(toolsUsed);
      
      const workTypeHistoryEntry = {
        id: `worktype-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        carVin: carVin,
        carModel: carModel,
        fromWorkType: fromStatus,
        toWorkType: toStatus,
        workTypeChange: workTypeChange,
        timestamp: new Date().toISOString(),
        changedBy: changedBy,
        notes: notes || `Work type changed from ${fromStatus.replace('_', ' ')} to ${toStatus.replace('_', ' ')}`,
        type: 'work_type_change',
        partsUsed: partsUsed,
        partsUsedInStage: partsUsed, // All parts used in this stage
        totalPartsCost: totalPartsCost,
        toolsUsed: toolsUsed,
        toolsUsedInStage: toolsUsed, // All tools used in this stage
        totalToolsCost: totalToolsCost,
        workNotes: carData?.workNotes,
        issueDescription: carData?.issueDescription
      };

      // Save to repair history
      const savedHistory = localStorage.getItem('repairHistory');
      const history = savedHistory ? JSON.parse(savedHistory) : [];
      
      history.unshift({
        ...workTypeHistoryEntry,
        date: new Date().toLocaleDateString(),
        description: workTypeChange,
        technician: changedBy,
        workTypeTransition: workTypeChange,
        fromStage: fromStatus,
        toStage: toStatus,
        transitionTimestamp: workTypeHistoryEntry.timestamp,
        partsUsed: workTypeHistoryEntry.partsUsed,
        partsUsedInStage: workTypeHistoryEntry.partsUsedInStage,
        totalPartsCost: workTypeHistoryEntry.totalPartsCost,
        toolsUsed: workTypeHistoryEntry.toolsUsed,
        toolsUsedInStage: workTypeHistoryEntry.toolsUsedInStage,
        totalToolsCost: workTypeHistoryEntry.totalToolsCost
      });
      
      localStorage.setItem('repairHistory', JSON.stringify(history));

      // Also save to dedicated work type history
      const savedWorkTypeHistory = localStorage.getItem('workTypeHistory');
      const workTypeHistory = savedWorkTypeHistory ? JSON.parse(savedWorkTypeHistory) : [];
      workTypeHistory.unshift(workTypeHistoryEntry);
      localStorage.setItem('workTypeHistory', JSON.stringify(workTypeHistory));

      console.log(`Work type change recorded: ${carModel} (${carVin}) - ${workTypeChange} - Parts: ${partsUsed.length} - Tools: ${toolsUsed.length} - Parts Cost: $${totalPartsCost} - Tools Cost: $${totalToolsCost}`);
    } catch (error) {
      console.error('Error recording work type change:', error);
    }
  }

  // Get car data from various sources
  private static getCarData(carVin: string): any {
    // Try to get car data from garage cars
    const garageCars = localStorage.getItem('garageCars');
    if (garageCars) {
      const cars = JSON.parse(garageCars);
      const car = cars.find((c: any) => c.carCode === carVin || c.vinNumber === carVin);
      if (car) return car;
    }

    // Try to get from car inventory
    const carInventory = localStorage.getItem('carInventory');
    if (carInventory) {
      const inventory = JSON.parse(carInventory);
      const car = inventory.find((c: any) => c.vinNumber === carVin);
      if (car) return car;
    }

    return null;
  }

  // Calculate parts cost
  private static calculatePartsCost(parts: string[]): number {
    let totalCost = 0;
    
    parts.forEach(part => {
      // Simplified cost estimation based on part type
      if (part.toLowerCase().includes('battery')) {
        totalCost += 1500; // Battery cost
      } else if (part.toLowerCase().includes('brake')) {
        totalCost += 200; // Brake parts
      } else if (part.toLowerCase().includes('filter')) {
        totalCost += 50; // Filters
      } else if (part.toLowerCase().includes('sensor')) {
        totalCost += 300; // Sensors
      } else if (part.toLowerCase().includes('motor')) {
        totalCost += 800; // Motors
      } else if (part.toLowerCase().includes('tire')) {
        totalCost += 400; // Tires
      } else if (part.toLowerCase().includes('oil')) {
        totalCost += 80; // Oil
      } else if (part.toLowerCase().includes('fluid')) {
        totalCost += 60; // Fluids
      } else {
        totalCost += 100; // Default part cost
      }
    });
    
    return totalCost;
  }

  // Calculate tools cost
  private static calculateToolsCost(tools: string[]): number {
    let totalCost = 0;
    
    tools.forEach(tool => {
      // Simplified cost estimation based on tool type
      if (tool.toLowerCase().includes('diagnostic')) {
        totalCost += 500; // Diagnostic tools
      } else if (tool.toLowerCase().includes('lift')) {
        totalCost += 200; // Lift usage
      } else if (tool.toLowerCase().includes('scanner')) {
        totalCost += 300; // Scanner tools
      } else if (tool.toLowerCase().includes('welder')) {
        totalCost += 150; // Welding tools
      } else if (tool.toLowerCase().includes('tester')) {
        totalCost += 250; // Testing equipment
      } else if (tool.toLowerCase().includes('meter')) {
        totalCost += 100; // Meters and gauges
      } else if (tool.toLowerCase().includes('torque')) {
        totalCost += 80; // Torque wrenches
      } else if (tool.toLowerCase().includes('socket')) {
        totalCost += 50; // Socket sets
      } else if (tool.toLowerCase().includes('computer')) {
        totalCost += 400; // Computer equipment
      } else if (tool.toLowerCase().includes('crane')) {
        totalCost += 300; // Crane usage
      } else {
        totalCost += 75; // Default tool cost
      }
    });
    
    return totalCost;
  }

  // Update car data in respective tables
  private static updateCarInTables(carVin: string, location: string, status: string): void {
    // This would integrate with existing car data services
    // For now, we'll simulate the updates
    const updateData = {
      carVin,
      location,
      status,
      lastUpdated: new Date().toISOString()
    };

    // Update in garage inventory if applicable
    if (location.includes('garage')) {
      const garageData = JSON.parse(localStorage.getItem('garageInventory') || '[]');
      const carIndex = garageData.findIndex((car: any) => car.vin === carVin);
      if (carIndex !== -1) {
        garageData[carIndex].status = status;
        garageData[carIndex].location = location;
        localStorage.setItem('garageInventory', JSON.stringify(garageData));
      }
    }

    // Update in showroom data if applicable
    if (location.includes('showroom')) {
      const showroomData = JSON.parse(localStorage.getItem('showroomInventory') || '[]');
      const carIndex = showroomData.findIndex((car: any) => car.vin === carVin);
      if (carIndex !== -1) {
        showroomData[carIndex].status = status;
        showroomData[carIndex].location = location;
        localStorage.setItem('showroomInventory', JSON.stringify(showroomData));
      }
    }

    // Update in main car inventory
    const carInventory = JSON.parse(localStorage.getItem('carInventory') || '[]');
    const carIndex = carInventory.findIndex((car: any) => car.vin === carVin);
    if (carIndex !== -1) {
      carInventory[carIndex].status = status;
      carInventory[carIndex].location = location;
      localStorage.setItem('carInventory', JSON.stringify(carInventory));
    }
  }

  // Get cars needing attention
  static getCarsNeedingAttention(): CarAttentionItem[] {
    try {
      // Check all car sources for attention items
      const attentionItems: CarAttentionItem[] = [];

      // Check garage cars
      const garageData = JSON.parse(localStorage.getItem('garageInventory') || '[]');
      garageData.forEach((car: any) => {
        if (car.status === 'needs_repair' || car.status === 'waiting_parts' || car.batteryLevel < 50) {
          const daysWaiting = this.calculateDaysWaiting(car.lastUpdate || car.arrivalDate);
          const priority = this.calculatePriority(car, daysWaiting);
          
          attentionItems.push({
            carVin: car.vin,
            carModel: `${car.year} ${car.make} ${car.model}`,
            currentLocation: car.location || 'garage',
            attentionType: car.status === 'waiting_parts' ? 'parts_waiting' : 
                          car.batteryLevel < 50 ? 'low_battery' : 'repair_needed',
            priority,
            description: this.getAttentionDescription(car),
            daysWaiting,
            assignedTo: car.assignedMechanic,
            estimatedHours: car.estimatedRepairHours || 2
          });
        }
      });

      // Check showroom cars needing PDI
      const showroomData = JSON.parse(localStorage.getItem('showroomInventory') || '[]');
      showroomData.forEach((car: any) => {
        if (car.pdiStatus === 'incomplete' || car.pdiStatus === 'pending') {
          const daysWaiting = this.calculateDaysWaiting(car.arrivalDate);
          const priority = daysWaiting > 7 ? 'high' : daysWaiting > 3 ? 'medium' : 'low';
          
          attentionItems.push({
            carVin: car.vin,
            carModel: `${car.year} ${car.make} ${car.model}`,
            currentLocation: car.location || 'showroom',
            attentionType: 'repair_needed',
            priority,
            description: `PDI incomplete - ${car.pdiNotes || 'Awaiting PDI completion'}`,
            daysWaiting,
            estimatedHours: 3
          });
        }
      });

      // Check main inventory for overdue services
      const inventoryData = JSON.parse(localStorage.getItem('carInventory') || '[]');
      inventoryData.forEach((car: any) => {
        if (car.nextServiceDate && new Date(car.nextServiceDate) < new Date()) {
          const daysOverdue = Math.floor((new Date().getTime() - new Date(car.nextServiceDate).getTime()) / (1000 * 60 * 60 * 24));
          const priority = daysOverdue > 30 ? 'urgent' : daysOverdue > 14 ? 'high' : 'medium';
          
          attentionItems.push({
            carVin: car.vin,
            carModel: `${car.year} ${car.make} ${car.model}`,
            currentLocation: car.location || 'inventory',
            attentionType: 'overdue_service',
            priority,
            description: `Service overdue by ${daysOverdue} days`,
            daysWaiting: daysOverdue,
            nextDeadline: car.nextServiceDate
          });
        }
      });

      // Sort by priority and days waiting
      return attentionItems.sort((a, b) => {
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return b.daysWaiting - a.daysWaiting;
      });

    } catch (error) {
      console.error('Error getting cars needing attention:', error);
      return [];
    }
  }

  // Calculate days waiting
  private static calculateDaysWaiting(dateString: string): number {
    if (!dateString) return 0;
    const date = new Date(dateString);
    const now = new Date();
    return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  }

  // Calculate priority based on car condition and wait time
  private static calculatePriority(car: any, daysWaiting: number): CarAttentionItem['priority'] {
    if (car.batteryLevel < 20 || car.status === 'emergency_repair') return 'urgent';
    if (daysWaiting > 7 || car.customerPriority === 'high') return 'high';
    if (daysWaiting > 3 || car.batteryLevel < 50) return 'medium';
    return 'low';
  }

  // Get attention description
  private static getAttentionDescription(car: any): string {
    if (car.batteryLevel < 50) {
      return `Low battery: ${car.batteryLevel}% - Needs charging`;
    }
    if (car.status === 'waiting_parts') {
      return `Waiting for parts: ${car.partsNeeded?.join(', ') || 'Parts ordered'}`;
    }
    if (car.status === 'needs_repair') {
      return car.repairNotes || 'Repair needed - awaiting diagnosis';
    }
    return car.notes || 'Requires attention';
  }

  // Get location capacity information
  static getLocationCapacity(): { location: string; current: number; capacity: number; percentage: number }[] {
    const workflows = this.getWorkflowEntries();
    
    return this.LOCATIONS.map(location => {
      const current = workflows.filter(entry => entry.currentLocation === location.id).length;
      const capacity = location.capacity || 999;
      const percentage = capacity > 0 ? (current / capacity) * 100 : 0;
      
      return {
        location: location.name,
        current,
        capacity,
        percentage
      };
    });
  }

  // Get workflow analytics
  static getWorkflowAnalytics() {
    const workflows = this.getWorkflowEntries();
    const movements = JSON.parse(localStorage.getItem(this.MOVEMENTS_KEY) || '[]');

    const stageDistribution = workflows.reduce((acc, entry) => {
      acc[entry.workflowStage] = (acc[entry.workflowStage] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const avgTimeInStages = this.calculateAverageTimeInStages(movements);
    const bottlenecks = this.identifyBottlenecks(workflows);

    return {
      totalCars: workflows.length,
      stageDistribution,
      avgTimeInStages,
      bottlenecks,
      carsNeedingAttention: this.getCarsNeedingAttention().length
    };
  }

  // Calculate average time in each stage
  private static calculateAverageTimeInStages(movements: CarMovementRecord[]) {
    // Complex calculation - simplified for demo
    return {
      arrival: 1.5,
      pdi: 2.8,
      inventory: 15.3,
      showroom: 8.7,
      repair: 4.2,
      delivery: 1.1
    };
  }

  // Identify workflow bottlenecks
  private static identifyBottlenecks(workflows: CarWorkflowEntry[]): string[] {
    const stageCounts = workflows.reduce((acc, entry) => {
      acc[entry.workflowStage] = (acc[entry.workflowStage] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const bottlenecks: string[] = [];
    const avgCarsPerStage = workflows.length / Object.keys(stageCounts).length;

    Object.entries(stageCounts).forEach(([stage, count]) => {
      if (count > avgCarsPerStage * 1.5) {
        bottlenecks.push(stage);
      }
    });

    return bottlenecks;
  }

  // Update car priority
  static updateCarPriority(carVin: string, priority: CarWorkflowEntry['priority']): boolean {
    try {
      const workflows = this.getWorkflowEntries();
      const workflowIndex = workflows.findIndex(entry => entry.carVin === carVin);
      
      if (workflowIndex !== -1) {
        workflows[workflowIndex].priority = priority;
        workflows[workflowIndex].lastUpdate = new Date().toISOString();
        localStorage.setItem(this.WORKFLOW_KEY, JSON.stringify(workflows));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating car priority:', error);
      return false;
    }
  }

  // Search workflow entries
  static searchWorkflow(query: string): CarWorkflowEntry[] {
    const workflows = this.getWorkflowEntries();
    const searchTerm = query.toLowerCase();

    return workflows.filter(entry =>
      entry.carVin.toLowerCase().includes(searchTerm) ||
      entry.carModel.toLowerCase().includes(searchTerm) ||
      entry.currentLocation.toLowerCase().includes(searchTerm) ||
      entry.currentStatus.toLowerCase().includes(searchTerm) ||
      entry.assignedTo?.toLowerCase().includes(searchTerm)
    );
  }
} 