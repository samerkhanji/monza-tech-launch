interface PartInventoryItem {
  id: string;
  partNumber: string;
  partName: string;
  description: string;
  category: 'electrical' | 'mechanical' | 'body' | 'engine' | 'interior' | 'exterior';
  supplier: string;
  cost: number;
  sellingPrice: number;
  stockQuantity: number;
  minimumStock: number;
  location: string;
  lastUpdated: string;
  reorderLevel: number;
  leadTime: number; // days
  compatibleModels: string[];
  images?: string[];
}

interface PartUsageRecord {
  id: string;
  partNumber: string;
  partName: string;
  quantityUsed: number;
  carVin: string;
  carModel: string;
  workOrderId: string;
  mechanicName: string;
  usageDate: string;
  cost: number;
  reason: string;
  repairCategory: string;
}

export class PartsInventoryService {
  private static readonly PARTS_INVENTORY_KEY = 'partsInventory';
  private static readonly PARTS_USAGE_KEY = 'partsUsageHistory';

  // Get all parts inventory
  static getPartsInventory(): PartInventoryItem[] {
    try {
      const stored = localStorage.getItem(this.PARTS_INVENTORY_KEY);
      return stored ? JSON.parse(stored) : this.getDefaultPartsInventory();
    } catch (error) {
      console.error('Error loading parts inventory:', error);
      return this.getDefaultPartsInventory();
    }
  }

  // Find part by part number
  static findPartByNumber(partNumber: string): PartInventoryItem | null {
    const inventory = this.getPartsInventory();
    const cleanPartNumber = partNumber.trim().toUpperCase();
    
    return inventory.find(part => 
      part.partNumber.toUpperCase() === cleanPartNumber ||
      part.partNumber.replace(/[-\s]/g, '').toUpperCase() === cleanPartNumber.replace(/[-\s]/g, '')
    ) || null;
  }

  // Use part (decrement inventory)
  static usePart(
    partNumber: string, 
    quantity: number, 
    carVin: string, 
    carModel: string, 
    mechanicName: string, 
    workOrderId: string,
    reason: string,
    repairCategory: string
  ): { success: boolean; message: string; updatedPart?: PartInventoryItem } {
    const inventory = this.getPartsInventory();
    const partIndex = inventory.findIndex(part => 
      part.partNumber.toUpperCase() === partNumber.toUpperCase()
    );

    if (partIndex === -1) {
      return { success: false, message: `Part ${partNumber} not found in inventory` };
    }

    const part = inventory[partIndex];
    
    if (part.stockQuantity < quantity) {
      return { 
        success: false, 
        message: `Insufficient stock. Available: ${part.stockQuantity}, Requested: ${quantity}` 
      };
    }

    // Update inventory
    part.stockQuantity -= quantity;
    part.lastUpdated = new Date().toISOString();
    inventory[partIndex] = part;
    
    // Save updated inventory
    localStorage.setItem(this.PARTS_INVENTORY_KEY, JSON.stringify(inventory));

    // Record usage
    const usageRecord: PartUsageRecord = {
      id: `usage-${Date.now()}`,
      partNumber: part.partNumber,
      partName: part.partName,
      quantityUsed: quantity,
      carVin,
      carModel,
      workOrderId,
      mechanicName,
      usageDate: new Date().toISOString(),
      cost: part.cost * quantity,
      reason,
      repairCategory
    };

    this.recordPartUsage(usageRecord);

    return { 
      success: true, 
      message: `${quantity}x ${part.partName} used successfully`, 
      updatedPart: part 
    };
  }

  // Record part usage history
  private static recordPartUsage(usage: PartUsageRecord): void {
    try {
      const existingUsage = JSON.parse(localStorage.getItem(this.PARTS_USAGE_KEY) || '[]');
      existingUsage.push(usage);
      localStorage.setItem(this.PARTS_USAGE_KEY, JSON.stringify(existingUsage));
    } catch (error) {
      console.error('Error recording part usage:', error);
    }
  }

  // Get parts usage history
  static getPartsUsageHistory(): PartUsageRecord[] {
    try {
      return JSON.parse(localStorage.getItem(this.PARTS_USAGE_KEY) || '[]');
    } catch (error) {
      console.error('Error loading parts usage history:', error);
      return [];
    }
  }

  // Get low stock parts
  static getLowStockParts(): PartInventoryItem[] {
    const inventory = this.getPartsInventory();
    return inventory.filter(part => part.stockQuantity <= part.minimumStock);
  }

  // Check if part needs reorder
  static needsReorder(partNumber: string): boolean {
    const part = this.findPartByNumber(partNumber);
    return part ? part.stockQuantity <= part.reorderLevel : false;
  }

  // Update part stock (for receiving new parts)
  static updatePartStock(partNumber: string, quantity: number, operation: 'add' | 'set'): boolean {
    const inventory = this.getPartsInventory();
    const partIndex = inventory.findIndex(part => 
      part.partNumber.toUpperCase() === partNumber.toUpperCase()
    );

    if (partIndex === -1) return false;

    if (operation === 'add') {
      inventory[partIndex].stockQuantity += quantity;
    } else {
      inventory[partIndex].stockQuantity = quantity;
    }

    inventory[partIndex].lastUpdated = new Date().toISOString();
    localStorage.setItem(this.PARTS_INVENTORY_KEY, JSON.stringify(inventory));
    return true;
  }

  // Get default parts inventory
  private static getDefaultPartsInventory(): PartInventoryItem[] {
    return [
      {
        id: 'part-1',
        partNumber: 'VP-12345-BRK',
        partName: 'Front Brake Pads Set',
        description: 'High-performance ceramic brake pads for Voyah Free/Dreamer',
        category: 'mechanical',
        supplier: 'Voyah Parts Center',
        cost: 150.00,
        sellingPrice: 225.00,
        stockQuantity: 12,
        minimumStock: 3,
        location: 'Shelf A-12',
        lastUpdated: new Date().toISOString(),
        reorderLevel: 5,
        leadTime: 7,
        compatibleModels: ['Voyah Free', 'Voyah Dreamer']
      },
      {
        id: 'part-2',
        partNumber: 'BAT-45678-HV',
        partName: 'High Voltage Battery Module',
        description: 'Replacement battery module for electric powertrain',
        category: 'electrical',
        supplier: 'Voyah Parts Center',
        cost: 2500.00,
        sellingPrice: 3750.00,
        stockQuantity: 3,
        minimumStock: 1,
        location: 'Secure Storage B-01',
        lastUpdated: new Date().toISOString(),
        reorderLevel: 2,
        leadTime: 14,
        compatibleModels: ['Voyah Free', 'Voyah Dreamer']
      },
      {
        id: 'part-3',
        partNumber: 'MOT-78901-FR',
        partName: 'Front Electric Motor',
        description: 'Front axle electric motor assembly',
        category: 'electrical',
        supplier: 'Voyah Parts Center',
        cost: 1800.00,
        sellingPrice: 2700.00,
        stockQuantity: 2,
        minimumStock: 1,
        location: 'Heavy Parts C-05',
        lastUpdated: new Date().toISOString(),
        reorderLevel: 1,
        leadTime: 21,
        compatibleModels: ['Voyah Free', 'Voyah Dreamer']
      },
      {
        id: 'part-4',
        partNumber: 'ECU-23456-PWR',
        partName: 'Power Control Unit',
        description: 'Main power management ECU',
        category: 'electrical',
        supplier: 'Voyah Parts Center',
        cost: 800.00,
        sellingPrice: 1200.00,
        stockQuantity: 5,
        minimumStock: 2,
        location: 'Electronics D-08',
        lastUpdated: new Date().toISOString(),
        reorderLevel: 3,
        leadTime: 10,
        compatibleModels: ['Voyah Free', 'Voyah Dreamer']
      },
      {
        id: 'part-5',
        partNumber: 'FILT-67890-AIR',
        partName: 'Cabin Air Filter',
        description: 'HEPA cabin air filtration system',
        category: 'interior',
        supplier: 'Local Parts Supplier',
        cost: 45.00,
        sellingPrice: 75.00,
        stockQuantity: 20,
        minimumStock: 5,
        location: 'Filters E-03',
        lastUpdated: new Date().toISOString(),
        reorderLevel: 8,
        leadTime: 3,
        compatibleModels: ['Voyah Free', 'Voyah Dreamer']
      },
      {
        id: 'part-6',
        partNumber: 'SUSP-34567-RR',
        partName: 'Rear Suspension Strut',
        description: 'Adaptive rear suspension strut assembly',
        category: 'mechanical',
        supplier: 'Voyah Parts Center',
        cost: 450.00,
        sellingPrice: 675.00,
        stockQuantity: 8,
        minimumStock: 2,
        location: 'Suspension F-11',
        lastUpdated: new Date().toISOString(),
        reorderLevel: 4,
        leadTime: 12,
        compatibleModels: ['Voyah Free', 'Voyah Dreamer']
      }
    ];
  }

  // Search parts by category or model compatibility
  static searchParts(query: string, category?: string): PartInventoryItem[] {
    const inventory = this.getPartsInventory();
    const searchTerm = query.toLowerCase();

    return inventory.filter(part => {
      const matchesQuery = 
        part.partNumber.toLowerCase().includes(searchTerm) ||
        part.partName.toLowerCase().includes(searchTerm) ||
        part.description.toLowerCase().includes(searchTerm);
      
      const matchesCategory = !category || part.category === category;
      
      return matchesQuery && matchesCategory;
    });
  }

  // Get parts by category
  static getPartsByCategory(category: string): PartInventoryItem[] {
    const inventory = this.getPartsInventory();
    return inventory.filter(part => part.category === category);
  }

  // Add new part to inventory
  static addPart(part: Omit<PartInventoryItem, 'id' | 'lastUpdated'>): string {
    const inventory = this.getPartsInventory();
    const newPart: PartInventoryItem = {
      ...part,
      id: `part-${Date.now()}`,
      lastUpdated: new Date().toISOString()
    };
    
    inventory.push(newPart);
    localStorage.setItem(this.PARTS_INVENTORY_KEY, JSON.stringify(inventory));
    return newPart.id;
  }
} 