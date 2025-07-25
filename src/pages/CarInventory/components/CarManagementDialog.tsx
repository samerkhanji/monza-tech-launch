
import React, { useState } from 'react';
import { Car } from '../types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

interface CarManagementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  car: Car;
  onUpdate: (carId: string, updates: Partial<Car>) => void;
}

const CarManagementDialog: React.FC<CarManagementDialogProps> = ({
  isOpen,
  onClose,
  car,
  onUpdate,
}) => {
  const [currentFloor, setCurrentFloor] = useState<'Showroom 1' | 'Showroom 2' | undefined>(
    car.currentFloor
  );
  const [batteryPercentage, setBatteryPercentage] = useState<number>(
    car.batteryPercentage || 85
  );

  const handleSave = () => {
    onUpdate(car.id, {
      currentFloor,
      batteryPercentage,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Car - {car.model}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>VIN: {car.vinNumber}</Label>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="floor">Current Floor</Label>
            <Select
              value={currentFloor || ''}
              onValueChange={(value) => setCurrentFloor(value as 'Showroom 1' | 'Showroom 2')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select floor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Showroom 1">Showroom 1</SelectItem>
                <SelectItem value="Showroom 2">Showroom 2</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-3">
            <Label>Battery Percentage: {batteryPercentage}%</Label>
            <Slider
              value={[batteryPercentage]}
              onValueChange={(value) => setBatteryPercentage(value[0])}
              max={100}
              min={0}
              step={1}
              className="w-full"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CarManagementDialog;
