import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Clock, 
  Car, 
  AlertTriangle, 
  Plus, 
  User, 
  Calendar, 
  Timer,
  Wrench,
  Palette,
  Zap,
  Camera,
  Star,
  TrendingUp,
  Users,
  Play,
  Pause,
  Square,
  CheckCircle,
  AlertCircle,
  Crown,
  Flag,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  Activity,
  MapPin
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { GarageSchedule, ScheduledCar } from '@/types';
import VinOcrCameraDialog from './VinOcrCameraDialog';

interface DailyTimelineViewProps {
  schedule: GarageSchedule | null;
  date: string;
  onAddCar: (carData: Omit<ScheduledCar, 'id'>, targetDate: string) => void;
  onUpdateCarStatus: (carId: string, status: ScheduledCar['status'], targetDate: string) => void;
}

interface DailyCapacity {
  totalWorkers: number;
  hoursOpen: number;
  sections: {
    electrical: { workers: number; capacity: number; };
    mechanic: { workers: number; capacity: number; };
    body_work: { workers: number; capacity: number; };
    painter: { workers: number; capacity: number; };
    detailer: { workers: number; capacity: number; };
  };
  specialIssues: string;
}

interface WorkerAction {
  id: string;
  carId: string;
  workerId: string;
  action: 'start' | 'pause' | 'test_drive' | 'waiting_parts' | 'complete' | 'resume';
  timestamp: Date;
  notes?: string;
}

interface QuickAddCarData {
  carCode: string;
  carModel: string;
  customerName: string;
  workType: 'electrical' | 'painter' | 'detailer' | 'mechanic' | 'body_work';
  priority: 'high' | 'medium' | 'low';
  priorityReason: string;
  estimatedHours: number;
  isSpecialEvent: boolean;
  isOwnerRequest: boolean;
  deadline?: string;
  assignedWorker: string;
  notes: string;
}

const DailyTimelineView: React.FC<DailyTimelineViewProps> = ({
  schedule,
  date,
  onAddCar,
  onUpdateCarStatus
}) => {
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showVinCamera, setShowVinCamera] = useState(false);
  const [selectedCarForAction, setSelectedCarForAction] = useState<string | null>(null);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [showCapacitySettings, setShowCapacitySettings] = useState(false);
  
  // Determine if today is Saturday and adjust hours accordingly
  const isSaturday = new Date(date).getDay() === 6;
  const defaultHours = isSaturday ? 6 : 8; // Saturday: 8AM-2PM (6 hours), Other days: 8AM-4PM (8 hours)
  
  // Daily capacity management
  const [dailyCapacity, setDailyCapacity] = useState<DailyCapacity>({
    totalWorkers: 8,
    hoursOpen: defaultHours,
    sections: {
      electrical: { workers: 2, capacity: 6 },
      mechanic: { workers: 3, capacity: 10 },
      body_work: { workers: 1, capacity: 3 },
      painter: { workers: 1, capacity: 2 },
      detailer: { workers: 1, capacity: 4 }
    },
    specialIssues: ''
  });

  // Update hours when date changes (for Saturday logic)
  React.useEffect(() => {
    const newDefaultHours = isSaturday ? 6 : 8;
    setDailyCapacity(prev => ({
      ...prev,
      hoursOpen: newDefaultHours
    }));
  }, [date, isSaturday]);

  const handleUpdateCapacity = (field: keyof DailyCapacity, value: any) => {
    setDailyCapacity(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleUpdateSectionCapacity = (section: keyof DailyCapacity['sections'], field: 'workers' | 'capacity', value: number) => {
    setDailyCapacity(prev => ({
      ...prev,
      sections: {
        ...prev.sections,
        [section]: {
          ...prev.sections[section],
          [field]: value
        }
      }
    }));
  };

  const [quickAddData, setQuickAddData] = useState<QuickAddCarData>({
    carCode: '',
    carModel: '',
    customerName: '',
    workType: 'mechanic',
    priority: 'medium',
    priorityReason: '',
    estimatedHours: 2,
    isSpecialEvent: false,
    isOwnerRequest: false,
    deadline: '',
    assignedWorker: '',
    notes: ''
  });

  // Mock worker actions (in real app, this would come from database)
  const [workerActions, setWorkerActions] = useState<WorkerAction[]>([]);

  const getSectionIcon = (section: string) => {
    switch (section) {
      case 'electrical': return <Zap className="h-5 w-5" />;
      case 'mechanic': return <Wrench className="h-5 w-5" />;
      case 'body_work': return <Car className="h-5 w-5" />;
      case 'painter': return <Palette className="h-5 w-5" />;
      case 'detailer': return <Star className="h-5 w-5" />;
      default: return <Car className="h-5 w-5" />;
    }
  };

  const getSectionColor = (section: string) => {
    switch (section) {
      case 'electrical': return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'mechanic': return 'bg-green-100 border-green-300 text-green-800';
      case 'body_work': return 'bg-purple-100 border-purple-300 text-purple-800';
      case 'painter': return 'bg-orange-100 border-orange-300 text-orange-800';
      case 'detailer': return 'bg-pink-100 border-pink-300 text-pink-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-4 border-l-red-500 bg-red-50';
      case 'medium': return 'border-l-4 border-l-orange-500 bg-orange-50';
      case 'low': return 'border-l-4 border-l-green-500 bg-green-50';
      default: return 'border-l-4 border-l-gray-500 bg-gray-50';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'start': return <Play className="h-4 w-4 text-green-600" />;
      case 'pause': return <Pause className="h-4 w-4 text-orange-600" />;
      case 'test_drive': return <Car className="h-4 w-4 text-blue-600" />;
      case 'waiting_parts': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'complete': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'resume': return <Play className="h-4 w-4 text-green-600" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const handleVinDetected = (vin: string) => {
    setQuickAddData(prev => ({ ...prev, carCode: vin }));
    setShowVinCamera(false);
  };

  const handleQuickAddCar = () => {
    if (!quickAddData.carCode) {
      toast({
        title: 'Missing VIN',
        description: 'Please provide VIN number.',
        variant: 'destructive'
      });
      return;
    }

    const newCar: Omit<ScheduledCar, 'id'> = {
      carCode: quickAddData.carCode,
      carModel: quickAddData.carModel,
      customerName: quickAddData.customerName,
      priority: quickAddData.priority,
      estimatedDuration: `${quickAddData.estimatedHours}h`,
      workType: quickAddData.workType,
      assignedMechanic: quickAddData.assignedWorker,
      notes: quickAddData.notes,
      status: 'scheduled'
    };

    onAddCar(newCar, date);
    
    // Log the scheduling action
    const newAction: WorkerAction = {
      id: Date.now().toString(),
      carId: quickAddData.carCode,
      workerId: 'Manager',
      action: 'start',
      timestamp: new Date(),
      notes: `Assigned: ${quickAddData.priorityReason || 'Regular service'}`
    };
    setWorkerActions(prev => [...prev, newAction]);

    // Reset form
    setQuickAddData({
      carCode: '',
      carModel: '',
      customerName: '',
      workType: 'mechanic',
      priority: 'medium',
      priorityReason: '',
      estimatedHours: 2,
      isSpecialEvent: false,
      isOwnerRequest: false,
      deadline: '',
      assignedWorker: '',
      notes: ''
    });
    setShowQuickAdd(false);

    toast({
      title: 'Car Assigned',
      description: `${quickAddData.carCode} assigned to ${quickAddData.workType} section`,
    });
  };

  const handleWorkerAction = (carId: string, action: string, notes?: string) => {
    const newAction: WorkerAction = {
      id: Date.now().toString(),
      carId,
      workerId: 'Current Worker', // In real app, get from auth
      action: action as WorkerAction['action'],
      timestamp: new Date(),
      notes
    };
    
    setWorkerActions(prev => [...prev, newAction]);
    setShowActionDialog(false);
    setSelectedCarForAction(null);

    toast({
      title: 'Action Logged',
      description: `${action.replace('_', ' ')} recorded for ${carId}`,
    });
  };

  // Get all cars and organize by section
  const allCars = schedule?.scheduledCars || [];
  const scheduledCars = allCars.filter(car => car.status !== 'pending');
  const pendingCars = allCars.filter(car => car.status === 'pending');
  
  // Calculate section statistics
  const sectionStats = {
    electrical: {
      scheduled: scheduledCars.filter(car => car.workType === 'electrical' && car.status === 'scheduled').length,
      inProgress: scheduledCars.filter(car => car.workType === 'electrical' && car.status === 'in_progress').length,
      completed: scheduledCars.filter(car => car.workType === 'electrical' && car.status === 'completed').length,
      highPriority: scheduledCars.filter(car => car.workType === 'electrical' && car.priority === 'high').length,
    },
    mechanic: {
      scheduled: scheduledCars.filter(car => car.workType === 'mechanic' && car.status === 'scheduled').length,
      inProgress: scheduledCars.filter(car => car.workType === 'mechanic' && car.status === 'in_progress').length,
      completed: scheduledCars.filter(car => car.workType === 'mechanic' && car.status === 'completed').length,
      highPriority: scheduledCars.filter(car => car.workType === 'mechanic' && car.priority === 'high').length,
    },
    body_work: {
      scheduled: scheduledCars.filter(car => car.workType === 'body_work' && car.status === 'scheduled').length,
      inProgress: scheduledCars.filter(car => car.workType === 'body_work' && car.status === 'in_progress').length,
      completed: scheduledCars.filter(car => car.workType === 'body_work' && car.status === 'completed').length,
      highPriority: scheduledCars.filter(car => car.workType === 'body_work' && car.priority === 'high').length,
    },
    painter: {
      scheduled: scheduledCars.filter(car => car.workType === 'painter' && car.status === 'scheduled').length,
      inProgress: scheduledCars.filter(car => car.workType === 'painter' && car.status === 'in_progress').length,
      completed: scheduledCars.filter(car => car.workType === 'painter' && car.status === 'completed').length,
      highPriority: scheduledCars.filter(car => car.workType === 'painter' && car.priority === 'high').length,
    },
    detailer: {
      scheduled: scheduledCars.filter(car => car.workType === 'detailer' && car.status === 'scheduled').length,
      inProgress: scheduledCars.filter(car => car.workType === 'detailer' && car.status === 'in_progress').length,
      completed: scheduledCars.filter(car => car.workType === 'detailer' && car.status === 'completed').length,
      highPriority: scheduledCars.filter(car => car.workType === 'detailer' && car.priority === 'high').length,
    }
  };

  // Filter cars by section if needed
  const filteredCars = selectedSection === 'all' 
    ? scheduledCars 
    : scheduledCars.filter(car => car.workType === selectedSection);

  // Calculate total daily capacity
  const totalDailyCapacity = Object.values(dailyCapacity.sections).reduce((sum, section) => sum + section.capacity, 0);
  const totalCarsScheduled = scheduledCars.length;
  const capacityUtilization = Math.round((totalCarsScheduled / totalDailyCapacity) * 100);

  return (
    <div className="space-y-6 p-4">
      {/* Quick Add Button */}
      <div className="flex items-center justify-end">
        <div className="flex items-center space-x-3">
          <Dialog open={showQuickAdd} onOpenChange={setShowQuickAdd}>
            <DialogTrigger asChild>
              <Button size="lg">
                <Plus className="h-5 w-5 mr-2" />
                Add Car Assignment
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      {/* Today's Capacity - Always Visible */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl flex items-center">
              <TrendingUp className="h-6 w-6 mr-2 text-blue-600" />
              TODAY'S CAPACITY
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowCapacitySettings(true)}
              className="bg-white hover:bg-gray-50"
            >
              <MapPin className="h-4 w-4 mr-2" />
              Edit Settings
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{totalCarsScheduled}/{totalDailyCapacity}</div>
              <div className="text-sm text-gray-600">Cars/Capacity</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{dailyCapacity.totalWorkers}</div>
              <div className="text-sm text-gray-600">Workers Today</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">{dailyCapacity.hoursOpen}h</div>
              <div className="text-sm text-gray-600">
                Hours Open {isSaturday ? '(Saturday: 8AM-2PM)' : '(8AM-4PM)'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{capacityUtilization}%</div>
              <div className="text-sm text-gray-600">Utilization</div>
            </div>
          </div>
          <Progress value={capacityUtilization} className="h-3" />
          {dailyCapacity.specialIssues && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <div className="flex items-center">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
                <span className="font-medium text-yellow-800">Special Issues Today:</span>
              </div>
              <p className="text-yellow-700 mt-1">{dailyCapacity.specialIssues}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section Status Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <Users className="h-5 w-5 mr-2" />
            SECTION STATUS DASHBOARD
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {Object.entries(sectionStats).map(([section, stats]) => (
              <Card key={section} className="cursor-pointer hover:shadow-md transition-shadow" 
                    onClick={() => setSelectedSection(section)}>
                <CardHeader className="pb-2">
                  <CardTitle className={`text-sm flex items-center ${getSectionColor(section)} px-2 py-1 rounded`}>
                    {getSectionIcon(section)}
                    <span className="ml-2 capitalize">{section.replace('_', ' ')}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Workers:</span>
                      <span className="font-bold">{dailyCapacity.sections[section as keyof typeof dailyCapacity.sections].workers}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Capacity:</span>
                      <span className="font-bold">{dailyCapacity.sections[section as keyof typeof dailyCapacity.sections].capacity}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Scheduled:</span>
                      <span className="font-bold text-blue-600">{stats.scheduled}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>In Progress:</span>
                      <span className="font-bold text-orange-600">{stats.inProgress}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Completed:</span>
                      <span className="font-bold text-green-600">{stats.completed}</span>
                    </div>
                    {stats.highPriority > 0 && (
                      <div className="flex justify-between text-sm bg-red-50 px-2 py-1 rounded">
                        <span>HIGH:</span>
                        <span className="font-bold text-red-600">{stats.highPriority}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filter Controls */}
      <div className="flex items-center justify-between">
        <Select value={selectedSection} onValueChange={setSelectedSection}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Filter by section" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sections</SelectItem>
            <SelectItem value="electrical">Electrical</SelectItem>
            <SelectItem value="mechanic">Mechanical</SelectItem>
            <SelectItem value="body_work">Body Work</SelectItem>
            <SelectItem value="painter">Painting</SelectItem>
            <SelectItem value="detailer">Detailing</SelectItem>
          </SelectContent>
        </Select>
        
        <Button variant="outline" onClick={() => setSelectedSection('all')}>
          Show All Sections
        </Button>
      </div>

      {/* Pending Cars - Need Assignment */}
      {pendingCars.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              PENDING CARS ({pendingCars.length}) - NEED ASSIGNMENT
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingCars.map((car) => (
                <div key={car.id} className="bg-white border-2 border-orange-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-xl">{car.carCode}</span>
                    <Badge className="bg-orange-100 text-orange-700 border-orange-300">
                      PENDING
                    </Badge>
                  </div>
                  <p className="font-medium text-gray-800">{car.carModel}</p>
                  <p className="text-gray-600">{car.customerName}</p>
                  <div className="flex items-center justify-between mt-4">
                    <div className={`flex items-center text-sm px-3 py-1 rounded-lg ${getSectionColor(car.workType)}`}>
                      {getSectionIcon(car.workType)}
                      <span className="ml-2 font-medium capitalize">{car.workType.replace('_', ' ')}</span>
                    </div>
                    <Select 
                      value={car.status} 
                      onValueChange={(value) => onUpdateCarStatus(car.id!, value as ScheduledCar['status'], date)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="scheduled">Assign</SelectItem>
                        <SelectItem value="in_progress">Start Now</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Schedule List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <Timer className="h-6 w-6 mr-2" />
            TODAY'S ASSIGNMENTS
            {selectedSection !== 'all' && (
              <span className="ml-2 text-lg">
                - {selectedSection.replace('_', ' ').toUpperCase()}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCars.length === 0 ? (
            <div className="text-center py-12">
              <Car className="h-20 w-20 mx-auto text-gray-300 mb-4" />
              <h3 className="text-2xl font-semibold text-gray-500 mb-2">No Cars Assigned</h3>
              <p className="text-gray-400 text-lg">Ready for new assignments!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCars.map((car, index) => {
                const startTime = `${8 + Math.floor((index / filteredCars.length) * 8)}:${(index % 2) * 30 < 10 ? '0' : ''}${(index % 2) * 30}`;
                const carActions = workerActions.filter(action => action.carId === car.carCode);
                const isSpecialEvent = car.notes?.includes('SPECIAL EVENT');
                const isOwnerRequest = car.notes?.includes('OWNER REQUEST');
                
                return (
                  <Card
                    key={car.id}
                    className={`
                      ${getPriorityColor(car.priority)}
                      ${isSpecialEvent ? 'ring-2 ring-purple-400' : ''}
                      ${isOwnerRequest ? 'ring-2 ring-yellow-400' : ''}
                      hover:shadow-lg transition-all duration-200
                    `}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        {/* Left Side - Car Info */}
                        <div className="flex items-center space-x-6">
                          <div className="text-center">
                            <div className="text-3xl font-bold text-blue-600">{startTime}</div>
                            <div className="text-sm text-gray-500">Start Time</div>
                          </div>
                          
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="text-2xl font-bold">{car.carCode}</h3>
                              {car.priority === 'high' && (
                                <Badge className="bg-red-100 text-red-700 border-red-300">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  URGENT
                                </Badge>
                              )}
                              {isSpecialEvent && (
                                <Badge className="bg-purple-100 text-purple-700 border-purple-300">
                                  <Crown className="h-3 w-3 mr-1" />
                                  SPECIAL EVENT
                                </Badge>
                              )}
                              {isOwnerRequest && (
                                <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">
                                  <Flag className="h-3 w-3 mr-1" />
                                  OWNER REQUEST
                                </Badge>
                              )}
                            </div>
                            <p className="text-lg font-medium text-gray-700">{car.carModel}</p>
                            <p className="text-gray-600">{car.customerName}</p>
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            <div className={`flex items-center px-4 py-2 rounded-lg ${getSectionColor(car.workType)}`}>
                              {getSectionIcon(car.workType)}
                              <span className="ml-2 font-medium capitalize">{car.workType.replace('_', ' ')}</span>
                            </div>
                            <Badge variant="outline" className="text-lg px-3 py-1">
                              {car.estimatedDuration}
                            </Badge>
                            <div className="flex items-center text-gray-600">
                              <User className="h-4 w-4 mr-1" />
                              <span>{car.assignedMechanic}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Right Side - Actions */}
                        <div className="flex items-center space-x-3">
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedCarForAction(car.id!);
                                setShowActionDialog(true);
                              }}
                            >
                              <Activity className="h-4 w-4 mr-1" />
                              Log Action
                            </Button>
                          </div>
                          
                          <Select 
                            value={car.status} 
                            onValueChange={(value) => onUpdateCarStatus(car.id!, value as ScheduledCar['status'], date)}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="scheduled">Assigned</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="delayed">Delayed</SelectItem>
                              <SelectItem value="pending">Move to Pending</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <div className="flex flex-col space-y-1">
                            <Button size="sm" variant="outline">
                              <ArrowUp className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <ArrowDown className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Action Timeline */}
                      {carActions.length > 0 && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <h4 className="font-medium text-sm mb-2">Action Timeline:</h4>
                          <div className="space-y-1">
                            {carActions.slice(-3).map((action) => (
                              <div key={action.id} className="flex items-center text-sm">
                                {getActionIcon(action.action)}
                                <span className="ml-2">{action.action.replace('_', ' ')}</span>
                                <span className="ml-auto text-gray-500">
                                  {action.timestamp.toLocaleTimeString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Notes */}
                      {car.notes && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-800"><strong>Notes:</strong> {car.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Worker Action Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Worker Action</DialogTitle>
            <DialogDescription>
              Record what's happening with this car
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={() => handleWorkerAction(selectedCarForAction!, 'start')}>
              <Play className="h-4 w-4 mr-2" />
              Start Work
            </Button>
            <Button onClick={() => handleWorkerAction(selectedCarForAction!, 'pause')}>
              <Pause className="h-4 w-4 mr-2" />
              Pause
            </Button>
            <Button onClick={() => handleWorkerAction(selectedCarForAction!, 'test_drive')}>
              <Car className="h-4 w-4 mr-2" />
              Test Drive
            </Button>
            <Button onClick={() => handleWorkerAction(selectedCarForAction!, 'waiting_parts')}>
              <Clock className="h-4 w-4 mr-2" />
              Waiting Parts
            </Button>
            <Button onClick={() => handleWorkerAction(selectedCarForAction!, 'resume')}>
              <Play className="h-4 w-4 mr-2" />
              Resume
            </Button>
            <Button onClick={() => handleWorkerAction(selectedCarForAction!, 'complete')}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Complete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Car Assignment Dialog */}
      <Dialog open={showQuickAdd} onOpenChange={setShowQuickAdd}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Car Assignment</DialogTitle>
            <DialogDescription>
              Assign a new car to a worker and section
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>VIN/Car Code *</Label>
              <div className="flex space-x-2">
                <Input
                  value={quickAddData.carCode}
                  onChange={(e) => setQuickAddData(prev => ({ ...prev, carCode: e.target.value }))}
                  placeholder="Enter VIN"
                />
                <Button variant="outline" onClick={() => setShowVinCamera(true)}>
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Car Model</Label>
                <Input
                  value={quickAddData.carModel}
                  onChange={(e) => setQuickAddData(prev => ({ ...prev, carModel: e.target.value }))}
                  placeholder="Toyota Camry"
                />
              </div>
              <div>
                <Label>Customer Name</Label>
                <Input
                  value={quickAddData.customerName}
                  onChange={(e) => setQuickAddData(prev => ({ ...prev, customerName: e.target.value }))}
                  placeholder="Customer name"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Section</Label>
                <Select value={quickAddData.workType} onValueChange={(value) => setQuickAddData(prev => ({ ...prev, workType: value as QuickAddCarData['workType'] }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="electrical">Electrical</SelectItem>
                    <SelectItem value="mechanic">Mechanical</SelectItem>
                    <SelectItem value="body_work">Body Work</SelectItem>
                    <SelectItem value="painter">Painting</SelectItem>
                    <SelectItem value="detailer">Detailing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Priority Level</Label>
                <Select value={quickAddData.priority} onValueChange={(value) => setQuickAddData(prev => ({ ...prev, priority: value as QuickAddCarData['priority'] }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">HIGH - Urgent</SelectItem>
                    <SelectItem value="medium">MEDIUM - Normal</SelectItem>
                    <SelectItem value="low">LOW - When Available</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {quickAddData.priority === 'high' && (
              <div>
                <Label>Priority Reason *</Label>
                <Input
                  value={quickAddData.priorityReason}
                  onChange={(e) => setQuickAddData(prev => ({ ...prev, priorityReason: e.target.value }))}
                  placeholder="VIP customer, urgent event, etc."
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Assigned Worker</Label>
                <Input
                  value={quickAddData.assignedWorker}
                  onChange={(e) => setQuickAddData(prev => ({ ...prev, assignedWorker: e.target.value }))}
                  placeholder="Worker name"
                />
              </div>
              <div>
                <Label>Estimated Hours</Label>
                <Input
                  type="number"
                  min="0.5"
                  max="12"
                  step="0.5"
                  value={quickAddData.estimatedHours}
                  onChange={(e) => setQuickAddData(prev => ({ ...prev, estimatedHours: parseFloat(e.target.value) || 2 }))}
                />
              </div>
            </div>

            <div className="flex space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={quickAddData.isSpecialEvent}
                  onChange={(e) => setQuickAddData(prev => ({ ...prev, isSpecialEvent: e.target.checked }))}
                />
                <span>Special Event</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={quickAddData.isOwnerRequest}
                  onChange={(e) => setQuickAddData(prev => ({ ...prev, isOwnerRequest: e.target.checked }))}
                />
                <span>Owner Request</span>
              </label>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                value={quickAddData.notes}
                onChange={(e) => setQuickAddData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Special instructions, deadline info, etc."
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowQuickAdd(false)}>
              Cancel
            </Button>
            <Button onClick={handleQuickAddCar}>
              Add Assignment
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Capacity Settings Dialog */}
      <Dialog open={showCapacitySettings} onOpenChange={setShowCapacitySettings}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Edit Garage Capacity Settings</DialogTitle>
            <DialogDescription>
              Adjust working hours and section capacities based on available workers and special circumstances
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* General Settings */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Total Workers Today</Label>
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={dailyCapacity.totalWorkers}
                  onChange={(e) => handleUpdateCapacity('totalWorkers', parseInt(e.target.value) || 1)}
                />
              </div>
              <div>
                <Label>Hours Open</Label>
                <Input
                  type="number"
                  min="2"
                  max="12"
                  value={dailyCapacity.hoursOpen}
                  onChange={(e) => handleUpdateCapacity('hoursOpen', parseInt(e.target.value) || 8)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {isSaturday ? 'Saturday default: 6h (8AM-2PM)' : 'Weekday default: 8h (8AM-4PM)'}
                </p>
              </div>
              <div>
                <Label>Special Issues/Notes</Label>
                <Input
                  value={dailyCapacity.specialIssues}
                  onChange={(e) => handleUpdateCapacity('specialIssues', e.target.value)}
                  placeholder="e.g., Worker sick, equipment issue"
                />
              </div>
            </div>

            {/* Section Capacities */}
            <div>
              <h3 className="text-lg font-medium mb-4">Section Capacity Management</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(dailyCapacity.sections).map(([section, data]) => (
                  <Card key={section} className={`p-4 ${getSectionColor(section)}`}>
                    <div className="flex items-center mb-3">
                      {getSectionIcon(section)}
                      <span className="ml-2 font-medium capitalize">{section.replace('_', ' ')}</span>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm">Workers Available</Label>
                        <Input
                          type="number"
                          min="0"
                          max="10"
                          value={data.workers}
                          onChange={(e) => handleUpdateSectionCapacity(
                            section as keyof DailyCapacity['sections'], 
                            'workers', 
                            parseInt(e.target.value) || 0
                          )}
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-sm">Daily Capacity</Label>
                        <Input
                          type="number"
                          min="0"
                          max="20"
                          value={data.capacity}
                          onChange={(e) => handleUpdateSectionCapacity(
                            section as keyof DailyCapacity['sections'], 
                            'capacity', 
                            parseInt(e.target.value) || 0
                          )}
                          className="mt-1"
                        />
                      </div>
                      
                      <div className="text-xs text-gray-600">
                        Current: {sectionStats[section as keyof typeof sectionStats].scheduled + 
                                 sectionStats[section as keyof typeof sectionStats].inProgress} active cars
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Capacity Alert */}
            {totalCarsScheduled > totalDailyCapacity && (
              <div className="bg-red-50 border border-red-200 rounded p-4">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                  <span className="font-medium text-red-800">Over Capacity Warning</span>
                </div>
                <p className="text-red-700 mt-1">
                  You have {totalCarsScheduled} cars scheduled but only {totalDailyCapacity} capacity. 
                  Consider adjusting section capacities or rescheduling some cars.
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowCapacitySettings(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              setShowCapacitySettings(false);
              toast({
                title: 'Settings Updated',
                description: 'Garage capacity settings have been updated successfully.',
              });
            }}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* VIN OCR Camera Dialog */}
      <VinOcrCameraDialog
        isOpen={showVinCamera}
        onClose={() => setShowVinCamera(false)}
        onVinDetected={handleVinDetected}
      />

      {/* Live System Integration Status */}
      <div className="flex items-center justify-center gap-2 py-3 mt-6 border-t bg-blue-50 rounded-lg">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
        <span className="text-xs text-muted-foreground">
          Live integration with garage overview • Data synced automatically
        </span>
        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
          <Activity className="h-3 w-3 mr-1" />
          System Active
        </Badge>
      </div>
    </div>
  );
};

export default DailyTimelineView;
