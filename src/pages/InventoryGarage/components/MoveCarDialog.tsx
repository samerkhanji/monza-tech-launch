import React, { useState } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { dateUtils } from '@/lib/utils';
import { InventoryItem } from '@/types/inventory';

interface MoveCarDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem;
  onMove: (id: string, newLocation: string) => void;
}

const validLocations = [
  'Showroom Floor 1',
  'Showroom Floor 2',
  'Service Bay 1',
  'Service Bay 2',
  'Service Bay 3',
  'Maintenance Bay',
  'Parts Storage',
  'Customer Parking',
  'Employee Parking'
];

export const MoveCarDialog: React.FC<MoveCarDialogProps> = ({
  isOpen,
  onClose,
  item,
  onMove,
}) => {
  const [selectedLocation, setSelectedLocation] = React.useState<string>('');

  const handleMove = () => {
    if (selectedLocation) {
      onMove(item.id, selectedLocation);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Move Car to New Location</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Current Location</p>
              <p className="text-sm text-gray-600">
                {`${item.location.room} (${item.location.shelf}-${item.location.column}-${item.location.row})`}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Select New Location</p>
              <Select
                value={selectedLocation}
                onValueChange={setSelectedLocation}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a location" />
                </SelectTrigger>
                <SelectContent>
                  {validLocations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleMove}
            disabled={!selectedLocation}
          >
            Move Car
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
