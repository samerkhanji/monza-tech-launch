import React, { memo, useMemo, useCallback, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, MapPin, FileText, Battery, Fuel, Clock, CheckCircle, X } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCaption,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
  StatusBadge,
} from '@/components/ui/table';
import type { ShowroomCar } from '@/pages/ShowroomFloor2/types';
import EditCarDialog from './EditCarDialog';
import MoveCarDialog from './MoveCarDialog';
import PdiViewDialog from './PdiViewDialog';
import SimpleTestDriveDialog from '@/components/SimpleTestDriveDialog';
import ShowroomFloor2TableActions from './ShowroomFloor2TableActions';
import ITSoftwareUpdateDialog from '@/components/ITSoftwareUpdateDialog';
import { kilometersService } from '@/services/kilometersService';

interface CarData {
  id: string;
  vinNumber: string;
  model: string;
  year: number;
  color: string;
  price: number;
  status: 'sold' | 'reserved' | 'in_stock';
  category: 'EV' | 'REV' | 'ICEV';
  batteryPercentage: number;
  range: number;
  features?: string[];
  arrivalDate: string;
  pdiCompleted?: boolean;
  pdiTechnician?: string;
  pdiDate?: string;
  pdiNotes?: string;
  testDriveInfo?: {
    isOnTestDrive: boolean;
    isClientTestDrive: boolean;
  };
  customs?: 'paid' | 'not paid';
  brand?: string;
  currentFloor?: "Inventory" | "Garage" | "Showroom 1" | "Showroom 2" | "New Arrivals";
  purchasePrice?: number;
  clientName?: string;
  clientPhone?: string;
  clientLicensePlate?: string;
  expectedDeliveryDate?: string;
  notes?: string;
  lastModified?: string;
}

interface ShowroomFloor2TableProps {
  cars: CarData[];
  onScheduleTestDrive: (car: CarData) => void;
  onViewPdi: (car: CarData) => void;
  onStatusClick: (car: CarData) => void;
  onCustomsClick: (car: CarData) => void;
  onViewDetails: (car: CarData) => void;
  onEditCar: (car: CarData) => void;
  onMoveCar: (car: CarData) => void;
}

const MobileCarCard = memo(({ 
  car, 
  onScheduleTestDrive, 
  onViewPdi, 
  onStatusClick, 
  onCustomsClick, 
  onViewDetails, 
  onEditCar, 
  onMoveCar,
  handleSoftwareClick
}: { 
  car: CarData;
  onScheduleTestDrive: (car: CarData) => void;
  onViewPdi: (car: CarData) => void;
  onStatusClick: (car: CarData) => void;
  onCustomsClick: (car: CarData) => void;
  onViewDetails: (car: CarData) => void;
  onEditCar: (car: CarData) => void;
  onMoveCar: (car: CarData) => void;
  handleSoftwareClick: (car: CarData) => void;
}) => {
  const statusColorClass = useMemo(() => {
    switch (car.status) {
      case 'in_stock': return 'bg-green-100 text-green-800';
      case 'reserved': return 'bg-yellow-100 text-yellow-800';
      case 'sold': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }, [car.status]);

  const statusDisplayName = useMemo(() => {
    switch (car.status) {
      case 'in_stock': return 'Available';
      case 'reserved': return 'Reserved';
      case 'sold': return 'Sold';
      default: return car.status;
    }
  }, [car.status]);

  const categoryColorClass = useMemo(() => {
    switch (car.category) {
      case 'EV': return 'category-ev';
      case 'REV': return 'category-rev';
      case 'ICEV': return 'category-icev';
      default: return 'bg-gray-400 text-white';
    }
  }, [car.category]);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3 shadow-sm">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-lg">{car.model}</h3>
          <p className="text-sm text-gray-500 font-mono">{car.vinNumber}</p>
        </div>
        <Badge className={categoryColorClass}>
          {car.category}
        </Badge>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-gray-500">Year:</span>
          <span className="ml-2 font-medium">{car.year}</span>
        </div>
        <div>
          <span className="text-gray-500">Color:</span>
          <span className="ml-2 font-medium">{car.color}</span>
        </div>
        <div>
          <span className="text-gray-500">Price:</span>
          <span className="ml-2 font-medium">${car.price.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-1">
          <Battery className="h-4 w-4" />
          <span>{car.batteryPercentage}%</span>
        </div>
        <div>
          <span className="text-gray-500">HP:</span>
          <span className="ml-2 font-medium">{(car as any).horsePower || 350} HP</span>
        </div>
        <div>
          <span className="text-gray-500">Torque:</span>
          <span className="ml-2 font-medium">{(car as any).torque || 500} Nm</span>
        </div>
        <div>
          <span className="text-gray-500">0-100:</span>
          <span className="ml-2 font-medium">{(car as any).acceleration || '4.5'}s</span>
        </div>
        <div>
          <span className="text-gray-500">Top Speed:</span>
          <span className="ml-2 font-medium">{(car as any).topSpeed || 250} km/h</span>
        </div>
        <div>
          <span className="text-gray-500">Software:</span>
          <div 
            className="ml-2 inline-flex cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSoftwareClick(car);
            }}
            title="Click to manage software updates"
          >
            {(car as any).softwareVersion ? (
              <Badge variant="outline" className="text-xs hover:bg-blue-50 transition-colors">
                v{(car as any).softwareVersion}
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs text-yellow-700 bg-yellow-100 hover:bg-yellow-200 transition-colors">
                Update Needed
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Status and Actions Row */}
      <div className="flex flex-wrap gap-2 items-center">
        <Badge 
          className={`${statusColorClass} cursor-pointer hover:opacity-80 transition-all`}
          onClick={() => onStatusClick(car)}
        >
          {statusDisplayName}
        </Badge>

        {car.testDriveInfo?.isOnTestDrive ? (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            <Clock className="mr-1 h-3 w-3" />
            {car.testDriveInfo.isClientTestDrive ? 'Client' : 'Employee'} Test Drive
          </Badge>
        ) : car.status === 'sold' || car.status === 'reserved' ? (
          <Badge variant="outline" className="bg-gray-50 text-gray-500">
            Not Available
          </Badge>
        ) : (
          <Badge 
            variant="outline" 
            className="bg-gray-50 text-gray-500 cursor-pointer hover:bg-blue-50 hover:text-blue-600 transition-colors"
            onClick={() => onScheduleTestDrive(car)}
          >
            Available
          </Badge>
        )}

        <Badge 
          className={car.pdiCompleted ? 'bg-green-100 text-green-800 border-green-200' : 'bg-yellow-100 text-yellow-800 border-yellow-200'}
          onClick={() => onViewPdi(car)}
        >
          {car.pdiCompleted ? (
            <><span className="mr-1 text-lg">☺</span> Complete</>
          ) : (
            <><span className="mr-1 text-lg">☹</span> Pending</>
          )}
        </Badge>

        <Badge 
          variant={car.customs === 'paid' ? 'default' : 'destructive'}
          className="cursor-pointer hover:opacity-80 transition-opacity active:scale-95"
          onClick={() => onCustomsClick(car)}
          title="Click to manage customs payment"
        >
          {car.customs === 'paid' ? (
            <><CheckCircle className="mr-1 h-4 w-4" /> paid</>
          ) : (
            <><X className="mr-1 h-4 w-4" /> {car.customs || 'not paid'}</>
          )}
        </Badge>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t">
        <select
          onChange={(e) => {
            const action = e.target.value;
            if (action === 'view') onViewDetails(car);
            else if (action === 'edit') onEditCar(car);
            else if (action === 'move') onMoveCar(car);
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
          <option value="edit">Edit</option>
          <option value="move">Move</option>
        </select>
      </div>
    </div>
  );
});

MobileCarCard.displayName = 'MobileCarCard';

const ShowroomFloor2Table = memo(({ 
  cars, 
  onScheduleTestDrive, 
  onViewPdi, 
  onStatusClick, 
  onCustomsClick, 
  onViewDetails, 
  onEditCar, 
  onMoveCar 
}: ShowroomFloor2TableProps) => {
  const [showSoftwareDialog, setShowSoftwareDialog] = useState(false);
  const [softwareSelectedCar, setSoftwareSelectedCar] = useState<CarData | null>(null);

  const handleSoftwareClick = useCallback((car: CarData) => {
    setSoftwareSelectedCar(car);
    setShowSoftwareDialog(true);
  }, []);

  const handleSoftwareUpdateComplete = useCallback((carVin: string, updateData: any) => {
    console.log('Software update completed for car:', carVin, updateData);
    // Here you would typically update the car data in your state/database
    setSoftwareSelectedCar(null);
    setShowSoftwareDialog(false);
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'in_stock': return 'bg-green-100 text-green-800';
      case 'reserved': return 'bg-yellow-100 text-yellow-800';
      case 'sold': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }, []);

  const getStatusDisplayName = useCallback((status: string) => {
    switch (status) {
      case 'in_stock': return 'Available';
      case 'reserved': return 'Reserved';
      case 'sold': return 'Sold';
      default: return status;
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

  // Mobile view for small screens
  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden lg:block rounded-md border">
          <Table>
            <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold">VIN</TableHead>
              <TableHead className="font-semibold">Model</TableHead>
              <TableHead className="font-semibold">Category</TableHead>
              <TableHead className="font-semibold">Year</TableHead>
              <TableHead className="font-semibold">Color</TableHead>
              <TableHead className="font-semibold">Price</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Battery</TableHead>
              <TableHead className="font-semibold">Range Capacity</TableHead>
              <TableHead className="font-semibold">Km Driven</TableHead>
              <TableHead className="font-semibold">Horsepower</TableHead>
              <TableHead className="font-semibold">Torque</TableHead>
              <TableHead className="font-semibold">0-100 km/h</TableHead>
              <TableHead className="font-semibold">Top Speed</TableHead>
              <TableHead className="font-semibold">Test Drive</TableHead>
              <TableHead className="font-semibold">PDI</TableHead>
              <TableHead className="font-semibold">Customs</TableHead>
              <TableHead className="font-semibold">Software Model</TableHead>
              <TableHead className="font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
            {cars.map((car) => (
              <TableRow key={car.id} className="hover:bg-gray-50">
                <TableCell className="font-mono text-sm">{car.vinNumber}</TableCell>
                <TableCell className="font-medium">{car.model}</TableCell>
                <TableCell>
                  <Badge className={getCategoryColor(car.category)}>
                    {car.category}
                  </Badge>
                </TableCell>
                <TableCell>{car.year}</TableCell>
                <TableCell>{car.color}</TableCell>
                <TableCell className="font-medium">${car.price.toLocaleString()}</TableCell>
                <TableCell>
                  <Badge 
                    className={`${getStatusColor(car.status)} cursor-pointer hover:opacity-80 transition-all hover:scale-105 active:scale-95`}
                    onClick={() => onStatusClick(car)}
                    title="Click to change status"
                  >
                    {getStatusDisplayName(car.status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Battery className="h-4 w-4" />
                    {car.batteryPercentage}%
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Fuel className="h-4 w-4" />
                    {car.range} km
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {kilometersService.getKilometersDriven(car.id)} km
                  </div>
                </TableCell>
                <TableCell>
                  {(car as any).horsePower ? `${(car as any).horsePower} HP` : '350 HP'}
                </TableCell>
                <TableCell>
                  {(car as any).torque ? `${(car as any).torque} Nm` : '500 Nm'}
                </TableCell>
                <TableCell>
                  {(car as any).acceleration ? `${(car as any).acceleration}s` : '4.5s'}
                </TableCell>
                <TableCell>
                  {(car as any).topSpeed ? `${(car as any).topSpeed} km/h` : '250 km/h'}
                </TableCell>
                <TableCell>
                  {car.testDriveInfo?.isOnTestDrive ? (
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                      <Clock className="mr-1 h-3 w-3" />
                      {car.testDriveInfo.isClientTestDrive ? 'Client' : 'Employee'} Test Drive
                    </Badge>
                  ) : car.status === 'sold' || car.status === 'reserved' ? (
                    <Badge variant="outline" className="bg-gray-50 text-gray-500">
                      Not Available
                    </Badge>
                  ) : (
                    <Badge 
                      variant="outline" 
                      className="bg-gray-50 text-gray-500 cursor-pointer hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      onClick={() => onScheduleTestDrive(car)}
                      title="Click to schedule test drive"
                    >
                      Available
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div 
                    className="cursor-pointer"
                    onClick={() => onViewPdi(car)}
                  >
                    <Badge className={car.pdiCompleted ? 'bg-green-100 text-green-800 border-green-200' : 'bg-yellow-100 text-yellow-800 border-yellow-200'}>
                      {car.pdiCompleted ? (
                        <><span className="mr-1 text-lg">☺</span> Complete</>
                      ) : (
                        <><span className="mr-1 text-lg">☹</span> Pending</>
                      )}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={car.customs === 'paid' ? 'default' : 'destructive'}
                    className="cursor-pointer hover:opacity-80 transition-opacity active:scale-95"
                    onClick={() => onCustomsClick(car)}
                    title="Click to manage customs payment"
                  >
                    {car.customs === 'paid' ? (
                      <><CheckCircle className="mr-1 h-4 w-4" /> paid</>
                    ) : (
                      <><X className="mr-1 h-4 w-4" /> {car.customs || 'not paid'}</>
                    )}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div 
                    className="flex items-center gap-1 text-xs cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSoftwareClick(car);
                    }}
                    title="Click to manage software updates"
                  >
                    {(car as any).softwareVersion ? (
                      <Badge variant="outline" className="text-xs hover:bg-blue-50 transition-colors">
                        v{(car as any).softwareVersion}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs text-yellow-700 bg-yellow-100 hover:bg-yellow-200 transition-colors">
                        Update Needed
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <div className="relative">
                      <select
                        onChange={(e) => {
                          const action = e.target.value;
                          if (action === 'view') onViewDetails(car);
                          else if (action === 'edit') onEditCar(car);
                          else if (action === 'move') onMoveCar(car);
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
                        aria-label={`Actions for ${car.model} ${car.vinNumber}`}
                      >
                        <option value="">Actions</option>
                        <option value="view">View Details</option>
                        <option value="edit">Edit</option>
                        <option value="move">Move</option>
                      </select>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            </TableBody>
          </Table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {cars.map((car) => (
          <MobileCarCard
            key={car.id}
            car={car}
            onScheduleTestDrive={onScheduleTestDrive}
            onViewPdi={onViewPdi}
            onStatusClick={onStatusClick}
            onCustomsClick={onCustomsClick}
            onViewDetails={onViewDetails}
            onEditCar={onEditCar}
            onMoveCar={onMoveCar}
            handleSoftwareClick={handleSoftwareClick}
          />
        ))}
      </div>

      {/* Software Update Dialog */}
      <ITSoftwareUpdateDialog
        isOpen={showSoftwareDialog}
        onClose={() => {
          setShowSoftwareDialog(false);
          setSoftwareSelectedCar(null);
        }}
        car={softwareSelectedCar ? {
          vinNumber: softwareSelectedCar.vinNumber,
          model: softwareSelectedCar.model,
          currentVersion: (softwareSelectedCar as any).softwareVersion,
          lastUpdated: (softwareSelectedCar as any).softwareLastUpdated,
          lastUpdatedBy: (softwareSelectedCar as any).softwareUpdateBy,
          notes: (softwareSelectedCar as any).softwareUpdateNotes,
          needsUpdate: !(softwareSelectedCar as any).softwareVersion,
          priority: !(softwareSelectedCar as any).softwareVersion ? 'critical' : 'medium'
        } : null}
        onUpdateComplete={handleSoftwareUpdateComplete}
      />
    </>
  );
});

ShowroomFloor2Table.displayName = 'ShowroomFloor2Table';

export default ShowroomFloor2Table;
