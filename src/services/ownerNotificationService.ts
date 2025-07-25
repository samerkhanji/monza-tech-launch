export interface OwnerNotification {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'efficiency' | 'workflow' | 'quality' | 'financial' | 'customer';
  timestamp: string;
  affectedItems: string[];
  actionRequired: boolean;
  estimatedImpact: {
    financial: number;
    time: number; // in hours
    customer: 'none' | 'low' | 'medium' | 'high';
  };
  recommendedActions: string[];
}

export class OwnerNotificationService {
  private static readonly OWNER_NOTIFICATIONS_KEY = 'owner_notifications';
  private static readonly MAX_NOTIFICATIONS = 50;

  // Send immediate notification to owner
  static sendImmediate(notification: Omit<OwnerNotification, 'id' | 'timestamp'>): void {
    const ownerNotification: OwnerNotification = {
      ...notification,
      id: `owner-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };

    // Save to storage
    this.saveNotification(ownerNotification);

    // Log to console for immediate visibility
    const urgencySymbol = this.getUrgencySymbol(notification.severity);
    console.warn(`${urgencySymbol} OWNER ALERT [${notification.severity.toUpperCase()}]: ${notification.title}`);
    console.warn(`Impact: $${notification.estimatedImpact.financial.toFixed(2)} | ${notification.estimatedImpact.time.toFixed(1)}h | Customer: ${notification.estimatedImpact.customer}`);
    console.warn(`Affected: ${notification.affectedItems.join(', ')}`);
    console.warn(`Actions: ${notification.recommendedActions.slice(0, 3).join(', ')}`);

    // Browser notification if available
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`Workflow Alert: ${notification.title}`, {
        body: `${notification.description}\nImpact: $${notification.estimatedImpact.financial.toFixed(2)}`,
        icon: '/favicon.ico',
        tag: ownerNotification.id,
        requireInteraction: notification.severity === 'critical'
      });
    }

    // Toast notification for critical issues
    if (notification.severity === 'critical' || notification.severity === 'high') {
      // This would integrate with your toast system
      console.error(`CRITICAL WORKFLOW ISSUE: ${notification.title} - ${notification.description}`);
    }
  }

  // Quick efficiency alert
  static sendEfficiencyAlert(
    title: string, 
    description: string, 
    affectedCars: string[], 
    financialImpact: number, 
    timeImpact: number,
    severity: OwnerNotification['severity'] = 'high'
  ): void {
    this.sendImmediate({
      title,
      description,
      severity,
      category: 'efficiency',
      affectedItems: affectedCars,
      actionRequired: true,
      estimatedImpact: {
        financial: financialImpact,
        time: timeImpact,
        customer: timeImpact > 4 ? 'high' : timeImpact > 2 ? 'medium' : 'low'
      },
      recommendedActions: [
        'Review current workflow immediately',
        'Check resource allocation',
        'Consider customer communication',
        'Investigate root causes'
      ]
    });
  }

  // Quick workflow disruption alert
  static sendWorkflowDisruption(
    title: string,
    description: string,
    affectedCars: string[],
    severity: OwnerNotification['severity'] = 'high'
  ): void {
    this.sendImmediate({
      title,
      description,
      severity,
      category: 'workflow',
      affectedItems: affectedCars,
      actionRequired: true,
      estimatedImpact: {
        financial: affectedCars.length * 150,
        time: affectedCars.length * 1.5,
        customer: 'medium'
      },
      recommendedActions: [
        'Address disruption immediately',
        'Communicate with affected customers',
        'Implement corrective measures',
        'Monitor for recurring issues'
      ]
    });
  }

  // Get all owner notifications
  static getNotifications(limit: number = 20): OwnerNotification[] {
    try {
      const notifications = JSON.parse(localStorage.getItem(this.OWNER_NOTIFICATIONS_KEY) || '[]');
      return notifications.slice(0, limit);
    } catch (error) {
      console.error('Error loading owner notifications:', error);
      return [];
    }
  }

  // Get notifications by severity
  static getNotificationsBySeverity(severity: OwnerNotification['severity']): OwnerNotification[] {
    return this.getNotifications(100).filter(notification => notification.severity === severity);
  }

  // Get today's notifications
  static getTodaysNotifications(): OwnerNotification[] {
    const today = new Date().toISOString().split('T')[0];
    return this.getNotifications(100).filter(notification => 
      notification.timestamp.startsWith(today)
    );
  }

  // Get summary stats
  static getNotificationStats(): {
    total: number;
    today: number;
    critical: number;
    high: number;
    actionRequired: number;
    totalFinancialImpact: number;
  } {
    const notifications = this.getNotifications(100);
    const today = this.getTodaysNotifications();
    
    return {
      total: notifications.length,
      today: today.length,
      critical: notifications.filter(n => n.severity === 'critical').length,
      high: notifications.filter(n => n.severity === 'high').length,
      actionRequired: notifications.filter(n => n.actionRequired).length,
      totalFinancialImpact: today.reduce((sum, n) => sum + n.estimatedImpact.financial, 0)
    };
  }

  // Clear old notifications
  static clearOldNotifications(daysToKeep: number = 7): void {
    try {
      const notifications = this.getNotifications(1000);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      const recentNotifications = notifications.filter(notification => 
        new Date(notification.timestamp) > cutoffDate
      );
      
      localStorage.setItem(this.OWNER_NOTIFICATIONS_KEY, JSON.stringify(recentNotifications));
    } catch (error) {
      console.error('Error clearing old notifications:', error);
    }
  }

  // Private helper methods
  private static saveNotification(notification: OwnerNotification): void {
    try {
      const existingNotifications = JSON.parse(localStorage.getItem(this.OWNER_NOTIFICATIONS_KEY) || '[]');
      existingNotifications.unshift(notification);
      
      // Keep only recent notifications
      const limitedNotifications = existingNotifications.slice(0, this.MAX_NOTIFICATIONS);
      localStorage.setItem(this.OWNER_NOTIFICATIONS_KEY, JSON.stringify(limitedNotifications));
    } catch (error) {
      console.error('Error saving owner notification:', error);
    }
  }

  private static getUrgencySymbol(severity: OwnerNotification['severity']): string {
    switch (severity) {
      case 'critical': return '🔴';
      case 'high': return '🚨';
      case 'medium': return '⚠️';
      case 'low': return 'ℹ️';
      default: return '📢';
    }
  }

  // Request browser notification permission
  static async requestNotificationPermission(): Promise<boolean> {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  // Initialize service
  static initialize(): void {
    // Request notification permission
    this.requestNotificationPermission();
    
    // Clear old notifications on startup
    this.clearOldNotifications();
    
    console.log('🔔 Owner Notification Service initialized - Ready to send workflow alerts');
  }
} 