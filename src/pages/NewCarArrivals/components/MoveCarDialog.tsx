
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { NewCar } from '../types';

interface MoveCarDialogProps {
  isOpen: boolean;
  onClose: () => void;
  car: NewCar;
  onMoveCar: (destination: string) => void;
}

export const MoveCarDialog: React.FC<MoveCarDialogProps> = ({
  isOpen,
  onClose,
  car,
  onMoveCar
}) => {
  const [destination, setDestination] = useState('');

  const destinations = [
    { value: 'inventory', label: 'Car Inventory' },
    { value: 'showroom-1', label: 'Showroom Floor 1' },
    { value: 'showroom-2', label: 'Showroom Floor 2' },
    { value: 'garage', label: 'Garage' }
  ];

  const handleMove = () => {
    if (!destination) {
      toast({
        title: "Missing Information",
        description: "Please select a destination",
        variant: "destructive"
      });
      return;
    }

    onMoveCar(destination);
    onClose();
    setDestination('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Move Car - {car.model}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-monza-yellow/10 p-3 rounded border border-monza-yellow/20">
            <p className="text-sm"><strong>VIN:</strong> {car.vin || car.vinNumber}</p>
            <p className="text-sm"><strong>Model:</strong> {car.model}</p>
            <p className="text-sm"><strong>Color:</strong> {car.color}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="destination">Move to:</Label>
            <Select value={destination} onValueChange={setDestination}>
              <SelectTrigger>
                <SelectValue placeholder="Select destination" />
              </SelectTrigger>
              <SelectContent>
                {destinations.map((dest) => (
                  <SelectItem key={dest.value} value={dest.value}>
                    {dest.label}
                  </SelectItem>
                ))}
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
