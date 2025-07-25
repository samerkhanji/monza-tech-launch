import { useEffect, useRef } from 'react';
import { AutomatedNotificationService } from '@/services/automatedNotificationService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export const useAutomatedNotifications = () => {
  const { user } = useAuth();
  const serviceRef = useRef<AutomatedNotificationService | null>(null);

  useEffect(() => {
    // Initialize the automated notification service
    if (!serviceRef.current) {
      serviceRef.current = AutomatedNotificationService.getInstance();
      serviceRef.current.initialize();
    }

    // Cleanup on unmount
    return () => {
      if (serviceRef.current) {
        serviceRef.current.cleanup();
      }
    };
  }, []);

  // Manual trigger functions for immediate notifications
  const triggerGarageCompletion = (completion: any) => {
    AutomatedNotificationService.triggerGarageCompletion(completion);
    toast({
      title: "Garage Work Completed",
      description: `Vehicle ${completion.vin} work completed and notification sent to managers.`,
    });
  };

  const triggerCarStatusChange = (change: any) => {
    AutomatedNotificationService.triggerCarStatusChange(change);
    toast({
      title: "Car Status Updated",
      description: `Status change for ${change.vin} has been notified to relevant managers.`,
    });
  };

  const triggerInventoryArrival = (arrival: any) => {
    AutomatedNotificationService.triggerInventoryArrival(arrival);
    toast({
      title: "Inventory Arrival",
      description: `${arrival.type === 'car' ? 'Car' : 'Part'} arrival has been notified to managers.`,
    });
  };

  const triggerLowStockAlert = (alert: any) => {
    AutomatedNotificationService.triggerLowStockAlert(alert);
    toast({
      title: "Low Stock Alert",
      description: `Low stock alert for ${alert.itemId} has been sent to managers.`,
      variant: alert.currentStock === 0 ? 'destructive' : 'default',
    });
  };

  return {
    triggerGarageCompletion,
    triggerCarStatusChange,
    triggerInventoryArrival,
    triggerLowStockAlert,
  };
}; 