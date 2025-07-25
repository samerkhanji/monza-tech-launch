import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Clock, User, Wrench, AlertCircle, CheckCircle, Settings, Zap, Palette, Sparkles, Hammer } from 'lucide-react';
import { CustomCalendarIcon } from '@/components/icons/CustomCalendarIcon';
import { ScheduledCar } from '@/types';

interface WorkerScheduleViewProps {
  scheduledCars: (ScheduledCar & { 
    scheduleDate: string; 
    scheduleTime: string; 
    available: boolean;
    scheduleNotes?: string;
  })[];
}

const WorkerScheduleView: React.FC<WorkerScheduleViewProps> = ({ scheduledCars }) => {
  const getWorkTypeIcon = (workType: ScheduledCar['workType']) => {
    switch (workType) {
      case 'electrical': return <Zap className="h-4 w-4" />;
      case 'painter': return <Palette className="h-4 w-4" />;
      case 'detailer': return <Sparkles className="h-4 w-4" />;
      case 'mechanic': return <Settings className="h-4 w-4" />;
      case 'body_work': return <Hammer className="h-4 w-4" />;
      default: return <Wrench className="h-4 w-4" />;
    }
  };

  const getWorkTypeColor = (workType: ScheduledCar['workType']) => {
    switch (workType) {
      case 'electrical': return 'bg-yellow-100 text-yellow-800';
      case 'painter': return 'bg-purple-100 text-purple-800';
      case 'detailer': return 'bg-blue-100 text-blue-800';
      case 'mechanic': return 'bg-green-100 text-green-800';
      case 'body_work': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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

  const getStatusIcon = (status: ScheduledCar['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'delayed': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  // Group cars by date for better organization
  const carsByDate = scheduledCars.reduce((acc, car) => {
    if (!acc[car.scheduleDate]) {
      acc[car.scheduleDate] = [];
    }
    acc[car.scheduleDate].push(car);
    return acc;
  }, {} as Record<string, typeof scheduledCars>);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CustomCalendarIcon className="h-5 w-5" />
            Worker Schedule Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground mb-4">
            Complete view of all scheduled work assignments and employee activities
          </div>
          
          {Object.keys(carsByDate).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No scheduled work found. Cars will appear here when scheduled in the garage schedule.
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(carsByDate).map(([date, cars]) => (
                <div key={date} className="space-y-4">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <CustomCalendarIcon className="h-4 w-4" />
                    <h3 className="font-medium">
                      {new Date(date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </h3>
                    <Badge variant="outline">{cars.length} scheduled</Badge>
                  </div>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Car & Customer</TableHead>
                        <TableHead>Work Details</TableHead>
                        <TableHead>Assigned Worker</TableHead>
                        <TableHead>Schedule Time</TableHead>
                        <TableHead>Priority & Status</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cars.map((car) => (
                        <TableRow key={car.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{car.carCode}</div>
                              <div className="text-sm text-muted-foreground">{car.carModel}</div>
                              <div className="flex items-center gap-1 mt-1">
                                <User className="h-3 w-3" />
                                <span className="text-sm">{car.customerName}</span>
                              </div>
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <div className="space-y-2">
                              <Badge className={`${getWorkTypeColor(car.workType)} flex items-center gap-1 w-fit`}>
                                {getWorkTypeIcon(car.workType)}
                                {car.workType.replace('_', ' ')}
                              </Badge>
                              <div className="flex items-center gap-1 text-sm">
                                <Clock className="h-3 w-3" />
                                <span>{car.estimatedDuration}h estimated</span>
                              </div>
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              <span>{car.assignedMechanic || 'Unassigned'}</span>
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <div className="text-sm">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>{car.scheduleTime}</span>
                              </div>
                              {!car.available && (
                                <Badge variant="destructive" className="mt-1 text-xs">
                                  Unavailable
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <div className="space-y-1">
                              <Badge className={getPriorityColor(car.priority)}>
                                {car.priority} priority
                              </Badge>
                              <div className="flex items-center gap-1">
                                <Badge className={`${getStatusColor(car.status)} flex items-center gap-1`}>
                                  {getStatusIcon(car.status)}
                                  {car.status.replace('_', ' ')}
                                </Badge>
                              </div>
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <div className="max-w-xs">
                              {car.notes && (
                                <div className="text-sm bg-gray-50 p-2 rounded border">
                                  {car.notes.length > 100 ? car.notes.substring(0, 100) + '...' : car.notes}
                                </div>
                              )}
                              {car.scheduleNotes && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  Schedule: {car.scheduleNotes}
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkerScheduleView;
