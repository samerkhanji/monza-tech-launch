import React from 'react';
import { Card } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow,
  StatusBadge
} from '@/components/ui/table';
import CarOrdersTableActions from './CarOrdersTableActions';
import type { OrderedCar } from '@/pages/CarOrders/types';

interface CarOrdersTableProps {
  cars: OrderedCar[];
  onViewDetails: (car: OrderedCar) => void;
  onEditOrder: (car: OrderedCar) => void;
  onCancelOrder: (car: OrderedCar) => void;
  onStatusChange: (car: OrderedCar, status: 'pending' | 'in_transit' | 'arrived') => void;
}

export const CarOrdersTable: React.FC<CarOrdersTableProps> = ({
  cars,
  onViewDetails,
  onEditOrder,
  onCancelOrder,
  onStatusChange,
}) => {
  const getStatusVariant = (status: string): 'warning' | 'info' | 'success' | 'error' => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'in_transit':
        return 'info';
      case 'arrived':
        return 'success';
      default:
        return 'error';
    }
  };

  return (
    <Card className="p-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Model</TableHead>
            <TableHead>VIN</TableHead>
            <TableHead>Order Date</TableHead>
            <TableHead>Expected Arrival</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cars.map((car) => (
            <TableRow key={car.id}>
              <TableCell className="font-medium">{car.model}</TableCell>
              <TableCell>{car.vinNumber}</TableCell>
              <TableCell>{new Date(car.orderDate).toLocaleDateString()}</TableCell>
              <TableCell>{new Date(car.expectedArrivalDate).toLocaleDateString()}</TableCell>
              <TableCell>
                <StatusBadge variant={getStatusVariant(car.status)}>
                  {car.status.replace('_', ' ')}
                </StatusBadge>
              </TableCell>
              <TableCell>
                <CarOrdersTableActions
                  car={car}
                  onViewDetails={() => onViewDetails(car)}
                  onEdit={() => onEditOrder(car)}
                  onCancel={() => onCancelOrder(car)}
                  onStatusUpdate={(status) => onStatusChange(car, status)}
                />
              </TableCell>
            </TableRow>
          ))}
          {cars.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8">
                <p className="text-gray-500">No car orders found.</p>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
}; 