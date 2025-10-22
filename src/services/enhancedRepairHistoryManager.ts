import { EnhancedRepairHistory } from '@/types';
import { RepairCompletionData } from '@/components/garage/RepairCompletionForm';

export class EnhancedRepairHistoryManager {
  private static readonly REPAIR_HISTORY_KEY = 'enhancedRepairHistory';

  // Save repair from completion form
  static saveRepairFromCompletion(completionData: RepairCompletionData): boolean {
    try {
      const repairHistory: EnhancedRepairHistory = {
        id: `repair_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        car_vin: completionData.carCode,
        car_model: completionData.carModel,
        client_name: completionData.customerName,
        issue_description: completionData.issueDescription,
        solution_description: completionData.solutionDescription,
        repair_steps: completionData.repairSteps,
        parts_used: completionData.partsUsed,
        tools_used: completionData.toolsUsed,
        labor_hours: completionData.totalLaborHours,
        total_cost: completionData.totalCost,
        technician_name: completionData.assignedMechanic,
        assigned_mechanic: completionData.assignedMechanic,
        repair_date: new Date().toISOString().split('T')[0],
        completion_date: completionData.completionDate,
        work_type: completionData.workType,
        difficulty_level: completionData.difficultyLevel,
        quality_rating: completionData.qualityRating,
        client_satisfaction: completionData.clientSatisfaction,
        warranty_period: completionData.warrantPeriod,
        follow_up_required: completionData.followUpRequired,
        follow_up_notes: completionData.followUpNotes,
        before_photos: completionData.beforePhotos,
        after_photos: completionData.afterPhotos,
        mechanic_notes: completionData.mechanicNotes,
        recommendation: completionData.recommendation,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const existingHistory = this.getRepairHistory();
      existingHistory.unshift(repairHistory);
      localStorage.setItem(this.REPAIR_HISTORY_KEY, JSON.stringify(existingHistory));
      return true;
    } catch (error) {
      console.error('Error saving repair history:', error);
      return false;
    }
  }

  // Get all repair history
  static getRepairHistory(): EnhancedRepairHistory[] {
    try {
      const stored = localStorage.getItem(this.REPAIR_HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading repair history:', error);
      return [];
    }
  }

  // Get repair statistics
  static getRepairStatistics() {
    const history = this.getRepairHistory();
    const totalRepairs = history.length;
    const totalCars = new Set(history.map(r => r.car_vin)).size;
    const totalMechanics = new Set(history.map(r => r.technician_name)).size;
    const totalParts = history.reduce((sum, repair) => 
      sum + repair.parts_used.reduce((partSum, part) => partSum + part.quantity, 0), 0
    );

    return { totalRepairs, totalCars, totalMechanics, totalParts };
  }

  // Search repair history
  static searchRepairHistory(query: string): EnhancedRepairHistory[] {
    const allHistory = this.getRepairHistory();
    const searchTerm = query.toLowerCase();
    
    return allHistory.filter(repair => 
      repair.car_vin.toLowerCase().includes(searchTerm) ||
      repair.car_model.toLowerCase().includes(searchTerm) ||
      repair.client_name.toLowerCase().includes(searchTerm) ||
      repair.technician_name.toLowerCase().includes(searchTerm)
    );
  }
}