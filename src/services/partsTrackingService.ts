import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface PartInfo {
  id: string;
  part_number: string;
  part_name: string;
  quantity: number;
  supplier: string | null;
  location: string;
  car_model: string;
  shelf: string;
  row_position: string;
  column_position: string;
  room: string | null;
  floor: string | null;
  arrival_date: string | null;
  batch_number: string | null;
  expiry_date: string | null;
  last_updated: string | null;
  created_at: string | null;
}

export interface PartUsage {
  partId: string;
  partNumber: string;
  partName: string;
  quantity: number;
  usedBy: string;
  assignmentId: string;
  carVin: string;
  clientName: string;
}

export interface GarageAssignment {
  id: string;
  car_vin: string;
  car_model: string;
  client_name: string;
  assigned_technician: string;
  assignment_date: string;
  status: 'assigned' | 'in_progress' | 'waiting_parts' | 'completed' | 'on_hold';
  work_description: string | null;
  notes: string | null;
  created_at: string;
}

export interface StockAlert {
  id: string;
  part_name: string;
  part_number: string;
  current_stock: number;
  alert_level: 'critical' | 'low' | 'medium';
  estimated_days_remaining: number;
}

class PartsTrackingService {
  // Barcode scanning methods
  async scanBarcode(barcodeValue: string): Promise<PartInfo | null> {
    try {
      // Search for part by part number (using barcode as part number for now)
      const { data: partInfo, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('part_number', barcodeValue)
        .single();

      if (error) {
        console.error('Error finding part:', error);
        return null;
      }

      return partInfo;
    } catch (error) {
      console.error('Error scanning barcode:', error);
      return null;
    }
  }

  async searchPartsByText(searchTerm: string): Promise<PartInfo[]> {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .or(`part_name.ilike.%${searchTerm}%,part_number.ilike.%${searchTerm}%,car_model.ilike.%${searchTerm}%`)
        .order('part_name')
        .limit(20);

      if (error) {
        console.error('Error searching parts:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error searching parts:', error);
      return [];
    }
  }

  // Assignment management
  async createAssignment(assignmentData: Omit<GarageAssignment, 'id' | 'created_at'>): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('garage_assignments')
        .insert([assignmentData])
        .select('id')
        .single();

      if (error) {
        console.error('Error creating assignment:', error);
        toast({
          title: "Assignment Error",
          description: "Failed to create garage assignment.",
          variant: "destructive"
        });
        return null;
      }

      return data.id;
    } catch (error) {
      console.error('Error creating assignment:', error);
      return null;
    }
  }

  async getAssignment(assignmentId: string): Promise<GarageAssignment | null> {
    try {
      const { data, error } = await supabase
        .from('garage_assignments')
        .select('*')
        .eq('id', assignmentId)
        .single();

      if (error) {
        console.error('Error getting assignment:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error getting assignment:', error);
      return null;
    }
  }

  // Parts usage tracking using existing parts_usage_tracking table
  async recordPartUsage(usage: PartUsage): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('parts_usage_tracking')
        .insert([{
          part_number: usage.partNumber,
          part_name: usage.partName,
          quantity: usage.quantity,
          car_vin: usage.carVin,
          client_name: usage.clientName,
          technician: usage.usedBy,
          usage_date: new Date().toISOString(),
          repair_id: usage.assignmentId
        }])
        .select('id')
        .single();

      if (error) {
        console.error('Error recording part usage:', error);
        toast({
          title: "Usage Tracking Error",
          description: "Failed to record part usage.",
          variant: "destructive"
        });
        return false;
      }

      // Update inventory quantity
      await this.updateInventoryQuantityByPartNumber(usage.partNumber, usage.quantity);

      toast({
        title: "Part Usage Recorded",
        description: `${usage.quantity} ${usage.partName} used by ${usage.usedBy}`,
      });

      return true;
    } catch (error) {
      console.error('Error recording part usage:', error);
      return false;
    }
  }

  async getPartUsageForAssignment(assignmentId: string): Promise<PartUsage[]> {
    try {
      const { data, error } = await supabase
        .from('parts_usage_tracking')
        .select('*')
        .eq('repair_id', assignmentId)
        .order('usage_date', { ascending: false });

      if (error) {
        console.error('Error getting part usage:', error);
        return [];
      }

      return data.map(item => ({
        partId: item.id,
        partNumber: item.part_number,
        partName: item.part_name,
        quantity: item.quantity,
        usedBy: item.technician,
        assignmentId: item.repair_id || '',
        carVin: item.car_vin,
        clientName: item.client_name
      }));
    } catch (error) {
      console.error('Error getting part usage:', error);
      return [];
    }
  }

  async removePartUsage(usageId: string): Promise<boolean> {
    try {
      // Get the usage record first to restore inventory
      const { data: usageRecord, error: fetchError } = await supabase
        .from('parts_usage_tracking')
        .select('*')
        .eq('id', usageId)
        .single();

      if (fetchError || !usageRecord) {
        console.error('Error fetching usage record:', fetchError);
        return false;
      }

      // Delete the usage record
      const { error } = await supabase
        .from('parts_usage_tracking')
        .delete()
        .eq('id', usageId);

      if (error) {
        console.error('Error removing part usage:', error);
        return false;
      }

      // Restore inventory quantity
      await this.restoreInventoryQuantity(usageRecord.part_number, usageRecord.quantity);

      toast({
        title: "Part Usage Removed",
        description: "Part usage has been removed and inventory restored.",
      });

      return true;
    } catch (error) {
      console.error('Error removing part usage:', error);
      return false;
    }
  }

  // Inventory management
  async getInventoryItems(): Promise<PartInfo[]> {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .order('last_updated', { ascending: false });

      if (error) {
        console.error('Error getting inventory:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting inventory:', error);
      return [];
    }
  }

  async updateInventoryQuantity(partId: string, newQuantity: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('inventory_items')
        .update({ 
          quantity: newQuantity,
          last_updated: new Date().toISOString()
        })
        .eq('id', partId);

      if (error) {
        console.error('Error updating inventory:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating inventory:', error);
      return false;
    }
  }

  private async updateInventoryQuantityByPartNumber(partNumber: string, quantityUsed: number): Promise<void> {
    try {
      const { data: inventoryItem, error: fetchError } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('part_number', partNumber)
        .single();

      if (fetchError || !inventoryItem) {
        console.error('Error fetching inventory item:', fetchError);
        return;
      }

      const newQuantity = Math.max(0, inventoryItem.quantity - quantityUsed);
      
      const { error: updateError } = await supabase
        .from('inventory_items')
        .update({ 
          quantity: newQuantity,
          last_updated: new Date().toISOString()
        })
        .eq('id', inventoryItem.id);

      if (updateError) {
        console.error('Error updating inventory quantity:', updateError);
      }
    } catch (error) {
      console.error('Error updating inventory quantity:', error);
    }
  }

  private async restoreInventoryQuantity(partNumber: string, quantityToRestore: number): Promise<void> {
    try {
      const { data: inventoryItem, error: fetchError } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('part_number', partNumber)
        .single();

      if (fetchError || !inventoryItem) {
        console.error('Error fetching inventory item:', fetchError);
        return;
      }

      const newQuantity = inventoryItem.quantity + quantityToRestore;
      
      const { error: updateError } = await supabase
        .from('inventory_items')
        .update({ 
          quantity: newQuantity,
          last_updated: new Date().toISOString()
        })
        .eq('id', inventoryItem.id);

      if (updateError) {
        console.error('Error restoring inventory quantity:', updateError);
      }
    } catch (error) {
      console.error('Error restoring inventory quantity:', error);
    }
  }

  // Stock alerts and analytics
  async getStockAlerts(): Promise<StockAlert[]> {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .lte('quantity', 10)
        .order('quantity');

      if (error) {
        console.error('Error getting stock alerts:', error);
        return [];
      }

      return data.map(item => ({
        id: item.id,
        part_name: item.part_name,
        part_number: item.part_number,
        current_stock: item.quantity,
        alert_level: item.quantity === 0 ? 'critical' : item.quantity <= 3 ? 'low' : 'medium',
        estimated_days_remaining: Math.max(0, item.quantity * 7) // Rough estimate
      }));
    } catch (error) {
      console.error('Error getting stock alerts:', error);
      return [];
    }
  }

  async getRecentUsage(limit: number = 20): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('parts_usage_tracking')
        .select('*')
        .order('usage_date', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error getting recent usage:', error);
        return [];
      }

      return data.map(item => ({
        id: item.id,
        part_number: item.part_number,
        part_name: item.part_name,
        quantity: item.quantity,
        car_vin: item.car_vin,
        client_name: item.client_name,
        technician: item.technician,
        usage_date: item.usage_date
      }));
    } catch (error) {
      console.error('Error getting recent usage:', error);
      return [];
    }
  }

  // Analytics and reporting
  async getUsageAnalytics(period: 'daily' | 'weekly' | 'monthly' = 'weekly'): Promise<any[]> {
    try {
      const daysBack = period === 'daily' ? 1 : period === 'weekly' ? 7 : 30;
      const startDate = new Date(Date.now() - (daysBack * 24 * 60 * 60 * 1000)).toISOString();

      const { data, error } = await supabase
        .from('parts_usage_tracking')
        .select('part_number, part_name, quantity, usage_date, technician')
        .gte('usage_date', startDate)
        .order('usage_date', { ascending: false });

      if (error) {
        console.error('Error getting usage analytics:', error);
        return [];
      }

      // Group by part and calculate totals
      const analytics = data.reduce((acc: any, item: any) => {
        const key = item.part_number;
        if (!acc[key]) {
          acc[key] = {
            part_number: item.part_number,
            part_name: item.part_name,
            total_quantity: 0,
            usage_count: 0,
            technicians: new Set()
          };
        }
        
        acc[key].total_quantity += item.quantity;
        acc[key].usage_count += 1;
        acc[key].technicians.add(item.technician);
        
        return acc;
      }, {});

      return Object.values(analytics).map((item: any) => ({
        ...item,
        technicians: Array.from(item.technicians)
      }));
    } catch (error) {
      console.error('Error getting usage analytics:', error);
      return [];
    }
  }
}

export const partsTrackingService = new PartsTrackingService();
