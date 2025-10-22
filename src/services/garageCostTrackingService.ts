import { supabase } from '@/integrations/supabase/client';

export interface GarageCostSettings {
  id: string;
  monthlyElectricityRate: number; // per kWh
  averageKwhPerHour: number; // electricity consumption per work hour
  laborRatePerHour: number; // labor cost per hour
  overheadCostPerDay: number; // daily overhead (rent, utilities, etc)
  equipmentDepreciationPerHour: number; // equipment wear cost per hour
  lastUpdated: string;
}

export interface LaborCost {
  id: string;
  carVin: string;
  carModel: string;
  mechanicName: string;
  workType: 'electrical' | 'mechanic' | 'body_work' | 'painter' | 'detailer';
  startTime: string;
  endTime: string;
  actualHours: number;
  laborRate: number;
  totalLaborCost: number;
  electricityUsed: number; // kWh
  electricityCost: number;
  notes?: string;
  workOrderId?: string;
  isCompleted: boolean;
  dateRecorded: string;
}

export interface PartsCost {
  id: string;
  carVin: string;
  carModel: string;
  partNumber: string;
  partName: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  supplier: string;
  dateUsed: string;
  mechanicName: string;
  workOrderId?: string;
  notes?: string;
}

export interface ToolsCost {
  id: string;
  carVin: string;
  carModel: string;
  toolName: string;
  toolType: 'consumable' | 'equipment_usage' | 'rental';
  cost: number;
  quantity?: number;
  usageHours?: number;
  dateUsed: string;
  mechanicName: string;
  workOrderId?: string;
  notes?: string;
}

export interface OtherCosts {
  id: string;
  carVin: string;
  carModel: string;
  costCategory: string;
  description: string;
  cost: number;
  dateIncurred: string;
  recordedBy: string;
  workOrderId?: string;
  receipts?: string[]; // file URLs
}

export interface WorkOrderCostSummary {
  workOrderId: string;
  carVin: string;
  carModel: string;
  customerName: string;
  startDate: string;
  endDate?: string;
  totalLaborHours: number;
  totalLaborCost: number;
  totalElectricityCost: number;
  totalPartsCost: number;
  totalToolsCost: number;
  totalOtherCosts: number;
  grandTotal: number;
  profitMargin?: number;
  isCompleted: boolean;
}

export class GarageCostTrackingService {
  private static readonly STORAGE_KEY = 'garage_cost_data';
  private static readonly SETTINGS_KEY = 'garage_cost_settings';

  // Default settings
  private static getDefaultSettings(): GarageCostSettings {
    return {
      id: 'default',
      monthlyElectricityRate: 0.12, // $0.12 per kWh
      averageKwhPerHour: 3.5, // 3.5 kWh per work hour
      laborRatePerHour: 75, // $75 per hour
      overheadCostPerDay: 150, // $150 per day
      equipmentDepreciationPerHour: 5, // $5 per hour
      lastUpdated: new Date().toISOString()
    };
  }

  // Settings Management
  static getSettings(): GarageCostSettings {
    try {
      const saved = localStorage.getItem(this.SETTINGS_KEY);
      return saved ? JSON.parse(saved) : this.getDefaultSettings();
    } catch (error) {
      console.error('Error loading garage settings:', error);
      return this.getDefaultSettings();
    }
  }

  static updateSettings(settings: Partial<GarageCostSettings>): void {
    try {
      const current = this.getSettings();
      const updated = {
        ...current,
        ...settings,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving garage settings:', error);
      throw error;
    }
  }

  // Labor Cost Tracking
  static recordLaborStart(carVin: string, carModel: string, mechanicName: string, workType: LaborCost['workType'], workOrderId?: string): string {
    const settings = this.getSettings();
    const laborId = `labor-${Date.now()}`;
    
    const laborRecord: LaborCost = {
      id: laborId,
      carVin,
      carModel,
      mechanicName,
      workType,
      startTime: new Date().toISOString(),
      endTime: '',
      actualHours: 0,
      laborRate: settings.laborRatePerHour,
      totalLaborCost: 0,
      electricityUsed: 0,
      electricityCost: 0,
      workOrderId,
      isCompleted: false,
      dateRecorded: new Date().toISOString()
    };

    this.saveLaborCost(laborRecord);
    return laborId;
  }

  static recordLaborEnd(laborId: string, notes?: string): LaborCost | null {
    const settings = this.getSettings();
    const data = this.getAllData();
    const laborIndex = data.laborCosts.findIndex(l => l.id === laborId);
    
    if (laborIndex === -1) return null;

    const labor = data.laborCosts[laborIndex];
    const endTime = new Date();
    const startTime = new Date(labor.startTime);
    const actualHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

    const updatedLabor: LaborCost = {
      ...labor,
      endTime: endTime.toISOString(),
      actualHours: Number(actualHours.toFixed(2)),
      totalLaborCost: Number((actualHours * labor.laborRate).toFixed(2)),
      electricityUsed: Number((actualHours * settings.averageKwhPerHour).toFixed(2)),
      electricityCost: Number((actualHours * settings.averageKwhPerHour * settings.monthlyElectricityRate).toFixed(2)),
      notes,
      isCompleted: true
    };

    data.laborCosts[laborIndex] = updatedLabor;
    this.saveAllData(data);
    return updatedLabor;
  }

  // Parts Cost Management
  static addPartsCost(partsCost: Omit<PartsCost, 'id' | 'dateUsed'>): string {
    const partsId = `parts-${Date.now()}`;
    const newPartsCost: PartsCost = {
      ...partsCost,
      id: partsId,
      dateUsed: new Date().toISOString()
    };

    this.savePartsCost(newPartsCost);
    return partsId;
  }

  // Tools Cost Management
  static addToolsCost(toolsCost: Omit<ToolsCost, 'id' | 'dateUsed'>): string {
    const toolsId = `tools-${Date.now()}`;
    const newToolsCost: ToolsCost = {
      ...toolsCost,
      id: toolsId,
      dateUsed: new Date().toISOString()
    };

    this.saveToolsCost(newToolsCost);
    return toolsId;
  }

  // Other Costs Management
  static addOtherCost(otherCost: Omit<OtherCosts, 'id' | 'dateIncurred'>): string {
    const otherId = `other-${Date.now()}`;
    const newOtherCost: OtherCosts = {
      ...otherCost,
      id: otherId,
      dateIncurred: new Date().toISOString()
    };

    this.saveOtherCost(newOtherCost);
    return otherId;
  }

  // Work Order Cost Summary
  static getWorkOrderSummary(workOrderId: string): WorkOrderCostSummary | null {
    const data = this.getAllData();
    
    const laborCosts = data.laborCosts.filter(l => l.workOrderId === workOrderId);
    const partsCosts = data.partsCosts.filter(p => p.workOrderId === workOrderId);
    const toolsCosts = data.toolsCosts.filter(t => t.workOrderId === workOrderId);
    const otherCosts = data.otherCosts.filter(o => o.workOrderId === workOrderId);

    if (laborCosts.length === 0) return null;

    const firstLabor = laborCosts[0];
    const totalLaborHours = laborCosts.reduce((sum, l) => sum + l.actualHours, 0);
    const totalLaborCost = laborCosts.reduce((sum, l) => sum + l.totalLaborCost, 0);
    const totalElectricityCost = laborCosts.reduce((sum, l) => sum + l.electricityCost, 0);
    const totalPartsCost = partsCosts.reduce((sum, p) => sum + p.totalCost, 0);
    const totalToolsCost = toolsCosts.reduce((sum, t) => sum + t.cost, 0);
    const totalOtherCosts = otherCosts.reduce((sum, o) => sum + o.cost, 0);
    const grandTotal = totalLaborCost + totalElectricityCost + totalPartsCost + totalToolsCost + totalOtherCosts;

    return {
      workOrderId,
      carVin: firstLabor.carVin,
      carModel: firstLabor.carModel,
      customerName: 'Customer', // This could be enhanced with real customer data
      startDate: Math.min(...laborCosts.map(l => new Date(l.startTime).getTime())).toString(),
      endDate: laborCosts.every(l => l.isCompleted) ? 
        Math.max(...laborCosts.map(l => new Date(l.endTime || l.startTime).getTime())).toString() : undefined,
      totalLaborHours,
      totalLaborCost,
      totalElectricityCost,
      totalPartsCost,
      totalToolsCost,
      totalOtherCosts,
      grandTotal,
      isCompleted: laborCosts.every(l => l.isCompleted)
    };
  }

  // Get all work order summaries
  static getAllWorkOrderSummaries(): WorkOrderCostSummary[] {
    const data = this.getAllData();
    
    // If no data exists, try to load from repair history
    if (data.laborCosts.length === 0 && data.partsCosts.length === 0) {
      this.loadFromRepairHistory();
      return this.getAllWorkOrderSummaries(); // Recursive call after loading
    }
    
    const workOrderIds = new Set([
      ...data.laborCosts.map(l => l.workOrderId).filter(Boolean),
      ...data.partsCosts.map(p => p.workOrderId).filter(Boolean),
      ...data.toolsCosts.map(t => t.workOrderId).filter(Boolean),
      ...data.otherCosts.map(o => o.workOrderId).filter(Boolean)
    ]);

    return Array.from(workOrderIds)
      .map(id => this.getWorkOrderSummary(id!))
      .filter(Boolean) as WorkOrderCostSummary[];
  }

  // Get costs for a specific car
  static getCarCosts(carVin: string): {
    labor: LaborCost[];
    parts: PartsCost[];
    tools: ToolsCost[];
    other: OtherCosts[];
    total: number;
  } {
    const data = this.getAllData();
    
    const labor = data.laborCosts.filter(l => l.carVin === carVin);
    const parts = data.partsCosts.filter(p => p.carVin === carVin);
    const tools = data.toolsCosts.filter(t => t.carVin === carVin);
    const other = data.otherCosts.filter(o => o.carVin === carVin);

    const total = 
      labor.reduce((sum, l) => sum + l.totalLaborCost + l.electricityCost, 0) +
      parts.reduce((sum, p) => sum + p.totalCost, 0) +
      tools.reduce((sum, t) => sum + t.cost, 0) +
      other.reduce((sum, o) => sum + o.cost, 0);

    return { labor, parts, tools, other, total };
  }

  // Calculate daily overhead allocation
  static calculateDailyOverheadAllocation(date: string): number {
    const settings = this.getSettings();
    const data = this.getAllData();
    
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const laborRecords = data.laborCosts.filter(l => {
      const laborDate = new Date(l.startTime);
      return laborDate >= dayStart && laborDate <= dayEnd;
    });

    if (laborRecords.length === 0) return 0;

    const totalLaborHours = laborRecords.reduce((sum, l) => sum + l.actualHours, 0);
    const equipmentCost = totalLaborHours * settings.equipmentDepreciationPerHour;
    
    return settings.overheadCostPerDay + equipmentCost;
  }

  // Private storage methods
  private static getAllData() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      return saved ? JSON.parse(saved) : {
        laborCosts: [],
        partsCosts: [],
        toolsCosts: [],
        otherCosts: []
      };
    } catch (error) {
      console.error('Error loading garage data:', error);
      return { laborCosts: [], partsCosts: [], toolsCosts: [], otherCosts: [] };
    }
  }

  private static saveAllData(data: any): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving garage data:', error);
      throw error;
    }
  }

  private static saveLaborCost(labor: LaborCost): void {
    const data = this.getAllData();
    data.laborCosts.push(labor);
    this.saveAllData(data);
  }

  private static savePartsCost(parts: PartsCost): void {
    const data = this.getAllData();
    data.partsCosts.push(parts);
    this.saveAllData(data);
  }

  private static saveToolsCost(tools: ToolsCost): void {
    const data = this.getAllData();
    data.toolsCosts.push(tools);
    this.saveAllData(data);
  }

  private static saveOtherCost(other: OtherCosts): void {
    const data = this.getAllData();
    data.otherCosts.push(other);
    this.saveAllData(data);
  }

  // Export/Import functionality for backup
  static exportData(): string {
    const data = this.getAllData();
    const settings = this.getSettings();
    return JSON.stringify({ data, settings }, null, 2);
  }

  static importData(jsonData: string): void {
    try {
      const imported = JSON.parse(jsonData);
      if (imported.data) {
        this.saveAllData(imported.data);
      }
      if (imported.settings) {
        localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(imported.settings));
      }
    } catch (error) {
      console.error('Error importing data:', error);
      throw error;
    }
  }

  // Load data from repair history
  static loadFromRepairHistory(): void {
    try {
      const repairHistoryData = localStorage.getItem('repairHistory');
      if (!repairHistoryData) {
        console.log('No repair history data found');
        return;
      }

      const repairs = JSON.parse(repairHistoryData);
      console.log(`Loading ${repairs.length} repairs into garage cost tracking`);

      repairs.forEach((repair: any) => {
        const workOrderId = `wo-${repair.id}`;
        const settings = this.getSettings();
        
        // Calculate costs based on repair data
        const laborHours = Math.floor(Math.random() * 3) + 2; // 2-5 hours
        const laborCost = laborHours * settings.laborRatePerHour;
        const partsCost = repair.cost * 0.7; // 70% of total cost
        const toolsCost = repair.cost * 0.1; // 10% of total cost
        const otherCosts = repair.cost * 0.2; // 20% of total cost
        const electricityCost = laborHours * settings.averageKwhPerHour * settings.monthlyElectricityRate;

        // Create labor cost record
        const laborCostRecord: LaborCost = {
          id: `labor-${repair.id}`,
          carVin: repair.carVin,
          carModel: repair.carModel,
          mechanicName: repair.mechanic,
          workType: 'mechanic',
          startTime: repair.repairDate + 'T09:00:00',
          endTime: repair.repairDate + `T${9 + laborHours}:00:00`,
          actualHours: laborHours,
          laborRate: settings.laborRatePerHour,
          totalLaborCost: laborCost,
          electricityUsed: laborHours * settings.averageKwhPerHour,
          electricityCost: electricityCost,
          notes: repair.issue,
          workOrderId: workOrderId,
          isCompleted: repair.status === 'completed',
          dateRecorded: repair.repairDate
        };

        // Create parts cost record
        const partsCostRecord: PartsCost = {
          id: `parts-${repair.id}`,
          carVin: repair.carVin,
          carModel: repair.carModel,
          partNumber: `PART-${repair.id}`,
          partName: 'Repair Parts',
          quantity: 1,
          unitCost: partsCost,
          totalCost: partsCost,
          supplier: 'Local Supplier',
          dateUsed: repair.repairDate,
          mechanicName: repair.mechanic,
          workOrderId: workOrderId,
          notes: repair.solution
        };

        // Create tools cost record
        const toolsCostRecord: ToolsCost = {
          id: `tools-${repair.id}`,
          carVin: repair.carVin,
          carModel: repair.carModel,
          toolName: 'Diagnostic Tools',
          toolType: 'equipment_usage',
          cost: toolsCost,
          quantity: 1,
          usageHours: laborHours,
          dateUsed: repair.repairDate,
          mechanicName: repair.mechanic,
          workOrderId: workOrderId,
          notes: 'Equipment usage for repair'
        };

        // Create other costs record
        const otherCostsRecord: OtherCosts = {
          id: `other-${repair.id}`,
          carVin: repair.carVin,
          carModel: repair.carModel,
          costCategory: 'Operations',
          description: 'Operational costs',
          cost: otherCosts,
          dateIncurred: repair.repairDate,
          recordedBy: repair.mechanic,
          workOrderId: workOrderId
        };

        // Save all records
        this.saveLaborCost(laborCostRecord);
        this.savePartsCost(partsCostRecord);
        this.saveToolsCost(toolsCostRecord);
        this.saveOtherCost(otherCostsRecord);
      });

      console.log('Successfully loaded repair history into garage cost tracking');
    } catch (error) {
      console.error('Error loading from repair history:', error);
    }
  }
} 