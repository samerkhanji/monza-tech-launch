import React from 'react';
import { TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Car } from '../types';
import EditableCell from './EditableCell';

interface CarLocationCellsProps {
  car: Car;
  isEditing: boolean;
  editValues: Partial<Car>;
  onUpdateEditValue: (field: keyof Car, value: any) => void;
}

const CarLocationCells: React.FC<CarLocationCellsProps> = ({
  car,
  isEditing,
  editValues,
  onUpdateEditValue,
}) => {
  const locationOptions = [
    { value: 'In Stock', label: 'In Stock' },
    { value: 'Showroom 1', label: 'Showroom 1' },
    { value: 'Showroom 2', label: 'Showroom 2' },
    { value: 'Garage', label: 'Garage' }
  ];

  const customsOptions = [
    { value: 'paid', label: 'Paid' },
    { value: 'not paid', label: 'Not Paid' }
  ];

  const getLocationDisplay = (car: Car) => {
    // If car is sold, show N/A
    if (car.status === 'sold') {
      return 'N/A';
    }
    
    // If car has a current floor, show it
    if (car.currentFloor) {
      return car.currentFloor;
    }
    
    // If car is in stock but no specific location, show "In Stock"
    if (car.status === 'in_stock') {
      return 'In Stock';
    }
    
    return 'N/A';
  };

  const getLocationBadge = (car: Car) => {
    const location = getLocationDisplay(car);
    
    if (location === 'N/A') {
      return (
        <Badge variant="outline" className="bg-monza-gray/10 text-monza-gray border-monza-gray/20">
          N/A
        </Badge>
      );
    }
    
    if (location === 'In Stock') {
      return (
        <Badge variant="default" className="bg-monza-yellow/20 text-monza-black border-monza-yellow/40">
          In Stock
        </Badge>
      );
    }
    
    if (location === 'Showroom 1') {
      return (
        <Badge variant="default" className="bg-monza-yellow/15 text-monza-black border-monza-yellow/30">
          Showroom 1
        </Badge>
      );
    }
    
    if (location === 'Showroom 2') {
      return (
        <Badge variant="secondary" className="bg-monza-gray/15 text-monza-gray border-monza-gray/30">
          Showroom 2
        </Badge>
      );
    }
    
    if (location === 'Garage') {
      return (
        <Badge variant="outline" className="bg-monza-yellow/10 text-monza-black border-monza-yellow/25">
          Garage
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline" className="bg-monza-gray/10 text-monza-gray border-monza-gray/20">
        {location}
      </Badge>
    );
  };

  const getCustomsBadge = (status?: 'paid' | 'not paid') => {
    if (!status) return <span className="text-muted-foreground">Not set</span>;
    
    return (
      <span className={`px-2 py-1 text-xs rounded-full border ${
        status === 'paid' 
          ? 'bg-monza-yellow/20 text-monza-black border-monza-yellow/40' 
          : 'bg-monza-gray/15 text-monza-gray border-monza-gray/30'
      }`}>
        {status === 'paid' ? 'Paid' : 'Not Paid'}
      </span>
    );
  };

  return (
    <>
      {/* Location */}
      <TableCell>
        <EditableCell
          isEditing={isEditing}
          value={editValues.currentFloor || car.currentFloor || 'In Stock'}
          field="currentFloor"
          onUpdate={onUpdateEditValue}
          type="select"
          options={locationOptions}
          placeholder="Select location"
          className="w-full"
        >
          {getLocationBadge(car)}
        </EditableCell>
      </TableCell>

      {/* Customs */}
      <TableCell>
        <EditableCell
          isEditing={isEditing}
          value={editValues.customs || car.customs || ''}
          field="customs"
          onUpdate={onUpdateEditValue}
          type="select"
          options={customsOptions}
          placeholder="Select status"
          className="w-full"
        >
          {getCustomsBadge(car.customs)}
        </EditableCell>
      </TableCell>

      {/* Notes */}
      <TableCell>
        <EditableCell
          isEditing={isEditing}
          value={editValues.notes || car.notes || ''}
          field="notes"
          onUpdate={onUpdateEditValue}
          className="w-40"
          placeholder="Notes"
        >
          {car.notes ? (
            <span className="text-sm">{car.notes}</span>
          ) : (
            <span className="text-sm text-muted-foreground">No notes</span>
          )}
        </EditableCell>
      </TableCell>
    </>
  );
};

export default CarLocationCells;
