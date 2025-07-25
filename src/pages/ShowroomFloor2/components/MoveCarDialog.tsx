
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { ShowroomCar } from './ShowroomCar';

interface MoveCarDialogProps {
  isOpen: boolean;
  onClose: () => void;
  car: ShowroomCar | null;
  onMove?: (carId: string, destination: string) => void;
  onMoveCar?: (destination: string, notes?: string) => void;
}

export const MoveCarDialog: React.FC<MoveCarDialogProps> = ({
  isOpen,
  onClose,
  car,
  onMove,
  onMoveCar
}) => {
  const [destination, setDestination] = useState('');
  const [notes, setNotes] = useState('');

  const handleMove = () => {
    if (!car || !destination) {
      toast({
        title: "Missing Information",
        description: "Please select a destination",
        variant: "destructive"
      });
      return;
    }

    // Support both prop patterns for flexibility
    if (onMove) {
      onMove(car.id, destination);
    } else if (onMoveCar) {
      onMoveCar(destination, notes);
    }

    onClose();
    setDestination('');
    setNotes('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Move Car</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {car && (
            <div className="p-4 bg-gray-50 rounded">
              <h3 className="font-semibold">{car.model}</h3>
              <p className="text-sm text-gray-600">VIN: {car.vinNumber}</p>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="destination">Move to:</Label>
            <Select value={destination} onValueChange={setDestination}>
              <SelectTrigger>
                <SelectValue placeholder="Select destination" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="showroom-1">Showroom Floor 1</SelectItem>
                <SelectItem value="garage">Garage</SelectItem>
                <SelectItem value="inventory">Car Inventory</SelectItem>
                <SelectItem value="new-arrivals">New Arrivals</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleMove} className="bg-monza-yellow text-monza-black hover:bg-monza-yellow/80">
              Move Car
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MoveCarDialog;
