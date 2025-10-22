// Warranty Initializer Utility
// For setting up warranty tracking on existing cars and new arrivals

import WarrantyTrackingService from '@/services/warrantyTrackingService';

export class WarrantyInitializer {
  
  /**
   * Initialize warranty for a new car arrival
   * @param carData Car data from arrival
   * @param warrantyYears Number of years for warranty (default 3)
   */
  static initializeNewCarWarranty(carData: any, warrantyYears: number = 3): {
    warrantyStartDate: string;
    warrantyEndDate: string;
    warrantyMonthsRemaining: number;
    warrantyDaysRemaining: number;
    warrantyStatus: 'active' | 'expiring_soon' | 'expired';
  } {
    // Use manufacturing date or arrival date as warranty start
    const startDate = new Date(carData.manufacturing_date || carData.arrival_date || carData.created_at);
    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + warrantyYears);
    
    const warrantyInfo = WarrantyTrackingService.calculateWarrantyInfo(
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );
    
    return {
      warrantyStartDate: startDate.toISOString().split('T')[0],
      warrantyEndDate: endDate.toISOString().split('T')[0],
      warrantyMonthsRemaining: warrantyInfo.warrantyMonthsRemaining,
      warrantyDaysRemaining: warrantyInfo.warrantyDaysRemaining,
      warrantyStatus: warrantyInfo.warrantyStatus
    };
  }
  
  /**
   * Set custom warranty dates for a car
   */
  static setCustomWarranty(startDate: string, endDate: string): {
    warrantyStartDate: string;
    warrantyEndDate: string;
    warrantyMonthsRemaining: number;
    warrantyDaysRemaining: number;
    warrantyStatus: 'active' | 'expiring_soon' | 'expired';
  } {
    const warrantyInfo = WarrantyTrackingService.calculateWarrantyInfo(startDate, endDate);
    
    return {
      warrantyStartDate: startDate,
      warrantyEndDate: endDate,
      warrantyMonthsRemaining: warrantyInfo.warrantyMonthsRemaining,
      warrantyDaysRemaining: warrantyInfo.warrantyDaysRemaining,
      warrantyStatus: warrantyInfo.warrantyStatus
    };
  }
  
  /**
   * Bulk initialize warranty for existing cars (utility function)
   */
  static async bulkInitializeWarranty(): Promise<void> {
    try {
      console.log('Starting bulk warranty initialization...');
      await WarrantyTrackingService.initializeWarrantyTracking();
      console.log('Bulk warranty initialization completed');
    } catch (error) {
      console.error('Error in bulk warranty initialization:', error);
      throw error;
    }
  }
  
  /**
   * Get warranty summary for dashboard/reports
   */
  static async getWarrantySummaryForDashboard(): Promise<{
    summary: any;
    expiringCars: any[];
    recentlyExpired: any[];
  }> {
    try {
      const [summary, expiringCars] = await Promise.all([
        WarrantyTrackingService.getWarrantySummary(),
        WarrantyTrackingService.getCarsWithExpiringWarranties()
      ]);
      
      // Filter recently expired cars (expired within last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentlyExpired = expiringCars.filter(car => 
        car.warrantyStatus === 'expired' && 
        car.warrantyEndDate && 
        new Date(car.warrantyEndDate) >= thirtyDaysAgo
      );
      
      return {
        summary,
        expiringCars: expiringCars.filter(car => car.warrantyStatus === 'expiring_soon'),
        recentlyExpired
      };
    } catch (error) {
      console.error('Error getting warranty summary:', error);
      throw error;
    }
  }
}

// Helper function to add warranty fields to car data when creating/updating
export const addWarrantyToCarData = (carData: any, warrantyYears: number = 3) => {
  const warrantyInfo = WarrantyInitializer.initializeNewCarWarranty(carData, warrantyYears);
  
  return {
    ...carData,
    warranty_start_date: warrantyInfo.warrantyStartDate,
    warranty_end_date: warrantyInfo.warrantyEndDate,
    warranty_months_remaining: warrantyInfo.warrantyMonthsRemaining,
    warranty_days_remaining: warrantyInfo.warrantyDaysRemaining,
    warranty_status: warrantyInfo.warrantyStatus,
    last_warranty_update: new Date().toISOString()
  };
};

export default WarrantyInitializer;