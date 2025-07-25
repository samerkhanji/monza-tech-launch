import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Plus, 
  Clock, 
  User, 
  Car, 
  AlertTriangle, 
  Wrench, 
  Palette,
  Zap,
  Settings,
  Calendar
} from 'lucide-react';
import { ScheduledCar } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface ScheduleWorkInterfaceProps {
  cars: any[];
  scheduledCars: ScheduledCar[];
  onScheduleUpdate: (schedule: ScheduledCar) => void;
}

const ScheduleWorkInterface: React.FC<ScheduleWorkInterfaceProps> = ({
  cars,
  scheduledCars,
  onScheduleUpdate
}) => {
  const { toast } = useToast();
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [newAppointment, setNewAppointment] = useState<Partial<ScheduledCar>>({
    priority: 'medium',
    workType: 'mechanic',
    status: 'scheduled'
  });

  const workTypes = [
    { value: 'electrical', label: 'Electrical Work', icon: Zap },
    { value: 'painter', label: 'Paint & Bodywork', icon: Palette },
    { value: 'detailer', label: 'Detailing & Cleaning', icon: Settings },
    { value: 'mechanic', label: 'Mechanical Repair', icon: Wrench },
    { value: 'body_work', label: 'Body Work', icon: Car }
  ];

  const priorities = [
    { value: 'high', label: 'High Priority', color: 'bg-red-100 text-red-800' },
    { value: 'medium', label: 'Medium Priority', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'low', label: 'Low Priority', color: 'bg-green-100 text-green-800' }
  ];

  const mechanics = [
    'Ahmad', 'Mark', 'Samer', 'Mike', 'Tony', 'David', 'Carlos', 'Alex'
  ];

  // Get available cars that aren't already scheduled today
  const availableCars = cars.filter(car => 
    !scheduledCars.some(scheduled => scheduled.carCode === car.carCode) &&
    car.status !== 'delivered' && car.status !== 'ready'
  );

  const handleScheduleAppointment = () => {
    if (!newAppointment.carCode || !newAppointment.workType || !newAppointment.estimatedDuration) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    const appointment: ScheduledCar = {
      id: Date.now().toString(),
      carCode: newAppointment.carCode!,
      carModel: cars.find(c => c.carCode === newAppointment.carCode)?.carModel || 'Unknown Model',
      customerName: cars.find(c => c.carCode === newAppointment.carCode)?.customerName || 'Unknown Customer',
      priority: newAppointment.priority as 'high' | 'medium' | 'low',
      estimatedDuration: newAppointment.estimatedDuration!,
      workType: newAppointment.workType as ScheduledCar['workType'],
      assignedMechanic: newAppointment.assignedMechanic,
      notes: newAppointment.notes,
      status: 'scheduled'
    };

    onScheduleUpdate(appointment);
    setShowScheduleDialog(false);
    setNewAppointment({
      priority: 'medium',
      workType: 'mechanic',
      status: 'scheduled'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'delayed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    return priorities.find(p => p.value === priority)?.color || 'bg-gray-100 text-gray-800';
  };

  const getWorkTypeIcon = (workType: string) => {
    const type = workTypes.find(wt => wt.value === workType);
    const IconComponent = type?.icon || Wrench;
    return <IconComponent className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Header with Create Appointment Button */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Today's Scheduled Work</h3>
          <p className="text-sm text-muted-foreground">
            {scheduledCars.length} appointments scheduled • {availableCars.length} cars available for scheduling
          </p>
        </div>
        <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Schedule Appointment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Schedule New Work Appointment
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="car-selection">Select Car *</Label>
                  <Select onValueChange={(value) => setNewAppointment(prev => ({ ...prev, carCode: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a car..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCars.map((car) => (
                        <SelectItem key={car.id} value={car.carCode}>
                          <div className="flex items-center gap-2">
                            <Car className="h-4 w-4" />
                            {car.carCode} - {car.carModel}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="work-type">Work Type *</Label>
                  <Select onValueChange={(value) => setNewAppointment(prev => ({ ...prev, workType: value as ScheduledCar['workType'] }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select work type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {workTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="h-4 w-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select onValueChange={(value) => setNewAppointment(prev => ({ ...prev, priority: value as 'high' | 'medium' | 'low' }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority..." />
                    </SelectTrigger>
                    <SelectContent>
                      {priorities.map((priority) => (
                        <SelectItem key={priority.value} value={priority.value}>
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            {priority.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="duration">Duration (hours) *</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="0.5"
                    step="0.5"
                    placeholder="e.g., 2.5"
                    onChange={(e) => setNewAppointment(prev => ({ ...prev, estimatedDuration: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="mechanic">Assign Mechanic</Label>
                  <Select onValueChange={(value) => setNewAppointment(prev => ({ ...prev, assignedMechanic: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select mechanic..." />
                    </SelectTrigger>
                    <SelectContent>
                      {mechanics.map((mechanic) => (
                        <SelectItem key={mechanic} value={mechanic}>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            {mechanic}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes & Instructions</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any special instructions or notes for this appointment..."
                  onChange={(e) => setNewAppointment(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleScheduleAppointment} className="bg-blue-600 hover:bg-blue-700">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Appointment
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Scheduled Appointments Display */}
      <div className="space-y-4">
        {scheduledCars.length > 0 ? (
          scheduledCars.map((appointment) => (
            <Card key={appointment.id} className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {getWorkTypeIcon(appointment.workType)}
                      <h4 className="font-medium text-lg">{appointment.carCode}</h4>
                    </div>
                    <Badge className={getStatusColor(appointment.status)}>
                      {appointment.status.replace('_', ' ')}
                    </Badge>
                    <Badge className={getPriorityColor(appointment.priority)}>
                      {appointment.priority} priority
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {appointment.estimatedDuration} hours
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Vehicle & Customer</p>
                    <p className="font-medium">{appointment.carModel}</p>
                    <p className="text-muted-foreground">{appointment.customerName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Work Type</p>
                    <p className="font-medium capitalize">{appointment.workType.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Assigned Mechanic</p>
                    <p className="font-medium">{appointment.assignedMechanic || 'Unassigned'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Estimated Duration</p>
                    <p className="font-medium">{appointment.estimatedDuration} hours</p>
                  </div>
                </div>

                {appointment.notes && (
                  <div className="mt-3 p-3 bg-gray-50 rounded border">
                    <p className="text-xs text-muted-foreground mb-1">Notes:</p>
                    <p className="text-sm">{appointment.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Appointments Scheduled</h3>
              <p className="text-gray-500 mb-4">
                Schedule work appointments for cars to manage garage workflow efficiently.
              </p>
              <Button onClick={() => setShowScheduleDialog(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Schedule First Appointment
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Available Cars for Scheduling */}
      {availableCars.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Available Cars for Scheduling ({availableCars.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {availableCars.slice(0, 6).map((car) => (
                <div key={car.id} className="border rounded-lg p-3 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{car.carCode}</div>
                      <div className="text-sm text-muted-foreground">{car.carModel}</div>
                      <div className="text-xs text-muted-foreground">{car.customerName}</div>
                    </div>
                    <Button size="sm" onClick={() => {
                      setNewAppointment(prev => ({ ...prev, carCode: car.carCode }));
                      setShowScheduleDialog(true);
                    }}>
                      <Plus className="h-3 w-3 mr-1" />
                      Schedule
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            {availableCars.length > 6 && (
              <p className="text-sm text-muted-foreground mt-3">
                Showing 6 of {availableCars.length} available cars. Use the "Schedule Appointment" button to see all cars.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ScheduleWorkInterface; 