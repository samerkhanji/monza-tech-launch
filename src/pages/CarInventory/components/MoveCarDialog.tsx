
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { 
  ALL_LOCATIONS, 
  Location, 
  getAvailableMoveLocations, 
  getLocationLabel, 
  moveCar 
} from '@/services/universalScanHandler';

interface MoveCarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  carVin: string;
  currentLocation: Location;
  onCarMoved: () => void;
}

export function MoveCarDialog({
  open,
  onOpenChange,
  carVin,
  currentLocation,
  onCarMoved
}: MoveCarDialogProps) {
  const [targetLocation, setTargetLocation] = useState<Location | ''>('');
  const [isMoving, setIsMoving] = useState(false);

  // Get available move locations (excluding current location)
  const availableLocations = getAvailableMoveLocations(currentLocation);

  const handleMoveCar = async () => {
    if (!targetLocation) {
      toast({
        title: "No target selected",
        description: "Please select a destination for the car.",
        variant: "destructive",
      });
      return;
    }

    setIsMoving(true);
    try {
      const result = await moveCar(carVin, targetLocation);
      
      if (result.ok) {
        toast({
          title: "Car moved successfully",
          description: result.message,
        });
        
        // Reset form and close dialog
        setTargetLocation('');
        onCarMoved();
        onOpenChange(false);
      } else {
        toast({
          title: "Move failed",
          description: result.message || "Failed to move car",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error moving car:', error);
      toast({
        title: "Move failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsMoving(false);
    }
  };

  const handleCancel = () => {
    setTargetLocation('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Move Car</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="car-vin">Car VIN</Label>
            <div className="mt-1 p-2 bg-gray-50 rounded-md font-mono text-sm">
              {carVin}
            </div>
          </div>
          
          <div>
            <Label htmlFor="current-location">Current Location</Label>
            <div className="mt-1 p-2 bg-blue-50 rounded-md text-sm">
              {getLocationLabel(currentLocation)}
            </div>
          </div>
          
          <div>
            <Label htmlFor="target-location">Move to Location *</Label>
            <Select value={targetLocation} onValueChange={(value) => setTargetLocation(value as Location)}>
              <SelectTrigger>
                <SelectValue placeholder="Select destination" />
              </SelectTrigger>
              <SelectContent>
                {availableLocations.map((location) => (
                  <SelectItem key={location} value={location}>
                    {getLocationLabel(location)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleCancel} disabled={isMoving}>
            Cancel
          </Button>
          <Button 
            onClick={handleMoveCar} 
            disabled={!targetLocation || isMoving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isMoving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Moving...
              </>
            ) : (
              'Move Car'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
