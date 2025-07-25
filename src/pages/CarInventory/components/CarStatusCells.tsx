
import React from 'react';
import { format } from 'date-fns';
import { TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Battery } from 'lucide-react';
import { Car } from '../types';
import EditableCell from './EditableCell';

interface CarStatusCellsProps {
  car: Car;
  isEditing: boolean;
  editValues: Partial<Car>;
  onUpdateEditValue: (field: keyof Car, value: any) => void;
  onStatusUpdate: (carId: string, newStatus: 'in_stock' | 'sold' | 'reserved') => void;
}

const CarStatusCells: React.FC<CarStatusCellsProps> = ({
  car,
  isEditing,
  editValues,
  onUpdateEditValue,
  onStatusUpdate,
}) => {
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'MMM d, yyyy');
  };

  const getBatteryColor = (percentage?: number) => {
    if (!percentage) return 'text-gray-400';
    if (percentage > 60) return 'text-green-600';
    if (percentage > 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case 'in_stock': return 'default';
      case 'sold': return 'secondary';
      case 'reserved': return 'outline';
      default: return 'default';
    }
  };

  const statusOptions = [
    { value: 'in_stock', label: 'In Stock' },
    { value: 'sold', label: 'Sold' },
    { value: 'reserved', label: 'Reserved' }
  ];

  const handleStatusChange = (newStatus: string) => {
    onUpdateEditValue('status', newStatus);
    if (!isEditing) {
      onStatusUpdate(car.id, newStatus as 'in_stock' | 'sold' | 'reserved');
    }
  };

  return (
    <>
      {/* Battery % */}
      <TableCell>
        <EditableCell
          isEditing={isEditing}
          value={editValues.batteryPercentage || car.batteryPercentage}
          field="batteryPercentage"
          onUpdate={onUpdateEditValue}
          type="number"
          min={0}
          max={100}
          className="w-20"
        >
          {car.batteryPercentage ? (
            <div className="flex items-center gap-1">
              <Battery className={`h-4 w-4 ${getBatteryColor(car.batteryPercentage)}`} />
              <span className={getBatteryColor(car.batteryPercentage)}>
                {car.batteryPercentage}%
              </span>
            </div>
          ) : (
            <span className="text-gray-400">N/A</span>
          )}
        </EditableCell>
      </TableCell>

      {/* Status */}
      <TableCell>
        <EditableCell
          isEditing={isEditing}
          value={editValues.status || car.status}
          field="status"
          onUpdate={handleStatusChange}
          type="select"
          options={statusOptions}
          className="w-32"
        >
          <Badge variant={getBadgeVariant(car.status)}>
            {car.status.replace('_', ' ')}
          </Badge>
        </EditableCell>
      </TableCell>

      {/* PDI Status */}
      <TableCell>
        {car.pdiCompleted ? (
          <div>
            <Badge className="bg-green-100 text-green-800 border-green-200">
              <span className="mr-1 text-lg">☺</span>
              Complete
            </Badge>
            {car.pdiTechnician && (
              <div className="text-xs text-muted-foreground mt-1">
                by {car.pdiTechnician}
              </div>
            )}
          </div>
        ) : (
          <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">
            <span className="mr-1 text-lg">☹</span>
            Pending
          </Badge>
        )}
      </TableCell>

      {/* Arrival Date */}
      <TableCell>{formatDate(car.arrivalDate)}</TableCell>
    </>
  );
};

export default CarStatusCells;
