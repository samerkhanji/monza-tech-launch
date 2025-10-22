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
import PortalActionDropdown from '@/components/ui/PortalActionDropdown';
import EnhancedCarDetailDialog from '@/components/EnhancedCarDetailDialog';
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
  Activity,
  Clock,
  CheckCircle,
  X,
  Zap,
  Settings,
  Car,
  Download
} from 'lucide-react';
import TestDriveDialog from '@/pages/CarInventory/components/TestDriveDialog';
import TestDriveSelectionDialog from '@/components/TestDriveSelectionDialog';
import WarrantyInfoColumn from '@/components/WarrantyInfoColumn';
import StandardWarrantyButton from '@/components/StandardWarrantyButton';
import SoftwareModelColumn from '@/components/SoftwareModelColumn';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import CustomsManagementDialog from '@/components/CustomsManagementDialog';

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
  softwareModel?: string;
  softwareVersion?: string;
  softwareLastUpdated?: string;
  // Warranty tracking fields
  warrantyStartDate?: string;
  warrantyEndDate?: string;
  warrantyMonthsRemaining?: number;
  warrantyDaysRemaining?: number;
  warrantyStatus?: 'active' | 'expiring_soon' | 'expired';
  lastWarrantyUpdate?: string;
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
  onCarUpdate?: (carId: string, updates: Record<string, unknown>) => void;
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
  const [showDetailsDialogState, setShowDetailsDialogState] = useState<boolean>(false);
  const [showTestDriveDialog, setShowTestDriveDialog] = useState(false);
  const [showTestDriveSelectionDialog, setShowTestDriveSelectionDialog] = useState(false);
  const [isClientTestDrive, setIsClientTestDrive] = useState(false);

  const statusColorClass = useMemo(() => {
    switch (car.garageStatus || car.status) {
      case 'stored': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_repair': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'ready_for_pickup': return 'bg-green-100 text-green-800 border-green-200';
      case 'awaiting_parts': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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

  const getGarageStatusDisplayName = useCallback((garageStatus: string) => {
    switch (garageStatus) {
      case 'stored': return 'Stored';
      case 'in_repair': return 'In Repair';
      case 'ready_for_pickup': return 'Ready for Pickup';
      case 'awaiting_parts': return 'Awaiting Parts';
      default: return garageStatus;
    }
  }, []);

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

  const handleTestDriveTypeSelection = (isClientTestDrive: boolean) => {
    setIsClientTestDrive(isClientTestDrive);
    // Close selection first, then open the schedule dialog on the next frame
    setShowTestDriveSelectionDialog(false);
    requestAnimationFrame(() => {
      setShowTestDriveDialog(true);
    });
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
            {getGarageStatusDisplayName(car.garageStatus || car.status || 'stored')}
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
                className="bg-monza-yellow hover:bg-monza-yellow/90 text-monza-black text-xs px-2 py-1 h-7"
                onClick={useCallback(() => {
                  setSelectedCar(car);
                  setShowTestDriveSelectionDialog(true);
                }, [car])}
              >
                <Briefcase className="h-3 w-3 mr-1" />
                Test Drive
              </Button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t">
          <PortalActionDropdown
            options={[
              { value: 'view', label: 'View Details' },
              ...(onEditCar ? [{ value: 'edit', label: 'Edit Car' }] : []),
              ...(onMoveCar ? [{ value: 'move', label: 'Move Car' }] : [])
            ]}
            onAction={(action) => {
              try {
                if (action === 'view' && car.id) onCarClick(car);
                else if (action === 'edit' && onEditCar && car.id) onEditCar(car);
                else if (action === 'move' && onMoveCar && car.id) onMoveCar(car);
              } catch (error) {
                console.error('Error performing mobile action:', error);
              }
            }}
            className="flex-1"
            id={`mobile-actions-${car.id}`}
            ariaLabel={`Actions for ${car.model || car.carModel} ${car.vinNumber || car.vin}`}
          />
        </div>
      </div>

      {/* Test Drive Selection Dialog */}
      {showTestDriveSelectionDialog && selectedCar && (
        <TestDriveSelectionDialog
          isOpen={showTestDriveSelectionDialog}
          onClose={() => {
            setShowTestDriveSelectionDialog(false);
            setSelectedCar(null);
          }}
          onSelectTestDriveType={handleTestDriveTypeSelection}
          carModel={selectedCar.model || selectedCar.carModel}
          carVin={selectedCar.vinNumber || selectedCar.vin}
        />
      )}

      {/* Test Drive Dialog */}
      {selectedCar && (
        <TestDriveDialog
          isOpen={showTestDriveDialog}
          onClose={() => {
            setShowTestDriveDialog(false);
            setSelectedCar(null);
          }}
          car={selectedCar as any}
          onScheduleTestDrive={handleStartTestDrive}
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
  onTestDriveEnd,
  onCarUpdate
}) => {
  const [selectedCar, setSelectedCar] = useState<CarData | null>(null);
  const [showDetailsDialogState, setShowDetailsDialogState] = useState(false);
  const [showTestDriveDialog, setShowTestDriveDialog] = useState(false);
  const [showTestDriveSelectionDialog, setShowTestDriveSelectionDialog] = useState(false);
  const [isClientTestDrive, setIsClientTestDrive] = useState(false);
  const { toast } = useToast();
  const [showCustomsDialog, setShowCustomsDialog] = useState(false);
  const [customsCar, setCustomsCar] = useState<CarData | null>(null);
  
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

  const handleTestDriveTypeSelection = (isClientTestDrive: boolean) => {
    setIsClientTestDrive(isClientTestDrive);
    setShowTestDriveSelectionDialog(false);
    setShowTestDriveDialog(true);
  };

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'available':
      case 'in_stock':
      case 'stored':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'sold':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'reserved':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'maintenance':
      case 'in_repair':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'ready_for_pickup':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'awaiting_parts':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }, []);

  const getCategoryColor = useCallback((category: string) => {
    switch (String(category)) {
      case 'EV': return 'category-ev';
      case 'REV': return 'category-rev';
      case 'ICEV': return 'category-icev';
      default: return 'category-ev';
    }
  }, []);

  const getGarageStatusDisplayName = useCallback((garageStatus: string) => {
    switch (garageStatus) {
      case 'stored': return 'Stored';
      case 'in_repair': return 'In Repair';
      case 'ready_for_pickup': return 'Ready for Pickup';
      case 'awaiting_parts': return 'Awaiting Parts';
      default: return garageStatus;
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
              <TableHead className="font-semibold">Category</TableHead>
              <TableHead className="font-semibold">Year</TableHead>
              <TableHead className="font-semibold">Color</TableHead>
              <TableHead className="font-semibold">Color interior</TableHead>
              <TableHead className="font-semibold">Price</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Warranty Life</TableHead>
              <TableHead className="font-semibold">Battery</TableHead>
              <TableHead className="font-semibold">Range Capacity</TableHead>
              <TableHead className="font-semibold">Km Driven</TableHead>
              <TableHead className="font-semibold">Test Drive</TableHead>
              <TableHead className="font-semibold">PDI</TableHead>
              <TableHead className="font-semibold">Customs</TableHead>
              <TableHead className="font-semibold">Software Model</TableHead>
              <TableHead className="font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cars.length > 0 ? (
              cars.map((car) => (
                <TableRow key={car.id} className="hover:bg-gray-50 transition-colors">
                  <TableCell className="font-mono text-sm">{car.vinNumber || car.vin}</TableCell>
                  <TableCell className="font-medium">{car.model || car.carModel}</TableCell>
                  <TableCell>
                    <Badge className={getCategoryColor(car.category || 'EV')}>
                      {car.category || 'EV'}
                    </Badge>
                  </TableCell>
                  <TableCell>{(car as any).year || (car as any).modelYear || 'N/A'}</TableCell>
                  <TableCell>{(car as any).color || 'N/A'}</TableCell>
                  <TableCell>{(car as any).interiorColor || (car as any).interior_color || '-'}</TableCell>
                  <TableCell>${(car as any).price ? (car as any).price.toLocaleString() : '0'}</TableCell>
                  <TableCell>
                    <Badge 
                      className={`cursor-pointer hover:opacity-80 transition-opacity ${getStatusColor(car.status || 'in_stock')}`}
                      onClick={() => onStatusClick && onStatusClick(car)}
                    >
                      {getGarageStatusDisplayName(car.status || 'in_stock')}
                    </Badge>
                  </TableCell>
                  <StandardWarrantyButton car={car} />
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Battery className="h-4 w-4" />
                      {car.batteryPercentage || 0}%
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Fuel className="h-4 w-4" />
                      {(car as any).range || 0} km
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Activity className="h-4 w-4" />
                      {(car as any).mileage || (car as any).kmDriven || 0} km
                    </div>
                  </TableCell>
                  <TableCell>
                    {(car.testDriveInfo as TestDriveInfo)?.isOnTestDrive ? (
                      <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                        <Clock className="mr-1 h-3 w-3" />
                        On Test Drive
                      </Badge>
                    ) : (
                      <Badge 
                        variant="outline" 
                        className="cursor-pointer hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        onClick={() => onTestDriveSchedule && onTestDriveSchedule(car.id, { carModel: car.model, carVin: car.vinNumber })}
                      >
                        Available
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={car.pdiCompleted ? 'default' : 'destructive'}
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      {car.pdiCompleted ? 'Complete' : 'Pending'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={car.customs === 'paid' ? 'default' : 'destructive'}
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                      title="Click to manage customs"
                      onClick={() => { setCustomsCar(car); setShowCustomsDialog(true); }}
                    >
                      {car.customs === 'paid' ? 'Paid' : 'Not Paid'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <SoftwareModelColumn
                      softwareVersion={(car as any).softwareVersion}
                      softwareLastUpdated={(car as any).softwareLastUpdated}
                      softwareUpdateBy={(car as any).softwareUpdateBy}
                      softwareUpdateNotes={(car as any).softwareUpdateNotes}
                      compact={true}
                      editable={true}
                    />
                  </TableCell>
                  <TableCell>
                    <PortalActionDropdown
                      variant="dots"
                      options={[
                        { value: 'view', label: 'View Details', icon: <Eye className="h-4 w-4" /> },
                        { value: 'edit', label: 'Edit Car', icon: <Edit className="h-4 w-4" /> },
                        { value: 'move', label: 'Move Car', icon: <MapPin className="h-4 w-4" /> }
                      ]}
                      onAction={(action) => {
                        if (action === 'view') { setSelectedCar(car); setShowDetailsDialogState(true); }
                        else if (action === 'edit' && onEditCar) onEditCar(car);
                        else if (action === 'move' && onMoveCar) onMoveCar(car);
                      }}
                      id={`garage-actions-${car.id}`}
                      ariaLabel={`Actions for ${car.model || car.carModel} ${car.vinNumber || car.vin}`}
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={16} className="text-center py-6 text-muted-foreground">
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

      {/* View Details Dialog (car inventory style) */}
      <EnhancedCarDetailDialog
        isOpen={showDetailsDialogState}
        onClose={() => { setShowDetailsDialogState(false); setSelectedCar(null); }}
        car={selectedCar as any}
        onCarUpdate={(carId, updates) => {
          try { onCarUpdate && onCarUpdate(carId, updates as any); } catch {}
        }}
      />

      {/* Customs Management Dialog */}
      {customsCar && (
        <CustomsManagementDialog
          open={showCustomsDialog}
          onOpenChange={setShowCustomsDialog}
          car={customsCar as any}
          onCustomsUpdate={(carId, data) => {
            try { onCarUpdate && onCarUpdate(carId, data as any); } catch {}
          }}
        />
      )}


      {/* Test Drive Selection Dialog */}
      {showTestDriveSelectionDialog && selectedCar && (
        <TestDriveSelectionDialog
          isOpen={showTestDriveSelectionDialog}
          onClose={() => {
            setShowTestDriveSelectionDialog(false);
            setSelectedCar(null);
          }}
          onSelectTestDriveType={handleTestDriveTypeSelection}
          carModel={selectedCar.model || selectedCar.carModel}
          carVin={selectedCar.vinNumber || selectedCar.vin}
        />
      )}

      {/* Test Drive Dialog */}
      {selectedCar && (
        <TestDriveDialog
          isOpen={showTestDriveDialog}
          onClose={() => {
            setShowTestDriveDialog(false);
            setSelectedCar(null);
          }}
          car={selectedCar as any}
          onScheduleTestDrive={handleStartTestDrive}
          isClientTestDrive={isClientTestDrive}
        />
      )}
    </>
  );
});

GarageInventoryTable.displayName = 'GarageInventoryTable';

export default GarageInventoryTable; 