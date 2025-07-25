export interface Tool {
  id: string;
  name: string;
  type: 'tool' | 'equipment';
  category: string;
  purchasePrice: number;
  currentValue: number;
  purchaseDate: string;
  supplier: string;
  location: 'garage' | 'showroom' | 'events' | 'office' | 'storage';
  description: string;
  usageHours: number;
  lastUsed: string | null;
  depreciationRate: number; // annual depreciation rate as percentage
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'needs_repair';
  assignedTo: string | null; // employee name
  maintenanceHistory: MaintenanceRecord[];
  purchasedBy: string; // employee who purchased it
  notes: string;
  serialNumber?: string;
  warrantyExpiry?: string;
  images?: string[];
  isActive: boolean;
  saleInfo?: {
    salePrice: number;
    saleDate: string;
    soldTo: string;
    soldBy: string;
    saleReason: string;
    saleNotes?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceRecord {
  id: string;
  date: string;
  type: 'repair' | 'maintenance' | 'inspection';
  description: string;
  cost: number;
  performedBy: string;
  notes: string;
}

export interface DepreciationCalculation {
  originalValue: number;
  currentValue: number;
  depreciatedAmount: number;
  yearsOwned: number;
  annualDepreciation: number;
  depreciationRate: number;
}

export interface UsageSession {
  id: string;
  toolId: string;
  startTime: string;
  endTime: string | null;
  usedBy: string;
  project: string;
  notes: string;
  hours: number;
}

class ToolsEquipmentService {
  private tools: Tool[] = [];
  private usageSessions: UsageSession[] = [];

  constructor() {
    this.loadData();
    this.initializeSampleData();
  }

  // Load data from localStorage
  private loadData(): void {
    try {
      const toolsData = localStorage.getItem('toolsEquipment');
      const usageData = localStorage.getItem('toolsUsageSessions');
      
      if (toolsData) {
        this.tools = JSON.parse(toolsData);
      }
      if (usageData) {
        this.usageSessions = JSON.parse(usageData);
      }
    } catch (error) {
      console.error('Error loading tools data:', error);
    }
  }

  // Save data to localStorage
  private saveData(): void {
    try {
      localStorage.setItem('toolsEquipment', JSON.stringify(this.tools));
      localStorage.setItem('toolsUsageSessions', JSON.stringify(this.usageSessions));
    } catch (error) {
      console.error('Error saving tools data:', error);
    }
  }

  // Initialize with sample data if none exists
  private initializeSampleData(): void {
    if (this.tools.length === 0) {
      const sampleTools: Tool[] = [
        {
          id: 'tool-001',
          name: 'Professional Diagnostic Scanner',
          type: 'equipment',
          category: 'Diagnostic Equipment',
          purchasePrice: 3500,
          currentValue: 2800,
          purchaseDate: '2023-01-15',
          supplier: 'Auto Diagnostic Pro',
          location: 'garage',
          description: 'Advanced OBD-II scanner for all car models',
          usageHours: 245,
          lastUsed: '2025-01-10',
          depreciationRate: 20,
          condition: 'excellent',
          assignedTo: 'Ahmed Hassan',
          maintenanceHistory: [],
          purchasedBy: 'Manager',
          notes: 'Essential for garage operations',
          serialNumber: 'ADP-2023-001',
          warrantyExpiry: '2026-01-15',
          isActive: true,
          createdAt: '2023-01-15T10:00:00Z',
          updatedAt: '2025-01-10T14:30:00Z'
        },
        {
          id: 'tool-002',
          name: 'Hydraulic Car Lift',
          type: 'equipment',
          category: 'Lifting Equipment',
          purchasePrice: 8500,
          currentValue: 6800,
          purchaseDate: '2022-08-20',
          supplier: 'Garage Equipment Ltd',
          location: 'garage',
          description: 'Two-post hydraulic lift, 4000kg capacity',
          usageHours: 1200,
          lastUsed: '2025-01-09',
          depreciationRate: 10,
          condition: 'good',
          assignedTo: null,
          maintenanceHistory: [
            {
              id: 'maint-001',
              date: '2024-12-01',
              type: 'maintenance',
              description: 'Regular hydraulic oil change',
              cost: 150,
              performedBy: 'Service Technician',
              notes: 'All systems operating normally'
            }
          ],
          purchasedBy: 'Owner',
          notes: 'Main lift for heavy repairs',
          serialNumber: 'GEL-2022-HL4000',
          warrantyExpiry: '2027-08-20',
          isActive: true,
          createdAt: '2022-08-20T09:00:00Z',
          updatedAt: '2024-12-01T16:00:00Z'
        },
        {
          id: 'tool-003',
          name: 'Customer Display Screen',
          type: 'equipment',
          category: 'Customer Experience',
          purchasePrice: 1200,
          currentValue: 840,
          purchaseDate: '2023-11-01',
          supplier: 'Digital Display Solutions',
          location: 'showroom',
          description: '55" 4K display for customer presentations',
          usageHours: 2800,
          lastUsed: '2025-01-10',
          depreciationRate: 25,
          condition: 'good',
          assignedTo: 'Sales Team',
          maintenanceHistory: [],
          purchasedBy: 'Sales Manager',
          notes: 'Used for car feature presentations',
          serialNumber: 'DDS-55-4K-2023',
          warrantyExpiry: '2026-11-01',
          isActive: true,
          createdAt: '2023-11-01T14:00:00Z',
          updatedAt: '2025-01-10T17:00:00Z'
        }
      ];

      this.tools = sampleTools;
      this.saveData();
    }
  }

  // Calculate depreciation for a tool
  calculateDepreciation(tool: Tool): DepreciationCalculation {
    const purchaseDate = new Date(tool.purchaseDate);
    const currentDate = new Date();
    const yearsOwned = (currentDate.getTime() - purchaseDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    
    const annualDepreciation = tool.purchasePrice * (tool.depreciationRate / 100);
    const totalDepreciation = annualDepreciation * yearsOwned;
    const currentValue = Math.max(tool.purchasePrice - totalDepreciation, tool.purchasePrice * 0.1); // Min 10% of original value

    return {
      originalValue: tool.purchasePrice,
      currentValue: Math.round(currentValue * 100) / 100,
      depreciatedAmount: Math.round((tool.purchasePrice - currentValue) * 100) / 100,
      yearsOwned: Math.round(yearsOwned * 10) / 10,
      annualDepreciation: Math.round(annualDepreciation * 100) / 100,
      depreciationRate: tool.depreciationRate
    };
  }

  // Update current values for all tools based on depreciation
  updateAllDepreciationValues(): void {
    this.tools = this.tools.map(tool => {
      const depreciation = this.calculateDepreciation(tool);
      return {
        ...tool,
        currentValue: depreciation.currentValue,
        updatedAt: new Date().toISOString()
      };
    });
    this.saveData();
  }

  // Add new tool
  addTool(toolData: Omit<Tool, 'id' | 'createdAt' | 'updatedAt' | 'currentValue'>): Tool {
    const newTool: Tool = {
      ...toolData,
      id: `tool-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      currentValue: toolData.purchasePrice,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.tools.push(newTool);
    this.saveData();
    return newTool;
  }

  // Update tool
  updateTool(id: string, updates: Partial<Tool>): Tool | null {
    const index = this.tools.findIndex(tool => tool.id === id);
    if (index === -1) return null;

    this.tools[index] = {
      ...this.tools[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.saveData();
    return this.tools[index];
  }

  // Delete tool
  deleteTool(id: string): boolean {
    const index = this.tools.findIndex(tool => tool.id === id);
    if (index === -1) return false;

    this.tools.splice(index, 1);
    this.saveData();
    return true;
  }

  // Sell tool - marks as sold instead of deleting
  sellTool(id: string, saleData: {
    salePrice: number;
    soldTo: string;
    soldBy: string;
    saleReason: string;
    saleNotes?: string;
  }): Tool | null {
    const index = this.tools.findIndex(tool => tool.id === id);
    if (index === -1) return null;

    this.tools[index] = {
      ...this.tools[index],
      isActive: false,
      saleInfo: {
        ...saleData,
        saleDate: new Date().toISOString()
      },
      updatedAt: new Date().toISOString()
    };

    this.saveData();
    return this.tools[index];
  }

  // Get all active tools (not sold)
  getActiveTools(): Tool[] {
    return this.tools.filter(tool => tool.isActive);
  }

  // Get all sold tools
  getSoldTools(): Tool[] {
    return this.tools.filter(tool => !tool.isActive && tool.saleInfo);
  }

  // Get all tools
  getAllTools(): Tool[] {
    return [...this.tools];
  }

  // Get tools by location
  getToolsByLocation(location: Tool['location']): Tool[] {
    return this.tools.filter(tool => tool.location === location);
  }

  // Get tools by type
  getToolsByType(type: Tool['type']): Tool[] {
    return this.tools.filter(tool => tool.type === type);
  }

  // Start usage session
  startUsageSession(toolId: string, usedBy: string, project: string, notes: string = ''): UsageSession {
    const session: UsageSession = {
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      toolId,
      startTime: new Date().toISOString(),
      endTime: null,
      usedBy,
      project,
      notes,
      hours: 0
    };

    this.usageSessions.push(session);
    this.saveData();
    return session;
  }

  // End usage session
  endUsageSession(sessionId: string): UsageSession | null {
    const session = this.usageSessions.find(s => s.id === sessionId);
    if (!session || session.endTime) return null;

    const endTime = new Date().toISOString();
    const hours = (new Date(endTime).getTime() - new Date(session.startTime).getTime()) / (1000 * 60 * 60);

    session.endTime = endTime;
    session.hours = Math.round(hours * 10) / 10;

    // Update tool usage hours
    const tool = this.tools.find(t => t.id === session.toolId);
    if (tool) {
      tool.usageHours += session.hours;
      tool.lastUsed = endTime;
      tool.updatedAt = endTime;
    }

    this.saveData();
    return session;
  }

  // Get usage sessions for a tool
  getToolUsageSessions(toolId: string): UsageSession[] {
    return this.usageSessions.filter(session => session.toolId === toolId);
  }

  // Add maintenance record
  addMaintenanceRecord(toolId: string, record: Omit<MaintenanceRecord, 'id'>): MaintenanceRecord | null {
    const tool = this.tools.find(t => t.id === toolId);
    if (!tool) return null;

    const maintenanceRecord: MaintenanceRecord = {
      ...record,
      id: `maint-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    tool.maintenanceHistory.push(maintenanceRecord);
    tool.updatedAt = new Date().toISOString();
    this.saveData();
    return maintenanceRecord;
  }

  // Get tools summary
  getToolsSummary(): {
    totalTools: number;
    totalValue: number;
    totalCurrentValue: number;
    totalDepreciation: number;
    byLocation: Record<string, number>;
    byType: Record<string, number>;
    byCondition: Record<string, number>;
    needingMaintenance: Tool[];
  } {
    this.updateAllDepreciationValues();

    // Only include active tools in summary
    const activeTools = this.tools.filter(tool => tool.isActive);
    
    const totalValue = activeTools.reduce((sum, tool) => sum + tool.purchasePrice, 0);
    const totalCurrentValue = activeTools.reduce((sum, tool) => sum + tool.currentValue, 0);

    const byLocation: Record<string, number> = {};
    const byType: Record<string, number> = {};
    const byCondition: Record<string, number> = {};

    activeTools.forEach(tool => {
      byLocation[tool.location] = (byLocation[tool.location] || 0) + 1;
      byType[tool.type] = (byType[tool.type] || 0) + 1;
      byCondition[tool.condition] = (byCondition[tool.condition] || 0) + 1;
    });

    // Tools needing maintenance (high usage hours or poor condition) - only active tools
    const needingMaintenance = activeTools.filter(tool => 
      tool.condition === 'poor' || 
      tool.condition === 'needs_repair' ||
      (tool.usageHours > 500 && tool.type === 'equipment') ||
      (tool.usageHours > 200 && tool.type === 'tool')
    );

    return {
      totalTools: activeTools.length,
      totalValue: Math.round(totalValue * 100) / 100,
      totalCurrentValue: Math.round(totalCurrentValue * 100) / 100,
      totalDepreciation: Math.round((totalValue - totalCurrentValue) * 100) / 100,
      byLocation,
      byType,
      byCondition,
      needingMaintenance
    };
  }

  // Export data
  exportData(): string {
    const data = {
      tools: this.tools,
      usageSessions: this.usageSessions,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    return JSON.stringify(data, null, 2);
  }

  // Import data
  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      if (data.tools && Array.isArray(data.tools)) {
        this.tools = data.tools;
      }
      if (data.usageSessions && Array.isArray(data.usageSessions)) {
        this.usageSessions = data.usageSessions;
      }
      this.saveData();
      return true;
    } catch (error) {
      console.error('Error importing tools data:', error);
      return false;
    }
  }

  // Search tools
  searchTools(query: string): Tool[] {
    const searchTerm = query.toLowerCase().trim();
    if (!searchTerm) return this.tools;

    return this.tools.filter(tool =>
      tool.name.toLowerCase().includes(searchTerm) ||
      tool.category.toLowerCase().includes(searchTerm) ||
      tool.description.toLowerCase().includes(searchTerm) ||
      tool.supplier.toLowerCase().includes(searchTerm) ||
      (tool.assignedTo && tool.assignedTo.toLowerCase().includes(searchTerm)) ||
      (tool.serialNumber && tool.serialNumber.toLowerCase().includes(searchTerm))
    );
  }
}

// Create and export singleton instance
export const toolsEquipmentService = new ToolsEquipmentService();
export default toolsEquipmentService; 