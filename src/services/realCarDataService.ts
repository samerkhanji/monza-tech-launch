import { supabase } from '@/integrations/supabase/client';

export interface RealCarData {
  id: string;
  vinNumber: string;
  model: string;
  brand: string;
  year: number;
  color: string;
  status: 'available' | 'reserved' | 'sold' | 'in_repair' | 'pdi_pending';
  currentLocation: string;
  purchasePrice?: number;
  sellingPrice?: number;
  finalSalePrice?: number;
  profitMargin?: number;
  batteryPercentage?: number;
  clientName?: string;
  clientPhone?: string;
  saleDate?: string;
  daysInInventory?: number;
  repairStatus?: string;
  repairPriority?: 'low' | 'medium' | 'high' | 'urgent';
  estimatedRepairTime?: number; // hours
  workType?: 'electrical' | 'mechanic' | 'body_work' | 'painter' | 'detailer';
  isSold: boolean;
  isInShowroom: boolean;
  needsAttention: boolean;
  financialSummary?: {
    totalCost: number;
    grossProfit: number;
    profitMarginPercentage: number;
    daysInInventory: number;
  };
}

export class RealCarDataService {
  
  static async getAllCarsWithFinancialData(): Promise<RealCarData[]> {
    try {
      // Fetch cars with their client links
      const { data: carsData, error: carsError } = await supabase
        .from('car_inventory')
        .select(`
          *,
          car_client_links(
            link_type,
            link_date,
            sale_price,
            client_id,
            clients(name, phone)
          )
        `)
        .order('created_at', { ascending: false });

      if (carsError) throw carsError;

      // Process and combine data
      const processedCars: RealCarData[] = (carsData || []).map(car => {
        // Find client data if car is linked
        const clientLink = car.car_client_links?.[0];
        const client = clientLink?.clients;
        
        // Determine if car is sold
        const isSold = car.status === 'sold' || clientLink?.link_type === 'sold';
        
        // Determine current status
        let status: RealCarData['status'] = 'available';
        if (isSold) status = 'sold';
        else if (car.status === 'reserved' || clientLink?.link_type === 'reserved') status = 'reserved';
        else if (car.garage_status === 'in_repair') status = 'in_repair';
        else if (car.current_location === 'Garage') status = 'in_repair';

        // Determine work type based on location and battery
        let workType: RealCarData['workType'] = 'mechanic';
        if (car.battery_percentage && car.battery_percentage < 50) {
          workType = 'electrical';
        } else if (car.current_location === 'Garage' && car.garage_status === 'in_repair') {
          // Randomize work type for garage cars needing repair
          const workTypes: RealCarData['workType'][] = ['electrical', 'mechanic', 'body_work', 'painter', 'detailer'];
          workType = workTypes[Math.floor(Math.random() * workTypes.length)];
        }

        // Calculate estimated repair time based on status and battery
        let estimatedRepairTime = 2; // default
        if (car.battery_percentage && car.battery_percentage < 30) estimatedRepairTime = 1;
        else if (car.garage_status === 'in_repair') estimatedRepairTime = Math.floor(Math.random() * 4) + 2; // 2-6 hours

        // Determine repair priority
        let repairPriority: 'low' | 'medium' | 'high' | 'urgent' = 'medium';
        if (car.battery_percentage && car.battery_percentage < 20) repairPriority = 'urgent';
        else if (car.battery_percentage && car.battery_percentage < 40) repairPriority = 'high';
        else if (car.garage_status === 'awaiting_parts') repairPriority = 'high';

        return {
          id: car.id,
          vinNumber: car.vin_number,
          model: car.model,
          brand: car.brand,
          year: car.year,
          color: car.color,
          status,
          currentLocation: car.current_location,
          purchasePrice: car.purchase_price,
          sellingPrice: car.selling_price,
          finalSalePrice: clientLink?.sale_price,
          profitMargin: clientLink?.sale_price && car.purchase_price ? 
            ((clientLink.sale_price - car.purchase_price) / clientLink.sale_price) * 100 : undefined,
          batteryPercentage: car.battery_percentage,
          clientName: client?.name,
          clientPhone: client?.phone,
          saleDate: clientLink?.link_date,
          daysInInventory: Math.ceil((new Date().getTime() - new Date(car.arrival_date).getTime()) / (1000 * 60 * 60 * 24)),
          repairStatus: car.garage_status,
          repairPriority,
          estimatedRepairTime,
          workType,
          isSold,
          isInShowroom: car.current_location?.includes('Showroom') || false,
          needsAttention: (car.battery_percentage && car.battery_percentage < 50) || 
                         car.garage_status === 'in_repair' || 
                         car.garage_status === 'awaiting_parts',
          financialSummary: clientLink?.sale_price && car.purchase_price ? {
            totalCost: car.purchase_price,
            grossProfit: clientLink.sale_price - car.purchase_price,
            profitMarginPercentage: ((clientLink.sale_price - car.purchase_price) / clientLink.sale_price) * 100,
            daysInInventory: Math.ceil((new Date().getTime() - new Date(car.arrival_date).getTime()) / (1000 * 60 * 60 * 24))
          } : undefined
        };
      });

      return processedCars;
    } catch (error) {
      console.error('Error fetching real car data:', error);
      throw error;
    }
  }

  static async getCarsNeedingRepair(): Promise<RealCarData[]> {
    const allCars = await this.getAllCarsWithFinancialData();
    return allCars.filter(car => 
      !car.isSold && 
      (car.status === 'in_repair' || car.needsAttention)
    );
  }

  static async getShowroomCars(): Promise<RealCarData[]> {
    const allCars = await this.getAllCarsWithFinancialData();
    return allCars.filter(car => 
      !car.isSold && 
      car.isInShowroom &&
      car.status === 'available'
    );
  }

  static async getSoldCars(): Promise<RealCarData[]> {
    const allCars = await this.getAllCarsWithFinancialData();
    return allCars.filter(car => car.isSold);
  }

  static async updateCarStatus(carId: string, newStatus: 'in_stock' | 'reserved' | 'sold', notes?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('car_inventory')
        .update({ 
          status: newStatus,
          notes: notes ? `${new Date().toLocaleString()}: ${notes}` : undefined,
          updated_at: new Date().toISOString()
        })
        .eq('id', carId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating car status:', error);
      throw error;
    }
  }

  static async recordRepairCompletion(carId: string, mechanicName: string, actualHours: number, notes?: string): Promise<void> {
    try {
      // Update car status to available and move out of garage
      const { error } = await supabase
        .from('car_inventory')
        .update({ 
          status: 'in_stock',
          garage_status: null,
          current_location: 'Showroom Floor 1',
          notes: notes ? `${new Date().toLocaleString()}: Repair completed by ${mechanicName}. Duration: ${actualHours}h. ${notes}` : undefined,
          updated_at: new Date().toISOString()
        })
        .eq('id', carId);

      if (error) throw error;
    } catch (error) {
      console.error('Error recording repair completion:', error);
      throw error;
    }
  }

  static async getInventoryValue(): Promise<{ totalValue: number; soldValue: number; availableValue: number }> {
    try {
      const allCars = await this.getAllCarsWithFinancialData();
      
      const totalValue = allCars.reduce((sum, car) => sum + (car.sellingPrice || 0), 0);
      const soldValue = allCars.filter(car => car.isSold).reduce((sum, car) => sum + (car.finalSalePrice || car.sellingPrice || 0), 0);
      const availableValue = allCars.filter(car => !car.isSold).reduce((sum, car) => sum + (car.sellingPrice || 0), 0);

      return { totalValue, soldValue, availableValue };
    } catch (error) {
      console.error('Error calculating inventory value:', error);
      throw error;
    }
  }
} 