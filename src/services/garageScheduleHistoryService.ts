import { WorkTypeHistoryService } from './workTypeHistoryService';

export interface GarageScheduleChange {
  id: string;
  carId: string;
  carCode: string;
  carModel: string;
  customerName: string;
  fromStatus: string;
  toStatus: string;
  fromWorkType?: string;
  toWorkType?: string;
  timestamp: string;
  changedBy: string;
  notes?: string;
  partsUsed: string[];
  toolsUsed: string[];
  totalPartsCost: number;
  totalToolsCost: number;
  workNotes?: string;
  issueDescription?: string;
  estimatedDuration?: string;
  actualDuration?: string;
  priority: 'high' | 'medium' | 'low';
  assignedMechanic?: string;
  location: string;
  type: 'status_change' | 'work_type_change' | 'completion' | 'assignment' | 'priority_change';
}

export class GarageScheduleHistoryService {
  private static readonly GARAGE_SCHEDULE_HISTORY_KEY = 'garageScheduleHistory';

  // Record any change in garage schedule
  static recordScheduleChange(
    carId: string,
    carCode: string,
    carModel: string,
    customerName: string,
    fromStatus: string,
    toStatus: string,
    changedBy: string,
    changeType: GarageScheduleChange['type'],
    notes?: string,
    additionalData?: {
      partsUsed?: string[];
      toolsUsed?: string[];
      workNotes?: string;
      issueDescription?: string;
      estimatedDuration?: string;
      actualDuration?: string;
      priority?: 'high' | 'medium' | 'low';
      assignedMechanic?: string;
      location?: string;
      fromWorkType?: string;
      toWorkType?: string;
    }
  ): void {
    try {
      const change: GarageScheduleChange = {
        id: `schedule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        carId,
        carCode,
        carModel,
        customerName,
        fromStatus,
        toStatus,
        fromWorkType: additionalData?.fromWorkType,
        toWorkType: additionalData?.toWorkType,
        timestamp: new Date().toISOString(),
        changedBy,
        notes: notes || `${changeType.replace('_', ' ')}: ${fromStatus} → ${toStatus}`,
        partsUsed: additionalData?.partsUsed || [],
        toolsUsed: additionalData?.toolsUsed || [],
        totalPartsCost: this.calculatePartsCost(additionalData?.partsUsed || []),
        totalToolsCost: this.calculateToolsCost(additionalData?.toolsUsed || []),
        workNotes: additionalData?.workNotes,
        issueDescription: additionalData?.issueDescription,
        estimatedDuration: additionalData?.estimatedDuration,
        actualDuration: additionalData?.actualDuration,
        priority: additionalData?.priority || 'medium',
        assignedMechanic: additionalData?.assignedMechanic,
        location: additionalData?.location || 'garage_repair',
        type: changeType
      };

      // Save to garage schedule history
      this.saveScheduleChange(change);

      // Also record as work type change if status changed
      if (fromStatus !== toStatus) {
        this.recordAsWorkTypeChange(change);
      }

      // Record in repair history
      this.recordInRepairHistory(change);

      console.log(`Garage schedule change recorded: ${carModel} (${carCode}) - ${changeType} - ${fromStatus} → ${toStatus}`);
    } catch (error) {
      console.error('Error recording garage schedule change:', error);
    }
  }

  // Record status change specifically
  static recordStatusChange(
    carId: string,
    carCode: string,
    carModel: string,
    customerName: string,
    fromStatus: string,
    toStatus: string,
    changedBy: string,
    notes?: string,
    additionalData?: {
      partsUsed?: string[];
      toolsUsed?: string[];
      workNotes?: string;
      issueDescription?: string;
      estimatedDuration?: string;
      actualDuration?: string;
      priority?: 'high' | 'medium' | 'low';
      assignedMechanic?: string;
      location?: string;
    }
  ): void {
    this.recordScheduleChange(
      carId,
      carCode,
      carModel,
      customerName,
      fromStatus,
      toStatus,
      changedBy,
      'status_change',
      notes,
      additionalData
    );
  }

  // Record work type change specifically
  static recordWorkTypeChange(
    carId: string,
    carCode: string,
    carModel: string,
    customerName: string,
    fromWorkType: string,
    toWorkType: string,
    changedBy: string,
    notes?: string,
    additionalData?: {
      partsUsed?: string[];
      toolsUsed?: string[];
      workNotes?: string;
      issueDescription?: string;
      estimatedDuration?: string;
      actualDuration?: string;
      priority?: 'high' | 'medium' | 'low';
      assignedMechanic?: string;
      location?: string;
    }
  ): void {
    this.recordScheduleChange(
      carId,
      carCode,
      carModel,
      customerName,
      fromWorkType,
      toWorkType,
      changedBy,
      'work_type_change',
      notes,
      { ...additionalData, fromWorkType, toWorkType }
    );
  }

  // Record completion
  static recordCompletion(
    carId: string,
    carCode: string,
    carModel: string,
    customerName: string,
    fromStatus: string,
    changedBy: string,
    notes?: string,
    additionalData?: {
      partsUsed?: string[];
      toolsUsed?: string[];
      workNotes?: string;
      issueDescription?: string;
      estimatedDuration?: string;
      actualDuration?: string;
      priority?: 'high' | 'medium' | 'low';
      assignedMechanic?: string;
      location?: string;
    }
  ): void {
    this.recordScheduleChange(
      carId,
      carCode,
      carModel,
      customerName,
      fromStatus,
      'completed',
      changedBy,
      'completion',
      notes,
      additionalData
    );
  }

  // Record assignment change
  static recordAssignmentChange(
    carId: string,
    carCode: string,
    carModel: string,
    customerName: string,
    fromMechanic: string,
    toMechanic: string,
    changedBy: string,
    notes?: string,
    additionalData?: {
      partsUsed?: string[];
      toolsUsed?: string[];
      workNotes?: string;
      issueDescription?: string;
      estimatedDuration?: string;
      actualDuration?: string;
      priority?: 'high' | 'medium' | 'low';
      location?: string;
    }
  ): void {
    this.recordScheduleChange(
      carId,
      carCode,
      carModel,
      customerName,
      fromMechanic,
      toMechanic,
      changedBy,
      'assignment',
      notes,
      { ...additionalData, assignedMechanic: toMechanic }
    );
  }

  // Record priority change
  static recordPriorityChange(
    carId: string,
    carCode: string,
    carModel: string,
    customerName: string,
    fromPriority: 'high' | 'medium' | 'low',
    toPriority: 'high' | 'medium' | 'low',
    changedBy: string,
    notes?: string,
    additionalData?: {
      partsUsed?: string[];
      toolsUsed?: string[];
      workNotes?: string;
      issueDescription?: string;
      estimatedDuration?: string;
      actualDuration?: string;
      assignedMechanic?: string;
      location?: string;
    }
  ): void {
    this.recordScheduleChange(
      carId,
      carCode,
      carModel,
      customerName,
      fromPriority,
      toPriority,
      changedBy,
      'priority_change',
      notes,
      { ...additionalData, priority: toPriority }
    );
  }

  // Save schedule change to localStorage
  private static saveScheduleChange(change: GarageScheduleChange): void {
    const savedHistory = localStorage.getItem(this.GARAGE_SCHEDULE_HISTORY_KEY);
    const history = savedHistory ? JSON.parse(savedHistory) : [];
    history.unshift(change);
    localStorage.setItem(this.GARAGE_SCHEDULE_HISTORY_KEY, JSON.stringify(history));
  }

  // Record as work type change for repair history
  private static recordAsWorkTypeChange(change: GarageScheduleChange): void {
    if (change.fromStatus !== change.toStatus) {
      WorkTypeHistoryService.recordWorkTypeChange({
        id: change.id,
        carVin: change.carCode,
        carModel: change.carModel,
        customerName: change.customerName,
        fromWorkType: change.fromStatus,
        toWorkType: change.toStatus,
        workTypeChange: `${change.fromStatus.replace('_', ' ').toUpperCase()} → ${change.toStatus.replace('_', ' ').toUpperCase()}`,
        timestamp: change.timestamp,
        changedBy: change.changedBy,
        notes: change.notes,
        type: 'work_type_change',
        partsUsed: change.partsUsed,
        partsUsedInStage: change.partsUsed,
        totalPartsCost: change.totalPartsCost,
        toolsUsed: change.toolsUsed,
        toolsUsedInStage: change.toolsUsed,
        totalToolsCost: change.totalToolsCost,
        workNotes: change.workNotes,
        issueDescription: change.issueDescription
      });
    }
  }

  // Record in repair history
  private static recordInRepairHistory(change: GarageScheduleChange): void {
    const savedHistory = localStorage.getItem('repairHistory');
    const history = savedHistory ? JSON.parse(savedHistory) : [];
    
    const repairEntry = {
      id: change.id,
      car_vin: change.carCode,
      car_model: change.carModel,
      client_name: change.customerName,
      issue_description: change.issueDescription || `Status changed from ${change.fromStatus} to ${change.toStatus}`,
      solution_description: change.notes || `${change.type.replace('_', ' ')}: ${change.fromStatus} → ${change.toStatus}`,
      repair_steps: [`${change.type.replace('_', ' ')}: ${change.fromStatus} → ${change.toStatus}`],
      parts_used: change.partsUsed.map(part => ({
        part_number: part,
        part_name: part,
        quantity: 1,
        cost: 0,
        supplier: 'Monza Parts'
      })),
      technician_name: change.assignedMechanic || change.changedBy,
      repair_date: change.timestamp,
      completion_date: change.timestamp,
      difficulty_level: 'medium' as const,
      labor_hours: change.actualDuration ? parseFloat(change.actualDuration.replace('h', '')) : 0,
      total_cost: change.totalPartsCost + change.totalToolsCost,
      quality_rating: 5,
      client_satisfaction: 5,
      photos: [],
      before_photos: [],
      after_photos: [],
      repair_category: change.type,
      warranty_period: 12,
      follow_up_required: false,
      follow_up_notes: '',
      workTypeTransition: `${change.fromStatus} → ${change.toStatus}`,
      fromStage: change.fromStatus,
      toStage: change.toStatus,
      transitionTimestamp: change.timestamp,
      partsUsed: change.partsUsed,
      partsUsedInStage: change.partsUsed,
      totalPartsCost: change.totalPartsCost,
      toolsUsed: change.toolsUsed,
      toolsUsedInStage: change.toolsUsed,
      totalToolsCost: change.totalToolsCost
    };
    
    history.unshift(repairEntry);
    localStorage.setItem('repairHistory', JSON.stringify(history));
  }

  // Get all garage schedule changes
  static getScheduleChanges(): GarageScheduleChange[] {
    try {
      const stored = localStorage.getItem(this.GARAGE_SCHEDULE_HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading garage schedule changes:', error);
      return [];
    }
  }

  // Get changes for specific car
  static getCarScheduleChanges(carId: string): GarageScheduleChange[] {
    const changes = this.getScheduleChanges();
    return changes.filter(change => change.carId === carId);
  }

  // Get changes by type
  static getChangesByType(type: GarageScheduleChange['type']): GarageScheduleChange[] {
    const changes = this.getScheduleChanges();
    return changes.filter(change => change.type === type);
  }

  // Get recent changes
  static getRecentChanges(limit: number = 20): GarageScheduleChange[] {
    const changes = this.getScheduleChanges();
    return changes.slice(0, limit);
  }

  // Calculate parts cost
  private static calculatePartsCost(parts: string[]): number {
    let totalCost = 0;
    parts.forEach(part => {
      // Simplified cost calculation based on part name
      if (part.toLowerCase().includes('engine')) totalCost += 500;
      else if (part.toLowerCase().includes('transmission')) totalCost += 300;
      else if (part.toLowerCase().includes('brake')) totalCost += 150;
      else if (part.toLowerCase().includes('tire')) totalCost += 200;
      else if (part.toLowerCase().includes('battery')) totalCost += 120;
      else if (part.toLowerCase().includes('filter')) totalCost += 25;
      else if (part.toLowerCase().includes('oil')) totalCost += 50;
      else totalCost += 75; // Default cost
    });
    return totalCost;
  }

  // Calculate tools cost
  private static calculateToolsCost(tools: string[]): number {
    let totalCost = 0;
    tools.forEach(tool => {
      // Ensure tool is a string before calling toLowerCase
      const toolName = typeof tool === 'string' ? tool : String(tool || '');
      if (!toolName) return; // Skip empty tools
      
      // Simplified cost calculation based on tool name
      if (toolName.toLowerCase().includes('diagnostic')) totalCost += 200;
      else if (toolName.toLowerCase().includes('lift')) totalCost += 150;
      else if (toolName.toLowerCase().includes('wrench')) totalCost += 50;
      else if (toolName.toLowerCase().includes('screwdriver')) totalCost += 20;
      else if (toolName.toLowerCase().includes('multimeter')) totalCost += 100;
      else totalCost += 30; // Default cost
    });
    return totalCost;
  }

  // Clear all schedule changes
  static clearScheduleChanges(): void {
    localStorage.removeItem(this.GARAGE_SCHEDULE_HISTORY_KEY);
  }
} 