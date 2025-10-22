import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Car, 
  Calendar, 
  User, 
  Wrench, 
  TestTube, 
  Package, 
  DollarSign, 
  MapPin, 
  Clock, 
  Battery, 
  Gauge, 
  Route,
  FileText,
  Smartphone,
  Settings,
  History,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Zap,
  Fuel,
  Activity,
  Eye,
  Download,
  Phone,
  Mail,
  Navigation
} from 'lucide-react';
import { format } from 'date-fns';
import { useCarData } from '@/contexts/CarDataContext';
import { RealCarDataService } from '@/services/realCarDataService';
import { TestDriveService } from '@/services/testDriveService';
import { EnhancedRepairHistoryService } from '@/services/enhancedRepairHistoryService';
import { safeLocalStorageGet } from '@/utils/errorHandling';

interface CarHistoryDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  car: any; // Will accept any car object from different components
  carVin?: string; // Alternative way to identify car
}

interface ComprehensiveCarData {
  // Basic Info
  id: string;
  vinNumber: string;
  model: string;
  brand?: string;
  year: number;
  color: string;
  interiorColor?: string;
  category: string;
  sellingPrice?: number;
  
  // Current Status
  status: string;
  currentLocation?: string;
  batteryPercentage?: number;
  range?: number;
  kilometersOrMileage?: number;
  
  // Dates
  arrivalDate?: string;
  pdiDate?: string;
  soldDate?: string;
  deliveryDate?: string;
  lastSoftwareUpdate?: string;
  
  // History Arrays
  repairHistory: any[];
  testDriveHistory: any[];
  locationHistory: any[];
  softwareUpdateHistory: any[];
  partsChangedHistory: any[];
  mechanicsWorked: string[];
  
  // Client Info
  clientName?: string;
  clientPhone?: string;
  clientEmail?: string;
  
  // Technical
  softwareVersion?: string;
  warrantyInfo?: any;
  technicalSpecs?: any[];
}

const CarHistoryDetailsDialog: React.FC<CarHistoryDetailsDialogProps> = ({
  isOpen,
  onClose,
  car,
  carVin
}) => {
  const [comprehensiveData, setComprehensiveData] = useState<ComprehensiveCarData | null>(null);
  const [loading, setLoading] = useState(false);
  const { getCarByCode, getCarRepairHistory } = useCarData();

  useEffect(() => {
    if ((car || carVin) && isOpen) {
      loadComprehensiveCarData();
    }
  }, [car, carVin, isOpen]);

  const loadComprehensiveCarData = async () => {
    setLoading(true);
    try {
      const targetVin = carVin || car?.vinNumber || car?.carCode || car?.vin;
      if (!targetVin) return;

      // Initialize comprehensive data with basic car info
      const baseData: ComprehensiveCarData = {
        id: car?.id || targetVin,
        vinNumber: targetVin,
        model: car?.model || car?.carModel || 'Unknown Model',
        brand: car?.brand || 'Unknown Brand',
        year: car?.year || car?.modelYear || new Date().getFullYear(),
        color: car?.color || 'Unknown',
        interiorColor: car?.interiorColor || car?.interior_color,
        category: car?.category || 'EV',
        sellingPrice: car?.sellingPrice || car?.price,
        status: car?.status || 'unknown',
        currentLocation: car?.currentLocation || car?.currentFloor,
        batteryPercentage: car?.batteryPercentage,
        range: car?.range,
        kilometersOrMileage: car?.kilometersDriven || car?.kmDriven || car?.mileage,
        arrivalDate: car?.arrivalDate || car?.garageEntryDate,
        pdiDate: car?.pdiDate,
        soldDate: car?.soldDate,
        deliveryDate: car?.deliveryDate,
        lastSoftwareUpdate: car?.softwareLastUpdated,
        softwareVersion: car?.softwareVersion,
        clientName: car?.clientName || car?.customerName,
        clientPhone: car?.clientPhone,
        clientEmail: car?.clientEmail,
        repairHistory: [],
        testDriveHistory: [],
        locationHistory: [],
        softwareUpdateHistory: [],
        partsChangedHistory: [],
        mechanicsWorked: [],
        warrantyInfo: {
          startDate: car?.warrantyStartDate,
          endDate: car?.warrantyEndDate,
          monthsRemaining: car?.warrantyMonthsRemaining,
          daysRemaining: car?.warrantyDaysRemaining,
          status: car?.warrantyStatus
        },
        technicalSpecs: car?.technicalSpecs || []
      };

      // Load repair history
      try {
        const repairHistory = await EnhancedRepairHistoryService.getCarRepairHistory(targetVin);
        baseData.repairHistory = repairHistory;
        
        // Extract mechanics from repair history
        const mechanics = new Set<string>();
        repairHistory.forEach(repair => {
          if (repair.mechanic_assigned) mechanics.add(repair.mechanic_assigned);
          if (repair.assigned_employees) {
            repair.assigned_employees.forEach((emp: string) => mechanics.add(emp));
          }
        });
        baseData.mechanicsWorked = Array.from(mechanics);
      } catch (error) {
        console.warn('Could not load repair history:', error);
      }

      // Load test drive history
      try {
        const testDrives = TestDriveService.getTestDriveHistory(targetVin);
        baseData.testDriveHistory = testDrives;
      } catch (error) {
        console.warn('Could not load test drive history:', error);
      }

      // Load from unified car data if available
      try {
        const unifiedData = getCarByCode(targetVin);
        if (unifiedData) {
          baseData.repairHistory = [...baseData.repairHistory, ...unifiedData.repairHistory];
          baseData.locationHistory = unifiedData.locationHistory || [];
        }
      } catch (error) {
        console.warn('Could not load unified car data:', error);
      }

      // Load additional data from localStorage sources
      try {
        const allCarSources = [
          'carInventory',
          'showroomFloor1Cars',
          'showroomFloor2Cars', 
          'garageCars',
          'inventoryFloor2Cars',
          'realCarData'
        ];

        for (const source of allCarSources) {
          const data = safeLocalStorageGet<any[]>(source, []);
          const foundCar = data.find(c => 
            c.vinNumber === targetVin || 
            c.carCode === targetVin || 
            c.vin === targetVin ||
            c.id === targetVin
          );
          
          if (foundCar) {
            // Merge additional data
            Object.keys(foundCar).forEach(key => {
              if (foundCar[key] !== undefined && foundCar[key] !== null) {
                (baseData as any)[key] = foundCar[key];
              }
            });
          }
        }
      } catch (error) {
        console.warn('Could not load additional car data:', error);
      }

      // Generate mock location history if not available
      if (!baseData.locationHistory.length && baseData.arrivalDate) {
        baseData.locationHistory = generateMockLocationHistory(baseData);
      }

      // Generate mock software update history
      baseData.softwareUpdateHistory = generateMockSoftwareHistory(baseData);

      // Generate mock parts changed history from repair history
      baseData.partsChangedHistory = extractPartsFromRepairHistory(baseData.repairHistory);

      setComprehensiveData(baseData);
    } catch (error) {
      console.error('Error loading comprehensive car data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMockLocationHistory = (carData: ComprehensiveCarData) => {
    const locations = [];
    const startDate = new Date(carData.arrivalDate || Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    locations.push({
      location: 'New Arrivals',
      timestamp: startDate.toISOString(),
      reason: 'Initial arrival at dealership'
    });

    if (carData.pdiDate) {
      locations.push({
        location: 'Garage',
        timestamp: carData.pdiDate,
        reason: 'PDI inspection and preparation'
      });
    }

    if (carData.currentLocation) {
      locations.push({
        location: carData.currentLocation,
        timestamp: new Date().toISOString(),
        reason: 'Current location'
      });
    }

    return locations;
  };

  const generateMockSoftwareHistory = (carData: ComprehensiveCarData) => {
    const updates = [];
    
    if (carData.lastSoftwareUpdate) {
      updates.push({
        version: carData.softwareVersion || 'v2.4.1',
        updateDate: carData.lastSoftwareUpdate,
        updatedBy: 'IT Team',
        notes: 'Regular software maintenance update'
      });
    }

    return updates;
  };

  const extractPartsFromRepairHistory = (repairHistory: any[]) => {
    const parts: any[] = [];
    
    repairHistory.forEach(repair => {
      if (repair.parts_used) {
        repair.parts_used.forEach((part: any) => {
          parts.push({
            partName: part.part_name || part,
            partNumber: part.part_number,
            supplier: part.supplier,
            cost: part.cost,
            quantity: part.quantity || 1,
            dateInstalled: repair.repair_date,
            installedBy: repair.mechanic_assigned,
            repairId: repair.id
          });
        });
      }
    });

    return parts;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'available':
      case 'in_stock':
        return 'bg-green-100 text-green-800';
      case 'sold':
        return 'bg-blue-100 text-blue-800';
      case 'reserved':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_repair':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!comprehensiveData) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Loading Car Details...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Complete Vehicle History - {comprehensiveData.model} ({comprehensiveData.vinNumber})
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="repairs">Repairs & Parts</TabsTrigger>
            <TabsTrigger value="testdrives">Test Drives</TabsTrigger>
            <TabsTrigger value="technical">Technical</TabsTrigger>
            <TabsTrigger value="client">Client Info</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[70vh] mt-4">
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Vehicle Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Car className="h-5 w-5" />
                      Vehicle Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">VIN:</span>
                        <p className="font-mono">{comprehensiveData.vinNumber}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Model:</span>
                        <p>{comprehensiveData.model}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Brand:</span>
                        <p>{comprehensiveData.brand}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Year:</span>
                        <p>{comprehensiveData.year}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Color:</span>
                        <p>{comprehensiveData.color}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Interior:</span>
                        <p>{comprehensiveData.interiorColor || 'N/A'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Current Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Current Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-600">Status:</span>
                        <Badge className={getStatusColor(comprehensiveData.status)}>
                          {comprehensiveData.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Location:</span>
                        <span>{comprehensiveData.currentLocation || 'Unknown'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Price:</span>
                        <span className="font-bold text-green-600">
                          ${comprehensiveData.sellingPrice?.toLocaleString() || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Performance Data */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Gauge className="h-5 w-5" />
                      Performance Data
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-600 flex items-center gap-1">
                          <Battery className="h-4 w-4" />
                          Battery:
                        </span>
                        <span className="font-bold">{comprehensiveData.batteryPercentage || 0}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600 flex items-center gap-1">
                          <Fuel className="h-4 w-4" />
                          Range:
                        </span>
                        <span>{comprehensiveData.range || 0} km</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600 flex items-center gap-1">
                          <Route className="h-4 w-4" />
                          Driven:
                        </span>
                        <span>{comprehensiveData.kilometersOrMileage || 0} km</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Timeline Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Key Dates & Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <div>
                        <p className="font-medium text-blue-800">Arrival Date</p>
                        <p className="text-sm text-blue-600">{formatDate(comprehensiveData.arrivalDate)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-purple-600" />
                      <div>
                        <p className="font-medium text-purple-800">PDI Date</p>
                        <p className="text-sm text-purple-600">{formatDate(comprehensiveData.pdiDate)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-800">Sold Date</p>
                        <p className="text-sm text-green-600">{formatDate(comprehensiveData.soldDate)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                      <Smartphone className="h-5 w-5 text-orange-600" />
                      <div>
                        <p className="font-medium text-orange-800">Last Software Update</p>
                        <p className="text-sm text-orange-600">{formatDate(comprehensiveData.lastSoftwareUpdate)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Team Members */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Team Members Who Worked on This Vehicle
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {comprehensiveData.mechanicsWorked.length > 0 ? (
                      comprehensiveData.mechanicsWorked.map((mechanic, index) => (
                        <Badge key={index} variant="outline" className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {mechanic}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-gray-500">No mechanics recorded</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              {/* Location History */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Location History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {comprehensiveData.locationHistory.map((location, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{location.location}</p>
                              <p className="text-sm text-gray-600">{location.reason}</p>
                            </div>
                            <span className="text-sm text-gray-500">{formatDateTime(location.timestamp)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Software Update History */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Smartphone className="h-5 w-5" />
                    Software Update History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {comprehensiveData.softwareUpdateHistory.length > 0 ? (
                      comprehensiveData.softwareUpdateHistory.map((update, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                          <Zap className="h-5 w-5 text-yellow-600 mt-1" />
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">Version {update.version}</p>
                                <p className="text-sm text-gray-600">{update.notes}</p>
                                <p className="text-xs text-gray-500">Updated by: {update.updatedBy}</p>
                              </div>
                              <span className="text-sm text-gray-500">{formatDateTime(update.updateDate)}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">No software updates recorded</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="repairs" className="space-y-4">
              {/* Repair History */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Wrench className="h-5 w-5" />
                    Repair History ({comprehensiveData.repairHistory.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {comprehensiveData.repairHistory.length > 0 ? (
                      comprehensiveData.repairHistory.map((repair, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-medium">{repair.work_type || repair.issue_description}</p>
                              <p className="text-sm text-gray-600">{repair.solution_description}</p>
                            </div>
                            <Badge className="bg-blue-100 text-blue-800">
                              {repair.status || 'Completed'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {repair.mechanic_assigned || 'Unknown'}
                            </span>
                            <span className="flex items-center gap-1">
                              {formatDate(repair.repair_date)}
                            </span>
                            {repair.cost && (
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                ${repair.cost}
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">No repairs recorded</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Parts Changed */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Parts Changed ({comprehensiveData.partsChangedHistory.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {comprehensiveData.partsChangedHistory.length > 0 ? (
                      comprehensiveData.partsChangedHistory.map((part, index) => (
                        <div key={index} className="border rounded-lg p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{part.partName}</p>
                              {part.partNumber && (
                                <p className="text-sm text-gray-600">Part #: {part.partNumber}</p>
                              )}
                              {part.supplier && (
                                <p className="text-xs text-gray-500">Supplier: {part.supplier}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-medium">Qty: {part.quantity}</p>
                              {part.cost && (
                                <p className="text-sm text-green-600">${part.cost}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {part.installedBy || 'Unknown'}
                            </span>
                            <span className="flex items-center gap-1">
                              {formatDate(part.dateInstalled)}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">No parts changes recorded</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="testdrives" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TestTube className="h-5 w-5" />
                    Test Drive History ({comprehensiveData.testDriveHistory.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {comprehensiveData.testDriveHistory.length > 0 ? (
                      comprehensiveData.testDriveHistory.map((testDrive, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-medium">Test Drive #{index + 1}</p>
                              <p className="text-sm text-gray-600">
                                Customer: {testDrive.customerName || 'Unknown'}
                              </p>
                              {testDrive.customerPhone && (
                                <p className="text-sm text-gray-600">
                                  Phone: {testDrive.customerPhone}
                                </p>
                              )}
                            </div>
                            <Badge className="bg-green-100 text-green-800">
                              {testDrive.status || 'Completed'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              {formatDateTime(testDrive.scheduledDate || testDrive.timestamp)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {testDrive.duration || '30 min'}
                            </span>
                            {testDrive.distance && (
                              <span className="flex items-center gap-1">
                                <Route className="h-3 w-3" />
                                {testDrive.distance} km
                              </span>
                            )}
                          </div>
                          {testDrive.notes && (
                            <p className="text-sm text-gray-600 mt-2">{testDrive.notes}</p>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">No test drives recorded</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="technical" className="space-y-4">
              {/* Technical Specifications */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Technical Specifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Vehicle Specs</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Category:</span>
                          <span>{comprehensiveData.category}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Software Version:</span>
                          <span>{comprehensiveData.softwareVersion || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Battery Capacity:</span>
                          <span>{comprehensiveData.batteryPercentage || 0}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Range:</span>
                          <span>{comprehensiveData.range || 0} km</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Warranty Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Start Date:</span>
                          <span>{formatDate(comprehensiveData.warrantyInfo?.startDate)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">End Date:</span>
                          <span>{formatDate(comprehensiveData.warrantyInfo?.endDate)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Days Remaining:</span>
                          <span>{comprehensiveData.warrantyInfo?.daysRemaining || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <Badge className={
                            comprehensiveData.warrantyInfo?.status === 'active' ? 'bg-green-100 text-green-800' :
                            comprehensiveData.warrantyInfo?.status === 'expiring_soon' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }>
                            {comprehensiveData.warrantyInfo?.status || 'Unknown'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Additional Technical Specs */}
              {comprehensiveData.technicalSpecs && comprehensiveData.technicalSpecs.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Additional Technical Specifications</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {comprehensiveData.technicalSpecs.map((spec, index) => (
                        <div key={index} className="border rounded-lg p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{spec.name}</p>
                              <p className="text-sm text-gray-600">{spec.description}</p>
                            </div>
                            <span className="font-mono text-sm">{spec.value} {spec.unit}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="client" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Client Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {comprehensiveData.clientName ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Contact Details
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Name:</span>
                              <span className="font-medium">{comprehensiveData.clientName}</span>
                            </div>
                            {comprehensiveData.clientPhone && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Phone:</span>
                                <a 
                                  href={`tel:${comprehensiveData.clientPhone}`}
                                  className="text-blue-600 hover:underline flex items-center gap-1"
                                >
                                  <Phone className="h-3 w-3" />
                                  {comprehensiveData.clientPhone}
                                </a>
                              </div>
                            )}
                            {comprehensiveData.clientEmail && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Email:</span>
                                <a 
                                  href={`mailto:${comprehensiveData.clientEmail}`}
                                  className="text-blue-600 hover:underline flex items-center gap-1"
                                >
                                  <Mail className="h-3 w-3" />
                                  {comprehensiveData.clientEmail}
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            Important Dates
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Sale Date:</span>
                              <span>{formatDate(comprehensiveData.soldDate)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Delivery Date:</span>
                              <span>{formatDate(comprehensiveData.deliveryDate)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No client information available</p>
                      <p className="text-sm text-gray-400">This vehicle may not be sold yet or client data hasn't been recorded</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default CarHistoryDetailsDialog;
