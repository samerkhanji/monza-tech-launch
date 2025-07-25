import { useState, useEffect, useCallback } from 'react';
import { timeTrackingService, ActivityType, trackTestDrive, trackRepair, trackClientInteraction } from '@/services/timeTrackingService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface UseTimeTrackingOptions {
  activityType?: ActivityType;
  activityDescription?: string;
  carVin?: string;
  carModel?: string;
  clientName?: string;
  clientPhone?: string;
  estimatedDurationMinutes?: number;
  location?: string;
  department?: string;
  autoTrack?: boolean; // Automatically start tracking when conditions are met
  showNotifications?: boolean;
}

interface UseTimeTrackingReturn {
  // State
  isTracking: boolean;
  activeActivityId: string | null;
  elapsedTime: number;
  
  // Actions
  startTracking: (overrides?: Partial<UseTimeTrackingOptions>) => Promise<string | null>;
  endTracking: (notes?: string, issues?: string[]) => Promise<any>;
  
  // Utilities
  formatTime: (seconds: number) => string;
  
  // Specialized tracking methods
  trackTestDrive: {
    start: (isClient?: boolean) => Promise<string | null>;
    end: (notes?: string, issues?: string[]) => Promise<any>;
  };
  trackRepair: {
    start: (repairDescription: string, estimatedHours: number) => Promise<string | null>;
    end: (partsUsed?: string[], toolsUsed?: string[], notes?: string) => Promise<any>;
  };
  trackClientInteraction: {
    log: (interactionType: string, durationMinutes: number) => Promise<string | null>;
  };
}

export const useTimeTracking = (options: UseTimeTrackingOptions = {}): UseTimeTrackingReturn => {
  const { user } = useAuth();
  const [isTracking, setIsTracking] = useState(false);
  const [activeActivityId, setActiveActivityId] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);

  const {
    activityType,
    activityDescription,
    carVin,
    carModel,
    clientName,
    clientPhone,
    estimatedDurationMinutes,
    location = 'Workplace',
    department = 'General',
    autoTrack = false,
    showNotifications = true
  } = options;

  // Timer effect for elapsed time
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isTracking && startTime) {
      interval = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        setElapsedTime(elapsed);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTracking, startTime]);

  // Auto-track when conditions are met
  useEffect(() => {
    if (autoTrack && activityType && activityDescription && !isTracking && user) {
      startTracking();
    }
  }, [autoTrack, activityType, activityDescription, isTracking, user]);

  const formatTime = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const startTracking = useCallback(async (overrides: Partial<UseTimeTrackingOptions> = {}): Promise<string | null> => {
    if (!user) {
      console.error('User not authenticated for time tracking');
      return null;
    }

    if (isTracking) {
      console.warn('Activity tracking already in progress');
      return activeActivityId;
    }

    const config = { ...options, ...overrides };
    
    if (!config.activityType || !config.activityDescription) {
      console.error('Activity type and description required for tracking');
      return null;
    }

    try {
      const employeeName = (user as any)?.user_metadata?.full_name || user.email || 'Unknown Employee';
      
      const activityId = await timeTrackingService.startActivity({
        employeeName,
        employeeEmail: user.email,
        activityType: config.activityType,
        activityDescription: config.activityDescription,
        startTime: new Date().toISOString(),
        carVin: config.carVin,
        carModel: config.carModel,
        clientName: config.clientName,
        estimatedDurationMinutes: config.estimatedDurationMinutes,
        location: config.location,
        department: config.department
      });

      setActiveActivityId(activityId);
      setIsTracking(true);
      setStartTime(new Date());
      setElapsedTime(0);

      if (showNotifications) {
        toast({
          title: "Activity Tracking Started",
          description: `Now tracking: ${config.activityDescription}`,
          duration: 3000
        });
      }

      return activityId;
    } catch (error) {
      console.error('Error starting activity tracking:', error);
      if (showNotifications) {
        toast({
          title: "Tracking Error",
          description: "Failed to start activity tracking",
          variant: "destructive"
        });
      }
      return null;
    }
  }, [user, options, isTracking, activeActivityId, showNotifications]);

  const endTracking = useCallback(async (notes?: string, issues?: string[]): Promise<any> => {
    if (!activeActivityId || !isTracking) {
      console.warn('No active activity to end');
      return null;
    }

    try {
      const result = await timeTrackingService.endActivity(activeActivityId, { notes, issues });
      
      setActiveActivityId(null);
      setIsTracking(false);
      setStartTime(null);
      setElapsedTime(0);

      if (showNotifications && result) {
        toast({
          title: "Activity Completed",
          description: `Completed in ${timeTrackingService.formatDuration(result.durationMinutes || 0)}`,
          duration: 5000
        });
      }

      return result;
    } catch (error) {
      console.error('Error ending activity tracking:', error);
      if (showNotifications) {
        toast({
          title: "Tracking Error",
          description: "Failed to end activity tracking",
          variant: "destructive"
        });
      }
      return null;
    }
  }, [activeActivityId, isTracking, showNotifications]);

  // Specialized tracking methods
  const testDriveTracking = {
    start: async (isClient: boolean = false): Promise<string | null> => {
      if (!user || !carVin || !carModel) {
        console.error('Missing required data for test drive tracking');
        return null;
      }

      const employeeName = (user as any)?.user_metadata?.full_name || user.email || 'Unknown Employee';
      
      try {
        const activityId = await trackTestDrive.start(
          employeeName,
          carVin,
          carModel,
          clientName,
          isClient
        );

        setActiveActivityId(activityId);
        setIsTracking(true);
        setStartTime(new Date());
        setElapsedTime(0);

        if (showNotifications) {
          toast({
            title: "Test Drive Started",
            description: `${isClient ? 'Client' : 'Employee'} test drive tracking started`,
            duration: 3000
          });
        }

        return activityId;
      } catch (error) {
        console.error('Error starting test drive tracking:', error);
        return null;
      }
    },

    end: async (notes?: string, issues?: string[]): Promise<any> => {
      if (!activeActivityId) return null;
      
      try {
        const result = await trackTestDrive.end(activeActivityId, notes, issues);
        
        setActiveActivityId(null);
        setIsTracking(false);
        setStartTime(null);
        setElapsedTime(0);

        return result;
      } catch (error) {
        console.error('Error ending test drive tracking:', error);
        return null;
      }
    }
  };

  const repairTracking = {
    start: async (repairDescription: string, estimatedHours: number): Promise<string | null> => {
      if (!user || !carVin || !carModel) {
        console.error('Missing required data for repair tracking');
        return null;
      }

      const employeeName = (user as any)?.user_metadata?.full_name || user.email || 'Unknown Employee';
      
      try {
        const activityId = await trackRepair.start(
          employeeName,
          carVin,
          carModel,
          repairDescription,
          estimatedHours
        );

        setActiveActivityId(activityId);
        setIsTracking(true);
        setStartTime(new Date());
        setElapsedTime(0);

        if (showNotifications) {
          toast({
            title: "Repair Tracking Started",
            description: `Repair tracking started: ${repairDescription}`,
            duration: 3000
          });
        }

        return activityId;
      } catch (error) {
        console.error('Error starting repair tracking:', error);
        return null;
      }
    },

    end: async (partsUsed?: string[], toolsUsed?: string[], notes?: string): Promise<any> => {
      if (!activeActivityId) return null;
      
      try {
        const result = await trackRepair.end(activeActivityId, partsUsed, toolsUsed, notes);
        
        setActiveActivityId(null);
        setIsTracking(false);
        setStartTime(null);
        setElapsedTime(0);

        return result;
      } catch (error) {
        console.error('Error ending repair tracking:', error);
        return null;
      }
    }
  };

  const clientInteractionTracking = {
    log: async (interactionType: string, durationMinutes: number): Promise<string | null> => {
      if (!user || !clientName || !clientPhone) {
        console.error('Missing required data for client interaction tracking');
        return null;
      }

      const employeeName = (user as any)?.user_metadata?.full_name || user.email || 'Unknown Employee';
      
      try {
        const activityId = await trackClientInteraction.log(
          employeeName,
          clientName,
          clientPhone,
          interactionType,
          durationMinutes,
          carVin
        );

        if (showNotifications) {
          toast({
            title: "Client Interaction Logged",
            description: `${interactionType} with ${clientName} (${durationMinutes}min)`,
            duration: 3000
          });
        }

        return activityId;
      } catch (error) {
        console.error('Error logging client interaction:', error);
        return null;
      }
    }
  };

  return {
    // State
    isTracking,
    activeActivityId,
    elapsedTime,
    
    // Actions
    startTracking,
    endTracking,
    
    // Utilities
    formatTime,
    
    // Specialized tracking
    trackTestDrive: testDriveTracking,
    trackRepair: repairTracking,
    trackClientInteraction: clientInteractionTracking
  };
};

// Helper hook for automatic activity detection
export const useAutoTimeTracking = () => {
  const { user } = useAuth();
  
  const autoTrackActivity = useCallback(async (
    activityType: ActivityType,
    description: string,
    context: {
      carVin?: string;
      carModel?: string;
      clientName?: string;
      estimatedMinutes?: number;
      location?: string;
      department?: string;
    } = {}
  ): Promise<string | null> => {
    if (!user) return null;

    const employeeName = (user as any)?.user_metadata?.full_name || user.email || 'Unknown Employee';
    
    try {
      return await timeTrackingService.startActivity({
        employeeName,
        employeeEmail: user.email,
        activityType,
        activityDescription: description,
        startTime: new Date().toISOString(),
        carVin: context.carVin,
        carModel: context.carModel,
        clientName: context.clientName,
        estimatedDurationMinutes: context.estimatedMinutes,
        location: context.location || 'Workplace',
        department: context.department || 'General'
      });
    } catch (error) {
      console.error('Error auto-tracking activity:', error);
      return null;
    }
  }, [user]);

  const endAutoTracking = useCallback(async (activityId: string, notes?: string): Promise<any> => {
    try {
      return await timeTrackingService.endActivity(activityId, { notes });
    } catch (error) {
      console.error('Error ending auto-tracked activity:', error);
      return null;
    }
  }, []);

  return {
    autoTrackActivity,
    endAutoTracking
  };
}; 