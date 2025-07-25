import React from 'react';
import CarTable from './CarTable';
import { Car } from '../types';

interface CarInventoryTableProps {
  cars: Car[];
  onStatusUpdate: (carId: string, newStatus: 'in_stock' | 'sold' | 'reserved') => void;
  onShowroomToggle: (carId: string, inShowroom: boolean, note: string) => void;
  onPdiClick: (car: Car) => void;
  onEditClick: (car: Car) => void;
  onMoveClick: (car: Car) => void;
  onTestDriveSchedule?: (carId: string, testDriveInfo: any) => void;
  onTestDriveEnd?: (carId: string) => void;
  onTechSpecsClick?: (car: Car) => void;
  onCarUpdate?: (carId: string, updates: Partial<Car>) => void;
  onShowClientInfo?: (car: Car) => void;
  onDeliveryDateClick?: (car: Car) => void;
}

const CarInventoryTable: React.FC<CarInventoryTableProps> = ({
  cars,
  onStatusUpdate,
  onShowroomToggle,
  onPdiClick,
  onEditClick,
  onMoveClick,
  onTestDriveSchedule,
  onTestDriveEnd,
  onTechSpecsClick,
  onCarUpdate,
  onShowClientInfo,
  onDeliveryDateClick,
}) => {
  const handleViewRepairHistory = (car: Car) => {
    // Handle repair history viewing
    console.log('View repair history for car:', car.id);
  };

  const handleStatusChange = (car: Car, status: 'in_stock' | 'sold' | 'reserved') => {
    onStatusUpdate(car.id, status);
  };

  const handleStatusClick = (car: Car) => {
    onShowClientInfo?.(car);
  };

  return (
    <div className="overflow-x-auto">
      <CarTable
        cars={cars}
        onViewRepairHistory={handleViewRepairHistory}
        onPdiClick={onPdiClick}
        onShowroomToggle={(car) => onShowroomToggle(car.id, !car.inShowroom, '')}
        onStatusChange={handleStatusChange}
        onMoveCar={(carId, destination) => onMoveClick(cars.find(c => c.id === carId)!)}
        onTestDriveSchedule={onTestDriveSchedule}
        onTestDriveEnd={onTestDriveEnd}
        onOpenPdi={onPdiClick}
        onOpenEditDialog={onEditClick}
        onOpenMoveDialog={onMoveClick}
        onOpenTechSpecs={onTechSpecsClick}
        onCarUpdate={onCarUpdate}
        onShowClientInfo={onShowClientInfo}
        onDeliveryDateClick={onDeliveryDateClick}
      />
    </div>
  );
};

export default CarInventoryTable;
