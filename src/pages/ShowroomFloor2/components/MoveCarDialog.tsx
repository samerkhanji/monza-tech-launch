
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
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from '@/hooks/use-toast';
import { Car, Building, Wrench, Package, Clock } from 'lucide-react';

interface MoveCarDialogProps {
  isOpen: boolean;
  onClose: () => void;
  car: any;
  onMoveCar: (destination: string, notes?: string) => void;
}

const MoveCarDialog: React.FC<MoveCarDialogProps> = ({
  isOpen,
  onClose,
  car,
  onMoveCar
}) => {
  const [selectedDestination, setSelectedDestination] = useState('');
  const [notes, setNotes] = useState('');

  // Exclude current table (floor2) and disallow moving to New Arrivals from existing tables
  const destinations = [
    {
      id: 'floor1',
      label: 'Showroom Floor 1',
      description: 'Move to main showroom floor 1',
      icon: Building
    },
    {
      id: 'inventory',
      label: 'Car Inventory',
      description: 'Move to main car inventory storage',
      icon: Package
    },
    {
      id: 'garage',
      label: 'Garage Inventory',
      description: 'Move to garage inventory',
      icon: Wrench
    },
    {
      id: 'garage-schedule',
      label: 'Garage Schedule',
      description: 'Add to garage schedule for service/repair',
      icon: Clock
    }
  ];

  const handleMove = () => {
    if (!selectedDestination) {
      toast({
        title: 'Error',
        description: 'Please select a destination.',
        variant: 'destructive',
      });
      return;
    }

    onMoveCar(selectedDestination, notes);

    const destination = destinations.find(d => d.id === selectedDestination);
    toast({ title: 'Car Moved', description: `${car?.model} has been moved to ${destination?.label}.` });

    onClose();
    setSelectedDestination('');
    setNotes('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Move Car - {car?.model}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-monza-yellow/10 rounded-lg border border-monza-yellow/20">
            <p className="text-sm"><strong>VIN:</strong> {car?.vinNumber}</p>
            <p className="text-sm"><strong>Model:</strong> {car?.model}</p>
            <p className="text-sm"><strong>Color:</strong> {car?.color}</p>
          </div>

          <div className="space-y-3">
            <Label>Select Destination</Label>
            <RadioGroup
              value={selectedDestination}
              onValueChange={setSelectedDestination}
              className="space-y-3"
            >
              {destinations.map((destination) => {
                const IconComponent = destination.icon;
                const isSelected = selectedDestination === destination.id;
                return (
                  <div
                    key={destination.id}
                    className={
                      `flex items-center space-x-3 p-3 border rounded-lg transition-colors cursor-pointer ` +
                      (isSelected ? 'bg-yellow-50 border-monza-yellow' : 'hover:bg-gray-50')
                    }
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedDestination(destination.id)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedDestination(destination.id); } }}
                  >
                    <RadioGroupItem value={destination.id} id={destination.id} />
                    <div className="flex items-center space-x-3 flex-1">
                      <IconComponent className="h-5 w-5 text-monza-yellow" />
                      <div>
                        <Label htmlFor={destination.id} className="font-medium cursor-pointer">
                          {destination.label}
                        </Label>
                        <p className="text-sm text-gray-500">{destination.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about the move..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleMove} className="bg-monza-yellow hover:bg-monza-yellow/90 text-black">
            Move Car
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MoveCarDialog;
