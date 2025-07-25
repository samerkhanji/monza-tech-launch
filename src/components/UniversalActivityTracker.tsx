import React, { useState, useEffect } from 'react';
import { timeTrackingService, ActivityType } from '@/services/timeTrackingService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Timer, Play, Square, Clock, User } from 'lucide-react';

interface ActivityTrackerProps {
  // Optional: pre-configure for specific activity
  activityType?: ActivityType;
  activityDescription?: string;
  carVin?: string;
  carModel?: string;
  clientName?: string;
  estimatedDurationMinutes?: number;
  location?: string;
  department?: string;
  
  // Callbacks
  onActivityStart?: (activityId: string) => void;
  onActivityEnd?: (activityId: string, duration: number) => void;
  
  // UI Options
  showActiveTimer?: boolean;
  autoStart?: boolean;
  hideControls?: boolean;
  compact?: boolean;
}

interface ActiveActivity {
  id: string;
  activityType: ActivityType;
  activityDescription: string;
  startTime: Date;
  carVin?: string;
  carModel?: string;
  clientName?: string;
}

export const UniversalActivityTracker: React.FC<ActivityTrackerProps> = ({
  activityType,
  activityDescription,
  carVin,
  carModel,
  clientName,
  estimatedDurationMinutes,
  location,
  department,
  onActivityStart,
  onActivityEnd,
  showActiveTimer = true,
  autoStart = false,
  hideControls = false,
  compact = false
}) => {
  const { user } = useAuth();
  const [activeActivity, setActiveActivity] = useState<ActiveActivity | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isTracking, setIsTracking] = useState(false);

  // Auto-start if configured
  useEffect(() => {
    if (autoStart && activityType && activityDescription && !isTracking) {
      handleStartActivity();
    }
  }, [autoStart, activityType, activityDescription]);

  // Timer for active activities
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (activeActivity && isTracking) {
      interval = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - activeActivity.startTime.getTime()) / 1000);
        setElapsedTime(elapsed);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeActivity, isTracking]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartActivity = async () => {
    if (!user || !activityType || !activityDescription) {
      toast({
        title: "Cannot Start Tracking",
        description: "Missing required information for activity tracking",
        variant: "destructive"
      });
      return;
    }

    try {
      const employeeName = (user as any)?.user_metadata?.full_name || user.email || 'Unknown Employee';
      
      const activityId = await timeTrackingService.startActivity({
        employeeName,
        employeeEmail: user.email,
        activityType,
        activityDescription,
        startTime: new Date().toISOString(),
        carVin,
        carModel,
        clientName,
        estimatedDurationMinutes,
        location: location || 'Workplace',
        department: department || 'General'
      });

      const newActivity: ActiveActivity = {
        id: activityId,
        activityType,
        activityDescription,
        startTime: new Date(),
        carVin,
        carModel,
        clientName
      };

      setActiveActivity(newActivity);
      setIsTracking(true);
      setElapsedTime(0);

      if (onActivityStart) {
        onActivityStart(activityId);
      }

      if (!hideControls) {
        toast({
          title: "Activity Started",
          description: `Now tracking: ${activityDescription}`,
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Error starting activity:', error);
      toast({
        title: "Tracking Error",
        description: "Failed to start activity tracking",
        variant: "destructive"
      });
    }
  };

  const handleEndActivity = async (notes?: string) => {
    if (!activeActivity) return;

    try {
      const result = await timeTrackingService.endActivity(activeActivity.id, { notes });
      
      if (result) {
        const durationMinutes = result.durationMinutes || 0;
        
        if (onActivityEnd) {
          onActivityEnd(activeActivity.id, durationMinutes);
        }

        if (!hideControls) {
          toast({
            title: "Activity Completed",
            description: `${activityDescription} completed in ${timeTrackingService.formatDuration(durationMinutes)}`,
            duration: 5000
          });
        }
      }

      setActiveActivity(null);
      setIsTracking(false);
      setElapsedTime(0);
    } catch (error) {
      console.error('Error ending activity:', error);
      toast({
        title: "Tracking Error",
        description: "Failed to end activity tracking",
        variant: "destructive"
      });
    }
  };

  // Compact view for integration into existing components
  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm">
        {isTracking && activeActivity ? (
          <>
            <div className="flex items-center gap-1 text-green-600">
              <Timer className="h-4 w-4" />
              <span className="font-mono">{formatTime(elapsedTime)}</span>
            </div>
            {!hideControls && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleEndActivity()}
                className="h-6 px-2 text-xs"
              >
                <Square className="h-3 w-3 mr-1" />
                Stop
              </Button>
            )}
          </>
        ) : (
          !hideControls && activityType && activityDescription && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleStartActivity}
              className="h-6 px-2 text-xs"
            >
              <Play className="h-3 w-3 mr-1" />
              Track
            </Button>
          )
        )}
      </div>
    );
  }

  // Full card view
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Timer className="h-5 w-5" />
          Activity Tracker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isTracking && activeActivity ? (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Current Activity:</span>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <Timer className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              </div>
              
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="font-medium text-green-800">{activeActivity.activityDescription}</p>
                {(activeActivity.carModel || activeActivity.clientName) && (
                  <div className="mt-2 text-sm text-green-700">
                    {activeActivity.carModel && <p>Vehicle: {activeActivity.carModel}</p>}
                    {activeActivity.clientName && <p>Client: {activeActivity.clientName}</p>}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="text-3xl font-mono font-bold text-blue-600">
                    {formatTime(elapsedTime)}
                  </div>
                  <p className="text-sm text-gray-500">Elapsed Time</p>
                </div>
              </div>
            </div>

            {!hideControls && (
              <div className="flex gap-2">
                <Button
                  onClick={() => handleEndActivity()}
                  className="flex-1"
                  variant="default"
                >
                  <Square className="h-4 w-4 mr-2" />
                  Complete Activity
                </Button>
              </div>
            )}
          </>
        ) : (
          <>
            {activityType && activityDescription ? (
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="font-medium text-blue-800">{activityDescription}</p>
                  {(carModel || clientName) && (
                    <div className="mt-2 text-sm text-blue-700">
                      {carModel && <p>Vehicle: {carModel}</p>}
                      {clientName && <p>Client: {clientName}</p>}
                    </div>
                  )}
                  {estimatedDurationMinutes && (
                    <p className="text-sm text-blue-600 mt-1">
                      Estimated duration: {timeTrackingService.formatDuration(estimatedDurationMinutes)}
                    </p>
                  )}
                </div>

                {!hideControls && (
                  <Button onClick={handleStartActivity} className="w-full">
                    <Play className="h-4 w-4 mr-2" />
                    Start Tracking
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <Clock className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>No activity configured for tracking</p>
              </div>
            )}
          </>
        )}

        {showActiveTimer && user && (
          <div className="pt-3 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="h-4 w-4" />
              <span>Tracking for: {(user as any)?.user_metadata?.full_name || user.email}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Hook for easier integration
export const useActivityTracker = (config: Omit<ActivityTrackerProps, 'showActiveTimer' | 'hideControls' | 'compact'>) => {
  const [isTracking, setIsTracking] = useState(false);
  const [activeActivityId, setActiveActivityId] = useState<string | null>(null);

  const startTracking = async () => {
    if (!config.activityType || !config.activityDescription) return null;

    try {
      const { user } = useAuth();
      const employeeName = (user as any)?.user_metadata?.full_name || user?.email || 'Unknown Employee';
      
      const activityId = await timeTrackingService.startActivity({
        employeeName,
        employeeEmail: user?.email,
        activityType: config.activityType,
        activityDescription: config.activityDescription,
        startTime: new Date().toISOString(),
        carVin: config.carVin,
        carModel: config.carModel,
        clientName: config.clientName,
        estimatedDurationMinutes: config.estimatedDurationMinutes,
        location: config.location || 'Workplace',
        department: config.department || 'General'
      });

      setActiveActivityId(activityId);
      setIsTracking(true);
      
      if (config.onActivityStart) {
        config.onActivityStart(activityId);
      }

      return activityId;
    } catch (error) {
      console.error('Error starting activity tracking:', error);
      return null;
    }
  };

  const endTracking = async (notes?: string) => {
    if (!activeActivityId) return null;

    try {
      const result = await timeTrackingService.endActivity(activeActivityId, { notes });
      
      if (result && config.onActivityEnd) {
        config.onActivityEnd(activeActivityId, result.durationMinutes || 0);
      }

      setActiveActivityId(null);
      setIsTracking(false);
      
      return result;
    } catch (error) {
      console.error('Error ending activity tracking:', error);
      return null;
    }
  };

  return {
    isTracking,
    activeActivityId,
    startTracking,
    endTracking
  };
};

export default UniversalActivityTracker; 