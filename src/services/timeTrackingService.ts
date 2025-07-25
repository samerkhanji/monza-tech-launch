import { supabase } from '@/integrations/supabase/client';

// Time tracking event types
export type ActivityType = 
  | 'test_drive_employee'
  | 'test_drive_client' 
  | 'repair_start'
  | 'repair_progress'
  | 'repair_complete'
  | 'pdi_start'
  | 'pdi_complete'
  | 'client_interaction'
  | 'car_inspection'
  | 'car_movement'
  | 'part_installation'
  | 'quality_check'
  | 'delivery_preparation'
  | 'documentation'
  | 'cleanup'
  | 'training'
  | 'break'
  | 'other';

// Employee activity tracking interface
export interface TimeTrackingEvent {
  id?: string;
  employeeName: string;
  employeeEmail?: string;
  activityType: ActivityType;
  activityDescription: string;
  
  // Time stamps
  startTime: string; // ISO string
  endTime?: string; // ISO string (null if ongoing)
  
  // Duration calculations
  durationMinutes?: number;
  durationHours?: number;
  
  // Related entities
  carVin?: string;
  carModel?: string;
  clientName?: string;
  clientPhone?: string;
  repairId?: string;
  pdiId?: string;
  
  // Location and context
  location?: string;
  department?: string;
  workstation?: string;
  
  // Performance metrics
  estimatedDurationMinutes?: number;
  actualVsEstimated?: number; // Percentage difference
  efficiencyRating?: number; // 1-5 scale
  
  // Additional data
  notes?: string;
  issues?: string[];
  toolsUsed?: string[];
  partsUsed?: string[];
  
  // Metadata
  createdAt: string;
  updatedAt?: string;
  isActive?: boolean; // True if activity is ongoing
  sessionId?: string; // For grouping related activities
}

// Performance summary interfaces
export interface EmployeePerformanceSummary {
  employeeName: string;
  employeeEmail?: string;
  timePeriodd: {
    start: string;
    end: string;
  };
  totalHours: number;
  totalMinutes: number;
  activitiesCompleted: number;
  averageActivityDuration: number;
  efficiencyScore: number;
  activitiesByType: Record<ActivityType, {
    count: number;
    totalMinutes: number;
    averageMinutes: number;
    efficiencyScore: number;
  }>;
  carsWorkedOn: number;
  clientsServed: number;
  onTimePerformance: number; // Percentage
}

export interface ActivityAnalytics {
  activityType: ActivityType;
  totalOccurrences: number;
  averageDurationMinutes: number;
  fastestDurationMinutes: number;
  slowestDurationMinutes: number;
  totalTimeSpentMinutes: number;
  employeeRankings: {
    employeeName: string;
    averageDuration: number;
    totalActivities: number;
    efficiencyScore: number;
  }[];
}

class TimeTrackingService {
  private activeActivities: Map<string, TimeTrackingEvent> = new Map();

  // Start tracking an activity
  async startActivity(activity: Omit<TimeTrackingEvent, 'id' | 'createdAt' | 'isActive'>): Promise<string> {
    const now = new Date().toISOString();
    const sessionId = crypto.randomUUID();
    
    const event: TimeTrackingEvent = {
      ...activity,
      id: crypto.randomUUID(),
      createdAt: now,
      isActive: true,
      sessionId,
      startTime: activity.startTime || now
    };

    // Store in memory for quick access
    this.activeActivities.set(event.id!, event);

    try {
      // Save to localStorage instead of database for now
      const existingData = localStorage.getItem('timeTrackingEvents');
      const events = existingData ? JSON.parse(existingData) : [];
      events.push(event);
      localStorage.setItem('timeTrackingEvents', JSON.stringify(events));
      
      console.log(`Started tracking: ${event.activityType} by ${event.employeeName}`);
      return event.id!;
    } catch (error) {
      console.error('Error starting activity tracking:', error);
      // Keep in memory even if storage fails
      return event.id!;
    }
  }

  // End tracking an activity
  async endActivity(activityId: string, endData?: Partial<TimeTrackingEvent>): Promise<TimeTrackingEvent | null> {
    const activity = this.activeActivities.get(activityId);
    if (!activity) {
      console.warn(`Activity ${activityId} not found in active activities`);
      return null;
    }

    const now = new Date().toISOString();
    const startTime = new Date(activity.startTime);
    const endTime = new Date(now);
    const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
    const durationHours = Math.round((durationMinutes / 60) * 100) / 100;

    // Calculate efficiency if estimated duration was provided
    let actualVsEstimated: number | undefined;
    let efficiencyRating: number | undefined;
    
    if (activity.estimatedDurationMinutes) {
      actualVsEstimated = Math.round(((durationMinutes - activity.estimatedDurationMinutes) / activity.estimatedDurationMinutes) * 100);
      // Efficiency rating: 5 = way faster, 4 = faster, 3 = on time, 2 = slower, 1 = much slower
      if (actualVsEstimated <= -20) efficiencyRating = 5;
      else if (actualVsEstimated <= -10) efficiencyRating = 4;
      else if (actualVsEstimated <= 10) efficiencyRating = 3;
      else if (actualVsEstimated <= 25) efficiencyRating = 2;
      else efficiencyRating = 1;
    }

    const updatedActivity: TimeTrackingEvent = {
      ...activity,
      ...endData,
      endTime: now,
      durationMinutes,
      durationHours,
      actualVsEstimated,
      efficiencyRating,
      updatedAt: now,
      isActive: false
    };

    // Remove from active tracking
    this.activeActivities.delete(activityId);

    try {
      // Update in localStorage
      const existingData = localStorage.getItem('timeTrackingEvents');
      const events = existingData ? JSON.parse(existingData) : [];
      const updatedEvents = events.map((e: TimeTrackingEvent) =>
        e.id === activityId ? updatedActivity : e
      );
      localStorage.setItem('timeTrackingEvents', JSON.stringify(updatedEvents));
      
      console.log(`Completed tracking: ${updatedActivity.activityType} by ${updatedActivity.employeeName} - Duration: ${durationMinutes}min`);
      return updatedActivity;
    } catch (error) {
      console.error('Error ending activity tracking:', error);
      return updatedActivity;
    }
  }

  // Quick log for completed activities (when start/end happen immediately)
  async logCompletedActivity(activity: Omit<TimeTrackingEvent, 'id' | 'createdAt' | 'isActive' | 'durationMinutes' | 'durationHours'>): Promise<string> {
    const startTime = new Date(activity.startTime);
    const endTime = new Date(activity.endTime!);
    const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
    const durationHours = Math.round((durationMinutes / 60) * 100) / 100;

    let actualVsEstimated: number | undefined;
    let efficiencyRating: number | undefined;
    
    if (activity.estimatedDurationMinutes) {
      actualVsEstimated = Math.round(((durationMinutes - activity.estimatedDurationMinutes) / activity.estimatedDurationMinutes) * 100);
      if (actualVsEstimated <= -20) efficiencyRating = 5;
      else if (actualVsEstimated <= -10) efficiencyRating = 4;
      else if (actualVsEstimated <= 10) efficiencyRating = 3;
      else if (actualVsEstimated <= 25) efficiencyRating = 2;
      else efficiencyRating = 1;
    }

    const event: TimeTrackingEvent = {
      ...activity,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      durationMinutes,
      durationHours,
      actualVsEstimated,
      efficiencyRating,
      isActive: false
    };

    try {
      // Log to localStorage
      const existingData = localStorage.getItem('timeTrackingEvents');
      const events = existingData ? JSON.parse(existingData) : [];
      events.push(event);
      localStorage.setItem('timeTrackingEvents', JSON.stringify(events));
      
      console.log(`Logged completed activity: ${event.activityType} by ${event.employeeName} - Duration: ${durationMinutes}min`);
      return event.id!;
    } catch (error) {
      console.error('Error logging completed activity:', error);
      return event.id!;
    }
  }

  // Get active activities for an employee
  getActiveActivities(employeeName?: string): TimeTrackingEvent[] {
    const activities = Array.from(this.activeActivities.values());
    if (employeeName) {
      return activities.filter(a => a.employeeName === employeeName);
    }
    return activities;
  }

  // Get employee performance summary
  async getEmployeePerformance(employeeName: string, startDate: string, endDate: string): Promise<EmployeePerformanceSummary | null> {
    try {
      const existingData = localStorage.getItem('timeTrackingEvents');
      if (!existingData) return null;

      const activities = JSON.parse(existingData) as TimeTrackingEvent[];
      const filteredActivities = activities.filter(a =>
        a.employeeName === employeeName &&
        a.startTime >= startDate &&
        a.startTime <= endDate &&
        !a.isActive
      );

      if (filteredActivities.length === 0) return null;

      const totalMinutes = filteredActivities.reduce((sum, a) => sum + (a.durationMinutes || 0), 0);
      const totalHours = Math.round((totalMinutes / 60) * 100) / 100;
      const averageActivityDuration = Math.round(totalMinutes / filteredActivities.length);
      const efficiencyScore = filteredActivities.reduce((sum, a) => sum + (a.efficiencyRating || 3), 0) / filteredActivities.length;

      const activitiesByType: Record<ActivityType, any> = {} as any;
      const uniqueCars = new Set<string>();
      const uniqueClients = new Set<string>();
      let onTimeCount = 0;

      filteredActivities.forEach(activity => {
        if (activity.carVin) uniqueCars.add(activity.carVin);
        if (activity.clientName) uniqueClients.add(activity.clientName);
        if (activity.efficiencyRating && activity.efficiencyRating >= 3) onTimeCount++;

        if (!activitiesByType[activity.activityType]) {
          activitiesByType[activity.activityType] = {
            count: 0,
            totalMinutes: 0,
            averageMinutes: 0,
            efficiencyScore: 0
          };
        }

        const typeData = activitiesByType[activity.activityType];
        typeData.count++;
        typeData.totalMinutes += activity.durationMinutes || 0;
        typeData.efficiencyScore += activity.efficiencyRating || 3;
      });

      // Calculate averages for each activity type
      Object.values(activitiesByType).forEach((typeData: any) => {
        typeData.averageMinutes = Math.round(typeData.totalMinutes / typeData.count);
        typeData.efficiencyScore = typeData.efficiencyScore / typeData.count;
      });

      return {
        employeeName,
        timePeriodd: { start: startDate, end: endDate },
        totalHours,
        totalMinutes,
        activitiesCompleted: filteredActivities.length,
        averageActivityDuration,
        efficiencyScore,
        activitiesByType,
        carsWorkedOn: uniqueCars.size,
        clientsServed: uniqueClients.size,
        onTimePerformance: Math.round((onTimeCount / filteredActivities.length) * 100)
      };
    } catch (error) {
      console.error('Error getting employee performance:', error);
      return null;
    }
  }

  // Get activity analytics
  async getActivityAnalytics(activityType: ActivityType, startDate: string, endDate: string): Promise<ActivityAnalytics | null> {
    try {
      const existingData = localStorage.getItem('timeTrackingEvents');
      if (!existingData) return null;

      const activities = JSON.parse(existingData) as TimeTrackingEvent[];
      const filteredActivities = activities.filter(a =>
        a.activityType === activityType &&
        a.startTime >= startDate &&
        a.startTime <= endDate &&
        a.endTime !== null
      );

      if (filteredActivities.length === 0) return null;

      const durations = filteredActivities.map(a => a.durationMinutes || 0);
      const totalTimeSpent = durations.reduce((sum, d) => sum + d, 0);
      const averageDuration = Math.round(totalTimeSpent / filteredActivities.length);

      // Employee rankings
      const employeeStats: Record<string, { totalDuration: number; count: number; efficiencySum: number }> = {};
      
      filteredActivities.forEach(activity => {
        if (!employeeStats[activity.employeeName]) {
          employeeStats[activity.employeeName] = { totalDuration: 0, count: 0, efficiencySum: 0 };
        }
        employeeStats[activity.employeeName].totalDuration += activity.durationMinutes || 0;
        employeeStats[activity.employeeName].count++;
        employeeStats[activity.employeeName].efficiencySum += activity.efficiencyRating || 3;
      });

      const employeeRankings = Object.entries(employeeStats).map(([name, stats]) => ({
        employeeName: name,
        averageDuration: Math.round(stats.totalDuration / stats.count),
        totalActivities: stats.count,
        efficiencyScore: stats.efficiencySum / stats.count
      })).sort((a, b) => a.averageDuration - b.averageDuration);

      return {
        activityType,
        totalOccurrences: filteredActivities.length,
        averageDurationMinutes: averageDuration,
        fastestDurationMinutes: Math.min(...durations),
        slowestDurationMinutes: Math.max(...durations),
        totalTimeSpentMinutes: totalTimeSpent,
        employeeRankings
      };
    } catch (error) {
      console.error('Error getting activity analytics:', error);
      return null;
    }
  }

  // Get all time tracking data for reporting
  async getAllTimeTrackingData(startDate?: string, endDate?: string): Promise<TimeTrackingEvent[]> {
    try {
      const existingData = localStorage.getItem('timeTrackingEvents');
      if (!existingData) return [];

      const activities = JSON.parse(existingData) as TimeTrackingEvent[];
      const filteredActivities = activities.filter(a =>
        (!startDate || a.startTime >= startDate) &&
        (!endDate || a.startTime < endDate)
      );

      return filteredActivities;
    } catch (error) {
      console.error('Error getting time tracking data:', error);
      return [];
    }
  }

  // Helper method to format duration
  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }

  // Helper method to calculate efficiency percentage
  calculateEfficiencyPercentage(actual: number, estimated: number): number {
    if (estimated === 0) return 100;
    return Math.round(((estimated - actual) / estimated) * 100);
  }
}

// Create and export singleton instance
export const timeTrackingService = new TimeTrackingService();

// Convenience functions for common activities
export const trackTestDrive = {
  start: (employeeName: string, carVin: string, carModel: string, clientName?: string, isClient: boolean = false) => {
    return timeTrackingService.startActivity({
      employeeName,
      activityType: isClient ? 'test_drive_client' : 'test_drive_employee',
      activityDescription: `${isClient ? 'Client' : 'Employee'} test drive - ${carModel}${clientName ? ` for ${clientName}` : ''}`,
      startTime: new Date().toISOString(),
      carVin,
      carModel,
      clientName,
      estimatedDurationMinutes: isClient ? 30 : 15,
      location: 'Test Drive Route',
      department: 'Sales'
    });
  },
  
  end: (activityId: string, notes?: string, issues?: string[]) => {
    return timeTrackingService.endActivity(activityId, { notes, issues });
  }
};

export const trackRepair = {
  start: (employeeName: string, carVin: string, carModel: string, repairDescription: string, estimatedHours: number) => {
    return timeTrackingService.startActivity({
      employeeName,
      activityType: 'repair_start',
      activityDescription: `Repair: ${repairDescription} on ${carModel}`,
      startTime: new Date().toISOString(),
      carVin,
      carModel,
      estimatedDurationMinutes: estimatedHours * 60,
      location: 'Garage',
      department: 'Service'
    });
  },
  
  end: (activityId: string, partsUsed?: string[], toolsUsed?: string[], notes?: string) => {
    return timeTrackingService.endActivity(activityId, { partsUsed, toolsUsed, notes });
  }
};

export const trackClientInteraction = {
  log: (employeeName: string, clientName: string, clientPhone: string, interactionType: string, durationMinutes: number, carVin?: string) => {
    const now = new Date();
    const startTime = new Date(now.getTime() - (durationMinutes * 60 * 1000));
    
    return timeTrackingService.logCompletedActivity({
      employeeName,
      activityType: 'client_interaction',
      activityDescription: `${interactionType} with ${clientName}`,
      startTime: startTime.toISOString(),
      endTime: now.toISOString(),
      clientName,
      clientPhone,
      carVin,
      location: 'Showroom',
      department: 'Sales'
    });
  }
}; 