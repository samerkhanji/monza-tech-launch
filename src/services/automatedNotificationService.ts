import { ComprehensiveNotificationService } from './comprehensiveNotificationService';
import { useAuth } from '@/contexts/AuthContext';

// Notification recipients for different events
const NOTIFICATION_RECIPIENTS = {
  OWNERS: ['Samer', 'Owner'],
  CUSTOMS_MANAGERS: ['Samaya', 'Lara'],
  ALL_MANAGERS: ['Samer', 'Samaya', 'Lara', 'Owner'],
  ALL_USERS: 'all'
};

// Low stock thresholds
const LOW_STOCK_THRESHOLDS = {
  CARS: 5, // Alert when less than 5 cars in stock
  PARTS: 3, // Alert when less than 3 parts in stock
  CRITICAL_PARTS: 1 // Alert when critical parts are at 1 or less
};

interface CarStatusChange {
  vin: string;
  oldStatus: string;
  newStatus: string;
  location: string;
  changedBy: string;
  timestamp: string;
}

interface GarageCompletion {
  carId: string;
  vin: string;
  workType: string;
  completedBy: string;
  completionTime: string;
  duration: string;
}

interface InventoryArrival {
  type: 'car' | 'part';
  vin?: string;
  partNumber?: string;
  quantity: number;
  source: 'ordered_cars' | 'ordered_parts';
  arrivalTime: string;
  location: string;
}

interface LowStockAlert {
  type: 'car' | 'part';
  itemId: string;
  currentStock: number;
  threshold: number;
  location: string;
}

class AutomatedNotificationService {
  private static instance: AutomatedNotificationService;
  private isInitialized = false;
  private monitoringInterval: NodeJS.Timeout | null = null;

  static getInstance(): AutomatedNotificationService {
    if (!AutomatedNotificationService.instance) {
      AutomatedNotificationService.instance = new AutomatedNotificationService();
    }
    return AutomatedNotificationService.instance;
  }

  // Initialize the automated notification system
  initialize(): void {
    if (this.isInitialized) return;
    
    console.log('🚨 Initializing Automated Notification Service...');
    
    // Start monitoring intervals
    this.startGarageMonitoring();
    this.startInventoryMonitoring();
    this.startCarStatusMonitoring();
    this.startLowStockMonitoring();
    
    this.isInitialized = true;
    console.log('✅ Automated Notification Service initialized');
  }

  // Monitor garage completions
  private startGarageMonitoring(): void {
    setInterval(() => {
      this.checkGarageCompletions();
    }, 30000); // Check every 30 seconds
  }

  private checkGarageCompletions(): void {
    try {
      const garageSchedule = JSON.parse(localStorage.getItem('garageSchedule') || '[]');
      const completedCars = garageSchedule.filter((car: any) => 
        car.status === 'completed' && !car.notificationSent
      );

      completedCars.forEach((car: any) => {
        this.notifyGarageCompletion({
          carId: car.id,
          vin: car.vin,
          workType: car.workType || 'Repair',
          completedBy: car.mechanic || 'Unknown',
          completionTime: new Date().toISOString(),
          duration: car.duration || 'Unknown'
        });

        // Mark as notified
        car.notificationSent = true;
      });

      // Save updated schedule
      localStorage.setItem('garageSchedule', JSON.stringify(garageSchedule));
    } catch (error) {
      console.error('Error checking garage completions:', error);
    }
  }

  // Monitor car status changes
  private startCarStatusMonitoring(): void {
    setInterval(() => {
      this.checkCarStatusChanges();
    }, 15000); // Check every 15 seconds
  }

  private checkCarStatusChanges(): void {
    try {
      const carInventory = JSON.parse(localStorage.getItem('carInventory') || '[]');
      const statusHistory = JSON.parse(localStorage.getItem('carStatusHistory') || '[]');
      
      carInventory.forEach((car: any) => {
        const lastHistory = statusHistory.find((h: any) => h.vin === car.vin);
        
        if (lastHistory && lastHistory.status !== car.status) {
          this.notifyCarStatusChange({
            vin: car.vin,
            oldStatus: lastHistory.status,
            newStatus: car.status,
            location: car.location || 'Unknown',
            changedBy: car.lastModifiedBy || 'System',
            timestamp: new Date().toISOString()
          });

          // Update history
          statusHistory.push({
            vin: car.vin,
            status: car.status,
            timestamp: new Date().toISOString(),
            changedBy: car.lastModifiedBy || 'System'
          });
        }
      });

      localStorage.setItem('carStatusHistory', JSON.stringify(statusHistory));
    } catch (error) {
      console.error('Error checking car status changes:', error);
    }
  }

  // Monitor inventory arrivals from ordered items
  private startInventoryMonitoring(): void {
    setInterval(() => {
      this.checkInventoryArrivals();
    }, 20000); // Check every 20 seconds
  }

  private checkInventoryArrivals(): void {
    try {
      // Check for cars moved from ordered to inventory
      const orderedCars = JSON.parse(localStorage.getItem('orderedCars') || '[]');
      const carInventory = JSON.parse(localStorage.getItem('carInventory') || '[]');
      
      orderedCars.forEach((orderedCar: any) => {
        const inInventory = carInventory.find((car: any) => car.vin === orderedCar.vin);
        
        if (inInventory && !orderedCar.arrivalNotified) {
          this.notifyInventoryArrival({
            type: 'car',
            vin: orderedCar.vin,
            quantity: 1,
            source: 'ordered_cars',
            arrivalTime: new Date().toISOString(),
            location: inInventory.location || 'Inventory'
          });

          // Mark as notified
          orderedCar.arrivalNotified = true;
        }
      });

      // Check for parts moved from ordered to inventory
      const orderedParts = JSON.parse(localStorage.getItem('orderedParts') || '[]');
      const partInventory = JSON.parse(localStorage.getItem('partInventory') || '[]');
      
      orderedParts.forEach((orderedPart: any) => {
        const inInventory = partInventory.find((part: any) => part.partNumber === orderedPart.partNumber);
        
        if (inInventory && !orderedPart.arrivalNotified) {
          this.notifyInventoryArrival({
            type: 'part',
            partNumber: orderedPart.partNumber,
            quantity: orderedPart.quantity || 1,
            source: 'ordered_parts',
            arrivalTime: new Date().toISOString(),
            location: inInventory.location || 'Inventory'
          });

          // Mark as notified
          orderedPart.arrivalNotified = true;
        }
      });

      // Save updated data
      localStorage.setItem('orderedCars', JSON.stringify(orderedCars));
      localStorage.setItem('orderedParts', JSON.stringify(orderedParts));
    } catch (error) {
      console.error('Error checking inventory arrivals:', error);
    }
  }

  // Monitor low stock levels
  private startLowStockMonitoring(): void {
    setInterval(() => {
      this.checkLowStockLevels();
    }, 60000); // Check every minute
  }

  private checkLowStockLevels(): void {
    try {
      // Skip checking if no data sources are available
      const carInventoryData = localStorage.getItem('carInventory');
      const partInventoryData = localStorage.getItem('partInventory');
      
      // If no mock data and no Supabase connection, skip checking
      if (!carInventoryData && !partInventoryData) {
        // console.log('📋 No inventory data available for stock monitoring');
        return;
      }

      // Check car inventory only if data exists
      if (carInventoryData) {
        const carInventory = JSON.parse(carInventoryData);
        const availableCars = carInventory.filter((car: any) => car.status === 'available');
        
        if (availableCars.length <= LOW_STOCK_THRESHOLDS.CARS) {
          this.notifyLowStock({
            type: 'car',
            itemId: 'available_cars',
            currentStock: availableCars.length,
            threshold: LOW_STOCK_THRESHOLDS.CARS,
            location: 'Showroom'
          });
        }
      }

      // Check part inventory only if data exists
      if (partInventoryData) {
        const partInventory = JSON.parse(partInventoryData);
        
        partInventory.forEach((part: any) => {
          const threshold = part.isCritical ? LOW_STOCK_THRESHOLDS.CRITICAL_PARTS : LOW_STOCK_THRESHOLDS.PARTS;
          
          if (part.quantity <= threshold) {
            this.notifyLowStock({
              type: 'part',
              itemId: part.partNumber,
              currentStock: part.quantity,
              threshold: threshold,
              location: part.location || 'Inventory'
            });
          }
        });
      }
    } catch (error) {
      console.error('Error checking low stock levels:', error);
    }
  }

  // Notification methods
  private notifyGarageCompletion(completion: GarageCompletion): void {
    ComprehensiveNotificationService.addNotification({
      title: `Garage Work Completed`,
      description: `Vehicle ${completion.vin} has completed ${completion.workType} work. Duration: ${completion.duration}`,
      category: 'garage',
      severity: 'medium',
      location: 'Garage',
      relatedEntityType: 'car',
      relatedEntityId: completion.carId,
      affectedSystems: ['garage', 'inventory'],
      estimatedImpact: {
        financial: 0,
        timeMinutes: 0,
        customerSatisfaction: 'high',
        workflowDisruption: 'none'
      },
      source: 'automated_garage_monitor',
      metadata: {
        vin: completion.vin,
        workType: completion.workType,
        completedBy: completion.completedBy,
        duration: completion.duration
      }
    });

    // Send specific notifications to owners and managers
    this.sendTargetedNotification(
      NOTIFICATION_RECIPIENTS.ALL_MANAGERS,
      `Garage Work Completed - ${completion.vin}`,
      `Vehicle ${completion.vin} has completed ${completion.workType} work and is ready for customer pickup.`,
      'success'
    );
  }

  private notifyCarStatusChange(change: CarStatusChange): void {
    const isSignificantChange = ['available', 'reserved', 'sold'].includes(change.newStatus);
    
    if (isSignificantChange) {
      ComprehensiveNotificationService.addNotification({
        title: `Car Status Changed`,
        description: `Vehicle ${change.vin} status changed from ${change.oldStatus} to ${change.newStatus}`,
        category: 'cars',
        severity: change.newStatus === 'sold' ? 'high' : 'medium',
        location: change.location,
        relatedEntityType: 'car',
        relatedEntityId: change.vin,
        affectedSystems: ['inventory', 'sales'],
        estimatedImpact: {
          financial: change.newStatus === 'sold' ? 50000 : 0,
          timeMinutes: 0,
          customerSatisfaction: 'medium',
          workflowDisruption: 'minor'
        },
        source: 'automated_status_monitor',
        metadata: {
          vin: change.vin,
          oldStatus: change.oldStatus,
          newStatus: change.newStatus,
          changedBy: change.changedBy
        }
      });

      // Send specific notifications to owners, Samaya, and Lara
      this.sendTargetedNotification(
        [...NOTIFICATION_RECIPIENTS.OWNERS, ...NOTIFICATION_RECIPIENTS.CUSTOMS_MANAGERS],
        `Car Status Update - ${change.vin}`,
        `Vehicle ${change.vin} status changed from ${change.oldStatus} to ${change.newStatus} at ${change.location}`,
        change.newStatus === 'sold' ? 'success' : 'info'
      );
    }
  }

  private notifyInventoryArrival(arrival: InventoryArrival): void {
    const entityId = arrival.type === 'car' ? arrival.vin : arrival.partNumber;
    
    ComprehensiveNotificationService.addNotification({
      title: `${arrival.type === 'car' ? 'Car' : 'Part'} Arrived`,
      description: `${arrival.type === 'car' ? 'Vehicle' : 'Part'} ${entityId} has arrived from ${arrival.source.replace('_', ' ')}`,
      category: 'inventory',
      severity: 'medium',
      location: arrival.location,
      relatedEntityType: arrival.type === 'car' ? 'car' : 'inventory',
      relatedEntityId: entityId,
      affectedSystems: ['inventory', 'orders'],
      estimatedImpact: {
        financial: 0,
        timeMinutes: 30,
        customerSatisfaction: 'medium',
        workflowDisruption: 'minor'
      },
      source: 'automated_arrival_monitor',
      metadata: {
        type: arrival.type,
        vin: arrival.vin,
        partNumber: arrival.partNumber,
        quantity: arrival.quantity,
        source: arrival.source
      }
    });

    // Send specific notifications to owners and managers
    this.sendTargetedNotification(
      NOTIFICATION_RECIPIENTS.ALL_MANAGERS,
      `${arrival.type === 'car' ? 'Car' : 'Part'} Arrival - ${entityId}`,
      `${arrival.type === 'car' ? 'Vehicle' : 'Part'} ${entityId} has arrived from ${arrival.source.replace('_', ' ')} and is now in ${arrival.location}`,
      'info'
    );
  }

  private notifyLowStock(alert: LowStockAlert): void {
    ComprehensiveNotificationService.addNotification({
      title: `Low Stock Alert`,
      description: `${alert.type === 'car' ? 'Car' : 'Part'} stock is low: ${alert.currentStock} remaining (threshold: ${alert.threshold})`,
      category: 'inventory',
      severity: alert.currentStock === 0 ? 'critical' : 'high',
      location: alert.location,
      relatedEntityType: 'inventory',
      relatedEntityId: alert.itemId,
      affectedSystems: ['inventory', 'sales'],
      estimatedImpact: {
        financial: alert.currentStock === 0 ? 10000 : 5000,
        timeMinutes: 120,
        customerSatisfaction: 'low',
        workflowDisruption: 'moderate'
      },
      source: 'automated_stock_monitor',
      metadata: {
        type: alert.type,
        itemId: alert.itemId,
        currentStock: alert.currentStock,
        threshold: alert.threshold
      }
    });

    // Send specific notifications to owners and managers
    this.sendTargetedNotification(
      NOTIFICATION_RECIPIENTS.ALL_MANAGERS,
      `Low Stock Alert - ${alert.itemId}`,
      `${alert.type === 'car' ? 'Car' : 'Part'} stock is critically low: ${alert.currentStock} remaining in ${alert.location}`,
      alert.currentStock === 0 ? 'destructive' : 'warning'
    );
  }

  // Send targeted notifications to specific users
  private sendTargetedNotification(
    recipients: string[] | string,
    title: string,
    description: string,
    type: 'info' | 'success' | 'warning' | 'destructive' = 'info'
  ): void {
    // This would integrate with your existing notification system
    // For now, we'll use the comprehensive notification service
    const severity: 'low' | 'medium' | 'high' | 'critical' = 
      type === 'destructive' ? 'critical' : 
      type === 'warning' ? 'high' : 
      type === 'success' ? 'medium' : 'medium';

    const notificationData = {
      title,
      description,
      category: 'system' as const,
      severity,
      location: 'System',
      affectedSystems: ['notifications'],
      estimatedImpact: {
        financial: 0,
        timeMinutes: 0,
        customerSatisfaction: 'none' as const,
        workflowDisruption: 'none' as const
      },
      source: 'automated_targeted_notification',
      metadata: {
        recipients: Array.isArray(recipients) ? recipients : [recipients],
        type
      }
    };

    ComprehensiveNotificationService.addNotification(notificationData);
  }

  // Manual trigger methods for immediate notifications
  static triggerGarageCompletion(completion: GarageCompletion): void {
    AutomatedNotificationService.getInstance().notifyGarageCompletion(completion);
  }

  static triggerCarStatusChange(change: CarStatusChange): void {
    AutomatedNotificationService.getInstance().notifyCarStatusChange(change);
  }

  static triggerInventoryArrival(arrival: InventoryArrival): void {
    AutomatedNotificationService.getInstance().notifyInventoryArrival(arrival);
  }

  static triggerLowStockAlert(alert: LowStockAlert): void {
    AutomatedNotificationService.getInstance().notifyLowStock(alert);
  }

  // Cleanup method
  cleanup(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    this.isInitialized = false;
  }
}

export { AutomatedNotificationService, NOTIFICATION_RECIPIENTS, LOW_STOCK_THRESHOLDS };
export type { CarStatusChange, GarageCompletion, InventoryArrival, LowStockAlert }; 