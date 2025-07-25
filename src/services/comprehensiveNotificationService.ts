interface ComprehensiveNotification {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  category: 'workflow' | 'efficiency' | 'error' | 'schedule' | 'inventory' | 'cars' | 'garage' | 'showroom' | 'software' | 'shipment' | 'testdrive' | 'financial' | 'customer' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: string;
  relatedEntityType?: 'car' | 'employee' | 'order' | 'shipment' | 'repair' | 'inventory' | 'customer' | 'system';
  relatedEntityId?: string;
  affectedSystems: string[];
  estimatedImpact: {
    financial: number;
    timeMinutes: number;
    customerSatisfaction: 'none' | 'low' | 'medium' | 'high';
    workflowDisruption: 'none' | 'minor' | 'moderate' | 'major';
  };
  status: 'active' | 'acknowledged' | 'resolved' | 'escalated';
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  actionsTaken?: string[];
  read: boolean;
  priority: number; // 1-10, higher = more urgent
  source: string; // Which service/component generated this
  metadata?: Record<string, any>;
}

interface DailyActivitySummary {
  date: string;
  totalNotifications: number;
  bySeverity: Record<string, number>;
  byCategory: Record<string, number>;
  totalFinancialImpact: number;
  totalTimeImpact: number;
  unresolvedCritical: number;
  topIssues: ComprehensiveNotification[];
}

class ComprehensiveNotificationService {
  private static readonly STORAGE_KEY = 'comprehensive_notifications';
  private static readonly MAX_NOTIFICATIONS = 1000;
  private static readonly ACTIVITY_SUMMARY_KEY = 'daily_activity_summary';

  // Add notification with automatic categorization and impact assessment
  static addNotification(data: Omit<ComprehensiveNotification, 'id' | 'timestamp' | 'read' | 'status' | 'priority'>): ComprehensiveNotification {
    const notification: ComprehensiveNotification = {
      ...data,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      read: false,
      status: 'active',
      priority: this.calculatePriority(data.severity, data.estimatedImpact)
    };

    this.saveNotification(notification);
    this.updateDailyActivity(notification);
    this.triggerRealTimeAlert(notification);

    return notification;
  }

  // Calculate priority based on severity and impact
  private static calculatePriority(severity: string, impact: any): number {
    let priority = 1;

    // Base priority by severity
    switch (severity) {
      case 'critical': priority = 10; break;
      case 'high': priority = 7; break;
      case 'medium': priority = 4; break;
      case 'low': priority = 2; break;
    }

    // Adjust by financial impact
    if (impact.financial > 1000) priority += 2;

    // Adjust by workflow disruption
    if (impact.workflowDisruption === 'major') priority += 3;

    return Math.min(priority, 10);
  }

  // Save notification to storage
  private static saveNotification(notification: ComprehensiveNotification): void {
    try {
      const notifications = this.getAllNotifications();
      notifications.unshift(notification);
      
      // Keep only latest notifications
      const trimmed = notifications.slice(0, this.MAX_NOTIFICATIONS);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(trimmed));
    } catch (error) {
      console.error('Error saving notification:', error);
    }
  }

  // Get all notifications with filtering options
  static getAllNotifications(filters?: {
    category?: string[];
    severity?: string[];
    status?: string[];
    fromDate?: string;
    toDate?: string;
    limit?: number;
  }): ComprehensiveNotification[] {
    try {
      const notifications: ComprehensiveNotification[] = JSON.parse(
        localStorage.getItem(this.STORAGE_KEY) || '[]'
      );

      let filtered = notifications;

      if (filters) {
        if (filters.category) {
          filtered = filtered.filter(n => filters.category!.includes(n.category));
        }
        if (filters.severity) {
          filtered = filtered.filter(n => filters.severity!.includes(n.severity));
        }
        if (filters.status) {
          filtered = filtered.filter(n => filters.status!.includes(n.status));
        }
        if (filters.fromDate) {
          filtered = filtered.filter(n => n.timestamp >= filters.fromDate!);
        }
        if (filters.toDate) {
          filtered = filtered.filter(n => n.timestamp <= filters.toDate!);
        }
        if (filters.limit) {
          filtered = filtered.slice(0, filters.limit);
        }
      }

      return filtered.sort((a, b) => b.priority - a.priority);
    } catch (error) {
      console.error('Error loading notifications:', error);
      return [];
    }
  }

  // Get unread count
  static getUnreadCount(filters?: { category?: string[]; severity?: string[] }): number {
    return this.getAllNotifications({ ...filters, status: ['active'] })
      .filter(n => !n.read).length;
  }

  // Mark notification as read
  static markAsRead(id: string): void {
    try {
      const notifications = this.getAllNotifications();
      const updated = notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      );
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  // Mark all as read
  static markAllAsRead(): void {
    try {
      const notifications = this.getAllNotifications();
      const updated = notifications.map(n => ({ ...n, read: true }));
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }

  // Acknowledge notification
  static acknowledgeNotification(id: string, acknowledgedBy: string): void {
    try {
      const notifications = this.getAllNotifications();
      const updated = notifications.map(n => 
        n.id === id ? { 
          ...n, 
          status: 'acknowledged' as const,
          acknowledgedBy,
          acknowledgedAt: new Date().toISOString()
        } : n
      );
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error acknowledging notification:', error);
    }
  }

  // Resolve notification
  static resolveNotification(id: string, resolvedBy: string, actionsTaken: string[]): void {
    try {
      const notifications = this.getAllNotifications();
      const updated = notifications.map(n => 
        n.id === id ? { 
          ...n, 
          status: 'resolved' as const,
          resolvedBy,
          resolvedAt: new Date().toISOString(),
          actionsTaken
        } : n
      );
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error resolving notification:', error);
    }
  }

  // Update daily activity summary
  private static updateDailyActivity(notification: ComprehensiveNotification): void {
    try {
      const today = new Date().toISOString().split('T')[0];
      const summaries: Record<string, DailyActivitySummary> = JSON.parse(
        localStorage.getItem(this.ACTIVITY_SUMMARY_KEY) || '{}'
      );

      if (!summaries[today]) {
        summaries[today] = {
          date: today,
          totalNotifications: 0,
          bySeverity: {},
          byCategory: {},
          totalFinancialImpact: 0,
          totalTimeImpact: 0,
          unresolvedCritical: 0,
          topIssues: []
        };
      }

      const summary = summaries[today];
      summary.totalNotifications++;
      summary.bySeverity[notification.severity] = (summary.bySeverity[notification.severity] || 0) + 1;
      summary.byCategory[notification.category] = (summary.byCategory[notification.category] || 0) + 1;
      summary.totalFinancialImpact += notification.estimatedImpact.financial;
      summary.totalTimeImpact += notification.estimatedImpact.timeMinutes;

      if (notification.severity === 'critical' && notification.status === 'active') {
        summary.unresolvedCritical++;
      }

      // Update top issues (keep top 5 by priority)
      summary.topIssues.push(notification);
      summary.topIssues.sort((a, b) => b.priority - a.priority);
      summary.topIssues = summary.topIssues.slice(0, 5);

      localStorage.setItem(this.ACTIVITY_SUMMARY_KEY, JSON.stringify(summaries));
    } catch (error) {
      console.error('Error updating daily activity:', error);
    }
  }

  // Get daily activity summary
  static getDailyActivitySummary(date?: string): DailyActivitySummary | null {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0];
      const summaries: Record<string, DailyActivitySummary> = JSON.parse(
        localStorage.getItem(this.ACTIVITY_SUMMARY_KEY) || '{}'
      );
      return summaries[targetDate] || null;
    } catch (error) {
      console.error('Error getting daily activity summary:', error);
      return null;
    }
  }

  // Trigger real-time alert for high priority notifications
  private static triggerRealTimeAlert(notification: ComprehensiveNotification): void {
    if (notification.priority >= 7) {
      // Console alert
      console.warn(`🚨 HIGH PRIORITY ALERT: ${notification.title}`);
      console.warn(`Impact: $${notification.estimatedImpact.financial} | ${notification.estimatedImpact.timeMinutes}min | ${notification.category.toUpperCase()}`);
      
      // Browser notification if available
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`Business Alert: ${notification.title}`, {
          body: notification.description,
          icon: '/favicon.ico',
          tag: notification.id,
          requireInteraction: notification.severity === 'critical'
        });
      }
    }
  }

  // Convenience methods for different business areas
  static reportWorkflowDisruption(title: string, description: string, impact: any, location: string): void {
    this.addNotification({
      title,
      description,
      category: 'workflow',
      severity: impact.workflowDisruption === 'major' ? 'critical' : 'high',
      location,
      affectedSystems: ['workflow'],
      estimatedImpact: impact,
      source: 'workflow-monitor'
    });
  }

  static reportEfficiencyIssue(title: string, description: string, impact: any, location: string): void {
    this.addNotification({
      title,
      description,
      category: 'efficiency',
      severity: impact.financial > 1000 ? 'high' : 'medium',
      location,
      affectedSystems: ['operations'],
      estimatedImpact: impact,
      source: 'efficiency-monitor'
    });
  }

  static reportSystemError(title: string, description: string, location: string, severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'): void {
    this.addNotification({
      title,
      description,
      category: 'error',
      severity,
      location,
      affectedSystems: ['software'],
      estimatedImpact: {
        financial: severity === 'critical' ? 500 : severity === 'high' ? 200 : 50,
        timeMinutes: severity === 'critical' ? 60 : severity === 'high' ? 30 : 10,
        customerSatisfaction: severity === 'critical' ? 'high' : 'low',
        workflowDisruption: severity === 'critical' ? 'major' : 'minor'
      },
      source: 'system-monitor'
    });
  }

  static reportInventoryIssue(title: string, description: string, itemId: string, impact: any): void {
    this.addNotification({
      title,
      description,
      category: 'inventory',
      severity: 'medium',
      location: 'inventory',
      relatedEntityType: 'inventory',
      relatedEntityId: itemId,
      affectedSystems: ['inventory'],
      estimatedImpact: impact,
      source: 'inventory-monitor'
    });
  }

  static reportCarIssue(title: string, description: string, carId: string, location: string, severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'): void {
    this.addNotification({
      title,
      description,
      category: 'cars',
      severity,
      location,
      relatedEntityType: 'car',
      relatedEntityId: carId,
      affectedSystems: ['inventory', 'showroom'],
      estimatedImpact: {
        financial: 100,
        timeMinutes: 30,
        customerSatisfaction: 'medium',
        workflowDisruption: 'minor'
      },
      source: 'car-monitor'
    });
  }

  static reportScheduleIssue(title: string, description: string, impact: any): void {
    this.addNotification({
      title,
      description,
      category: 'schedule',
      severity: 'medium',
      location: 'schedule',
      affectedSystems: ['schedule', 'garage'],
      estimatedImpact: impact,
      source: 'schedule-monitor'
    });
  }

  static reportTestDriveIssue(title: string, description: string, carId: string, severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'): void {
    this.addNotification({
      title,
      description,
      category: 'testdrive',
      severity,
      location: 'showroom',
      relatedEntityType: 'car',
      relatedEntityId: carId,
      affectedSystems: ['showroom', 'schedule'],
      estimatedImpact: {
        financial: 200,
        timeMinutes: 60,
        customerSatisfaction: 'high',
        workflowDisruption: 'moderate'
      },
      source: 'testdrive-monitor'
    });
  }

  // Clear old notifications (older than 30 days)
  static cleanupOldNotifications(): void {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const notifications = this.getAllNotifications();
      const filtered = notifications.filter(n => n.timestamp >= thirtyDaysAgo);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error cleaning up notifications:', error);
    }
  }

  // Export notifications for analysis
  static exportNotifications(filters?: any): string {
    const notifications = this.getAllNotifications(filters);
    return JSON.stringify({
      exportDate: new Date().toISOString(),
      totalNotifications: notifications.length,
      notifications
    }, null, 2);
  }

  // Initialize with sample data
  static initializeSampleData(): void {
    if (this.getAllNotifications().length === 0) {
      // Add some sample notifications
      this.reportWorkflowDisruption(
        'Garage Schedule Overrun',
        'Car VY-2024-001 repair is running 2 hours behind schedule',
        {
          financial: 300,
          timeMinutes: 120,
          customerSatisfaction: 'high',
          workflowDisruption: 'moderate'
        },
        'garage'
      );

      this.reportEfficiencyIssue(
        'Low Parts Inventory',
        'Brake pads inventory is below minimum threshold',
        {
          financial: 500,
          timeMinutes: 240,
          customerSatisfaction: 'medium',
          workflowDisruption: 'minor'
        },
        'inventory'
      );

      this.reportSystemError(
        'VIN Scanner Connection Lost',
        'VIN scanner device connectivity issues detected',
        'showroom',
        'high'
      );
    }
  }
}

export { ComprehensiveNotificationService, type ComprehensiveNotification, type DailyActivitySummary }; 