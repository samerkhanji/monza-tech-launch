export interface WorkTypeHistoryEntry {
  id: string;
  carVin: string;
  carModel: string;
  customerName?: string;
  fromWorkType: string;
  toWorkType: string;
  workTypeChange: string;
  timestamp: string;
  changedBy: string;
  notes?: string;
  type: 'work_type_change';
  duration?: string;
  assignedEmployee?: string;
  mechanics?: string[];
  partsUsed: string[];
  partsUsedInStage: string[];
  totalPartsCost: number;
  toolsUsed: string[];
  toolsUsedInStage: string[];
  totalToolsCost: number;
  workNotes?: string;
  issueDescription?: string;
}

export class WorkTypeHistoryService {
  private static readonly WORK_TYPE_HISTORY_KEY = 'workTypeHistory';

  // Get all work type history entries
  static getWorkTypeHistory(): WorkTypeHistoryEntry[] {
    try {
      const stored = localStorage.getItem(this.WORK_TYPE_HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading work type history:', error);
      return [];
    }
  }

  // Get work type history for a specific car
  static getCarWorkTypeHistory(carVin: string): WorkTypeHistoryEntry[] {
    const history = this.getWorkTypeHistory();
    return history.filter(entry => entry.carVin === carVin);
  }

  // Get work type history for a specific date range
  static getWorkTypeHistoryByDateRange(startDate: string, endDate: string): WorkTypeHistoryEntry[] {
    const history = this.getWorkTypeHistory();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return history.filter(entry => {
      const entryDate = new Date(entry.timestamp);
      return entryDate >= start && entryDate <= end;
    });
  }

  // Get work type history for a specific work type
  static getWorkTypeHistoryByType(workType: string): WorkTypeHistoryEntry[] {
    const history = this.getWorkTypeHistory();
    return history.filter(entry => 
      entry.fromWorkType === workType || entry.toWorkType === workType
    );
  }

  // Get work type transitions (from one type to another)
  static getWorkTypeTransitions(fromType: string, toType: string): WorkTypeHistoryEntry[] {
    const history = this.getWorkTypeHistory();
    return history.filter(entry => 
      entry.fromWorkType === fromType && entry.toWorkType === toType
    );
  }

  // Get work type analytics
  static getWorkTypeAnalytics() {
    const history = this.getWorkTypeHistory();
    
    // Count transitions
    const transitionCounts: { [key: string]: number } = {};
    const workTypeCounts: { [key: string]: number } = {};
    const carCounts: { [key: string]: number } = {};
    const workTypeStages: { [key: string]: any } = {};
    
    history.forEach(entry => {
      const transition = `${entry.fromWorkType} → ${entry.toWorkType}`;
      transitionCounts[transition] = (transitionCounts[transition] || 0) + 1;
      
      workTypeCounts[entry.fromWorkType] = (workTypeCounts[entry.fromWorkType] || 0) + 1;
      workTypeCounts[entry.toWorkType] = (workTypeCounts[entry.toWorkType] || 0) + 1;
      
      carCounts[entry.carVin] = (carCounts[entry.carVin] || 0) + 1;
      
      // Organize by work type stages
      if (!workTypeStages[entry.fromWorkType]) {
        workTypeStages[entry.fromWorkType] = {
          workType: entry.fromWorkType,
          entries: [],
          totalPartsCost: 0,
          totalToolsCost: 0,
          totalParts: 0,
          totalTools: 0,
          mechanics: new Set(),
          notes: []
        };
      }
      
      const stage = workTypeStages[entry.fromWorkType];
      stage.entries.push(entry);
      stage.totalPartsCost += entry.totalPartsCost || 0;
      stage.totalToolsCost += entry.totalToolsCost || 0;
      stage.totalParts += entry.partsUsed?.length || 0;
      stage.totalTools += entry.toolsUsed?.length || 0;
      
      if (entry.mechanics) {
        entry.mechanics.forEach(mechanic => stage.mechanics.add(mechanic));
      }
      
      if (entry.notes) {
        stage.notes.push(entry.notes);
      }
    });

    // Convert Sets to arrays for JSON serialization
    Object.values(workTypeStages).forEach(stage => {
      stage.mechanics = Array.from(stage.mechanics);
    });

    return {
      totalTransitions: history.length,
      uniqueCars: Object.keys(carCounts).length,
      transitionCounts,
      workTypeCounts,
      workTypeStages,
      averageTransitionsPerCar: history.length / Object.keys(carCounts).length
    };
  }

  // Get comprehensive work type stage data
  static getWorkTypeStages(carVin?: string) {
    const history = carVin ? this.getCarWorkTypeHistory(carVin) : this.getWorkTypeHistory();
    const stages: { [key: string]: any } = {};
    
    history.forEach(entry => {
      const workType = entry.fromWorkType;
      
      if (!stages[workType]) {
        stages[workType] = {
          workType,
          label: this.getWorkTypeLabel(workType),
          entries: [],
          totalPartsCost: 0,
          totalToolsCost: 0,
          totalParts: 0,
          totalTools: 0,
          mechanics: new Set(),
          notes: [],
          workNotes: [],
          issueDescriptions: []
        };
      }
      
      const stage = stages[workType];
      stage.entries.push(entry);
      stage.totalPartsCost += entry.totalPartsCost || 0;
      stage.totalToolsCost += entry.totalToolsCost || 0;
      stage.totalParts += entry.partsUsed?.length || 0;
      stage.totalTools += entry.toolsUsed?.length || 0;
      
      if (entry.mechanics) {
        entry.mechanics.forEach(mechanic => stage.mechanics.add(mechanic));
      }
      
      if (entry.notes) {
        stage.notes.push(entry.notes);
      }
      
      if (entry.workNotes) {
        stage.workNotes.push(entry.workNotes);
      }
      
      if (entry.issueDescription) {
        stage.issueDescriptions.push(entry.issueDescription);
      }
    });

    // Convert Sets to arrays and sort by work type order
    const sortedStages = Object.values(stages).map(stage => ({
      ...stage,
      mechanics: Array.from(stage.mechanics)
    })).sort((a, b) => this.getWorkTypeOrder(a.workType) - this.getWorkTypeOrder(b.workType));
    
    return sortedStages;
  }

  // Get work type label
  private static getWorkTypeLabel(workType: string): string {
    switch (workType) {
      case 'in_diagnosis':
        return 'Diagnosis Stage';
      case 'in_repair':
        return 'Repair Stage';
      case 'in_quality_check':
        return 'Quality Check Stage';
      case 'ready':
        return 'Ready Stage';
      case 'delivered':
        return 'Delivery Stage';
      default:
        return workType.replace('_', ' ').toUpperCase();
    }
  }

  // Get work type order for sorting
  private static getWorkTypeOrder(workType: string): number {
    switch (workType) {
      case 'in_diagnosis':
        return 1;
      case 'in_repair':
        return 2;
      case 'in_quality_check':
        return 3;
      case 'ready':
        return 4;
      case 'delivered':
        return 5;
      default:
        return 999;
    }
  }

  // Get recent work type changes (last N entries)
  static getRecentWorkTypeChanges(limit: number = 10): WorkTypeHistoryEntry[] {
    const history = this.getWorkTypeHistory();
    return history.slice(0, limit);
  }

  // Search work type history
  static searchWorkTypeHistory(query: string): WorkTypeHistoryEntry[] {
    const history = this.getWorkTypeHistory();
    const lowerQuery = query.toLowerCase();
    
    return history.filter(entry => 
      entry.carModel.toLowerCase().includes(lowerQuery) ||
      entry.carVin.toLowerCase().includes(lowerQuery) ||
      entry.workTypeChange.toLowerCase().includes(lowerQuery) ||
      entry.changedBy.toLowerCase().includes(lowerQuery) ||
      (entry.notes && entry.notes.toLowerCase().includes(lowerQuery))
    );
  }

  // Clear work type history (for testing/reset purposes)
  static clearWorkTypeHistory(): void {
    localStorage.removeItem(this.WORK_TYPE_HISTORY_KEY);
  }
} 