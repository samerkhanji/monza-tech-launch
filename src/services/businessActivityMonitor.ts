import { ComprehensiveNotificationService } from './comprehensiveNotificationService';

class BusinessActivityMonitor {
  private static isInitialized = false;
  private static activityLog: any[] = [];

  // Initialize monitoring system
  static initialize() {
    if (this.isInitialized) return;
    
    this.isInitialized = true;
    this.setupGlobalErrorHandler();
    this.setupPerformanceMonitoring();
    this.setupWorkflowTracking();
    
    console.log('🔍 Business Activity Monitor initialized');
  }

  // Global error handler for system errors
  private static setupGlobalErrorHandler() {
    // Capture JavaScript errors
    window.addEventListener('error', (event) => {
      this.reportSystemError(
        'JavaScript Error',
        `${event.message} at ${event.filename}:${event.lineno}`,
        'software',
        'medium'
      );
    });

    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.reportSystemError(
        'Unhandled Promise Rejection',
        event.reason?.toString() || 'Unknown promise rejection',
        'software',
        'high'
      );
    });

    // Capture console errors (optional)
    const originalError = console.error;
    console.error = (...args) => {
      if (args[0] && typeof args[0] === 'string' && !args[0].includes('🚨')) {
        this.reportSystemError(
          'Console Error',
          args.join(' '),
          'software',
          'low'
        );
      }
      originalError.apply(console, args);
    };
  }

  // Performance monitoring
  private static setupPerformanceMonitoring() {
    // Monitor page load times
    if ('performance' in window) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const loadTime = performance.now();
          if (loadTime > 3000) { // More than 3 seconds
            this.reportEfficiencyIssue(
              'Slow Page Load',
              `Page took ${(loadTime / 1000).toFixed(2)} seconds to load`,
              {
                financial: Math.round(loadTime / 100), // Estimate cost
                timeMinutes: Math.round(loadTime / 60000),
                customerSatisfaction: loadTime > 5000 ? 'high' : 'medium',
                workflowDisruption: 'minor'
              },
              'software'
            );
          }
        }, 100);
      });
    }
  }

  // Workflow tracking system
  private static setupWorkflowTracking() {
    // Track form submission failures
    this.trackFormSubmissions();
    
    // Track navigation errors
    this.trackNavigationIssues();
    
    // Track data loading failures
    this.trackDataLoadingIssues();
  }

  // Track form submission issues
  private static trackFormSubmissions() {
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement;
      const formData = new FormData(form);
      
      // Check for empty required fields
      const requiredFields = form.querySelectorAll('[required]');
      const emptyRequiredFields: string[] = [];
      
      requiredFields.forEach((field: any) => {
        if (!field.value || field.value.trim() === '') {
          emptyRequiredFields.push(field.name || field.id || 'unknown field');
        }
      });

      if (emptyRequiredFields.length > 0) {
        this.reportWorkflowDisruption(
          'Form Submission Error',
          `Required fields missing: ${emptyRequiredFields.join(', ')}`,
          {
            financial: 50,
            timeMinutes: 5,
            customerSatisfaction: 'medium',
            workflowDisruption: 'minor'
          },
          'showroom'
        );
      }
    });
  }

  // Track navigation issues
  private static trackNavigationIssues() {
    let navigationStartTime = Date.now();
    
    window.addEventListener('beforeunload', () => {
      navigationStartTime = Date.now();
    });

    window.addEventListener('load', () => {
      const navigationTime = Date.now() - navigationStartTime;
      if (navigationTime > 5000) {
        this.reportEfficiencyIssue(
          'Slow Navigation',
          `Page navigation took ${(navigationTime / 1000).toFixed(2)} seconds`,
          {
            financial: 25,
            timeMinutes: Math.round(navigationTime / 60000),
            customerSatisfaction: 'low',
            workflowDisruption: 'minor'
          },
          'software'
        );
      }
    });
  }

  // Track data loading issues
  private static trackDataLoadingIssues() {
    // Monitor fetch requests
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = Date.now();
      try {
        const response = await originalFetch(...args);
        const loadTime = Date.now() - startTime;
        
        if (!response.ok) {
          this.reportSystemError(
            'API Request Failed',
            `${args[0]} returned ${response.status}: ${response.statusText}`,
            'software',
            response.status >= 500 ? 'high' : 'medium'
          );
        } else if (loadTime > 5000) {
          this.reportEfficiencyIssue(
            'Slow API Response',
            `API call to ${args[0]} took ${(loadTime / 1000).toFixed(2)} seconds`,
            {
              financial: 30,
              timeMinutes: Math.round(loadTime / 60000),
              customerSatisfaction: 'low',
              workflowDisruption: 'minor'
            },
            'software'
          );
        }
        
        return response;
      } catch (error) {
        this.reportSystemError(
          'Network Error',
          `Failed to fetch ${args[0]}: ${error}`,
          'software',
          'high'
        );
        throw error;
      }
    };
  }

  // Car-specific monitoring
  static monitorCarWorkflow(carId: string, action: string, location: string) {
    this.logActivity('car_workflow', { carId, action, location });
    
    // Detect potential issues
    const recentActions = this.getRecentActivities('car_workflow', 30); // Last 30 minutes
    const sameCarActions = recentActions.filter(a => a.data.carId === carId);
    
    if (sameCarActions.length > 10) {
      this.reportWorkflowDisruption(
        'Excessive Car Activity',
        `Car ${carId} has had ${sameCarActions.length} actions in the last 30 minutes`,
        {
          financial: 200,
          timeMinutes: 30,
          customerSatisfaction: 'medium',
          workflowDisruption: 'moderate'
        },
        location
      );
    }
  }

  // Inventory monitoring
  static monitorInventoryChanges(itemType: string, action: string, quantity?: number) {
    this.logActivity('inventory', { itemType, action, quantity });
    
    if (action === 'shortage' || (quantity !== undefined && quantity < 5)) {
      this.reportInventoryIssue(
        'Low Inventory Warning',
        `${itemType} inventory is running low${quantity !== undefined ? ` (${quantity} remaining)` : ''}`,
        itemType,
        {
          financial: quantity === 0 ? 1000 : 500,
          timeMinutes: 120,
          customerSatisfaction: quantity === 0 ? 'high' : 'medium',
          workflowDisruption: quantity === 0 ? 'major' : 'moderate'
        }
      );
    }
  }

  // Schedule monitoring
  static monitorScheduleIssues(eventType: string, scheduledTime: Date, actualTime?: Date) {
    this.logActivity('schedule', { eventType, scheduledTime, actualTime });
    
    if (actualTime && scheduledTime) {
      const delayMinutes = (actualTime.getTime() - scheduledTime.getTime()) / (1000 * 60);
      
      if (delayMinutes > 30) {
        this.reportScheduleIssue(
          'Schedule Delay',
          `${eventType} is running ${Math.round(delayMinutes)} minutes behind schedule`,
          {
            financial: delayMinutes * 5, // $5 per minute delay
            timeMinutes: delayMinutes,
            customerSatisfaction: delayMinutes > 60 ? 'high' : 'medium',
            workflowDisruption: delayMinutes > 120 ? 'major' : 'moderate'
          }
        );
      }
    }
  }

  // Test drive monitoring
  static monitorTestDrive(carId: string, duration: number, issues?: string[]) {
    this.logActivity('testdrive', { carId, duration, issues });
    
    if (issues && issues.length > 0) {
      this.reportTestDriveIssue(
        'Test Drive Issues',
        `Test drive for car ${carId} had issues: ${issues.join(', ')}`,
        carId,
        issues.length > 2 ? 'high' : 'medium'
      );
    }
    
    if (duration > 120) { // More than 2 hours
      this.reportEfficiencyIssue(
        'Extended Test Drive',
        `Test drive for car ${carId} lasted ${duration} minutes`,
        {
          financial: (duration - 120) * 2, // $2 per extra minute
          timeMinutes: duration - 120,
          customerSatisfaction: 'low',
          workflowDisruption: 'minor'
        },
        'showroom'
      );
    }
  }

  // Garage efficiency monitoring
  static monitorGarageEfficiency(mechanicId: string, taskType: string, estimatedTime: number, actualTime: number) {
    this.logActivity('garage_efficiency', { mechanicId, taskType, estimatedTime, actualTime });
    
    const efficiency = estimatedTime / actualTime;
    
    if (efficiency < 0.7) { // More than 30% over estimated time
      this.reportEfficiencyIssue(
        'Garage Task Overrun',
        `${taskType} by ${mechanicId} took ${actualTime}min (estimated: ${estimatedTime}min)`,
        {
          financial: (actualTime - estimatedTime) * 3,
          timeMinutes: actualTime - estimatedTime,
          customerSatisfaction: 'medium',
          workflowDisruption: 'moderate'
        },
        'garage'
      );
    }
  }

  // Customer interaction monitoring
  static monitorCustomerInteraction(interactionType: string, duration: number, satisfaction?: number) {
    this.logActivity('customer', { interactionType, duration, satisfaction });
    
    if (satisfaction !== undefined && satisfaction < 3) { // 1-5 scale
      this.reportCustomerIssue(
        'Low Customer Satisfaction',
        `${interactionType} received ${satisfaction}/5 satisfaction rating`,
        {
          financial: (5 - satisfaction) * 100,
          timeMinutes: duration,
          customerSatisfaction: 'high',
          workflowDisruption: 'minor'
        }
      );
    }
  }

  // Financial monitoring
  static monitorFinancialTransaction(type: string, amount: number, expected?: number) {
    this.logActivity('financial', { type, amount, expected });
    
    if (expected && Math.abs(amount - expected) > expected * 0.1) { // 10% variance
      this.reportFinancialIssue(
        'Financial Variance',
        `${type} amount (${amount}) differs from expected (${expected}) by ${Math.abs(amount - expected)}`,
        {
          financial: Math.abs(amount - expected),
          timeMinutes: 15,
          customerSatisfaction: 'low',
          workflowDisruption: 'minor'
        }
      );
    }
  }

  // Convenience methods using ComprehensiveNotificationService
  private static reportWorkflowDisruption(title: string, description: string, impact: any, location: string) {
    ComprehensiveNotificationService.addNotification({
      title,
      description,
      category: 'workflow',
      severity: impact.workflowDisruption === 'major' ? 'critical' : 'high',
      location,
      affectedSystems: ['workflow'],
      estimatedImpact: impact,
      source: 'activity-monitor'
    });
  }

  private static reportEfficiencyIssue(title: string, description: string, impact: any, location: string) {
    ComprehensiveNotificationService.addNotification({
      title,
      description,
      category: 'efficiency',
      severity: impact.financial > 200 ? 'high' : 'medium',
      location,
      affectedSystems: ['operations'],
      estimatedImpact: impact,
      source: 'activity-monitor'
    });
  }

  private static reportSystemError(title: string, description: string, location: string, severity: 'low' | 'medium' | 'high' | 'critical' = 'medium') {
    ComprehensiveNotificationService.addNotification({
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
      source: 'activity-monitor'
    });
  }

  private static reportInventoryIssue(title: string, description: string, itemId: string, impact: any) {
    ComprehensiveNotificationService.addNotification({
      title,
      description,
      category: 'inventory',
      severity: 'medium',
      location: 'inventory',
      affectedSystems: ['inventory'],
      estimatedImpact: impact,
      source: 'activity-monitor'
    });
  }

  private static reportScheduleIssue(title: string, description: string, impact: any) {
    ComprehensiveNotificationService.addNotification({
      title,
      description,
      category: 'schedule',
      severity: 'medium',
      location: 'schedule',
      affectedSystems: ['schedule', 'garage'],
      estimatedImpact: impact,
      source: 'activity-monitor'
    });
  }

  private static reportTestDriveIssue(title: string, description: string, carId: string, severity: 'low' | 'medium' | 'high' | 'critical' = 'medium') {
    ComprehensiveNotificationService.addNotification({
      title,
      description,
      category: 'testdrive',
      severity,
      location: 'showroom',
      affectedSystems: ['showroom', 'schedule'],
      estimatedImpact: {
        financial: 200,
        timeMinutes: 60,
        customerSatisfaction: 'high',
        workflowDisruption: 'moderate'
      },
      source: 'activity-monitor'
    });
  }

  private static reportCustomerIssue(title: string, description: string, impact: any) {
    ComprehensiveNotificationService.addNotification({
      title,
      description,
      category: 'customer',
      severity: 'high',
      location: 'showroom',
      affectedSystems: ['showroom', 'customer'],
      estimatedImpact: impact,
      source: 'activity-monitor'
    });
  }

  private static reportFinancialIssue(title: string, description: string, impact: any) {
    ComprehensiveNotificationService.addNotification({
      title,
      description,
      category: 'financial',
      severity: impact.financial > 500 ? 'high' : 'medium',
      location: 'financial',
      affectedSystems: ['financial'],
      estimatedImpact: impact,
      source: 'activity-monitor'
    });
  }

  // Activity logging
  private static logActivity(type: string, data: any) {
    const activity = {
      id: Date.now().toString(),
      type,
      timestamp: new Date().toISOString(),
      data
    };
    
    this.activityLog.unshift(activity);
    
    // Keep only last 1000 activities
    if (this.activityLog.length > 1000) {
      this.activityLog = this.activityLog.slice(0, 1000);
    }
  }

  // Get recent activities
  private static getRecentActivities(type: string, minutes: number) {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    return this.activityLog.filter(activity => 
      activity.type === type && new Date(activity.timestamp) > cutoff
    );
  }

  // Generate sample issues for demonstration
  static generateSampleIssues() {
    // Simulate various business issues
    setTimeout(() => {
      this.reportWorkflowDisruption(
        'Parts Delivery Delay',
        'Brake pad shipment is 3 hours late, affecting 2 scheduled repairs',
        {
          financial: 450,
          timeMinutes: 180,
          customerSatisfaction: 'high',
          workflowDisruption: 'moderate'
        },
        'garage'
      );
    }, 2000);

    setTimeout(() => {
      this.reportEfficiencyIssue(
        'Slow VIN Processing',
        'VIN scanner taking average 45 seconds per scan (target: 15 seconds)',
        {
          financial: 150,
          timeMinutes: 30,
          customerSatisfaction: 'medium',
          workflowDisruption: 'minor'
        },
        'showroom'
      );
    }, 5000);

    setTimeout(() => {
      this.reportTestDriveIssue(
        'Test Drive Incident',
        'Customer reported unusual noise during test drive of VY-2024-003',
        'VY-2024-003',
        'high'
      );
    }, 8000);

    setTimeout(() => {
      this.reportFinancialIssue(
        'Payment Processing Error',
        'Credit card payment failed for car sale - manual verification needed',
        {
          financial: 25000,
          timeMinutes: 45,
          customerSatisfaction: 'high',
          workflowDisruption: 'moderate'
        }
      );
    }, 12000);

    // Additional issues that disrupt efficiency or cause problems
    setTimeout(() => {
      ComprehensiveNotificationService.addNotification({
        title: 'Shipment Tracking Lost',
        description: 'Shipment #SH-2024-089 GPS tracking has been lost for 6 hours',
        category: 'shipment',
        severity: 'high',
        location: 'warehouse',
        affectedSystems: ['shipment', 'inventory'],
        estimatedImpact: {
          financial: 800,
          timeMinutes: 120,
          customerSatisfaction: 'high',
          workflowDisruption: 'moderate'
        },
        source: 'shipment-monitor'
      });
    }, 15000);

    setTimeout(() => {
      ComprehensiveNotificationService.addNotification({
        title: 'Last-Second Schedule Change',
        description: 'Customer moved test drive appointment 10 minutes before scheduled time',
        category: 'schedule',
        severity: 'medium',
        location: 'showroom',
        affectedSystems: ['schedule', 'showroom'],
        estimatedImpact: {
          financial: 100,
          timeMinutes: 30,
          customerSatisfaction: 'medium',
          workflowDisruption: 'moderate'
        },
        source: 'schedule-monitor'
      });
    }, 18000);

    setTimeout(() => {
      ComprehensiveNotificationService.addNotification({
        title: 'Data Entry Mistake',
        description: 'Wrong VIN entered for car VY-2024-007, causing inventory mismatch',
        category: 'error',
        severity: 'high',
        location: 'showroom',
        affectedSystems: ['inventory', 'showroom'],
        estimatedImpact: {
          financial: 300,
          timeMinutes: 60,
          customerSatisfaction: 'medium',
          workflowDisruption: 'major'
        },
        source: 'data-monitor'
      });
    }, 21000);

    setTimeout(() => {
      ComprehensiveNotificationService.addNotification({
        title: 'Software Bug Detected',
        description: 'PDI form not saving properly, causing data loss issues',
        category: 'software',
        severity: 'critical',
        location: 'software',
        affectedSystems: ['software', 'workflow'],
        estimatedImpact: {
          financial: 600,
          timeMinutes: 90,
          customerSatisfaction: 'high',
          workflowDisruption: 'major'
        },
        source: 'system-monitor'
      });
    }, 24000);
  }
}

export { BusinessActivityMonitor }; 