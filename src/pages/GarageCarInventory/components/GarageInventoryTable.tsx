import React, { useState, memo, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCaption,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Eye, 
  Edit, 
  MapPin, 
  Wrench, 
  FileText, 
  User, 
  Briefcase, 
  Battery,
  Fuel,
  Clock,
  CheckCircle,
  X,
  Zap,
  Settings,
  Car
} from 'lucide-react';
import SimpleTestDriveDialog from '@/components/SimpleTestDriveDialog';

interface TestDriveInfo {
  isOnTestDrive?: boolean;
  testDriveStartTime?: string;
  testDriveEndTime?: string;
  testDriverName?: string;
  testDriverPhone?: string;
  testDriverLicense?: string;
  notes?: string;
  isClientTestDrive?: boolean;
}

interface Damage {
  type: string;
  description: string;
  severity: string;
  estimatedCost: number;
  photos?: string[];
}

interface CarData {
  id: string;
  vin?: string;
  vinNumber?: string;
  make?: string;
  model?: string;
  carModel?: string;
  year?: number;
  color?: string;
  status?: string;
  garageStatus?: string;
  location?: string;
  garageLocation?: string;
  clientId?: string;
  customerName?: string;
  clientName?: string;
  category?: string;
  horsePower?: number;
  torque?: number;
  acceleration?: number;
  topSpeed?: number;
  batteryPercentage?: number;
  isOnTestDrive?: boolean;
  testDriveStartTime?: string;
  testDriveEndTime?: string;
  testDriveClient?: string;
  testDriveInfo?: TestDriveInfo;
  workType?: string;
  entryDate?: string;
  garageEntryDate?: string;
  damages?: Damage[];
  [key: string]: unknown;
}

interface GarageInventoryTableProps {
  cars: CarData[];
  onCarClick: (car: CarData) => void;
  onEditCar?: (car: CarData) => void;
  onMoveCar?: (car: CarData) => void;
  onStatusClick?: (car: CarData) => void;
  onTestDriveSchedule?: (carId: string, testDriveInfo: unknown) => void;
  onTestDriveEnd?: (carId: string) => void;
}

const MobileGarageCarCard = memo(({ 
  car, 
  onCarClick,
  onEditCar,
  onMoveCar,
  onStatusClick,
  onTestDriveSchedule,
  onTestDriveEnd
}: { 
  car: CarData;
  onCarClick: (car: CarData) => void;
  onEditCar?: (car: CarData) => void;
  onMoveCar?: (car: CarData) => void;
  onStatusClick?: (car: CarData) => void;
  onTestDriveSchedule?: (carId: string, testDriveInfo: unknown) => void;
  onTestDriveEnd?: (carId: string) => void;
}) => {
  const [selectedCar, setSelectedCar] = useState<CarData | null>(null);
  const [showTestDriveDialog, setShowTestDriveDialog] = useState(false);
  const [isClientTestDrive, setIsClientTestDrive] = useState(false);

  const statusColorClass = useMemo(() => {
    switch (car.garageStatus || car.status) {
      case 'stored': return 'bg-blue-100 text-blue-800';
      case 'in_repair': return 'bg-yellow-100 text-yellow-800';
      case 'ready_for_pickup': return 'bg-green-100 text-green-800';
      case 'awaiting_parts': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }, [car.garageStatus, car.status]);

  const categoryColorClass = useMemo(() => {
    switch (car.category) {
      case 'EV': return 'category-ev';
      case 'REV': return 'category-rev';
      case 'ICEV': return 'category-icev';
      default: return 'bg-gray-400 text-white';
    }
  }, [car.category]);

  const handleStartTestDrive = (carId: string, testDriveInfo: any) => {
    if (onTestDriveSchedule) {
      onTestDriveSchedule(carId, testDriveInfo);
    }
    setShowTestDriveDialog(false);
  };

  const handleTestDriveEnd = (carId: string) => {
    if (onTestDriveEnd) {
      onTestDriveEnd(carId);
    }
    setShowTestDriveDialog(false);
  };

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3 shadow-sm">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-lg">{car.model || car.carModel}</h3>
            <p className="text-sm text-gray-500 font-mono">{car.vinNumber || car.vin}</p>
          </div>
          <Badge className={categoryColorClass}>
            {car.category || 'EV'}
          </Badge>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-500">Customer:</span>
            <span className="ml-2 font-medium">{car.customerName || car.clientName || 'N/A'}</span>
          </div>
          <div>
            <span className="text-gray-500">Location:</span>
            <span className="ml-2 font-medium">{car.garageLocation || 'Bay 1'}</span>
          </div>
          <div>
            <span className="text-gray-500">HP:</span>
            <span className="ml-2 font-medium">{car.horsePower || 350} HP</span>
          </div>
          <div>
            <span className="text-gray-500">Torque:</span>
            <span className="ml-2 font-medium">{car.torque || 500} Nm</span>
          </div>
          <div>
            <span className="text-gray-500">0-100:</span>
            <span className="ml-2 font-medium">{car.acceleration || '4.5'}s</span>
          </div>
          <div>
            <span className="text-gray-500">Top Speed:</span>
            <span className="ml-2 font-medium">{car.topSpeed || 250} km/h</span>
          </div>
          {car.batteryPercentage && (
            <div className="flex items-center gap-1">
              <Battery className="h-4 w-4" />
              <span>{String(car.batteryPercentage)}%</span>
            </div>
          )}
          <div>
            <span className="text-gray-500">Entry:</span>
            <span className="ml-2 font-medium">
              {car.entryDate ? new Date(String(car.entryDate)).toLocaleDateString() : 'N/A'}
            </span>
          </div>
        </div>

        {/* Status and Test Drive */}
        <div className="flex flex-wrap gap-2 items-center">
          <Badge 
            className={`${statusColorClass} cursor-pointer hover:opacity-80 transition-all hover:scale-105 active:scale-95`}
            onClick={() => onStatusClick && onStatusClick(car)}
            title="Click to manage status"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onStatusClick && onStatusClick(car);
              }
            }}
            aria-label={`Manage status for ${car.model || car.carModel}`}
          >
            {car.garageStatus || car.status || 'stored'}
          </Badge>

                              {(car.testDriveInfo as TestDriveInfo)?.isOnTestDrive ? (
                      <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                        <Clock className="mr-1 h-3 w-3" />
                        Test Drive Active
                      </Badge>
                    ) : (
            <div className="flex gap-1 flex-wrap">
              <Button 
                size="sm"
                className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-2 py-1 h-7"
                onClick={useCallback(() => {
                  setSelectedCar(car);
                  setIsClientTestDrive(false);
                  setShowTestDriveDialog(true);
                }, [car])}
              >
                <Briefcase className="h-3 w-3 mr-1" />
                Employee
              </Button>
              <Button 
                size="sm"
                className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-2 py-1 h-7"
                onClick={useCallback(() => {
                  setSelectedCar(car);
                  setIsClientTestDrive(true);
                  setShowTestDriveDialog(true);
                }, [car])}
              >
                <User className="h-3 w-3 mr-1" />
                Client
              </Button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t">
                      <select
              onChange={(e) => {
                const action = e.target.value;
                try {
                  if (action === 'view' && car.id) onCarClick(car);
                  else if (action === 'edit' && onEditCar && car.id) onEditCar(car);
                  else if (action === 'move' && onMoveCar && car.id) onMoveCar(car);
                } catch (error) {
                  console.error('Error performing mobile action:', error);
                }
                e.target.value = '';
              }}
            className="flex-1 h-9 px-3 border-2 border-gray-300 rounded-lg bg-white cursor-pointer text-sm font-medium hover:bg-gray-50 hover:border-monza-yellow focus:ring-2 focus:ring-monza-yellow focus:border-monza-yellow transition-all duration-200 shadow-sm"
            style={{ 
              appearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23374151' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: 'right 8px center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '20px'
            }}
          >
            <option value="">Actions</option>
            <option value="view">View Details</option>
            {onEditCar && <option value="edit">Edit Car</option>}
            {onMoveCar && <option value="move">Move Car</option>}
          </select>
        </div>
      </div>

      {/* Test Drive Dialog */}
      {selectedCar && (
        <SimpleTestDriveDialog
          isOpen={showTestDriveDialog}
          onClose={() => {
            setShowTestDriveDialog(false);
            setSelectedCar(null);
          }}
          car={selectedCar}
          onStartTestDrive={handleStartTestDrive}
          onEndTestDrive={handleTestDriveEnd}
          isClientTestDrive={isClientTestDrive}
        />
      )}
    </>
  );
});

MobileGarageCarCard.displayName = 'MobileGarageCarCard';

const GarageInventoryTable: React.FC<GarageInventoryTableProps> = memo(({
  cars,
  onCarClick,
  onEditCar,
  onMoveCar,
  onStatusClick,
  onTestDriveSchedule,
  onTestDriveEnd
}) => {
  const [selectedCar, setSelectedCar] = useState<CarData | null>(null);
  const [showTestDriveDialog, setShowTestDriveDialog] = useState(false);
  const [isClientTestDrive, setIsClientTestDrive] = useState(false);
  
  const handleStartTestDrive = (carId: string, testDriveInfo: TestDriveInfo) => {
    if (onTestDriveSchedule) {
      onTestDriveSchedule(carId, testDriveInfo);
    }
    setShowTestDriveDialog(false);
  };

  const handleTestDriveEnd = (carId: string) => {
    if (onTestDriveEnd) {
      onTestDriveEnd(carId);
    }
    setShowTestDriveDialog(false);
  };

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'stored': return 'bg-blue-100 text-blue-800';
      case 'in_repair': return 'bg-yellow-100 text-yellow-800';
      case 'ready_for_pickup': return 'bg-green-100 text-green-800';
      case 'awaiting_parts': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }, []);

  const getCategoryColor = useCallback((category: string) => {
    switch (category) {
      case 'EV': return 'category-ev';
      case 'REV': return 'category-rev';
      case 'ICEV': return 'category-icev';
      default: return 'bg-gray-400 text-white';
    }
  }, []);

  const getWorkTypeIcon = useCallback((workType?: string) => {
    switch (workType) {
      case 'electrical': return <Zap className="h-4 w-4" />;
      case 'painter': return <Settings className="h-4 w-4" />;
      case 'detailer': return <Settings className="h-4 w-4" />;
      case 'mechanic': return <Wrench className="h-4 w-4" />;
      case 'body_work': return <Car className="h-4 w-4" />;
      default: return <Wrench className="h-4 w-4" />;
    }
  }, []);

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden lg:block rounded-md border">
        <Table>
          <TableCaption>Vehicles currently stored in garage</TableCaption>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold">VIN</TableHead>
              <TableHead className="font-semibold">Model</TableHead>
              <TableHead className="font-semibold">Customer</TableHead>
              <TableHead className="font-semibold">Category</TableHead>
              <TableHead className="font-semibold">Location</TableHead>
              <TableHead className="font-semibold">Horsepower</TableHead>
              <TableHead className="font-semibold">Torque</TableHead>
              <TableHead className="font-semibold">0-100 km/h</TableHead>
              <TableHead className="font-semibold">Top Speed</TableHead>
              <TableHead className="font-semibold">Battery</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Test Drive</TableHead>
              <TableHead className="font-semibold">Entry Date</TableHead>
              <TableHead className="font-semibold">Work Type</TableHead>
              <TableHead className="font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cars.length > 0 ? (
              cars.map((car) => (
                <TableRow key={car.id} className="hover:bg-gray-50 transition-colors">
                  <TableCell className="font-mono text-sm">{car.vinNumber || car.vin}</TableCell>
                  <TableCell className="font-medium">{car.model || car.carModel}</TableCell>
                  <TableCell>{car.customerName || car.clientName || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge className={getCategoryColor(car.category || 'EV')}>
                      {car.category || 'EV'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      {car.garageLocation || 'Bay 1'}
                    </div>
                  </TableCell>
                  <TableCell>
                    {car.horsePower ? `${car.horsePower} HP` : '350 HP'}
                  </TableCell>
                  <TableCell>
                    {car.torque ? `${car.torque} Nm` : '500 Nm'}
                  </TableCell>
                  <TableCell>
                    {car.acceleration ? `${car.acceleration}s` : '4.5s'}
                  </TableCell>
                  <TableCell>
                    {car.topSpeed ? `${car.topSpeed} km/h` : '250 km/h'}
                  </TableCell>
                  <TableCell>
                    {car.batteryPercentage ? (
                      <div className="flex items-center gap-1">
                        <Battery className="h-4 w-4" />
                        {String(car.batteryPercentage)}%
                      </div>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      className={`${getStatusColor(car.garageStatus || car.status || 'stored')} cursor-pointer hover:opacity-80 transition-all hover:scale-105 active:scale-95`}
                      onClick={() => onStatusClick && onStatusClick(car)}
                      title="Click to manage status"
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onStatusClick && onStatusClick(car);
                        }
                      }}
                      aria-label={`Manage status for ${car.model || car.carModel}`}
                    >
                      {car.garageStatus || car.status || 'stored'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {(car.testDriveInfo as TestDriveInfo)?.isOnTestDrive ? (
                      <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                        <Clock className="mr-1 h-3 w-3" />
                        Test Drive Active
                      </Badge>
                    ) : (
                      <div className="flex gap-1 flex-wrap">
                        <Button 
                          size="sm"
                          className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-2 py-1 h-7"
                          onClick={useCallback(() => {
                            setSelectedCar(car);
                            setIsClientTestDrive(false);
                            setShowTestDriveDialog(true);
                          }, [car])}
                          title="Employee Test Drive"
                        >
                          <Briefcase className="h-3 w-3 mr-1" />
                          Employee
                        </Button>
                        <Button 
                          size="sm"
                          className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-2 py-1 h-7"
                          onClick={useCallback(() => {
                            setSelectedCar(car);
                            setIsClientTestDrive(true);
                            setShowTestDriveDialog(true);
                          }, [car])}
                          title="Client Test Drive"
                        >
                          <User className="h-3 w-3 mr-1" />
                          Client
                        </Button>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {car.entryDate ? new Date(String(car.entryDate)).toLocaleDateString() : 
                     car.garageEntryDate ? new Date(String(car.garageEntryDate)).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {getWorkTypeIcon(car.workType as string)}
                      <span className="capitalize">
                        {(car.workType as string)?.replace('_', ' ') || 'General Maintenance'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <div className="relative">
                        <select
                          onChange={(e) => {
                            const action = e.target.value;
                            try {
                              if (action === 'view' && car.id) onCarClick(car);
                              else if (action === 'edit' && onEditCar && car.id) onEditCar(car);
                              else if (action === 'move' && onMoveCar && car.id) onMoveCar(car);
                            } catch (error) {
                              console.error('Error performing action:', error);
                            }
                            e.target.value = '';
                          }}
                          className="w-28 h-9 px-3 border-2 border-gray-300 rounded-lg bg-white cursor-pointer text-sm font-medium hover:bg-gray-50 hover:border-monza-yellow focus:ring-2 focus:ring-monza-yellow focus:border-monza-yellow transition-all duration-200 shadow-sm"
                          style={{ 
                            appearance: 'none',
                            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23374151' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                            backgroundPosition: 'right 8px center',
                            backgroundRepeat: 'no-repeat',
                            backgroundSize: '20px'
                          }}
                          aria-label={`Actions for ${car.model || car.carModel} ${car.vinNumber || car.vin}`}
                        >
                          <option value="">Actions</option>
                          <option value="view">View Details</option>
                          {onEditCar && <option value="edit">Edit Car</option>}
                          {onMoveCar && <option value="move">Move Car</option>}
                        </select>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={15} className="text-center py-6 text-muted-foreground">
                  No vehicles in garage inventory
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {cars.map((car) => (
          <MobileGarageCarCard
            key={car.id}
            car={car}
            onCarClick={onCarClick}
            onEditCar={onEditCar}
            onMoveCar={onMoveCar}
            onStatusClick={onStatusClick}
            onTestDriveSchedule={onTestDriveSchedule}
            onTestDriveEnd={onTestDriveEnd}
          />
        ))}
      </div>

      {/* Test Drive Dialog */}
      {selectedCar && (
        <SimpleTestDriveDialog
          isOpen={showTestDriveDialog}
          onClose={() => {
            setShowTestDriveDialog(false);
            setSelectedCar(null);
          }}
          car={selectedCar}
          onStartTestDrive={handleStartTestDrive}
          onEndTestDrive={handleTestDriveEnd}
          isClientTestDrive={isClientTestDrive}
        />
      )}
    </>
  );
});

GarageInventoryTable.displayName = 'GarageInventoryTable';

export default GarageInventoryTable; 