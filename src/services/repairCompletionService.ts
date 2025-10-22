import { supabase } from '@/integrations/supabase/client';

export interface RepairCompletionData {
  repairId: string;
  carId: string;
  carVIN: string;
  carModel: string;
  customerName: string;
  completedBy: string;
  completionDate: string;
  partsUsed: Array<{
    partId: string;
    partNumber: string;
    partName: string;
    quantityUsed: number;
    costPerUnit: number;
    totalCost: number;
  }>;
  totalRepairCost: number;
  mechanics: string[];
  notes?: string;
}

export interface ReceiptData {
  receiptId: string;
  repairId: string;
  carInfo: {
    vin: string;
    model: string;
    customerName: string;
  };
  jobInfo: {
    jobId: string;
    title: string;
    completedDate: string;
  };
  partsList: Array<{
    name: string;
    quantity: number;
    costPerUnit: number;
    totalCost: number;
  }>;
  totalCost: number;
  mechanics: string[];
  generatedAt: string;
}

class RepairCompletionService {
  async completeRepair(completionData: RepairCompletionData): Promise<boolean> {
    try {
      // 1. Deduct parts from inventory
      for (const part of completionData.partsUsed) {
        const { error: updateError } = await supabase
          .from('parts_inventory')
          .update({ 
            stock_quantity: supabase.sql`stock_quantity - ${part.quantityUsed}` 
          })
          .eq('id', part.partId);

        if (updateError) {
          console.error('Failed to update part inventory:', updateError);
          return false;
        }

        // 2. Log part usage
        const { error: logError } = await supabase
          .from('repair_parts_used')
          .insert({
            repair_id: completionData.repairId,
            part_id: part.partId,
            quantity_used: part.quantityUsed,
            used_by: completionData.completedBy,
            created_at: new Date().toISOString()
          });

        if (logError) {
          console.error('Failed to log part usage:', logError);
          return false;
        }

        // 3. Check if part needs reorder
        const { data: partData } = await supabase
          .from('parts_inventory')
          .select('stock_quantity, low_stock_threshold')
          .eq('id', part.partId)
          .single();

        if (partData && partData.stock_quantity <= partData.low_stock_threshold) {
          // Send low stock alert (could be implemented as notification or email)
          console.log(`Low stock alert for part ${part.partNumber}: ${partData.stock_quantity} remaining`);
        }
      }

      // 4. Update repair status
      const { error: repairError } = await supabase
        .from('repairs')
        .update({ 
          status: 'completed',
          completed_at: completionData.completionDate,
          completed_by: completionData.completedBy,
          total_cost: completionData.totalRepairCost
        })
        .eq('id', completionData.repairId);

      if (repairError) {
        console.error('Failed to update repair status:', repairError);
        return false;
      }

      // 5. Generate receipt
      const receiptData = await this.generateReceipt(completionData);
      if (receiptData) {
        await this.saveReceipt(receiptData);
      }

      return true;
    } catch (error) {
      console.error('Repair completion error:', error);
      return false;
    }
  }

  async generateReceipt(completionData: RepairCompletionData): Promise<ReceiptData> {
    const receiptId = `RCP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      receiptId,
      repairId: completionData.repairId,
      carInfo: {
        vin: completionData.carVIN,
        model: completionData.carModel,
        customerName: completionData.customerName
      },
      jobInfo: {
        jobId: completionData.repairId,
        title: `Repair - ${completionData.carModel}`,
        completedDate: completionData.completionDate
      },
      partsList: completionData.partsUsed.map(part => ({
        name: part.partName,
        quantity: part.quantityUsed,
        costPerUnit: part.costPerUnit,
        totalCost: part.totalCost
      })),
      totalCost: completionData.totalRepairCost,
      mechanics: completionData.mechanics,
      generatedAt: new Date().toISOString()
    };
  }

  async saveReceipt(receiptData: ReceiptData): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('repair_receipts')
        .insert({
          receipt_id: receiptData.receiptId,
          repair_id: receiptData.repairId,
          car_vin: receiptData.carInfo.vin,
          car_model: receiptData.carInfo.model,
          customer_name: receiptData.carInfo.customerName,
          job_id: receiptData.jobInfo.jobId,
          job_title: receiptData.jobInfo.title,
          completed_date: receiptData.jobInfo.completedDate,
          parts_list: receiptData.partsList,
          total_cost: receiptData.totalCost,
          mechanics: receiptData.mechanics,
          generated_at: receiptData.generatedAt
        });

      if (error) {
        console.error('Failed to save receipt:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Save receipt error:', error);
      return false;
    }
  }

  async getReceiptsByCar(carVIN: string): Promise<ReceiptData[]> {
    try {
      const { data, error } = await supabase
        .from('repair_receipts')
        .select('*')
        .eq('car_vin', carVIN)
        .order('generated_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch receipts:', error);
        return [];
      }

      return data.map(row => ({
        receiptId: row.receipt_id,
        repairId: row.repair_id,
        carInfo: {
          vin: row.car_vin,
          model: row.car_model,
          customerName: row.customer_name
        },
        jobInfo: {
          jobId: row.job_id,
          title: row.job_title,
          completedDate: row.completed_date
        },
        partsList: row.parts_list,
        totalCost: row.total_cost,
        mechanics: row.mechanics,
        generatedAt: row.generated_at
      }));
    } catch (error) {
      console.error('Get receipts error:', error);
      return [];
    }
  }

  async downloadReceiptAsPDF(receiptData: ReceiptData): Promise<Blob | null> {
    try {
      // This would typically use a PDF generation library like jsPDF
      // For now, we'll return null as a placeholder
      console.log('Generating PDF for receipt:', receiptData.receiptId);
      return null;
    } catch (error) {
      console.error('PDF generation error:', error);
      return null;
    }
  }

  async getPartsUsedForRepair(repairId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('repair_parts_used')
        .select(`
          *,
          parts_inventory (
            part_number,
            part_name,
            cost
          )
        `)
        .eq('repair_id', repairId);

      if (error) {
        console.error('Failed to fetch parts used:', error);
        return [];
      }

      return data.map(row => ({
        partId: row.part_id,
        partNumber: row.parts_inventory.part_number,
        partName: row.parts_inventory.part_name,
        quantityUsed: row.quantity_used,
        costPerUnit: row.parts_inventory.cost,
        totalCost: row.quantity_used * row.parts_inventory.cost,
        usedBy: row.used_by,
        usedAt: row.created_at
      }));
    } catch (error) {
      console.error('Get parts used error:', error);
      return [];
    }
  }
}

export const repairCompletionService = new RepairCompletionService(); 