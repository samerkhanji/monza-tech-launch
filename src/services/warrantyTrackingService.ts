// Warranty Tracking Service
// Handles warranty countdown logic and notifications

import { supabase } from '@/integrations/supabase/client';
import { ComprehensiveNotificationService } from './comprehensiveNotificationService';

export interface WarrantyInfo {
  warrantyStartDate: string;
  warrantyEndDate: string;
  warrantyMonthsRemaining: number;
  warrantyDaysRemaining: number;
  warrantyStatus: 'active' | 'expiring_soon' | 'expired';
}

export interface CarWithWarranty {
  id: string;
  vinNumber: string;
  carModel: string;
  brand: string;
  warrantyStartDate?: string;
  warrantyEndDate?: string;
  warrantyMonthsRemaining?: number;
  warrantyDaysRemaining?: number;
  warrantyStatus?: 'active' | 'expiring_soon' | 'expired';
  currentFloor?: string;
}

export class WarrantyTrackingService {
  private static readonly EXPIRING_THRESHOLD_DAYS = 90; // 3 months = 90 days
  
  /**
   * Calculate warranty information based on start and end dates
   */
  static calculateWarrantyInfo(startDate: string, endDate: string): WarrantyInfo {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    
    // Calculate days remaining
    const timeDiff = end.getTime() - today.getTime();
    const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    // Calculate months remaining (approximate)
    const monthsRemaining = Math.ceil(daysRemaining / 30);
    
    // Determine status
    let status: 'active' | 'expiring_soon' | 'expired' = 'active';
    if (daysRemaining <= 0) {
      status = 'expired';
    } else if (daysRemaining <= this.EXPIRING_THRESHOLD_DAYS) {
      status = 'expiring_soon';
    }
    
    return {
      warrantyStartDate: startDate,
      warrantyEndDate: endDate,
      warrantyMonthsRemaining: Math.max(0, monthsRemaining),
      warrantyDaysRemaining: Math.max(0, daysRemaining),
      warrantyStatus: status
    };
  }
  
  /**
   * Update warranty countdown for a specific car
   */
  static async updateCarWarrantyCountdown(
    tableName: string, 
    carId: string, 
    warrantyStartDate: string, 
    warrantyEndDate: string
  ): Promise<boolean> {
    try {
      const warrantyInfo = this.calculateWarrantyInfo(warrantyStartDate, warrantyEndDate);
      
      const { error } = await supabase
        .from(tableName)
        .update({
          warranty_months_remaining: warrantyInfo.warrantyMonthsRemaining,
          warranty_days_remaining: warrantyInfo.warrantyDaysRemaining,
          warranty_status: warrantyInfo.warrantyStatus,
          last_warranty_update: new Date().toISOString()
        })
        .eq('id', carId);
      
      if (error) {
        console.error('Error updating warranty countdown:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error in updateCarWarrantyCountdown:', error);
      return false;
    }
  }
  
  /**
   * Run daily warranty countdown for all cars across all inventory tables
   */
  static async runDailyWarrantyCountdown(): Promise<void> {
    const inventoryTables = [
      'showroom_floor1_inventory',
      'showroom_floor2_inventory', 
      'garage_inventory',
      'car_inventory',
      'ordered_cars'
    ];
    
    console.log('Starting daily warranty countdown...');
    
    for (const tableName of inventoryTables) {
      try {
        await this.processTableWarrantyCountdown(tableName);
      } catch (error) {
        console.error(`Error processing warranty countdown for ${tableName}:`, error);
      }
    }
    
    console.log('Daily warranty countdown completed');
  }
  
  /**
   * Process warranty countdown for a specific table
   */
  private static async processTableWarrantyCountdown(tableName: string): Promise<void> {
    try {
      // Get all cars with warranty information
      const { data: cars, error } = await supabase
        .from(tableName)
        .select('id, vin_number, model, brand, warranty_start_date, warranty_end_date, warranty_status')
        .not('warranty_end_date', 'is', null);
      
      if (error) {
        console.error(`Error fetching cars from ${tableName}:`, error);
        return;
      }
      
      if (!cars || cars.length === 0) {
        console.log(`No cars with warranty data found in ${tableName}`);
        return;
      }
      
      for (const car of cars) {
        if (car.warranty_start_date && car.warranty_end_date) {
          const warrantyInfo = this.calculateWarrantyInfo(
            car.warranty_start_date, 
            car.warranty_end_date
          );
          
          // Update the car's warranty information
          await this.updateCarWarrantyCountdown(
            tableName,
            car.id,
            car.warranty_start_date,
            car.warranty_end_date
          );
          
          // Check if we need to send notifications
          await this.checkAndSendWarrantyNotifications(car, warrantyInfo, tableName);
        }
      }
      
      console.log(`Processed warranty countdown for ${cars.length} cars in ${tableName}`);
    } catch (error) {
      console.error(`Error in processTableWarrantyCountdown for ${tableName}:`, error);
    }
  }
  
  /**
   * Check and send warranty notifications if needed
   */
  private static async checkAndSendWarrantyNotifications(
    car: any, 
    warrantyInfo: WarrantyInfo, 
    tableName: string
  ): Promise<void> {
    try {
      // Only send notifications for cars expiring soon (within 3 months)
      if (warrantyInfo.warrantyStatus === 'expiring_soon') {
        
        // Check if we already sent a notification for this car recently (within last 7 days)
        const recentNotifications = ComprehensiveNotificationService.getAllNotifications()
          .filter(n => 
            n.metadata?.carVin === car.vin_number && 
            n.type === 'warranty_expiring' &&
            new Date(n.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          );
        
        if (recentNotifications.length === 0) {
          // Send warranty expiring notification
          ComprehensiveNotificationService.addNotification({
            title: `Warranty Expiring Soon - ${car.model}`,
            description: `Vehicle ${car.vin_number} warranty expires in ${warrantyInfo.warrantyDaysRemaining} days (${warrantyInfo.warrantyMonthsRemaining} months). Please review and take necessary action.`,
            type: 'warranty_expiring',
            severity: warrantyInfo.warrantyDaysRemaining <= 30 ? 'high' : 'medium',
            category: 'vehicle_management',
            source: 'warranty_tracking_system',
            impact: {
              scope: 'vehicle',
              severity: warrantyInfo.warrantyDaysRemaining <= 30 ? 'high' : 'medium',
              urgency: warrantyInfo.warrantyDaysRemaining <= 30 ? 'high' : 'medium'
            },
            metadata: {
              carVin: car.vin_number,
              carModel: car.model,
              carBrand: car.brand,
              tableName: tableName,
              warrantyEndDate: warrantyInfo.warrantyEndDate,
              daysRemaining: warrantyInfo.warrantyDaysRemaining,
              monthsRemaining: warrantyInfo.warrantyMonthsRemaining
            },
            actionRequired: true,
            assignedTo: 'vehicle_management_team'
          });
          
          console.log(`Sent warranty notification for ${car.vin_number} (${warrantyInfo.warrantyDaysRemaining} days remaining)`);
        }
      } else if (warrantyInfo.warrantyStatus === 'expired') {
        // Send warranty expired notification (only once)
        const expiredNotifications = ComprehensiveNotificationService.getAllNotifications()
          .filter(n => 
            n.metadata?.carVin === car.vin_number && 
            n.type === 'warranty_expired'
          );
        
        if (expiredNotifications.length === 0) {
          ComprehensiveNotificationService.addNotification({
            title: `Warranty Expired - ${car.model}`,
            description: `Vehicle ${car.vin_number} warranty has expired. Vehicle is no longer under manufacturer warranty coverage.`,
            type: 'warranty_expired',
            severity: 'high',
            category: 'vehicle_management',
            source: 'warranty_tracking_system',
            impact: {
              scope: 'vehicle',
              severity: 'high',
              urgency: 'medium'
            },
            metadata: {
              carVin: car.vin_number,
              carModel: car.model,
              carBrand: car.brand,
              tableName: tableName,
              warrantyEndDate: warrantyInfo.warrantyEndDate
            },
            actionRequired: true,
            assignedTo: 'vehicle_management_team'
          });
          
          console.log(`Sent warranty expired notification for ${car.vin_number}`);
        }
      }
    } catch (error) {
      console.error('Error sending warranty notifications:', error);
    }
  }
  
  /**
   * Get warranty summary for all cars
   */
  static async getWarrantySummary(): Promise<{
    totalCars: number;
    activeCars: number;
    expiringSoon: number;
    expired: number;
  }> {
    const inventoryTables = [
      'showroom_floor1_inventory',
      'showroom_floor2_inventory', 
      'garage_inventory',
      'car_inventory',
      'ordered_cars'
    ];
    
    let totalCars = 0;
    let activeCars = 0;
    let expiringSoon = 0;
    let expired = 0;
    
    for (const tableName of inventoryTables) {
      try {
        const { data: cars } = await supabase
          .from(tableName)
          .select('warranty_status')
          .not('warranty_end_date', 'is', null);
        
        if (cars) {
          totalCars += cars.length;
          cars.forEach(car => {
            switch (car.warranty_status) {
              case 'active':
                activeCars++;
                break;
              case 'expiring_soon':
                expiringSoon++;
                break;
              case 'expired':
                expired++;
                break;
            }
          });
        }
      } catch (error) {
        console.error(`Error getting warranty summary for ${tableName}:`, error);
      }
    }
    
    return {
      totalCars,
      activeCars,
      expiringSoon,
      expired
    };
  }
  
  /**
   * Get cars with expiring warranties
   */
  static async getCarsWithExpiringWarranties(): Promise<CarWithWarranty[]> {
    const inventoryTables = [
      'showroom_floor1_inventory',
      'showroom_floor2_inventory', 
      'garage_inventory',
      'car_inventory',
      'ordered_cars'
    ];
    
    const expiringCars: CarWithWarranty[] = [];
    
    for (const tableName of inventoryTables) {
      try {
        const { data: cars } = await supabase
          .from(tableName)
          .select('*')
          .eq('warranty_status', 'expiring_soon')
          .order('warranty_days_remaining', { ascending: true });
        
        if (cars) {
          cars.forEach(car => {
            expiringCars.push({
              ...car,
              currentFloor: tableName.replace('_inventory', '').replace('_', ' ')
            });
          });
        }
      } catch (error) {
        console.error(`Error getting expiring warranties for ${tableName}:`, error);
      }
    }
    
    return expiringCars;
  }
  
  /**
   * Initialize warranty tracking for existing cars (one-time setup)
   */
  static async initializeWarrantyTracking(): Promise<void> {
    console.log('Initializing warranty tracking for existing cars...');
    
    const inventoryTables = [
      'showroom_floor1_inventory',
      'showroom_floor2_inventory', 
      'garage_inventory',
      'car_inventory',
      'ordered_cars'
    ];
    
    for (const tableName of inventoryTables) {
      try {
        // Get cars that have warranty but no warranty tracking set up
        const { data: cars } = await supabase
          .from(tableName)
          .select('*')
          .not('warranty', 'is', null)
          .is('warranty_start_date', null);
        
        if (cars && cars.length > 0) {
          console.log(`Setting up warranty tracking for ${cars.length} cars in ${tableName}`);
          
          for (const car of cars) {
            // For existing cars, assume warranty started from arrival date or manufacture date
            const warrantyStartDate = car.arrival_date || car.manufacturing_date || car.created_at;
            
            if (warrantyStartDate) {
              // Assume standard 3-year warranty
              const startDate = new Date(warrantyStartDate);
              const endDate = new Date(startDate);
              endDate.setFullYear(endDate.getFullYear() + 3);
              
              const warrantyInfo = this.calculateWarrantyInfo(
                startDate.toISOString().split('T')[0],
                endDate.toISOString().split('T')[0]
              );
              
              await supabase
                .from(tableName)
                .update({
                  warranty_start_date: startDate.toISOString().split('T')[0],
                  warranty_end_date: endDate.toISOString().split('T')[0],
                  warranty_months_remaining: warrantyInfo.warrantyMonthsRemaining,
                  warranty_days_remaining: warrantyInfo.warrantyDaysRemaining,
                  warranty_status: warrantyInfo.warrantyStatus,
                  last_warranty_update: new Date().toISOString()
                })
                .eq('id', car.id);
            }
          }
        }
      } catch (error) {
        console.error(`Error initializing warranty tracking for ${tableName}:`, error);
      }
    }
    
    console.log('Warranty tracking initialization completed');
  }
}

// Export for use in other parts of the application
export default WarrantyTrackingService;