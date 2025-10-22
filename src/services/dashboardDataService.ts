import { supabase } from '@/integrations/supabase/client';
import { safeLocalStorageGet } from '@/utils/errorHandling';
import { carService } from './carService';

export interface DashboardMetrics {
  // Car inventory metrics
  totalCars: number;
  availableCars: number;
  soldCars: number;
  inProgressCars: number;
  
  // Financial metrics
  totalRevenue: number;
  monthlySales: number;
  averageCarPrice: number;
  profitMargin: number;
  
  // Operational metrics
  activeEmployees: number;
  pendingRequests: number;
  scheduledToday: number;
  carsInGarage: number;
  lowStockItems: number;
  
  // Performance metrics
  efficiencyScore: number;
  customerSatisfaction: number;
  inventoryTurnover: number;
  repairCompletionRate: number;
  
  // Recent activities
  recentActivities: ActivityItem[];
}

export interface ActivityItem {
  type: string;
  message: string;
  time: string;
  icon: any;
  priority: 'low' | 'medium' | 'high';
}

export interface RoleSpecificMetrics {
  owner: {
    totalRevenue: number;
    activeEmployees: number;
    monthlySales: number;
    quarterlyGrowth: number;
  };
  garage_manager: {
    teamEfficiency: number;
    completedRepairs: number;
    avgRepairTime: number;
    mechanicsAvailable: number;
  };
  sales: {
    personalSales: number;
    activeLeads: number;
    availableCars: number;
    targetProgress: number;
    conversionRate: number;
  };
  assistant: {
    pendingTasks: number;
    newArrivals: number;
    scheduledAppointments: number;
    processedToday: number;
  };
}

class DashboardDataService {
  async getComprehensiveMetrics(): Promise<DashboardMetrics> {
    try {
      // First try to get data from the database using car service
      let allCars: any[] = [];
      
      try {
        const { data: dbCars, error } = await carService.getAllCars();
        if (!error && dbCars) {
          allCars = dbCars;
          console.log(`📊 Loaded ${allCars.length} cars from database`);
        }
      } catch (dbError) {
        console.log('Database not available, trying localStorage fallback');
      }
      
      // Fallback to localStorage if database fails
      if (allCars.length === 0) {
        const carInventory = safeLocalStorageGet<any[]>('carInventory', []);
        const showroomFloor1 = safeLocalStorageGet<any[]>('showroomFloor1', []);
        const showroomFloor2 = safeLocalStorageGet<any[]>('showroomFloor2', []);
        const garageCars = safeLocalStorageGet<any[]>('garageInventory', []);
        const orderedCars = safeLocalStorageGet<any[]>('orderedCars', []);
        
        allCars = [
          ...carInventory,
          ...showroomFloor1,
          ...showroomFloor2,
          ...garageCars,
          ...orderedCars
        ];
        console.log(`📊 Loaded ${allCars.length} cars from localStorage fallback`);
      }
      
      // Calculate basic metrics
      const totalCars = allCars.length;
      const availableCars = allCars.filter((car: any) => 
        car.status === 'available' || car.status === 'in_stock'
      ).length;
      const soldCars = allCars.filter((car: any) => 
        car.status === 'sold'
      ).length;
      const inProgressCars = allCars.filter((car: any) => 
        car.status === 'reserved' || car.status === 'in_repair' || car.status === 'pending'
      ).length;
      
      // Financial calculations
      const averageCarPrice = 45000;
      const totalRevenue = soldCars * averageCarPrice;
      const monthlySales = Math.floor(soldCars * 0.3);
      const profitMargin = 0.15; // 15% profit margin
      
      // Operational metrics
      const activeEmployees = 8;
      const pendingRequests = Math.floor(Math.random() * 10) + 3;
      const scheduledToday = Math.floor(Math.random() * 8) + 2;
      const carsInGarage = allCars.filter((car: any) => 
        car.status === 'in_repair' || car.currentFloor === 'garage'
      ).length;
      const lowStockItems = Math.floor(Math.random() * 15) + 5;
      
      // Performance metrics
      const efficiencyScore = Math.floor(Math.random() * 20) + 80;
      const customerSatisfaction = Math.floor(Math.random() * 15) + 85;
      const inventoryTurnover = Math.min(100, (soldCars / Math.max(1, totalCars)) * 100);
      const repairCompletionRate = Math.floor(Math.random() * 20) + 75;
      
      // Generate recent activities
      const recentActivities = this.generateRecentActivities();
      
      return {
        totalCars,
        availableCars,
        soldCars,
        inProgressCars,
        totalRevenue,
        monthlySales,
        averageCarPrice,
        profitMargin,
        activeEmployees,
        pendingRequests,
        scheduledToday,
        carsInGarage,
        lowStockItems,
        efficiencyScore,
        customerSatisfaction,
        inventoryTurnover,
        repairCompletionRate,
        recentActivities
      };
    } catch (error) {
      console.error('Error loading comprehensive metrics:', error);
      return this.getDefaultMetrics();
    }
  }
  
  getRoleSpecificMetrics(): RoleSpecificMetrics {
    return {
      owner: {
        totalRevenue: 1250000,
        activeEmployees: 12,
        monthlySales: 24,
        quarterlyGrowth: 15.3
      },
      garage_manager: {
        teamEfficiency: 87,
        completedRepairs: 156,
        avgRepairTime: 2.4,
        mechanicsAvailable: 4
      },
      sales: {
        personalSales: 8,
        activeLeads: 15,
        availableCars: 32,
        targetProgress: 73,
        conversionRate: 24.5
      },
      assistant: {
        pendingTasks: 7,
        newArrivals: 5,
        scheduledAppointments: 12,
        processedToday: 8
      }
    };
  }
  
  private generateRecentActivities(): ActivityItem[] {
    const activities = [
      {
        type: 'car_arrival',
        message: 'New car arrival: Voyah Free',
        time: '2 hours ago',
        priority: 'medium' as const
      },
      {
        type: 'repair_complete',
        message: 'Repair completed: BMW X5',
        time: '4 hours ago',
        priority: 'high' as const
      },
      {
        type: 'sale_complete',
        message: 'Sale completed: Mercedes C-Class',
        time: '6 hours ago',
        priority: 'high' as const
      },
      {
        type: 'appointment',
        message: 'Customer appointment scheduled',
        time: '8 hours ago',
        priority: 'medium' as const
      },
      {
        type: 'maintenance',
        message: 'Scheduled maintenance: Audi A4',
        time: '10 hours ago',
        priority: 'low' as const
      },
      {
        type: 'inventory',
        message: 'Inventory count completed',
        time: '12 hours ago',
        priority: 'medium' as const
      }
    ];
    
    return activities.map(activity => ({
      ...activity,
      icon: this.getActivityIcon(activity.type)
    }));
  }
  
  private getActivityIcon(type: string) {
    const icons = {
      car_arrival: 'Car',
      repair_complete: 'Wrench',
      sale_complete: 'DollarSign',
              appointment: 'Clock',
      maintenance: 'Settings',
      inventory: 'Package'
    };
    
    return icons[type as keyof typeof icons] || 'Activity';
  }
  
  private getDefaultMetrics(): DashboardMetrics {
    return {
      totalCars: 0,
      availableCars: 0,
      soldCars: 0,
      inProgressCars: 0,
      totalRevenue: 0,
      monthlySales: 0,
      averageCarPrice: 45000,
      profitMargin: 0.15,
      activeEmployees: 8,
      pendingRequests: 5,
      scheduledToday: 3,
      carsInGarage: 0,
      lowStockItems: 8,
      efficiencyScore: 85,
      customerSatisfaction: 90,
      inventoryTurnover: 0,
      repairCompletionRate: 80,
      recentActivities: []
    };
  }
  
  async getFinancialAnalytics() {
    try {
      const metrics = await this.getComprehensiveMetrics();
      
      return {
        revenue: {
          total: metrics.totalRevenue,
          monthly: metrics.monthlySales * metrics.averageCarPrice,
          average: metrics.averageCarPrice,
          profit: metrics.totalRevenue * metrics.profitMargin
        },
        sales: {
          total: metrics.soldCars,
          monthly: metrics.monthlySales,
          conversionRate: (metrics.soldCars / Math.max(1, metrics.totalCars)) * 100
        },
        performance: {
          efficiency: metrics.efficiencyScore,
          satisfaction: metrics.customerSatisfaction,
          turnover: metrics.inventoryTurnover
        }
      };
    } catch (error) {
      console.error('Error loading financial analytics:', error);
      return null;
    }
  }
  
  async getOperationalAnalytics() {
    try {
      const metrics = await this.getComprehensiveMetrics();
      
      return {
        inventory: {
          total: metrics.totalCars,
          available: metrics.availableCars,
          inProgress: metrics.inProgressCars,
          inGarage: metrics.carsInGarage
        },
        workforce: {
          activeEmployees: metrics.activeEmployees,
          efficiency: metrics.efficiencyScore,
          pendingTasks: metrics.pendingRequests
        },
        operations: {
          scheduledToday: metrics.scheduledToday,
          lowStockItems: metrics.lowStockItems,
          repairCompletionRate: metrics.repairCompletionRate
        }
      };
    } catch (error) {
      console.error('Error loading operational analytics:', error);
      return null;
    }
  }

  async getInventoryByModel() {
    try {
      const { data: cars, error } = await carService.getAllCars();
      if (error || !cars) {
        return this.getSampleInventoryByModel();
      }

      const modelCounts: { [key: string]: { total: number; s1: number; s2: number } } = {};
      
      cars.forEach((car: any) => {
        const model = car.model || car.customModelName || 'Unknown';
        if (!modelCounts[model]) {
          modelCounts[model] = { total: 0, s1: 0, s2: 0 };
        }
        
        modelCounts[model].total++;
        
        if (car.currentFloor === 'floor1' || car.currentFloor === 'showroom1') {
          modelCounts[model].s1++;
        } else if (car.currentFloor === 'floor2' || car.currentFloor === 'showroom2') {
          modelCounts[model].s2++;
        }
      });

      return Object.entries(modelCounts).map(([model, counts]) => ({
        model,
        trim: 'Standard',
        total: counts.total,
        s1: counts.s1,
        s2: counts.s2
      }));
    } catch (error) {
      console.error('Error getting inventory by model:', error);
      return this.getSampleInventoryByModel();
    }
  }

  async getGarageBacklog() {
    try {
      const { data: cars, error } = await carService.getAllCars();
      if (error || !cars) {
        return this.getSampleGarageBacklog();
      }

      const garageCars = cars.filter((car: any) => 
        car.status === 'in_repair' || car.currentFloor === 'garage'
      ).slice(0, 10);

      return garageCars.map((car: any) => ({
        vin: car.vinNumber || 'N/A',
        model: car.model || car.customModelName || 'Unknown',
        status: car.status || 'Unknown',
        assigned: car.pdiTechnician || 'Unassigned',
        eta: '2-3 days',
        sla: 'On track'
      }));
    } catch (error) {
      console.error('Error getting garage backlog:', error);
      return this.getSampleGarageBacklog();
    }
  }

  async getSalesPipeline() {
    try {
      const { data: cars, error } = await carService.getAllCars();
      if (error || !cars) {
        return this.getSampleSalesPipeline();
      }

      const pipeline = {
        'In Stock': cars.filter((car: any) => car.status === 'in_stock' || car.status === 'available').length,
        'Reserved': cars.filter((car: any) => car.status === 'reserved').length,
        'In Negotiation': cars.filter((car: any) => car.status === 'pending').length,
        'Sold': cars.filter((car: any) => car.status === 'sold').length
      };

      return Object.entries(pipeline).map(([stage, quantity]) => ({
        stage,
        quantity
      }));
    } catch (error) {
      console.error('Error getting sales pipeline:', error);
      return this.getSampleSalesPipeline();
    }
  }

  private getSampleInventoryByModel() {
    return [
      { model: 'Voyah FREE', trim: 'Standard', total: 5, s1: 3, s2: 2 },
      { model: 'BMW X5', trim: 'Premium', total: 3, s1: 2, s2: 1 },
      { model: 'Mercedes C-Class', trim: 'Luxury', total: 2, s1: 1, s2: 1 }
    ];
  }

  private getSampleGarageBacklog() {
    return [
      { vin: 'LDP95H96XSE900273', model: 'Voyah FREE', status: 'In Repair', assigned: 'Mark', eta: '2-3 days', sla: 'On track' },
      { vin: 'BMW123456789', model: 'BMW X5', status: 'Pending', assigned: 'Khalil', eta: '1-2 days', sla: 'On track' }
    ];
  }

  private getSampleSalesPipeline() {
    return [
      { stage: 'In Stock', quantity: 8 },
      { stage: 'Reserved', quantity: 3 },
      { stage: 'In Negotiation', quantity: 2 },
      { stage: 'Sold', quantity: 5 }
    ];
  }
}

export const dashboardDataService = new DashboardDataService(); 