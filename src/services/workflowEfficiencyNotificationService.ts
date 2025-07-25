import { useNotifications } from '@/contexts/NotificationContext';
import { CarWorkflowService } from './carWorkflowService';
import { GarageCostTrackingService } from './garageCostTrackingService';
import { productivityTrackingService } from './productivityTrackingService';

export interface EfficiencyAlert {
  id: string;
  type: 'overrun' | 'bottleneck' | 'parts_delay' | 'productivity_drop' | 'cost_spike' | 'quality_issue' | 'resource_shortage' | 'critical_delay';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affectedCars: string[];
  affectedMechanics: string[];
  impactDescription: string;
  financialImpact: number;
  timeImpact: number; // in hours
  recommendedActions: string[];
  autoResolutionAvailable: boolean;
  timestamp: string;
  location: string;
  department: string;
}

export interface EfficiencyMetrics {
  averageOverrunTime: number;
  dailyProductivityScore: number;
  costEfficiencyRatio: number;
  completionRate: number;
  customerSatisfactionImpact: number;
  resourceUtilization: number;
}

export class WorkflowEfficiencyNotificationService {
  private static instance: WorkflowEfficiencyNotificationService;
  private static monitoringInterval: NodeJS.Timeout | null = null;
  private static readonly EFFICIENCY_ALERTS_KEY = 'workflow_efficiency_alerts';
  private static readonly THRESHOLDS = {
    overrunTimeMinutes: 15,
    productivityDropPercent: 15,
    costSpikePercent: 25,
    partsDelayHours: 4,
    qualityIssueThreshold: 2,
    resourceUtilizationMin: 60,
    criticalDelayHours: 8
  };

  private constructor() {}

  static getInstance(): WorkflowEfficiencyNotificationService {
    if (!this.instance) {
      this.instance = new WorkflowEfficiencyNotificationService();
    }
    return this.instance;
  }

  // Main monitoring function
  static async monitorWorkflowEfficiency(): Promise<void> {
    const service = this.getInstance();
    
    try {
      await Promise.all([
        service.checkTimeOverruns(),
        service.checkPartsDelays(),
        service.checkBottlenecks(),
        service.checkCriticalDelays()
      ]);
    } catch (error) {
      console.error('Error monitoring workflow efficiency:', error);
    }
  }

  // Check for cars running over their estimated time
  private async checkTimeOverruns(): Promise<void> {
    try {
      const scheduleData = this.getScheduleData();
      const now = new Date();
      const overrunningCars: any[] = [];

      for (const slot of scheduleData.timeSlots || []) {
        for (const car of slot.cars || []) {
          if (car.status === 'in_progress' && car.actualStartTime && car.isOverrunning) {
            const overrunMinutes = car.overrunMinutes || 0;
            
            if (overrunMinutes >= WorkflowEfficiencyNotificationService.THRESHOLDS.overrunTimeMinutes) {
              overrunningCars.push({
                ...car,
                overrunMinutes,
                estimatedLoss: this.calculateOverrunLoss(overrunMinutes)
              });
            }
          }
        }
      }

      if (overrunningCars.length > 0) {
        const totalFinancialImpact = overrunningCars.reduce((sum, car) => sum + car.estimatedLoss, 0);
        const totalTimeImpact = overrunningCars.reduce((sum, car) => sum + (car.overrunMinutes / 60), 0);

        await this.createEfficiencyAlert({
          type: 'overrun',
          severity: overrunningCars.length > 2 ? 'high' : 'medium',
          title: `${overrunningCars.length} Car${overrunningCars.length > 1 ? 's' : ''} Running Over Schedule`,
          description: `Cars are exceeding estimated repair times, causing schedule disruption and potential customer delays.`,
          affectedCars: overrunningCars.map(car => car.carCode),
          affectedMechanics: [...new Set(overrunningCars.map(car => car.assignedMechanic))],
          impactDescription: `Schedule disruption affecting ${overrunningCars.length} vehicles and potentially delaying subsequent appointments.`,
          financialImpact: totalFinancialImpact,
          timeImpact: totalTimeImpact,
          recommendedActions: [
            'Review current work complexity and adjust estimates',
            'Check if additional resources are needed',
            'Consider reassigning work to balance load',
            'Notify affected customers of potential delays'
          ],
          autoResolutionAvailable: false,
          location: 'Garage',
          department: 'Service'
        });
      }
    } catch (error) {
      console.error('Error checking time overruns:', error);
    }
  }

  // Check for parts delivery delays
  private async checkPartsDelays(): Promise<void> {
    try {
      const scheduleData = this.getScheduleData();
      const now = new Date();
      const delayedCars: any[] = [];

      for (const slot of scheduleData.timeSlots || []) {
        for (const car of slot.cars || []) {
          if (car.status === 'waiting_parts' && car.partsNeeded) {
            const expectedArrival = new Date(car.partsNeeded.estimatedArrival);
            const hoursDelayed = (now.getTime() - expectedArrival.getTime()) / (1000 * 60 * 60);
            
            if (hoursDelayed >= WorkflowEfficiencyNotificationService.THRESHOLDS.partsDelayHours) {
              delayedCars.push({
                ...car,
                hoursDelayed: Math.floor(hoursDelayed),
                urgency: car.partsNeeded.urgency
              });
            }
          }
        }
      }

      if (delayedCars.length > 0) {
        await this.createEfficiencyAlert({
          type: 'parts_delay',
          severity: delayedCars.some(car => car.urgency === 'high') ? 'high' : 'medium',
          title: `Parts Delivery Delays Affecting ${delayedCars.length} Vehicle${delayedCars.length > 1 ? 's' : ''}`,
          description: `Expected parts deliveries are delayed, causing work stoppages and customer delays.`,
          affectedCars: delayedCars.map(car => car.carCode),
          affectedMechanics: [...new Set(delayedCars.map(car => car.assignedMechanic))],
          impactDescription: `${delayedCars.length} vehicles unable to proceed with repairs due to missing parts.`,
          financialImpact: this.calculatePartsDelayLoss(delayedCars),
          timeImpact: delayedCars.reduce((sum, car) => sum + car.hoursDelayed, 0),
          recommendedActions: [
            'Contact suppliers for updated delivery times',
            'Consider alternative part sources',
            'Reschedule affected vehicles',
            'Review supplier reliability'
          ],
          autoResolutionAvailable: true,
          location: 'Garage',
          department: 'Service'
        });
      }
    } catch (error) {
      console.error('Error checking parts delays:', error);
    }
  }

  // Check for workflow bottlenecks
  private async checkBottlenecks(): Promise<void> {
    try {
      const analytics = CarWorkflowService.getWorkflowAnalytics();
      
      if (analytics.bottlenecks.length > 0) {
        await this.createEfficiencyAlert({
          type: 'bottleneck',
          severity: analytics.bottlenecks.length > 2 ? 'high' : 'medium',
          title: `Workflow Bottlenecks Detected in ${analytics.bottlenecks.length} Stage${analytics.bottlenecks.length > 1 ? 's' : ''}`,
          description: `Multiple vehicles are accumulating in specific workflow stages, causing delays.`,
          affectedCars: [],
          affectedMechanics: [],
          impactDescription: `Bottlenecks in: ${analytics.bottlenecks.join(', ')}. This is slowing overall throughput.`,
          financialImpact: this.calculateBottleneckLoss(analytics.bottlenecks.length),
          timeImpact: analytics.bottlenecks.length * 2,
          recommendedActions: [
            'Redistribute resources to bottleneck stages',
            'Review workflow processes for optimization',
            'Consider temporary staff reallocation'
          ],
          autoResolutionAvailable: false,
          location: 'Multiple',
          department: 'Operations'
        });
      }
    } catch (error) {
      console.error('Error checking bottlenecks:', error);
    }
  }

  // Check for critical delays
  private async checkCriticalDelays(): Promise<void> {
    try {
      const carsNeedingAttention = CarWorkflowService.getCarsNeedingAttention();
      const criticalCars = carsNeedingAttention.filter(car => 
        car.priority === 'urgent' || 
        car.daysWaiting * 24 >= WorkflowEfficiencyNotificationService.THRESHOLDS.criticalDelayHours
      );

      if (criticalCars.length > 0) {
        await this.createEfficiencyAlert({
          type: 'critical_delay',
          severity: 'critical',
          title: `${criticalCars.length} Critical Delay${criticalCars.length > 1 ? 's' : ''} Detected`,
          description: `Vehicles have been waiting for critical periods, requiring immediate attention.`,
          affectedCars: criticalCars.map(car => car.carVin),
          affectedMechanics: [],
          impactDescription: `Critical delays may result in customer complaints, SLA breaches, and reputation damage.`,
          financialImpact: criticalCars.length * 500,
          timeImpact: criticalCars.reduce((sum, car) => sum + car.daysWaiting * 24, 0),
          recommendedActions: [
            'Prioritize critical vehicles immediately',
            'Allocate additional resources if needed',
            'Contact affected customers proactively'
          ],
          autoResolutionAvailable: true,
          location: 'Multiple',
          department: 'Service'
        });
      }
    } catch (error) {
      console.error('Error checking critical delays:', error);
    }
  }

  // Create and send efficiency alert to owner
  private async createEfficiencyAlert(alertData: Omit<EfficiencyAlert, 'id' | 'timestamp'>): Promise<void> {
    const alert: EfficiencyAlert = {
      ...alertData,
      id: `efficiency-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };

    // Save alert to storage
    this.saveEfficiencyAlert(alert);

    // Send notification to owner
    this.sendOwnerNotification(alert);
  }

  // Send notification to owner
  private sendOwnerNotification(alert: EfficiencyAlert): void {
    const notification = {
      title: `🚨 WORKFLOW ALERT: ${alert.title}`,
      description: `${alert.description} Financial Impact: $${alert.financialImpact.toFixed(2)} | Time Impact: ${alert.timeImpact.toFixed(1)}h`,
      priority: alert.severity === 'critical' ? 'urgent' : alert.severity === 'high' ? 'high' : 'medium',
      type: 'error' as const,
      link: '/garage-schedule',
      assignedTo: 'Owner'
    };

    // Log critical alerts immediately
    console.warn(`🚨 OWNER NOTIFICATION [${alert.severity.toUpperCase()}]:`, {
      title: alert.title,
      impact: `$${alert.financialImpact.toFixed(2)} / ${alert.timeImpact.toFixed(1)}h`,
      affectedCars: alert.affectedCars.length,
      location: alert.location,
      department: alert.department,
      actions: alert.recommendedActions
    });

    // In a real implementation, you would call the notification context here
    // For now, we'll trigger a browser notification if available
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`Workflow Alert: ${alert.title}`, {
        body: `${alert.description}\nImpact: $${alert.financialImpact.toFixed(2)}`,
        icon: '/favicon.ico',
        tag: alert.id
      });
    }
  }

  // Helper calculation methods
  private calculateOverrunLoss(overrunMinutes: number): number {
    const laborCostPerMinute = 1.25; // $75/hour = $1.25/minute
    const opportunityCostPerMinute = 0.83; // Lost scheduling efficiency
    return (overrunMinutes * (laborCostPerMinute + opportunityCostPerMinute));
  }

  private calculatePartsDelayLoss(delayedCars: any[]): number {
    return delayedCars.reduce((sum, car) => {
      const baseLoss = 150; // Base loss per delayed car
      const urgencyMultiplier = car.urgency === 'high' ? 2 : car.urgency === 'medium' ? 1.5 : 1;
      return sum + (baseLoss * urgencyMultiplier);
    }, 0);
  }

  private calculateBottleneckLoss(bottleneckCount: number): number {
    return bottleneckCount * 300; // $300 estimated loss per bottleneck
  }

  // Helper data methods
  private getScheduleData(): any {
    const today = new Date().toISOString().split('T')[0];
    const savedSchedule = localStorage.getItem(`garage_schedule_${today}`);
    return savedSchedule ? JSON.parse(savedSchedule) : { timeSlots: [] };
  }

  private saveEfficiencyAlert(alert: EfficiencyAlert): void {
    try {
      const existingAlerts = JSON.parse(localStorage.getItem(WorkflowEfficiencyNotificationService.EFFICIENCY_ALERTS_KEY) || '[]');
      existingAlerts.unshift(alert);
      
      // Keep only last 100 alerts
      const limitedAlerts = existingAlerts.slice(0, 100);
      localStorage.setItem(WorkflowEfficiencyNotificationService.EFFICIENCY_ALERTS_KEY, JSON.stringify(limitedAlerts));
    } catch (error) {
      console.error('Error saving efficiency alert:', error);
    }
  }

  // Public methods for accessing alerts
  static getEfficiencyAlerts(limit: number = 20): EfficiencyAlert[] {
    try {
      const alerts = JSON.parse(localStorage.getItem(WorkflowEfficiencyNotificationService.EFFICIENCY_ALERTS_KEY) || '[]');
      return alerts.slice(0, limit);
    } catch (error) {
      console.error('Error loading efficiency alerts:', error);
      return [];
    }
  }

  // Get efficiency metrics for dashboard
  static getEfficiencyMetrics(): EfficiencyMetrics {
    const alerts = this.getEfficiencyAlerts(50);
    const today = new Date().toISOString().split('T')[0];
    const todayAlerts = alerts.filter(alert => alert.timestamp.startsWith(today));

    return {
      averageOverrunTime: todayAlerts
        .filter(alert => alert.type === 'overrun')
        .reduce((sum, alert) => sum + alert.timeImpact, 0) / Math.max(1, todayAlerts.filter(alert => alert.type === 'overrun').length),
      dailyProductivityScore: Math.max(0, 100 - (todayAlerts.length * 5)),
      costEfficiencyRatio: this.calculateCostEfficiencyRatio(todayAlerts),
      completionRate: this.calculateCompletionRate(),
      customerSatisfactionImpact: Math.max(0, 100 - (todayAlerts.filter(alert => alert.severity === 'critical' || alert.severity === 'high').length * 10)),
      resourceUtilization: 75 // Placeholder
    };
  }

  private static calculateCostEfficiencyRatio(alerts: EfficiencyAlert[]): number {
    const totalLoss = alerts.reduce((sum, alert) => sum + alert.financialImpact, 0);
    const baseCost = 3000; // Daily operational cost
    return Math.max(0, 100 - ((totalLoss / baseCost) * 100));
  }

  private static calculateCompletionRate(): number {
    // This would calculate from actual completion data
    return 92; // Placeholder: 92% completion rate
  }

  // Start continuous monitoring with proper cleanup
  static startMonitoring(): void {
    // Clear existing interval if any
    this.stopMonitoring();

    // Monitor every 2 minutes
    this.monitoringInterval = setInterval(() => {
      this.monitorWorkflowEfficiency();
    }, 120000);

    // Initial check
    this.monitorWorkflowEfficiency();
    
    console.log('🔍 Workflow efficiency monitoring started - Owner will be notified immediately of any disruptions');
  }

  // Stop monitoring and cleanup
  static stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('🔍 Workflow efficiency monitoring stopped');
    }
  }

  // Check if monitoring is active
  static isMonitoringActive(): boolean {
    return this.monitoringInterval !== null;
  }

  // Manual trigger for testing
  static triggerManualCheck(): void {
    console.log('🔍 Running manual workflow efficiency check...');
    this.monitorWorkflowEfficiency();
  }
} 