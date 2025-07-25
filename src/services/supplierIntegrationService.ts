import { supabase } from '@/integrations/supabase/client';

interface SupplierConfig {
  id: string;
  name: string;
  apiEndpoint: string;
  apiKey: string;
  authType: 'bearer' | 'api_key' | 'basic';
  isActive: boolean;
  supportedOperations: string[];
}

interface PartQuote {
  partNumber: string;
  partName: string;
  supplier: string;
  price: number;
  currency: string;
  availability: 'in_stock' | 'on_order' | 'discontinued';
  leadTime: number; // days
  minimumQuantity: number;
  quotedAt: string;
  validUntil: string;
}

interface PurchaseOrder {
  id: string;
  supplierId: string;
  orderNumber: string;
  items: Array<{
    partNumber: string;
    partName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  totalAmount: number;
  currency: string;
  status: 'draft' | 'sent' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  orderDate: string;
  expectedDelivery?: string;
  trackingNumber?: string;
}

interface InventoryUpdate {
  partNumber: string;
  supplier: string;
  availableQuantity: number;
  price: number;
  lastUpdated: string;
}

class SupplierIntegrationService {
  private static instance: SupplierIntegrationService;
  private suppliers: Map<string, SupplierConfig> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.loadSupplierConfigs();
  }

  static getInstance(): SupplierIntegrationService {
    if (!this.instance) {
      this.instance = new SupplierIntegrationService();
    }
    return this.instance;
  }

  // Load supplier configurations from database
  private async loadSupplierConfigs(): Promise<void> {
    try {
      const { data: suppliers, error } = await supabase
        .from('supplier_configs')
        .select('*')
        .eq('is_active', true);

      if (error) {
        console.error('Failed to load supplier configs:', error);
        return;
      }

      suppliers?.forEach(supplier => {
        this.suppliers.set(supplier.id, {
          id: supplier.id,
          name: supplier.name,
          apiEndpoint: supplier.api_endpoint,
          apiKey: supplier.api_key,
          authType: supplier.auth_type,
          isActive: supplier.is_active,
          supportedOperations: supplier.supported_operations || [],
        });
      });

      console.log(`Loaded ${this.suppliers.size} supplier configurations`);
    } catch (error) {
      console.error('Error loading supplier configs:', error);
    }
  }

  // Initialize automatic inventory updates
  async startInventorySync(intervalMinutes: number = 60): Promise<void> {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.updateInterval = setInterval(async () => {
      await this.syncInventoryFromAllSuppliers();
    }, intervalMinutes * 60 * 1000);

    // Initial sync
    await this.syncInventoryFromAllSuppliers();
  }

  // Stop automatic inventory updates
  stopInventorySync(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  // Get quotes for a part from all suppliers
  async getPartQuotes(partNumber: string): Promise<PartQuote[]> {
    const quotes: PartQuote[] = [];
    
    for (const [supplierId, supplier] of this.suppliers) {
      if (!supplier.supportedOperations.includes('quote')) {
        continue;
      }

      try {
        const quote = await this.getQuoteFromSupplier(supplier, partNumber);
        if (quote) {
          quotes.push(quote);
        }
      } catch (error) {
        console.error(`Failed to get quote from ${supplier.name}:`, error);
      }
    }

    // Sort by price
    quotes.sort((a, b) => a.price - b.price);

    // Store quotes in database
    await this.storeQuotes(partNumber, quotes);

    return quotes;
  }

  // Get quote from specific supplier
  private async getQuoteFromSupplier(supplier: SupplierConfig, partNumber: string): Promise<PartQuote | null> {
    try {
      const response = await fetch(`${supplier.apiEndpoint}/api/v1/quote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(supplier),
        },
        body: JSON.stringify({
          partNumber,
          quantity: 1,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        partNumber: data.partNumber || partNumber,
        partName: data.partName || '',
        supplier: supplier.name,
        price: data.price || 0,
        currency: data.currency || 'USD',
        availability: data.availability || 'on_order',
        leadTime: data.leadTime || 7,
        minimumQuantity: data.minimumQuantity || 1,
        quotedAt: new Date().toISOString(),
        validUntil: data.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };
    } catch (error) {
      console.error(`Error getting quote from ${supplier.name}:`, error);
      return null;
    }
  }

  // Create purchase order
  async createPurchaseOrder(
    supplierId: string,
    items: Array<{ partNumber: string; partName: string; quantity: number; unitPrice: number }>
  ): Promise<PurchaseOrder | null> {
    const supplier = this.suppliers.get(supplierId);
    if (!supplier || !supplier.supportedOperations.includes('purchase')) {
      throw new Error('Supplier does not support purchase orders');
    }

    try {
      const orderData = {
        items,
        orderDate: new Date().toISOString(),
        totalAmount: items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0),
        currency: 'USD',
        customerInfo: await this.getCustomerInfo(),
      };

      const response = await fetch(`${supplier.apiEndpoint}/api/v1/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(supplier),
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error(`Failed to create purchase order: ${response.statusText}`);
      }

      const data = await response.json();

      const purchaseOrder: PurchaseOrder = {
        id: data.orderId,
        supplierId,
        orderNumber: data.orderNumber,
        items,
        totalAmount: orderData.totalAmount,
        currency: orderData.currency,
        status: 'sent',
        orderDate: orderData.orderDate,
        expectedDelivery: data.expectedDelivery,
      };

      // Store in database
      await this.storePurchaseOrder(purchaseOrder);

      return purchaseOrder;
    } catch (error) {
      console.error('Failed to create purchase order:', error);
      return null;
    }
  }

  // Track order status
  async trackOrder(orderId: string): Promise<Partial<PurchaseOrder> | null> {
    try {
      const { data: order } = await supabase
        .from('purchase_orders')
        .select('*, supplier_id')
        .eq('id', orderId)
        .single();

      if (!order) {
        throw new Error('Order not found');
      }

      const supplier = this.suppliers.get(order.supplier_id);
      if (!supplier || !supplier.supportedOperations.includes('tracking')) {
        return null;
      }

      const response = await fetch(`${supplier.apiEndpoint}/api/v1/orders/${order.order_number}/status`, {
        headers: this.getAuthHeaders(supplier),
      });

      if (!response.ok) {
        throw new Error(`Failed to track order: ${response.statusText}`);
      }

      const data = await response.json();

      const updates = {
        status: data.status,
        trackingNumber: data.trackingNumber,
        expectedDelivery: data.expectedDelivery,
      };

      // Update database
      await supabase
        .from('purchase_orders')
        .update(updates)
        .eq('id', orderId);

      return updates;
    } catch (error) {
      console.error('Failed to track order:', error);
      return null;
    }
  }

  // Sync inventory from all suppliers
  private async syncInventoryFromAllSuppliers(): Promise<void> {
    console.log('Starting inventory sync from all suppliers...');

    for (const [supplierId, supplier] of this.suppliers) {
      if (!supplier.supportedOperations.includes('inventory')) {
        continue;
      }

      try {
        await this.syncInventoryFromSupplier(supplier);
      } catch (error) {
        console.error(`Failed to sync inventory from ${supplier.name}:`, error);
      }
    }

    console.log('Inventory sync completed');
  }

  // Sync inventory from specific supplier
  private async syncInventoryFromSupplier(supplier: SupplierConfig): Promise<void> {
    try {
      const response = await fetch(`${supplier.apiEndpoint}/api/v1/inventory`, {
        headers: this.getAuthHeaders(supplier),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const updates: InventoryUpdate[] = data.items || [];

      // Process updates in batches
      const batchSize = 100;
      for (let i = 0; i < updates.length; i += batchSize) {
        const batch = updates.slice(i, i + batchSize);
        await this.processBatchInventoryUpdates(batch);
      }

      console.log(`Synced ${updates.length} items from ${supplier.name}`);
    } catch (error) {
      console.error(`Error syncing inventory from ${supplier.name}:`, error);
    }
  }

  // Process batch inventory updates
  private async processBatchInventoryUpdates(updates: InventoryUpdate[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('supplier_inventory')
        .upsert(
          updates.map(update => ({
            part_number: update.partNumber,
            supplier: update.supplier,
            available_quantity: update.availableQuantity,
            price: update.price,
            last_updated: update.lastUpdated,
            updated_at: new Date().toISOString(),
          })),
          { onConflict: 'part_number,supplier' }
        );

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Failed to process inventory updates:', error);
    }
  }

  // Get authentication headers for supplier
  private getAuthHeaders(supplier: SupplierConfig): Record<string, string> {
    switch (supplier.authType) {
      case 'bearer':
        return { Authorization: `Bearer ${supplier.apiKey}` };
      case 'api_key':
        return { 'X-API-Key': supplier.apiKey };
      case 'basic':
        return { Authorization: `Basic ${btoa(supplier.apiKey)}` };
      default:
        return {};
    }
  }

  // Store quotes in database
  private async storeQuotes(partNumber: string, quotes: PartQuote[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('part_quotes')
        .upsert(
          quotes.map(quote => ({
            part_number: quote.partNumber,
            part_name: quote.partName,
            supplier: quote.supplier,
            price: quote.price,
            currency: quote.currency,
            availability: quote.availability,
            lead_time: quote.leadTime,
            minimum_quantity: quote.minimumQuantity,
            quoted_at: quote.quotedAt,
            valid_until: quote.validUntil,
          })),
          { onConflict: 'part_number,supplier' }
        );

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Failed to store quotes:', error);
    }
  }

  // Store purchase order in database
  private async storePurchaseOrder(order: PurchaseOrder): Promise<void> {
    try {
      const { error } = await supabase
        .from('purchase_orders')
        .insert({
          id: order.id,
          supplier_id: order.supplierId,
          order_number: order.orderNumber,
          items: order.items,
          total_amount: order.totalAmount,
          currency: order.currency,
          status: order.status,
          order_date: order.orderDate,
          expected_delivery: order.expectedDelivery,
          tracking_number: order.trackingNumber,
        });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Failed to store purchase order:', error);
    }
  }

  // Get customer information for orders
  private async getCustomerInfo() {
    return {
      name: 'Monza S.A.L.',
      address: '123 Auto Plaza, Beirut, Lebanon',
      phone: '+961-1-234567',
      email: 'orders@monzasal.com',
      taxId: 'LB123456789',
    };
  }

  // Add new supplier configuration
  async addSupplier(config: Omit<SupplierConfig, 'id'>): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('supplier_configs')
        .insert({
          name: config.name,
          api_endpoint: config.apiEndpoint,
          api_key: config.apiKey,
          auth_type: config.authType,
          is_active: config.isActive,
          supported_operations: config.supportedOperations,
        })
        .select('id')
        .single();

      if (error) {
        throw error;
      }

      const supplierId = data.id;
      this.suppliers.set(supplierId, { ...config, id: supplierId });

      return supplierId;
    } catch (error) {
      console.error('Failed to add supplier:', error);
      throw error;
    }
  }

  // Get all configured suppliers
  getSuppliers(): SupplierConfig[] {
    return Array.from(this.suppliers.values());
  }

  // Test supplier connection
  async testSupplierConnection(supplierId: string): Promise<boolean> {
    const supplier = this.suppliers.get(supplierId);
    if (!supplier) {
      return false;
    }

    try {
      const response = await fetch(`${supplier.apiEndpoint}/api/v1/health`, {
        headers: this.getAuthHeaders(supplier),
        timeout: 10000,
      });

      return response.ok;
    } catch (error) {
      console.error(`Connection test failed for ${supplier.name}:`, error);
      return false;
    }
  }

  // Cleanup
  cleanup(): void {
    this.stopInventorySync();
  }
}

export default SupplierIntegrationService; 