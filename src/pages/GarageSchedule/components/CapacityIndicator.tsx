import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Car, CheckCircle, Clock, Users } from 'lucide-react';
import { GarageSchedule } from '@/types';

interface CapacityIndicatorProps {
  schedule: GarageSchedule | null;
  date: string;
  className?: string;
}

const CapacityIndicator: React.FC<CapacityIndicatorProps> = ({ schedule, date, className = '' }) => {
  if (!schedule) {
    return (
      <Card className={`border-gray-200 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-500">No Schedule Set</p>
              <p className="text-xs text-gray-400">Create a schedule for {date}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxCapacity = schedule.maxCarsCapacity || 7;
  const currentScheduled = schedule.currentCarsScheduled || 0;
  const utilizationPercentage = (currentScheduled / maxCapacity) * 100;
  const availableSlots = maxCapacity - currentScheduled;

  const getCapacityStatus = () => {
    if (utilizationPercentage >= 100) {
      return {
        status: 'full',
        color: 'border-red-200 bg-red-50',
        badgeColor: 'bg-red-100 text-red-800',
        icon: AlertTriangle,
        message: 'At Full Capacity',
        textColor: 'text-red-700'
      };
    } else if (utilizationPercentage >= 80) {
      return {
        status: 'near-full',
        color: 'border-yellow-200 bg-yellow-50',
        badgeColor: 'bg-yellow-100 text-yellow-800',
        icon: Clock,
        message: 'Nearly Full',
        textColor: 'text-yellow-700'
      };
    } else if (utilizationPercentage >= 50) {
      return {
        status: 'moderate',
        color: 'border-blue-200 bg-blue-50',
        badgeColor: 'bg-blue-100 text-blue-800',
        icon: Users,
        message: 'Good Utilization',
        textColor: 'text-blue-700'
      };
    }
    
    return {
      status: 'available',
      color: 'border-green-200 bg-green-50',
      badgeColor: 'bg-green-100 text-green-800',
      icon: CheckCircle,
      message: 'Available',
      textColor: 'text-green-700'
    };
  };

  const capacityStatus = getCapacityStatus();
  const StatusIcon = capacityStatus.icon;

  return (
    <Card className={`${capacityStatus.color} ${className}`}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header with status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StatusIcon className={`h-4 w-4 ${capacityStatus.textColor}`} />
              <span className={`text-sm font-medium ${capacityStatus.textColor}`}>
                {capacityStatus.message}
              </span>
            </div>
            <Badge className={capacityStatus.badgeColor}>
              {currentScheduled}/{maxCapacity}
            </Badge>
          </div>

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-600">
              <span>Capacity</span>
              <span>{Math.round(utilizationPercentage)}% used</span>
            </div>
            <Progress 
              value={utilizationPercentage} 
              className="h-2"
            />
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-center">
              <div className="font-medium text-gray-900">{currentScheduled}</div>
              <div className="text-gray-500">Scheduled</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-gray-900">{availableSlots}</div>
              <div className="text-gray-500">Available</div>
            </div>
          </div>

          {/* Working hours */}
          {schedule.startTime && schedule.endTime && (
            <div className="text-xs text-gray-600 text-center">
              <Clock className="h-3 w-3 inline mr-1" />
              {schedule.startTime} - {schedule.endTime}
            </div>
          )}

          {/* Availability status */}
          {!schedule.available && (
            <div className="text-xs text-red-600 text-center font-medium">
              Garage Closed
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CapacityIndicator; 