import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, Car, Clock, Wrench, Zap, Palette, Sparkles, Settings, Hammer, Timer, Users } from 'lucide-react';
import { CustomCalendarIcon } from '@/components/icons/CustomCalendarIcon';
import { GarageSchedule, ScheduledCar } from '@/types';
import ScheduledCarsSection from './ScheduledCarsSection';

interface DailyPlanningTabsProps {
  todaySchedule: GarageSchedule | null;
  tomorrowSchedule: GarageSchedule | null;
  today: string;
  tomorrow: string;
  onAddCar: (carData: Omit<ScheduledCar, 'id'>, targetDate: string) => void;
  onUpdateCarStatus: (carId: string, status: ScheduledCar['status'], targetDate: string) => void;
  onMoveToTomorrow: (carId: string) => void;
  onCreateDefaultSchedule: (date: string) => void;
}

const DailyPlanningTabs: React.FC<DailyPlanningTabsProps> = ({
  todaySchedule,
  tomorrowSchedule,
  today,
  tomorrow,
  onAddCar,
  onUpdateCarStatus,
  onMoveToTomorrow,
  onCreateDefaultSchedule
}) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const workstations = [
    { type: 'electrical', name: 'Electrical', icon: Zap, color: 'bg-yellow-50 border-yellow-200', capacity: 2 },
    { type: 'mechanic', name: 'Mechanic', icon: Settings, color: 'bg-green-50 border-green-200', capacity: 2 },
    { type: 'painter', name: 'Painter', icon: Palette, color: 'bg-purple-50 border-purple-200', capacity: 2 },
    { type: 'detailer', name: 'Detailer', icon: Sparkles, color: 'bg-blue-50 border-blue-200', capacity: 1 },
    { type: 'body_work', name: 'Body Work', icon: Hammer, color: 'bg-red-50 border-red-200', capacity: 1 }
  ];

  const getCapacityOverview = (schedule: GarageSchedule | null) => {
    if (!schedule) return { total: 0, used: 0, available: 0, utilization: 0 };
    
    const totalCapacity = schedule.maxCarsCapacity || 8;
    const usedCapacity = schedule.currentCarsScheduled || 0;
    const availableCapacity = totalCapacity - usedCapacity;
    const utilization = (usedCapacity / totalCapacity) * 100;
    
    return { total: totalCapacity, used: usedCapacity, available: availableCapacity, utilization };
  };

  const getCarsByWorkType = (schedule: GarageSchedule | null, workType: string) => {
    if (!schedule?.scheduledCars) return [];
    return schedule.scheduledCars.filter(car => car.workType === workType);
  };

  const getWorkstationUtilization = (schedule: GarageSchedule | null) => {
    if (!schedule) return [];
    
    return workstations.map(station => {
      const cars = getCarsByWorkType(schedule, station.type);
      const inProgress = cars.filter(car => car.status === 'in_progress').length;
      const scheduled = cars.filter(car => car.status === 'scheduled').length;
      const completed = cars.filter(car => car.status === 'completed').length;
      
      return {
        ...station,
        current: cars.length,
        inProgress,
        scheduled,
        completed,
        utilization: (cars.length / station.capacity) * 100,
        availableSlots: station.capacity - cars.length,
        cars
      };
    });
  };

  const generateTimeSlots = (startTime: string, endTime: string) => {
    const slots = [];
    const start = parseInt(startTime.split(':')[0]);
    const end = parseInt(endTime.split(':')[0]);
    
    for (let hour = start; hour < end; hour++) {
      slots.push({
        time: `${hour.toString().padStart(2, '0')}:00 - ${(hour + 1).toString().padStart(2, '0')}:00`,
        hour,
        isPeakHour: hour >= 10 && hour <= 14 // 10AM - 2PM peak hours
      });
    }
    return slots;
  };

  const renderScheduleInfo = (schedule: GarageSchedule | null, date: string, isToday: boolean = false) => {
    if (!schedule) {
      return (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                No Schedule Found
              </h3>
              <p className="text-muted-foreground mb-4">
                Mark doesn't have a schedule set for {isToday ? 'today' : 'tomorrow'}
              </p>
              <Button onClick={() => onCreateDefaultSchedule(date)}>
                Create Default Schedule
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    const capacity = getCapacityOverview(schedule);
    const workstationData = getWorkstationUtilization(schedule);
    const timeSlots = generateTimeSlots(schedule.startTime, schedule.endTime);

    return (
      <div className="space-y-6">
        {/* Capacity Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Garage Capacity Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{capacity.total}</div>
                <div className="text-sm text-muted-foreground">Total Capacity</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">{capacity.used}</div>
                <div className="text-sm text-muted-foreground">Cars Scheduled</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{capacity.available}</div>
                <div className="text-sm text-muted-foreground">Available Slots</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{Math.round(capacity.utilization)}%</div>
                <div className="text-sm text-muted-foreground">Utilization</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Capacity Utilization</span>
                <span>{capacity.used}/{capacity.total} cars</span>
              </div>
              <Progress value={capacity.utilization} className="h-3" />
              
              {capacity.utilization > 90 && (
                <div className="text-amber-600 text-sm flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  Nearly at full capacity - Consider rescheduling non-urgent repairs
                </div>
              )}
              
              {capacity.utilization >= 70 && capacity.utilization <= 90 && (
                <div className="text-blue-600 text-sm flex items-center gap-1">
                  <Timer className="h-4 w-4" />
                  Good utilization - {capacity.available} slots available for urgent repairs
                </div>
              )}
              
              {capacity.utilization < 70 && (
                <div className="text-green-600 text-sm flex items-center gap-1">
                  <Car className="h-4 w-4" />
                  Excellent availability - Great time to schedule more cars
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Worker Schedule & Workstation Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Worker Schedule & Workstation Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {workstationData.map((station) => {
                const Icon = station.icon;
                return (
                  <Card key={station.type} className={`border-2 ${station.color}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Icon className="h-5 w-5" />
                          <span className="font-medium">{station.name}</span>
                        </div>
                        <Badge variant={station.availableSlots > 0 ? "default" : "destructive"}>
                          {station.current}/{station.capacity}
                        </Badge>
                      </div>
                      
                      <div className="space-y-3">
                        <Progress value={station.utilization} className="h-2" />
                        
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="text-center">
                            <div className="text-lg font-bold text-blue-600">{station.scheduled}</div>
                            <div>Scheduled</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-orange-600">{station.inProgress}</div>
                            <div>In Progress</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-green-600">{station.completed}</div>
                            <div>Completed</div>
                          </div>
                        </div>
                        
                        {station.availableSlots > 0 ? (
                          <div className="text-green-600 text-sm font-medium">
                            ✓ {station.availableSlots} slot(s) available
                          </div>
                        ) : (
                          <div className="text-red-600 text-sm font-medium">
                            ⚠ At full capacity
                          </div>
                        )}

                        {/* Show current cars for this workstation */}
                        {station.cars.length > 0 && (
                          <div className="mt-2 space-y-1">
                            <div className="text-xs font-medium text-muted-foreground">Current Cars:</div>
                            {station.cars.slice(0, 2).map(car => (
                              <div key={car.id} className="text-xs p-1 bg-white/50 rounded">
                                {car.carCode} - {car.status}
                              </div>
                            ))}
                            {station.cars.length > 2 && (
                              <div className="text-xs text-muted-foreground">+{station.cars.length - 2} more</div>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Time Slot Availability */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5" />
              Daily Time Slot Availability ({schedule.startTime} - {schedule.endTime})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {timeSlots.map((slot) => {
                  return (
                    <div
                      key={slot.time}
                      className={`p-3 rounded-lg border text-center text-sm transition-colors ${
                        slot.isPeakHour 
                          ? 'bg-orange-50 border-orange-200 hover:bg-orange-100' 
                          : 'bg-green-50 border-green-200 hover:bg-green-100'
                      }`}
                    >
                      <div className="font-medium text-xs">{slot.time}</div>
                      <div className={`text-xs mt-1 font-medium ${
                        slot.isPeakHour ? 'text-orange-600' : 'text-green-600'
                      }`}>
                        {slot.isPeakHour ? 'Peak Hours' : 'Available'}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {slot.isPeakHour ? 'Priority only' : 'Open for bookings'}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm font-medium text-blue-800 mb-2">Scheduling Recommendations:</div>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Peak hours (10 AM - 2 PM): Priority repairs & urgent work only</li>
                    <li>• Off-peak morning: Ideal for test drives & inspections</li>
                    <li>• Off-peak afternoon: Perfect for routine maintenance</li>
                    <li>• Current availability: {capacity.available} open slots</li>
                  </ul>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-sm font-medium text-green-800 mb-2">Best Times to Schedule More Cars:</div>
                  <ul className="text-sm text-green-700 space-y-1">
                    {timeSlots.filter(slot => !slot.isPeakHour).slice(0, 3).map(slot => (
                      <li key={slot.time}>• {slot.time} - Excellent availability</li>
                    ))}
                    {capacity.available === 0 && (
                      <li>• Consider scheduling for tomorrow or next available day</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mark's Availability */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Mark's Availability & Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {schedule.available ? 'Available' : 'Not Available'}
                </div>
                <div className="text-sm text-muted-foreground">Status for {isToday ? 'today' : 'tomorrow'}</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {schedule.startTime} - {schedule.endTime}
                </div>
                <div className="text-sm text-muted-foreground">Working Hours</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {Math.floor(parseInt(schedule.endTime.split(':')[0]) - parseInt(schedule.startTime.split(':')[0]))} hours
                </div>
                <div className="text-sm text-muted-foreground">Total Work Day</div>
              </div>
            </div>
            
            {schedule.notes && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                <div className="text-sm font-medium text-amber-800">Schedule Notes:</div>
                <div className="text-sm text-amber-700 mt-1">{schedule.notes}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Scheduled Cars Detail */}
        <ScheduledCarsSection
          schedule={schedule}
          date={date}
          onAddCar={onAddCar}
          onUpdateCarStatus={onUpdateCarStatus}
          onMoveToTomorrow={isToday ? onMoveToTomorrow : undefined}
          showMoveToTomorrow={isToday}
        />
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Daily Planning & Capacity Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="today" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="today">
                Today ({formatDate(today)})
              </TabsTrigger>
              <TabsTrigger value="tomorrow">
                Tomorrow ({formatDate(tomorrow)})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="today" className="mt-4">
              {renderScheduleInfo(todaySchedule, today, true)}
            </TabsContent>
            
            <TabsContent value="tomorrow" className="mt-4">
              {renderScheduleInfo(tomorrowSchedule, tomorrow, false)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default DailyPlanningTabs; 