
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Car } from '../types';

interface MoveCarDialogProps {
  isOpen: boolean;
  onClose: () => void;
  car: Car;
  onMoveCar: (destination: string) => void;
}

const MoveCarDialog: React.FC<MoveCarDialogProps> = ({ 
  isOpen, 
  onClose, 
  car, 
  onMoveCar 
}) => {
  const destinations = [
    { value: 'floor1', label: 'Showroom Floor 1' },
    { value: 'floor2', label: 'Showroom Floor 2' },
    { value: 'garage', label: 'Garage' }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Move Car - {car.model}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-sm"><strong>VIN:</strong> {car.vinNumber}</p>
            <p className="text-sm"><strong>Model:</strong> {car.model}</p>
            <p className="text-sm"><strong>Color:</strong> {car.color}</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Select destination:</p>
            {destinations.map((dest) => (
              <Button
                key={dest.value}
                variant="outline"
                className="w-full justify-start"
                onClick={() => onMoveCar(dest.value)}
              >
                {dest.label}
              </Button>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MoveCarDialog;
