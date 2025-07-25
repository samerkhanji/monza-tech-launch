interface PartUsageEntry {
  id: string;
  carVin: string;
  carModel: string;
  partNumber: string;
  partName: string;
  quantity: number;
  cost: number;
  mechanicName: string;
  workOrderId: string;
  usageDate: string;
  repairCategory: string;
  notes: string;
}

interface RepairHistoryEntry {
  id: string;
  carVin: string;
  carModel: string;
  repairDate: string;
  mechanicName: string;
  workOrderId: string;
  repairCategory: string;
  description: string;
  status: 'in_progress' | 'completed' | 'waiting_parts' | 'on_hold';
  priority: 'low' | 'medium' | 'high';
  estimatedHours: number;
  actualHours?: number;
  totalCost: number;
  customerComplaints: string[];
  workPerformed: string[];
  partsUsed: PartUsageEntry[];
  photos?: string[];
  customerSatisfaction?: number;
  completionDate?: string;
  nextServiceDate?: string;
  recommendations?: string[];
}

export class RepairHistoryService {
  private static readonly REPAIR_HISTORY_KEY = 'repairHistory';
  private static readonly PARTS_USAGE_KEY = 'repairPartsUsage';

  // Get all repair history entries
  static getRepairHistory(): RepairHistoryEntry[] {
    try {
      const stored = localStorage.getItem(this.REPAIR_HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading repair history:', error);
      return [];
    }
  }

  // Get repair history for specific car
  static getCarRepairHistory(carVin: string): RepairHistoryEntry[] {
    const allHistory = this.getRepairHistory();
    return allHistory.filter(entry => entry.carVin === carVin);
  }

  // Add part usage to repair history
  static async addPartUsage(partUsage: Omit<PartUsageEntry, 'id'>): Promise<void> {
    try {
      // Add to parts usage log
      const partUsageEntry: PartUsageEntry = {
        ...partUsage,
        id: `part-usage-${Date.now()}`
      };

      const existingPartsUsage = this.getPartsUsageHistory();
      existingPartsUsage.push(partUsageEntry);
      localStorage.setItem(this.PARTS_USAGE_KEY, JSON.stringify(existingPartsUsage));

      // Update repair history entry
      const repairHistory = this.getRepairHistory();
      const repairIndex = repairHistory.findIndex(entry => 
        entry.workOrderId === partUsage.workOrderId || 
        (entry.carVin === partUsage.carVin && entry.status === 'in_progress')
      );

      if (repairIndex !== -1) {
        // Add part to existing repair entry
        repairHistory[repairIndex].partsUsed.push(partUsageEntry);
        repairHistory[repairIndex].totalCost += partUsage.cost;
        repairHistory[repairIndex].workPerformed.push(
          `Used ${partUsage.quantity}x ${partUsage.partName} (${partUsage.partNumber})`
        );
      } else {
        // Create new repair entry if none exists
        const newRepairEntry: RepairHistoryEntry = {
          id: `repair-${Date.now()}`,
          carVin: partUsage.carVin,
          carModel: partUsage.carModel,
          repairDate: partUsage.usageDate,
          mechanicName: partUsage.mechanicName,
          workOrderId: partUsage.workOrderId,
          repairCategory: partUsage.repairCategory,
          description: `Parts replacement - ${partUsage.notes}`,
          status: 'in_progress',
          priority: 'medium',
          estimatedHours: 2,
          totalCost: partUsage.cost,
          customerComplaints: [],
          workPerformed: [`Used ${partUsage.quantity}x ${partUsage.partName} (${partUsage.partNumber})`],
          partsUsed: [partUsageEntry]
        };
        repairHistory.push(newRepairEntry);
      }

      localStorage.setItem(this.REPAIR_HISTORY_KEY, JSON.stringify(repairHistory));
    } catch (error) {
      console.error('Error adding part usage to repair history:', error);
      throw error;
    }
  }

  // Get parts usage history
  static getPartsUsageHistory(): PartUsageEntry[] {
    try {
      return JSON.parse(localStorage.getItem(this.PARTS_USAGE_KEY) || '[]');
    } catch (error) {
      console.error('Error loading parts usage history:', error);
      return [];
    }
  }

  // Create new repair entry
  static createRepairEntry(repair: Omit<RepairHistoryEntry, 'id' | 'partsUsed' | 'workPerformed'>): string {
    const repairHistory = this.getRepairHistory();
    const newRepair: RepairHistoryEntry = {
      ...repair,
      id: `repair-${Date.now()}`,
      partsUsed: [],
      workPerformed: []
    };
    
    repairHistory.push(newRepair);
    localStorage.setItem(this.REPAIR_HISTORY_KEY, JSON.stringify(repairHistory));
    return newRepair.id;
  }

  // Update repair status
  static updateRepairStatus(
    workOrderId: string, 
    status: RepairHistoryEntry['status'],
    additionalData?: Partial<RepairHistoryEntry>
  ): boolean {
    try {
      const repairHistory = this.getRepairHistory();
      const repairIndex = repairHistory.findIndex(entry => entry.workOrderId === workOrderId);
      
      if (repairIndex !== -1) {
        repairHistory[repairIndex].status = status;
        if (additionalData) {
          Object.assign(repairHistory[repairIndex], additionalData);
        }
        
        if (status === 'completed') {
          repairHistory[repairIndex].completionDate = new Date().toISOString();
        }
        
        localStorage.setItem(this.REPAIR_HISTORY_KEY, JSON.stringify(repairHistory));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating repair status:', error);
      return false;
    }
  }

  // Get repair statistics
  static getRepairStatistics(mechanicName?: string) {
    const repairHistory = this.getRepairHistory();
    const filteredHistory = mechanicName 
      ? repairHistory.filter(entry => entry.mechanicName === mechanicName)
      : repairHistory;

    const totalRepairs = filteredHistory.length;
    const completedRepairs = filteredHistory.filter(entry => entry.status === 'completed').length;
    const inProgressRepairs = filteredHistory.filter(entry => entry.status === 'in_progress').length;
    const waitingPartsRepairs = filteredHistory.filter(entry => entry.status === 'waiting_parts').length;

    const totalCost = filteredHistory.reduce((sum, entry) => sum + entry.totalCost, 0);
    const averageCost = totalRepairs > 0 ? totalCost / totalRepairs : 0;

    const totalHours = filteredHistory
      .filter(entry => entry.actualHours)
      .reduce((sum, entry) => sum + (entry.actualHours || 0), 0);
    const averageHours = completedRepairs > 0 ? totalHours / completedRepairs : 0;

    const satisfaction = filteredHistory
      .filter(entry => entry.customerSatisfaction)
      .reduce((sum, entry) => sum + (entry.customerSatisfaction || 0), 0);
    const averageSatisfaction = satisfaction > 0 ? satisfaction / filteredHistory.filter(entry => entry.customerSatisfaction).length : 0;

    return {
      totalRepairs,
      completedRepairs,
      inProgressRepairs,
      waitingPartsRepairs,
      completionRate: totalRepairs > 0 ? (completedRepairs / totalRepairs) * 100 : 0,
      totalCost,
      averageCost,
      totalHours,
      averageHours,
      averageSatisfaction
    };
  }

  // Get parts usage statistics
  static getPartsUsageStatistics() {
    const partsUsage = this.getPartsUsageHistory();
    
    const partCounts = partsUsage.reduce((acc, usage) => {
      acc[usage.partNumber] = (acc[usage.partNumber] || 0) + usage.quantity;
      return acc;
    }, {} as Record<string, number>);

    const partCosts = partsUsage.reduce((acc, usage) => {
      acc[usage.partNumber] = (acc[usage.partNumber] || 0) + usage.cost;
      return acc;
    }, {} as Record<string, number>);

    const categoryUsage = partsUsage.reduce((acc, usage) => {
      acc[usage.repairCategory] = (acc[usage.repairCategory] || 0) + usage.quantity;
      return acc;
    }, {} as Record<string, number>);

    const mostUsedParts = Object.entries(partCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([partNumber, quantity]) => {
        const usage = partsUsage.find(p => p.partNumber === partNumber);
        return {
          partNumber,
          partName: usage?.partName || 'Unknown',
          quantity,
          totalCost: partCosts[partNumber] || 0
        };
      });

    const totalPartsValue = Object.values(partCosts).reduce((sum, cost) => sum + cost, 0);

    return {
      totalPartsUsed: partsUsage.reduce((sum, usage) => sum + usage.quantity, 0),
      totalPartsValue,
      mostUsedParts,
      categoryBreakdown: categoryUsage,
      uniquePartsUsed: Object.keys(partCounts).length
    };
  }

  // Search repair history
  static searchRepairs(query: string): RepairHistoryEntry[] {
    const repairHistory = this.getRepairHistory();
    const searchTerm = query.toLowerCase();

    return repairHistory.filter(entry => 
      entry.carVin.toLowerCase().includes(searchTerm) ||
      entry.carModel.toLowerCase().includes(searchTerm) ||
      entry.mechanicName.toLowerCase().includes(searchTerm) ||
      entry.description.toLowerCase().includes(searchTerm) ||
      entry.workOrderId.toLowerCase().includes(searchTerm) ||
      entry.customerComplaints.some(complaint => complaint.toLowerCase().includes(searchTerm)) ||
      entry.workPerformed.some(work => work.toLowerCase().includes(searchTerm))
    );
  }

  // Export repair data
  static exportRepairData(carVin?: string) {
    const repairHistory = carVin 
      ? this.getCarRepairHistory(carVin)
      : this.getRepairHistory();
    
    return {
      exportDate: new Date().toISOString(),
      carVin: carVin || 'all',
      repairHistory,
      statistics: this.getRepairStatistics(),
      partsStatistics: this.getPartsUsageStatistics()
    };
  }

  // Clear old repair data (older than specified days)
  static cleanupOldData(daysToKeep: number = 365): number {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      const repairHistory = this.getRepairHistory();
      const partsUsage = this.getPartsUsageHistory();
      
      const filteredRepairs = repairHistory.filter(entry => 
        new Date(entry.repairDate) > cutoffDate
      );
      
      const filteredParts = partsUsage.filter(entry => 
        new Date(entry.usageDate) > cutoffDate
      );
      
      const removedCount = repairHistory.length - filteredRepairs.length;
      
      localStorage.setItem(this.REPAIR_HISTORY_KEY, JSON.stringify(filteredRepairs));
      localStorage.setItem(this.PARTS_USAGE_KEY, JSON.stringify(filteredParts));
      
      return removedCount;
    } catch (error) {
      console.error('Error cleaning up old data:', error);
      return 0;
    }
  }
} 