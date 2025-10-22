interface InventoryItem {
  id: string;
  partNumber: string;
  partName: string;
  quantity: number;
  category?: string;
  location?: string;
  lastUpdated?: string;
}

interface PartUsageRecord {
  id: string;
  partNumber: string;
  partName: string;
  quantity: number;
  carVIN: string;
  employee: string;
  timestamp: string;
  type: 'scan' | 'ai_recommendation' | 'manual_add' | 'return';
  context?: string; // 'repair', 'maintenance', etc.
}

class InventoryService {
  private readonly INVENTORY_KEY = 'inventory';
  private readonly INVENTORY_HISTORY_KEY = 'inventoryHistory';

  // Get all inventory items
  getInventory(): InventoryItem[] {
    try {
      const savedInventory = localStorage.getItem(this.INVENTORY_KEY);
      return savedInventory ? JSON.parse(savedInventory) : [];
    } catch (error) {
      console.error('Error loading inventory:', error);
      return [];
    }
  }

  // Save inventory to localStorage
  saveInventory(inventory: InventoryItem[]): void {
    try {
      localStorage.setItem(this.INVENTORY_KEY, JSON.stringify(inventory));
    } catch (error) {
      console.error('Error saving inventory:', error);
    }
  }

  // Find part by part number or ID
  findPart(partId: string): InventoryItem | null {
    const inventory = this.getInventory();
    return inventory.find(item => 
      item.partNumber === partId || item.id === partId
    ) || null;
  }

  // Decrease inventory when part is used
  usePart(partId: string, quantity: number = 1, context: {
    carVIN: string;
    employee: string;
    type: 'scan' | 'ai_recommendation' | 'manual_add';
    context?: string;
  }): boolean {
    try {
      const inventory = this.getInventory();
      const part = this.findPart(partId);
      
      if (!part) {
        console.error(`Part not found: ${partId}`);
        return false;
      }

      if (part.quantity < quantity) {
        console.error(`Insufficient quantity for ${part.partName}. Available: ${part.quantity}, Requested: ${quantity}`);
        return false;
      }

      // Update inventory
      const updatedInventory = inventory.map(item => {
        if (item.id === part.id) {
          return {
            ...item,
            quantity: item.quantity - quantity,
            lastUpdated: new Date().toISOString()
          };
        }
        return item;
      });

      this.saveInventory(updatedInventory);

      // Record usage
      this.recordPartUsage({
        partNumber: part.partNumber,
        partName: part.partName,
        quantity: quantity,
        carVIN: context.carVIN,
        employee: context.employee,
        timestamp: new Date().toISOString(),
        type: context.type,
        context: context.context
      });

      console.log(`Part used: ${part.partName} (${part.partNumber}) - Quantity: ${quantity}, Remaining: ${part.quantity - quantity}`);
      return true;
    } catch (error) {
      console.error('Error using part:', error);
      return false;
    }
  }

  // Refund part to inventory when deleted
  returnPart(partId: string, quantity: number = 1, context: {
    carVIN: string;
    employee: string;
    context?: string;
  }): boolean {
    try {
      const inventory = this.getInventory();
      const part = this.findPart(partId);
      
      if (!part) {
        console.error(`Part not found: ${partId}`);
        return false;
      }

      // Update inventory
      const updatedInventory = inventory.map(item => {
        if (item.id === part.id) {
          return {
            ...item,
            quantity: item.quantity + quantity,
            lastUpdated: new Date().toISOString()
          };
        }
        return item;
      });

      this.saveInventory(updatedInventory);

      // Record refund
      this.recordPartUsage({
        partNumber: part.partNumber,
        partName: part.partName,
        quantity: quantity,
        carVIN: context.carVIN,
        employee: context.employee,
        timestamp: new Date().toISOString(),
        type: 'return',
        context: context.context
      });

      console.log(`Part refunded: ${part.partName} (${part.partNumber}) - Quantity: ${quantity}, New Total: ${part.quantity + quantity}`);
      return true;
    } catch (error) {
      console.error('Error returning part:', error);
      return false;
    }
  }

  // Record part usage/return in history
  private recordPartUsage(usage: PartUsageRecord): void {
    try {
      const savedHistory = localStorage.getItem(this.INVENTORY_HISTORY_KEY);
      const history = savedHistory ? JSON.parse(savedHistory) : [];
      history.push({
        id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9),
        ...usage
      });
      localStorage.setItem(this.INVENTORY_HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Error recording part usage:', error);
    }
  }

  // Get usage history
  getUsageHistory(): PartUsageRecord[] {
    try {
      const savedHistory = localStorage.getItem(this.INVENTORY_HISTORY_KEY);
      return savedHistory ? JSON.parse(savedHistory) : [];
    } catch (error) {
      console.error('Error loading usage history:', error);
      return [];
    }
  }

  // Get inventory statistics
  getInventoryStats() {
    const inventory = this.getInventory();
    const totalItems = inventory.length;
    const totalQuantity = inventory.reduce((sum, item) => sum + item.quantity, 0);
    const lowStockItems = inventory.filter(item => item.quantity <= 5).length;
    const outOfStockItems = inventory.filter(item => item.quantity === 0).length;

    return {
      totalItems,
      totalQuantity,
      lowStockItems,
      outOfStockItems
    };
  }

  // Initialize sample inventory if empty
  initializeSampleInventory(): void {
    const inventory = this.getInventory();
    if (inventory.length === 0) {
      const sampleInventory: InventoryItem[] = [
        {
          id: '1',
          partNumber: 'BAT-001',
          partName: 'Battery',
          quantity: 10,
          category: 'Electrical',
          location: 'Warehouse A',
          lastUpdated: new Date().toISOString()
        },
        {
          id: '2',
          partNumber: 'ALT-001',
          partName: 'Alternator',
          quantity: 5,
          category: 'Electrical',
          location: 'Warehouse A',
          lastUpdated: new Date().toISOString()
        },
        {
          id: '3',
          partNumber: 'BRAKE-001',
          partName: 'Brake Pads',
          quantity: 20,
          category: 'Brakes',
          location: 'Warehouse B',
          lastUpdated: new Date().toISOString()
        },
        {
          id: '4',
          partNumber: 'OIL-001',
          partName: 'Oil Filter',
          quantity: 15,
          category: 'Engine',
          location: 'Warehouse B',
          lastUpdated: new Date().toISOString()
        },
        {
          id: '5',
          partNumber: 'SPARK-001',
          partName: 'Spark Plugs',
          quantity: 30,
          category: 'Engine',
          location: 'Warehouse C',
          lastUpdated: new Date().toISOString()
        }
      ];

      this.saveInventory(sampleInventory);
      console.log('Sample inventory initialized');
    }
  }
}

// Export singleton instance
export const inventoryService = new InventoryService();

// Initialize sample inventory on import
inventoryService.initializeSampleInventory(); 