import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  Car, 
  Wrench, 
  CheckCircle, 
  AlertTriangle, 
  MapPin,
  User,
  Activity,
  Battery,
  Fuel,
  Eye,
  Settings
} from 'lucide-react';
import { format, parseISO, isToday, isTomorrow, isYesterday } from 'date-fns';

interface CarData {
  id: string;
  vinNumber: string;
  model: string;
  year: number;
  color: string;
  price: number;
  status: 'sold' | 'reserved' | 'in_stock' | 'in_repair' | 'maintenance';
  category: 'EV' | 'REV' | 'ICEV';
  batteryPercentage: number;
  range: number;
  arrivalDate: string;
  pdiCompleted?: boolean;
  pdiStatus?: string;
  pdiTechnician?: string;
  pdiDate?: string;
  pdiNotes?: string;
  testDriveInfo?: any;
  customs?: 'paid' | 'not paid';
  brand?: string;
  currentFloor?: string;
  clientName?: string;
  clientPhone?: string;
  clientLicensePlate?: string;
  notes?: string;
  lastModified?: string;
  softwareVersion?: string;
  softwareLastUpdated?: string;
  softwareUpdateBy?: string;
  softwareUpdateNotes?: string;
  repairStatus?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assignedMechanic?: string;
  estimatedCompletion?: string;
  repairNotes?: string;
  partsUsed?: string[];
  laborHours?: number;
}

interface ScheduledCar {
  id: string;
  vinNumber: string;
  model: string;
  brand?: string;
  year?: number;
  color?: string;
  status: 'waiting' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  estimatedDuration: number;
  assignedMechanic?: string;
  notes?: string;
  startTime?: string;
  endTime?: string;
  actualStartTime?: string;
  actualEndTime?: string;
  partsNeeded?: string[];
  laborHours?: number;
  cost?: number;
}

interface DailyPlanViewProps {
  selectedDate?: string;
  onViewCarDetails?: (car: CarData) => void;
  onViewScheduleDetails?: (schedule: any) => void;
}

const DailyPlanView: React.FC<DailyPlanViewProps> = ({
  selectedDate,
  onViewCarDetails,
  onViewScheduleDetails
}) => {
  const [garageCars, setGarageCars] = useState<CarData[]>([]);
  const [scheduleData, setScheduleData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDailyData();
  }, [selectedDate]);

  const loadDailyData = () => {
    setLoading(true);
    
    // Load garage cars
    try {
      const savedCars = localStorage.getItem('garageCars');
      if (savedCars) {
        const parsedCars = JSON.parse(savedCars);
        setGarageCars(parsedCars);
      }
    } catch (error) {
      console.error('Error loading garage cars:', error);
    }

    // Load schedule data
    try {
      const savedSchedules = localStorage.getItem('garageSchedule');
      if (savedSchedules) {
        const schedules = JSON.parse(savedSchedules);
        const targetDate = selectedDate || format(new Date(), 'yyyy-MM-dd');
        const daySchedule = Array.isArray(schedules) 
          ? schedules.find((s: any) => s.date === targetDate)
          : schedules;
        setScheduleData(daySchedule);
        
        // Sync scheduled cars to garage inventory if they're missing
        if (daySchedule?.scheduledCars) {
          syncScheduledCarsToGarage(daySchedule.scheduledCars);
        }
      }
    } catch (error) {
      console.error('Error loading schedule data:', error);
    }

    setLoading(false);
  };

  const syncScheduledCarsToGarage = (scheduledCars: ScheduledCar[]) => {
    try {
      const existingGarageCars = localStorage.getItem('garageCars');
      const garageCars = existingGarageCars ? JSON.parse(existingGarageCars) : [];
      
      let hasChanges = false;
      
      scheduledCars.forEach(scheduledCar => {
        // Check if this car is already in garage inventory
        const existingCar = garageCars.find((car: CarData) => car.vinNumber === scheduledCar.vinNumber);
        
        if (!existingCar) {
          // Add missing car to garage inventory
          const garageCar = {
            id: `garage-${Date.now()}-${Math.random()}`,
            vinNumber: scheduledCar.vinNumber,
            model: scheduledCar.model,
            brand: scheduledCar.brand || 'Voyah',
            year: scheduledCar.year || 2024,
            color: scheduledCar.color || 'Unknown',
            price: 0,
            status: 'in_repair' as const,
            category: 'EV' as const,
            batteryPercentage: 100,
            range: 0,
            arrivalDate: new Date().toISOString(),
            currentFloor: 'Garage',
            repairStatus: scheduledCar.status === 'completed' ? 'completed' : 'pending',
            assignedMechanic: scheduledCar.assignedMechanic || '',
            estimatedCompletion: '',
            repairNotes: scheduledCar.notes || 'Added from schedule sync',
            lastModified: new Date().toISOString()
          };
          
          garageCars.push(garageCar);
          hasChanges = true;
        }
      });
      
      if (hasChanges) {
        localStorage.setItem('garageCars', JSON.stringify(garageCars));
        setGarageCars(garageCars);
        console.log('Synced scheduled cars to garage inventory');
      }
    } catch (error) {
      console.error('Error syncing scheduled cars to garage:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_repair':
        return 'bg-orange-100 text-orange-800';
      case 'maintenance':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case 'in_repair':
        return 'In Repair';
      case 'maintenance':
        return 'Maintenance';
      case 'completed':
        return 'Completed';
      case 'pending':
        return 'Pending';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'normal':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'EV':
        return <Battery className="h-4 w-4" />;
      case 'REV':
        return <Fuel className="h-4 w-4" />;
      case 'ICEV':
        return <Fuel className="h-4 w-4" />;
      default:
        return <Car className="h-4 w-4" />;
    }
  };

  const formatTime = (timeString: string) => {
    try {
      if (!timeString) return 'N/A';
      const date = parseISO(timeString);
      return format(date, 'HH:mm');
    } catch (error) {
      return timeString;
    }
  };

  const getDayLabel = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      if (isToday(date)) return 'Today';
      if (isTomorrow(date)) return 'Tomorrow';
      if (isYesterday(date)) return 'Yesterday';
      return format(date, 'EEEE, MMM d');
    } catch (error) {
      return dateString;
    }
  };

  const calculateProgress = () => {
    if (!scheduleData?.scheduledCars?.length) return 0;
    const completed = scheduleData.scheduledCars.filter((car: ScheduledCar) => 
      car.status === 'completed'
    ).length;
    return Math.round((completed / scheduleData.scheduledCars.length) * 100);
  };

  const getUrgentCars = () => {
    return garageCars.filter(car => 
      car.repairStatus === 'in_progress' || 
      car.status === 'in_repair' ||
      (scheduleData?.scheduledCars?.some((scheduled: ScheduledCar) => 
        scheduled.vinNumber === car.vinNumber && scheduled.priority === 'urgent'
      ))
    );
  };

  const getMechanicsWorkload = () => {
    const mechanics: { [key: string]: number } = {};
    
    // Count scheduled cars per mechanic
    scheduleData?.scheduledCars?.forEach((car: ScheduledCar) => {
      if (car.assignedMechanic) {
        mechanics[car.assignedMechanic] = (mechanics[car.assignedMechanic] || 0) + 1;
      }
    });

    // Count garage cars per mechanic
    garageCars.forEach(car => {
      if (car.assignedMechanic) {
        mechanics[car.assignedMechanic] = (mechanics[car.assignedMechanic] || 0) + 1;
      }
    });

    return mechanics;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const targetDate = selectedDate || format(new Date(), 'yyyy-MM-dd');
  const dayLabel = getDayLabel(targetDate);
  const progress = calculateProgress();
  const urgentCars = getUrgentCars();
  const mechanicsWorkload = getMechanicsWorkload();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Clock className="h-6 w-6 text-blue-600" />
          Daily Plan - {dayLabel}
        </h2>
          <p className="text-gray-600 mt-1">
            {scheduleData?.scheduledCars?.length || 0} cars scheduled • {garageCars.length} cars in garage
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => loadDailyData()} variant="outline">
            <Activity className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            onClick={() => {
              if (scheduleData?.scheduledCars) {
                syncScheduledCarsToGarage(scheduleData.scheduledCars);
              }
            }} 
            variant="outline"
            className="bg-blue-50 text-blue-700 hover:bg-blue-100"
          >
            <Car className="h-4 w-4 mr-2" />
            Sync to Garage
          </Button>
        </div>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Daily Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Completion Progress</span>
              <span className="text-sm text-gray-600">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-gray-600">Total Scheduled</p>
                <p className="text-xl font-semibold text-blue-800">
                  {scheduleData?.scheduledCars?.length || 0}
                </p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-gray-600">Completed</p>
                <p className="text-xl font-semibold text-green-800">
                  {scheduleData?.scheduledCars?.filter((car: ScheduledCar) => car.status === 'completed').length || 0}
                </p>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg">
                <p className="text-gray-600">In Progress</p>
                <p className="text-xl font-semibold text-orange-800">
                  {scheduleData?.scheduledCars?.filter((car: ScheduledCar) => car.status === 'in_progress').length || 0}
                </p>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <p className="text-gray-600">Urgent</p>
                <p className="text-xl font-semibold text-red-800">
                  {urgentCars.length}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mechanics Workload */}
      {Object.keys(mechanicsWorkload).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Mechanics Workload
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(mechanicsWorkload).map(([mechanic, count]) => (
                <div key={mechanic} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{mechanic}</p>
                      <p className="text-sm text-gray-600">{count} cars assigned</p>
                    </div>
                    <Badge variant={count > 3 ? 'destructive' : 'secondary'}>
                      {count > 3 ? 'High' : 'Normal'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Urgent Cars */}
      {urgentCars.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              Urgent Cars ({urgentCars.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {urgentCars.map(car => (
                <div key={car.id} className="bg-white p-4 rounded-lg border border-red-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Car className="h-5 w-5 text-red-600" />
                      <div>
                        <p className="font-medium text-gray-900">{car.model}</p>
                        <p className="text-sm text-gray-600">{car.vinNumber}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getStatusColor(car.repairStatus || car.status)}>
                            {getStatusDisplayName(car.repairStatus || car.status)}
                          </Badge>
                          {car.assignedMechanic && (
                            <Badge variant="outline" className="text-xs">
                              {car.assignedMechanic}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onViewCarDetails?.(car)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scheduled Cars */}
      {scheduleData?.scheduledCars?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Scheduled Cars ({scheduleData.scheduledCars.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {scheduleData.scheduledCars.map((scheduledCar: ScheduledCar) => {
                const garageCar = garageCars.find(car => car.vinNumber === scheduledCar.vinNumber);
                return (
                  <div key={scheduledCar.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(garageCar?.category || 'ICEV')}
                          <div>
                            <p className="font-medium text-gray-900">{scheduledCar.model}</p>
                            <p className="text-sm text-gray-600">{scheduledCar.vinNumber}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <Badge className={getPriorityColor(scheduledCar.priority)}>
                            {scheduledCar.priority}
                          </Badge>
                          <p className="text-sm text-gray-600 mt-1">
                            {scheduledCar.estimatedDuration} min
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge className={getStatusColor(scheduledCar.status)}>
                            {getStatusDisplayName(scheduledCar.status)}
                          </Badge>
                          {scheduledCar.assignedMechanic && (
                            <p className="text-sm text-gray-600 mt-1">
                              {scheduledCar.assignedMechanic}
                            </p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onViewCarDetails?.(garageCar!)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Garage Cars */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            All Cars in Garage ({garageCars.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {garageCars.map(car => (
              <div key={car.id} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(car.category)}
                      <div>
                        <p className="font-medium text-gray-900">{car.model}</p>
                        <p className="text-sm text-gray-600">{car.vinNumber}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getStatusColor(car.repairStatus || car.status)}>
                            {getStatusDisplayName(car.repairStatus || car.status)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onViewCarDetails?.(car)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DailyPlanView; 