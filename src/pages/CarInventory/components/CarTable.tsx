import React from 'react';
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
import { Car } from 'lucide-react';
import { Car as CarType } from '../types';
import CarTableRow from './CarTableRow';

interface CarTableProps {
  cars: CarType[];
  onViewRepairHistory: (car: CarType) => void;
  onPdiClick: (car: CarType) => void;
  onShowroomToggle: (car: CarType) => void;
  onStatusChange: (car: CarType, status: 'in_stock' | 'sold' | 'reserved') => void;
  onMoveCar: (carId: string, destination: string) => void;
  onTestDriveSchedule?: (carId: string, testDriveInfo: any) => void;
  onTestDriveEnd?: (carId: string) => void;
  onOpenPdi: (car: CarType) => void;
  onOpenEditDialog: (car: CarType) => void;
  onOpenMoveDialog: (car: CarType) => void;
  onOpenTechSpecs?: (car: CarType) => void;
  onCarUpdate?: (carId: string, updates: Partial<CarType>) => void;
  onShowClientInfo?: (car: CarType) => void;
  onDeliveryDateClick?: (car: CarType) => void;
}

const CarTable: React.FC<CarTableProps> = ({
  cars,
  onViewRepairHistory,
  onPdiClick,
  onShowroomToggle,
  onStatusChange,
  onMoveCar,
  onTestDriveSchedule,
  onTestDriveEnd,
  onOpenPdi,
  onOpenEditDialog,
  onOpenMoveDialog,
  onOpenTechSpecs,
  onCarUpdate,
  onShowClientInfo,
  onDeliveryDateClick,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Car className="h-5 w-5" />
          Car Inventory ({cars.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold">VIN</TableHead>
                <TableHead className="font-semibold">Model</TableHead>
                <TableHead className="font-semibold">Category</TableHead>
                <TableHead className="font-semibold">Year</TableHead>
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
                  <CarTableRow
                    key={car.id}
                    car={car}
                    onStatusUpdate={(carId, newStatus) => onStatusChange(car, newStatus)}
                    onShowroomToggle={(carId, inShowroom, note) => onShowroomToggle(car)}
                    onClientInfoSave={(carId, clientInfo) => {
                      // Handle client info save - this would need to be implemented in the parent
                    }}
                    onMoveCar={onMoveCar}
                    onTestDriveSchedule={onTestDriveSchedule}
                    onTestDriveEnd={onTestDriveEnd}
                    onOpenPdi={() => onOpenPdi(car)}
                    onOpenEditDialog={() => onOpenEditDialog(car)}
                    onOpenMoveDialog={() => onOpenMoveDialog(car)}
                    onOpenTechSpecs={onOpenTechSpecs ? () => onOpenTechSpecs(car) : undefined}
                    onCarUpdate={onCarUpdate}
                    onShowClientInfo={onShowClientInfo}
                  />
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={17} className="text-center py-8 text-gray-500">
                    No cars found matching the current filters
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default CarTable;
