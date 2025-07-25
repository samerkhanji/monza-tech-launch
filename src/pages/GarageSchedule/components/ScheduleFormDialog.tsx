import React, { useState, useContext } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCarData } from '@/contexts/CarDataContext';
import { GarageSchedule, ScheduledCar } from '@/types';
import { Search, Car, User, Clock, Wrench, AlertTriangle, Camera } from 'lucide-react';
import VinOcrCameraDialog from './VinOcrCameraDialog';

interface ScheduleFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingSchedule: GarageSchedule | null;
  onSubmit: (formData: any, editingSchedule?: GarageSchedule | null) => void;
}

interface CarAssignmentData {
  carCode: string;
  carModel: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  repairType: string;
  urgencyLevel: 'high' | 'medium' | 'low';
  estimatedHours: number;
  section: 'electrical' | 'painter' | 'detailer' | 'mechanic' | 'body_work';
  notes: string;
}

const ScheduleFormDialog: React.FC<ScheduleFormDialogProps> = ({
  isOpen,
  onClose,
  editingSchedule,
  onSubmit
}) => {
  const carDataContext = useCarData();
  const [activeTab, setActiveTab] = useState<'schedule' | 'assignment'>('schedule');
  
  const [formData, setFormData] = useState({
    date: editingSchedule?.date || '',
    startTime: editingSchedule?.startTime || '08:00',
    endTime: editingSchedule?.endTime || '16:00',
    available: editingSchedule?.available ?? true,
    notes: editingSchedule?.notes || '',
    maxCarsCapacity: editingSchedule?.maxCarsCapacity || 7
  });

  const [carAssignments, setCarAssignments] = useState<CarAssignmentData[]>([]);
  const [selectedVIN, setSelectedVIN] = useState<string>('');
  const [showVinCamera, setShowVinCamera] = useState(false);
  const [manualEntry, setManualEntry] = useState<CarAssignmentData>({
    carCode: '',
    carModel: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    repairType: '',
    urgencyLevel: 'medium',
    estimatedHours: 2,
    section: 'electrical',
    notes: ''
  });

  React.useEffect(() => {
    if (editingSchedule) {
      setFormData({
        date: editingSchedule.date,
        startTime: editingSchedule.startTime,
        endTime: editingSchedule.endTime,
        available: editingSchedule.available,
        notes: editingSchedule.notes || '',
        maxCarsCapacity: editingSchedule.maxCarsCapacity || 7
      });
      
      // Load existing car assignments if any
      if (editingSchedule.scheduledCars) {
        const assignments: CarAssignmentData[] = editingSchedule.scheduledCars.map(car => ({
          carCode: car.carCode,
          carModel: car.carModel,
          customerName: car.customerName,
          customerPhone: '', // Not in original interface
          customerEmail: '', // Not in original interface
          repairType: car.workType,
          urgencyLevel: car.priority,
          estimatedHours: parseInt(car.estimatedDuration) || 2,
          section: car.workType,
          notes: car.notes || ''
        }));
        setCarAssignments(assignments);
      }
    } else {
      setFormData({
        date: '',
        startTime: '08:00',
        endTime: '16:00',
        available: true,
        notes: '',
        maxCarsCapacity: 7
      });
      setCarAssignments([]);
    }
  }, [editingSchedule, isOpen]);

  const availableCars = carDataContext.unifiedCars.filter(car => 
    car.currentLocation === 'inventory' || car.currentLocation === 'garage'
  );

  const handleVINSelection = (vinCode: string) => {
    const car = carDataContext.getCarByCode(vinCode);
    if (car) {
      setManualEntry({
        carCode: car.carCode,
        carModel: car.model,
        customerName: car.clientName || '',
        customerPhone: car.clientPhone || '',
        customerEmail: car.clientEmail || '',
        repairType: '',
        urgencyLevel: 'medium',
        estimatedHours: 2,
        section: 'electrical',
        notes: ''
      });
    }
    setSelectedVIN(vinCode);
  };

  const addCarAssignment = () => {
    if (!manualEntry.carCode || !manualEntry.repairType) {
      return;
    }

    // Check if car is already assigned
    const alreadyAssigned = carAssignments.some(assignment => 
      assignment.carCode === manualEntry.carCode
    );

    if (alreadyAssigned) {
      alert('This car is already assigned to this schedule.');
      return;
    }

    setCarAssignments(prev => [...prev, { ...manualEntry }]);
    
    // Reset manual entry
    setManualEntry({
      carCode: '',
      carModel: '',
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      repairType: '',
      urgencyLevel: 'medium',
      estimatedHours: 2,
      section: 'electrical',
      notes: ''
    });
    setSelectedVIN('');
  };

  const removeCarAssignment = (index: number) => {
    setCarAssignments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert car assignments to ScheduledCar format
    const scheduledCars: ScheduledCar[] = carAssignments.map((assignment, index) => ({
      id: `scheduled-${Date.now()}-${index}`,
      carCode: assignment.carCode,
      carModel: assignment.carModel,
      customerName: assignment.customerName,
      priority: assignment.urgencyLevel,
      estimatedDuration: `${assignment.estimatedHours}h`,
      workType: assignment.section,
      assignedMechanic: 'Mark',
      notes: assignment.notes,
      status: 'pending'
    }));

    const scheduleData = {
      ...formData,
      scheduledCars
    };

    onSubmit(scheduleData, editingSchedule);
    onClose();
  };

  const getSectionCapacityInfo = (section: string) => {
    const sectionCounts = carAssignments.reduce((acc, assignment) => {
      acc[assignment.section] = (acc[assignment.section] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const count = sectionCounts[section] || 0;
    const maxCapacity = {
      electrical: 8,
      mechanic: 8,
      body_work: 6,
      painter: 6,
      detailer: 6
    }[section] || 6;

    const activeLimit = 2; // Only 2 cars actively worked on
    const willBePending = count > activeLimit;

    return {
      count,
      maxCapacity,
      activeLimit,
      willBePending,
      pendingCount: Math.max(0, count - activeLimit)
    };
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {editingSchedule ? 'Edit Schedule' : 'Add Schedule Entry'}
          </DialogTitle>
          <DialogDescription>
            Set Mark's availability, working hours, and assign cars to sections.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'schedule' | 'assignment')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="schedule">Schedule Settings</TabsTrigger>
            <TabsTrigger value="assignment" className="flex items-center gap-2">
              Car Assignment
              {carAssignments.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {carAssignments.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="schedule" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <div className="relative z-10">
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="relative z-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxCarsCapacity">Max Cars</Label>
                <Input
                  id="maxCarsCapacity"
                  type="number"
                  min="1"
                  max="20"
                  value={formData.maxCarsCapacity}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxCarsCapacity: parseInt(e.target.value) }))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="available">Available</Label>
              <Select
                value={formData.available.toString()}
                onValueChange={(value) => setFormData(prev => ({ ...prev, available: value === 'true' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Available</SelectItem>
                  <SelectItem value="false">Not Available</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Optional notes..."
              />
            </div>
          </TabsContent>

          <TabsContent value="assignment" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Add Car Assignment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* VIN Selection or Manual Entry */}
                <div className="space-y-2">
                  <Label>Car Selection Method</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Select by VIN</Label>
                      <Select value={selectedVIN} onValueChange={handleVINSelection}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose VIN..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availableCars.map(car => (
                            <SelectItem key={car.carCode} value={car.carCode}>
                              {car.carCode} - {car.model} ({car.color})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Or Enter VIN Manually</Label>
                      <Input
                        placeholder="Enter VIN..."
                        value={manualEntry.carCode}
                        onChange={(e) => setManualEntry(prev => ({ ...prev, carCode: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Car Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Car Model</Label>
                    <Input
                      value={manualEntry.carModel}
                      onChange={(e) => setManualEntry(prev => ({ ...prev, carModel: e.target.value }))}
                      placeholder="Car model..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Repair Type</Label>
                    <Input
                      value={manualEntry.repairType}
                      onChange={(e) => setManualEntry(prev => ({ ...prev, repairType: e.target.value }))}
                      placeholder="e.g., Battery replacement, Paint touch-up..."
                      required
                    />
                  </div>
                </div>

                {/* Customer Information */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Customer Name</Label>
                    <Input
                      value={manualEntry.customerName}
                      onChange={(e) => setManualEntry(prev => ({ ...prev, customerName: e.target.value }))}
                      placeholder="Customer name..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      value={manualEntry.customerPhone}
                      onChange={(e) => setManualEntry(prev => ({ ...prev, customerPhone: e.target.value }))}
                      placeholder="Phone number..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      value={manualEntry.customerEmail}
                      onChange={(e) => setManualEntry(prev => ({ ...prev, customerEmail: e.target.value }))}
                      placeholder="Email address..."
                      type="email"
                    />
                  </div>
                </div>

                {/* Work Details */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Section Assignment</Label>
                    <Select
                      value={manualEntry.section}
                      onValueChange={(value) => setManualEntry(prev => ({ ...prev, section: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="electrical">Electrical Work</SelectItem>
                        <SelectItem value="mechanic">Mechanical Repairs</SelectItem>
                        <SelectItem value="body_work">Body Work</SelectItem>
                        <SelectItem value="painter">Painting</SelectItem>
                        <SelectItem value="detailer">Detailing</SelectItem>
                      </SelectContent>
                    </Select>
                    {(() => {
                      const capacityInfo = getSectionCapacityInfo(manualEntry.section);
                      return capacityInfo.willBePending && (
                        <div className="flex items-center gap-1 text-amber-600 text-xs">
                          <AlertTriangle className="h-3 w-3" />
                          Will be pending (2 cars max active)
                        </div>
                      );
                    })()}
                  </div>
                  <div className="space-y-2">
                    <Label>Urgency Level</Label>
                    <Select
                      value={manualEntry.urgencyLevel}
                      onValueChange={(value) => setManualEntry(prev => ({ ...prev, urgencyLevel: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Normal</SelectItem>
                        <SelectItem value="medium">Priority Client</SelectItem>
                        <SelectItem value="high">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Estimated Hours</Label>
                    <Input
                      type="number"
                      min="0.5"
                      max="24"
                      step="0.5"
                      value={manualEntry.estimatedHours}
                      onChange={(e) => setManualEntry(prev => ({ ...prev, estimatedHours: parseFloat(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Work Notes</Label>
                  <Textarea
                    value={manualEntry.notes}
                    onChange={(e) => setManualEntry(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Specific repair notes, parts needed, etc..."
                  />
                </div>

                <Button 
                  type="button" 
                  onClick={addCarAssignment}
                  disabled={!manualEntry.carCode || !manualEntry.repairType}
                  className="w-full"
                >
                  Add Car to Schedule
                </Button>
              </CardContent>
            </Card>

            {/* Assigned Cars List */}
            {carAssignments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Wrench className="h-5 w-5" />
                      Assigned Cars ({carAssignments.length})
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {carAssignments.map((assignment, index) => {
                      const capacityInfo = getSectionCapacityInfo(assignment.section);
                      const position = carAssignments.filter(a => a.section === assignment.section).indexOf(assignment) + 1;
                      const isActive = position <= 2;
                      
                      return (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{assignment.carCode}</span>
                              <Badge variant={isActive ? "default" : "secondary"}>
                                {isActive ? "Active Work" : `Pending #${position - 2}`}
                              </Badge>
                              <Badge variant="outline" className={`text-xs ${
                                assignment.urgencyLevel === 'high' ? 'border-red-500 text-red-700' :
                                assignment.urgencyLevel === 'medium' ? 'border-orange-500 text-orange-700' :
                                'border-gray-500 text-gray-700'
                              }`}>
                                {assignment.urgencyLevel}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-600">
                              <div>{assignment.carModel} - {assignment.repairType}</div>
                              <div>Customer: {assignment.customerName} | Section: {assignment.section} | {assignment.estimatedHours}h</div>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeCarAssignment(index)}
                          >
                            Remove
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit}>
            {editingSchedule ? 'Update Schedule' : 'Create Schedule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleFormDialog;
