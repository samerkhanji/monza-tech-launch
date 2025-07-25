
import React from 'react';
import { TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Zap, Fuel } from 'lucide-react';
import { Car } from '../types';
import EditableCell from './EditableCell';

interface CarBasicInfoCellsProps {
  car: Car;
  isEditing: boolean;
  editValues: Partial<Car>;
  onUpdateEditValue: (field: keyof Car, value: any) => void;
}

const CarBasicInfoCells: React.FC<CarBasicInfoCellsProps> = ({
  car,
  isEditing,
  editValues,
  onUpdateEditValue,
}) => {
  const getColorHex = (colorName: string): string => {
    const colorMap: Record<string, string> = {
      'Pearl White': '#FFFFFF',
      'Midnight Blue': '#145DA0',
      'Scarlet Red': '#FF2400',
      'Silver Frost': '#C0C0C0',
      'Obsidian Black': '#1A1A1A',
      'Electric Green': '#00FF00',
      'Desert Sand': '#EDC9AF',
      'Ocean Teal': '#0A7E8C',
    };
    return colorMap[colorName] || '#CCCCCC';
  };

  const categoryOptions = [
    { value: 'EV', label: 'EV' },
    { value: 'REV', label: 'REV' }
  ];

  return (
    <>
      {/* Model */}
      <TableCell className="font-medium">
        <EditableCell
          isEditing={isEditing}
          value={editValues.model || car.model}
          field="model"
          onUpdate={onUpdateEditValue}
          className="w-32"
        >
          {car.model}
        </EditableCell>
      </TableCell>

      {/* VIN Number */}
      <TableCell className="font-mono text-xs">
        <EditableCell
          isEditing={isEditing}
          value={editValues.vinNumber || car.vinNumber}
          field="vinNumber"
          onUpdate={onUpdateEditValue}
          className="w-32 font-mono text-xs"
        >
          {car.vinNumber}
        </EditableCell>
      </TableCell>

      {/* Color */}
      <TableCell>
        <EditableCell
          isEditing={isEditing}
          value={editValues.color || car.color}
          field="color"
          onUpdate={onUpdateEditValue}
          className="w-28"
        >
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: getColorHex(car.color) }}
            ></div>
            {car.color}
          </div>
        </EditableCell>
      </TableCell>

      {/* Category */}
      <TableCell>
        <EditableCell
          isEditing={isEditing}
          value={editValues.category || car.category}
          field="category"
          onUpdate={onUpdateEditValue}
          type="select"
          options={categoryOptions}
          className="w-20"
        >
          {car.category ? (
            <div className="flex items-center gap-1">
              {car.category === 'EV' ? (
                <Zap className="h-4 w-4 text-blue-600" />
              ) : (
                <Fuel className="h-4 w-4 text-orange-600" />
              )}
              <Badge variant="outline" className={car.category === 'EV' ? 'border-blue-200 text-blue-800' : 'border-orange-200 text-orange-800'}>
                {car.category}
              </Badge>
            </div>
          ) : (
            <span className="text-gray-400">N/A</span>
          )}
        </EditableCell>
      </TableCell>
    </>
  );
};

export default CarBasicInfoCells;
