import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Clock, 
  Car, 
  Wrench, 
  User, 
  AlertTriangle, 
  CheckCircle, 
  Play, 
  Pause, 
  Settings,
  MapPin,
  Timer,
  Activity,
  Zap,
  Palette,
  Star,
  Hammer,
  Sparkles,
  Eye,
  FileText,
  Package,
  DollarSign,
  TrendingUp,
  Phone,
  Mail
} from 'lucide-react';
import { format, parseISO, isToday, isTomorrow, addHours, differenceInMinutes } from 'date-fns';
import { ScheduledCar } from '@/types';
import { EnhancedRepairHistoryService } from '@/services/enhancedRepairHistoryService';
import { PartsInventoryService } from '@/services/partsInventoryService';
import { RealCarDataService, RealCarData } from '@/services/realCarDataService';
import { useToast } from '@/hooks/use-toast';
import { safeParseInt } from '@/utils/errorHandling';

interface EnhancedGarageScheduleViewProps {
  date: string;
  scheduledCars: ScheduledCar[];
  onCarStatusUpdate?: (carId: string, status: ScheduledCar['status']) => void;
  onViewCarDetails?: (car: ScheduledCar) => void;
}

interface CarDetails {
  car: ScheduledCar;
  repairHistory: any[];
  partsNeeded: any[];
  realCarData?: RealCarData;
  timeProgress: {
    elapsed: number;
    remaining: number;
    percentage: number;
    isOverrunning: boolean;
    overrunMinutes: number;
  };
}

export const EnhancedGarageScheduleView: React.FC<EnhancedGarageScheduleViewProps> = ({
  date,
  scheduledCars,
  onCarStatusUpdate,
  onViewCarDetails
}) => {
  const { toast } = useToast();
  const [carDetails, setCarDetails] = useState<CarDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCar, setSelectedCar] = useState<CarDetails | null>(null);
  const [showCarDetailsDialog, setShowCarDetailsDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'workers' | 'parts' | 'timeline'>('overview');

  useEffect(() => {
    loadCarDetails();
  }, [scheduledCars, date]);

  const loadCarDetails = async () => {
    setLoading(true);
    const details: CarDetails[] = [];

    for (const car of scheduledCars) {
      try {
        // Load repair history
        const repairHistory = await EnhancedRepairHistoryService.getCarRepairHistory(car.carCode);
        
        // Load parts information
        const partsNeeded = await PartsInventoryService.getPartsForCar(car.carCode);
        
        // Load real car data if available
        let realCarData: RealCarData | undefined;
        try {
          const realCars = await RealCarDataService.getRealCarData();
          realCarData = realCars.find(rc => rc.vinNumber === car.carCode);
        } catch (error) {
          console.warn('Could not load real car data:', error);
        }

        // Calculate time progress
        const timeProgress = calculateTimeProgress(car);

        details.push({
          car,
          repairHistory,
          partsNeeded,
          realCarData,
          timeProgress
        });
      } catch (error) {
        console.error(`Error loading details for car ${car.carCode}:`, error);
        details.push({
          car,
          repairHistory: [],
          partsNeeded: [],
          timeProgress: calculateTimeProgress(car)
        });
      }
    }

    setCarDetails(details);
    setLoading(false);
  };

  const calculateTimeProgress = (car: ScheduledCar) => {
    if (!car.actualStartTime) {
      return {
        elapsed: 0,
        remaining: safeParseInt(car.estimatedDuration, 0) * 60,
        percentage: 0,
        isOverrunning: false,
        overrunMinutes: 0
      };
    }

    const startTime = new Date(car.actualStartTime);
    const now = new Date();
    const elapsed = differenceInMinutes(now, startTime);
    const estimatedMinutes = safeParseInt(car.estimatedDuration, 0) * 60;
    const remaining = Math.max(0, estimatedMinutes - elapsed);
    const percentage = Math.min(100, (elapsed / estimatedMinutes) * 100);
    const isOverrunning = elapsed > estimatedMinutes;
    const overrunMinutes = isOverrunning ? elapsed - estimatedMinutes : 0;

    return {
      elapsed,
      remaining,
      percentage,
      isOverrunning,
      overrunMinutes
    };
  };

  const getWorkTypeIcon = (workType: string) => {
    switch (workType) {
      case 'electrical': return <Zap className="h-4 w-4" />;
      case 'mechanic': return <Wrench className="h-4 w-4" />;
      case 'body_work': return <Hammer className="h-4 w-4" />;
      case 'painter': return <Palette className="h-4 w-4" />;
      case 'detailer': return <Sparkles className="h-4 w-4" />;
      default: return <Car className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress': return 'bg-green-100 text-green-700 border-green-200';
      case 'completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'waiting_parts': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'paused': return 'bg-red-100 text-red-700 border-red-200';
      case 'scheduled': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const handleCarStatusUpdate = (carId: string, newStatus: ScheduledCar['status']) => {
    onCarStatusUpdate?.(carId, newStatus);
    toast({
      title: "Status Updated",
      description: `Car status changed to ${newStatus.replace('_', ' ')}`,
    });
  };

  const handleViewCarDetails = (carDetail: CarDetails) => {
    setSelectedCar(carDetail);
    setShowCarDetailsDialog(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-monza-yellow"></div>
        <span className="ml-2">Loading garage schedule details...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Garage Schedule Overview</h2>
          <p className="text-gray-600">
            {format(parseISO(date), 'EEEE, MMMM d, yyyy')} • {scheduledCars.length} cars scheduled
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge className="bg-green-100 text-green-700">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></div>
            Live Updates
          </Badge>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="workers" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Workers
          </TabsTrigger>
          <TabsTrigger value="parts" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Parts
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Timeline
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {carDetails.map((carDetail) => (
              <Card key={carDetail.car.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getWorkTypeIcon(carDetail.car.workType)}
                      <CardTitle className="text-lg">{carDetail.car.carModel}</CardTitle>
                    </div>
                    <Badge className={getStatusColor(carDetail.car.status)}>
                      {carDetail.car.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="font-mono">{carDetail.car.carCode}</span>
                    <Badge className={getPriorityColor(carDetail.car.priority)} variant="outline">
                      {carDetail.car.priority.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Customer Info */}
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">{carDetail.car.customerName}</span>
                  </div>

                  {/* Assigned Worker */}
                  {carDetail.car.assignedMechanic && (
                    <div className="flex items-center gap-2 text-sm bg-blue-50 p-2 rounded-lg">
                      <User className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-800">{carDetail.car.assignedMechanic}</span>
                    </div>
                  )}

                  {/* Time Progress */}
                  {carDetail.car.status === 'in_progress' && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{Math.round(carDetail.timeProgress.percentage)}%</span>
                      </div>
                      <Progress value={carDetail.timeProgress.percentage} className="h-2" />
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Elapsed: {formatDuration(carDetail.timeProgress.elapsed)}</span>
                        <span>Remaining: {formatDuration(carDetail.timeProgress.remaining)}</span>
                      </div>
                      {carDetail.timeProgress.isOverrunning && (
                        <div className="flex items-center gap-1 text-red-600 text-xs">
                          <AlertTriangle className="h-3 w-3" />
                          <span>Overrunning by {formatDuration(carDetail.timeProgress.overrunMinutes)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Estimated Duration */}
                  <div className="flex items-center gap-2 text-sm">
                    <Timer className="h-4 w-4 text-gray-500" />
                    <span>Estimated: {carDetail.car.estimatedDuration}h</span>
                  </div>

                  {/* Parts Needed */}
                  {carDetail.partsNeeded.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Package className="h-4 w-4 text-orange-500" />
                        <span>Parts Needed ({carDetail.partsNeeded.length})</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {carDetail.partsNeeded.slice(0, 2).map((part, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {part.partName}
                          </Badge>
                        ))}
                        {carDetail.partsNeeded.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{carDetail.partsNeeded.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Repair History Summary */}
                  {carDetail.repairHistory.length > 0 && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Previous repairs:</span> {carDetail.repairHistory.length}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewCarDetails(carDetail)}
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Details
                    </Button>
                    {carDetail.car.status === 'scheduled' && (
                      <Button
                        size="sm"
                        onClick={() => handleCarStatusUpdate(carDetail.car.id, 'in_progress')}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Start
                      </Button>
                    )}
                    {carDetail.car.status === 'in_progress' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCarStatusUpdate(carDetail.car.id, 'completed')}
                        className="flex-1"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Complete
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Workers Tab */}
        <TabsContent value="workers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Worker Assignments & Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Worker</TableHead>
                    <TableHead>Assigned Cars</TableHead>
                    <TableHead>Current Status</TableHead>
                    <TableHead>Total Hours</TableHead>
                    <TableHead>Completion Rate</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from(new Set(carDetails.map(cd => cd.car.assignedMechanic).filter(Boolean))).map((worker) => {
                    const workerCars = carDetails.filter(cd => cd.car.assignedMechanic === worker);
                    const completedCars = workerCars.filter(cd => cd.car.status === 'completed').length;
                    const totalHours = workerCars.reduce((sum, cd) => sum + safeParseInt(cd.car.estimatedDuration, 0), 0);
                    
                    return (
                      <TableRow key={worker}>
                        <TableCell className="font-medium">{worker}</TableCell>
                        <TableCell>{workerCars.length} cars</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {workerCars.map(car => (
                              <Badge key={car.car.id} className={getStatusColor(car.car.status)} variant="outline">
                                {car.car.carCode.slice(-6)}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>{totalHours}h</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={(completedCars / workerCars.length) * 100} className="w-16 h-2" />
                            <span className="text-sm">{Math.round((completedCars / workerCars.length) * 100)}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Parts Tab */}
        <TabsContent value="parts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Parts Management & Inventory
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Part</TableHead>
                    <TableHead>Car</TableHead>
                    <TableHead>Worker</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {carDetails.flatMap(carDetail => 
                    carDetail.partsNeeded.map(part => (
                      <TableRow key={`${carDetail.car.id}-${part.partNumber}`}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{part.partName}</div>
                            <div className="text-sm text-gray-500">{part.partNumber}</div>
                          </div>
                        </TableCell>
                        <TableCell>{carDetail.car.carCode.slice(-6)}</TableCell>
                        <TableCell>{carDetail.car.assignedMechanic || 'Unassigned'}</TableCell>
                        <TableCell>
                          <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                            Needed
                          </Badge>
                        </TableCell>
                        <TableCell>{part.quantity}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline">
                            <Package className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Daily Timeline & Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {carDetails.map((carDetail) => (
                  <div key={carDetail.car.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="font-medium">{carDetail.car.carModel}</div>
                        <Badge className={getStatusColor(carDetail.car.status)}>
                          {carDetail.car.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <span className="text-sm text-gray-600">{carDetail.car.carCode.slice(-6)}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {carDetail.car.estimatedDuration}h estimated
                      </div>
                    </div>
                    
                    {carDetail.car.status === 'in_progress' && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{Math.round(carDetail.timeProgress.percentage)}%</span>
                        </div>
                        <Progress value={carDetail.timeProgress.percentage} className="h-2" />
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>Elapsed: {formatDuration(carDetail.timeProgress.elapsed)}</span>
                          <span>Remaining: {formatDuration(carDetail.timeProgress.remaining)}</span>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4 mt-3 text-sm">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4 text-gray-500" />
                        <span>{carDetail.car.assignedMechanic || 'Unassigned'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Package className="h-4 w-4 text-gray-500" />
                        <span>{carDetail.partsNeeded.length} parts needed</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span>{carDetail.repairHistory.length} previous repairs</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Car Details Dialog */}
      <Dialog open={showCarDetailsDialog} onOpenChange={setShowCarDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Car Details - {selectedCar?.car.carModel}
            </DialogTitle>
          </DialogHeader>
          
          {selectedCar && (
            <div className="space-y-6">
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Vehicle Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Model:</label>
                      <p>{selectedCar.car.carModel}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">VIN:</label>
                      <p className="font-mono">{selectedCar.car.carCode}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Customer:</label>
                      <p>{selectedCar.car.customerName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Work Type:</label>
                      <div className="flex items-center gap-2">
                        {getWorkTypeIcon(selectedCar.car.workType)}
                        <span className="capitalize">{selectedCar.car.workType.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Repair History */}
              {selectedCar.repairHistory.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Repair History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedCar.repairHistory.slice(0, 3).map((repair, index) => (
                        <div key={index} className="border rounded p-3">
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-medium">{repair.issue_description}</div>
                            <Badge variant="outline">{repair.repair_date}</Badge>
                          </div>
                          <div className="text-sm text-gray-600">
                            <p>Technician: {repair.technician_name}</p>
                            <p>Cost: ${repair.total_cost || 'N/A'}</p>
                            {repair.parts_used && repair.parts_used.length > 0 && (
                              <div className="mt-2">
                                <span className="font-medium">Parts used:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {repair.parts_used.map((part: any, partIndex: number) => (
                                    <Badge key={partIndex} variant="outline" className="text-xs">
                                      {part.part_name}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Parts Needed */}
              {selectedCar.partsNeeded.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Parts Required</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Part Name</TableHead>
                          <TableHead>Part Number</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedCar.partsNeeded.map((part, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{part.partName}</TableCell>
                            <TableCell className="font-mono">{part.partNumber}</TableCell>
                            <TableCell>{part.quantity}</TableCell>
                            <TableCell>
                              <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                                Needed
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {/* Real Car Data */}
              {selectedCar.realCarData && (
                <Card>
                  <CardHeader>
                    <CardTitle>Additional Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Brand:</label>
                        <p>{selectedCar.realCarData.brand}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Year:</label>
                        <p>{selectedCar.realCarData.year}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Color:</label>
                        <p>{selectedCar.realCarData.color}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Category:</label>
                        <p>{selectedCar.realCarData.category}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}; 