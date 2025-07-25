import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, User, Wrench, Plus, ArrowRight, Zap, Palette, Sparkles, Settings, Hammer } from 'lucide-react';
import { GarageSchedule, ScheduledCar } from '@/types';
import GarageScheduleCarDialog from './GarageScheduleCarDialog';

interface EmployeeTypeSchedulingProps {
  schedule: GarageSchedule;
  date: string;
  onAddCar: (carData: Omit<ScheduledCar, 'id'>, targetDate: string) => void;
  onUpdateCarStatus: (carId: string, status: ScheduledCar['status'], targetDate: string) => void;
  onMoveToTomorrow?: (carId: string) => void;
  showMoveToTomorrow?: boolean;
}

const EmployeeTypeScheduling: React.FC<EmployeeTypeSchedulingProps> = ({
  schedule,
  date,
  onAddCar,
  onUpdateCarStatus,
  onMoveToTomorrow,
  showMoveToTomorrow = false
}) => {
  const [showAddCarDialog, setShowAddCarDialog] = useState(false);
  const [selectedWorkType, setSelectedWorkType] = useState<ScheduledCar['workType']>('mechanic');

  const employeeTypes = [
    { type: 'electrical' as const, name: 'Electrical', icon: Zap, color: 'bg-yellow-100 text-yellow-800' },
    { type: 'painter' as const, name: 'Painter', icon: Palette, color: 'bg-purple-100 text-purple-800' },
    { type: 'detailer' as const, name: 'Detailer', icon: Sparkles, color: 'bg-blue-100 text-blue-800' },
    { type: 'mechanic' as const, name: 'Mechanic', icon: Settings, color: 'bg-green-100 text-green-800' },
    { type: 'body_work' as const, name: 'Body Work', icon: Hammer, color: 'bg-red-100 text-red-800' }
  ];

  const getCarsByWorkType = (workType: ScheduledCar['workType']) => {
    return schedule.scheduledCars?.filter(car => car.workType === workType) || [];
  };

  const getMaxCapacityPerType = () => {
    return Math.floor((schedule.maxCarsCapacity || 7) / employeeTypes.length);
  };

  const getPriorityColor = (priority: ScheduledCar['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: ScheduledCar['status']) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'delayed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleAddCar = (workType: ScheduledCar['workType']) => {
    setSelectedWorkType(workType);
    setShowAddCarDialog(true);
  };

  const renderEmployeeSection = (employeeType: typeof employeeTypes[0]) => {
    const cars = getCarsByWorkType(employeeType.type);
    const maxCapacity = getMaxCapacityPerType();
    const Icon = employeeType.icon;

    return (
      <Card key={employeeType.type}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Icon className="h-5 w-5" />
              {employeeType.name}
              <Badge className={employeeType.color}>
                {cars.length}/{maxCapacity}
              </Badge>
            </CardTitle>
            <Button 
              onClick={() => handleAddCar(employeeType.type)}
              size="sm"
              disabled={!schedule.available || cars.length >= maxCapacity}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Car
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!schedule.available && (
            <div className="text-center py-4 text-muted-foreground">
              Mark is not available on this date
            </div>
          )}
          
          {schedule.available && cars.length === 0 && (
            <div className="text-center py-4 text-muted-foreground">
              No cars assigned to {employeeType.name.toLowerCase()}
            </div>
          )}

          {schedule.available && cars.length > 0 && (
            <div className="space-y-3">
              {cars.map((car) => (
                <div key={car.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div>
                        <div className="font-medium">{car.carCode}</div>
                        <div className="text-sm text-muted-foreground">{car.carModel}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityColor(car.priority)}>
                        {car.priority}
                      </Badge>
                      <Badge className={getStatusColor(car.status)}>
                        {car.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>{car.customerName}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{car.estimatedDuration}h</span>
                    </div>
                  </div>

                  {car.assignedMechanic && (
                    <div className="text-sm">
                      <strong>Assigned:</strong> {car.assignedMechanic}
                    </div>
                  )}

                  {car.notes && (
                    <div className="text-sm text-muted-foreground">
                      <strong>Notes:</strong> {car.notes}
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-2">
                    <select
                      value={car.status}
                      onChange={(e) => onUpdateCarStatus(car.id, e.target.value as ScheduledCar['status'], date)}
                      className="text-xs border rounded px-2 py-1"
                    >
                      <option value="scheduled">Scheduled</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="delayed">Delayed</option>
                    </select>

                    {showMoveToTomorrow && onMoveToTomorrow && car.status !== 'completed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onMoveToTomorrow(car.id)}
                      >
                        <ArrowRight className="h-3 w-3 mr-1" />
                        Move to Tomorrow
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="by-type">By Employee Type</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                All Scheduled Cars ({schedule.currentCarsScheduled || 0}/{schedule.maxCarsCapacity || 7})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {employeeTypes.map(type => {
                  const cars = getCarsByWorkType(type.type);
                  const Icon = type.icon;
                  return (
                    <div key={type.type} className="text-center p-4 border rounded-lg">
                      <Icon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <div className="font-medium">{type.name}</div>
                      <div className="text-2xl font-bold">{cars.length}</div>
                      <div className="text-sm text-muted-foreground">cars assigned</div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="by-type" className="mt-4">
          <div className="space-y-4">
            {employeeTypes.map(renderEmployeeSection)}
          </div>
        </TabsContent>
      </Tabs>

      <GarageScheduleCarDialog
        open={showAddCarDialog}
        onOpenChange={setShowAddCarDialog}
        onSchedule={onAddCar}
        targetDate={date}
        defaultWorkType={selectedWorkType}
      />
    </div>
  );
};

export default EmployeeTypeScheduling;
