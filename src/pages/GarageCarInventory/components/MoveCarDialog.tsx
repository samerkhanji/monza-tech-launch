import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Building, Package, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GarageCar {
  id: string;
  model: string;
  vinNumber?: string;
  color: string;
  garageLocation?: string;
  garageNotes?: string;
  garageStatus?: 'stored' | 'in_repair' | 'ready_for_pickup' | 'awaiting_parts';
}

interface MoveCarDialogProps {
  isOpen: boolean;
  onClose: () => void;
  car: GarageCar;
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
  const { toast } = useToast();

  // Exclude current table (garage) and disallow moving to New Arrivals from existing tables
  const destinations = [
    {
      id: 'floor1',
      label: 'Showroom Floor 1',
      description: 'Move to main showroom floor 1',
      icon: Building
    },
    {
      id: 'floor2',
      label: 'Showroom Floor 2',
      description: 'Move to luxury showroom floor 2',
      icon: Building
    },
    {
      id: 'inventory',
      label: 'Car Inventory',
      description: 'Move to main car inventory storage',
      icon: Package
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
        title: "Error",
        description: "Please select a destination.",
        variant: "destructive"
      });
      return;
    }

    onMoveCar(selectedDestination, notes);
    
    const destination = destinations.find(d => d.id === selectedDestination);
    toast({
      title: "Car Moved",
      description: `${car.model} has been moved to ${destination?.label}.`,
    });

    onClose();
    setSelectedDestination('');
    setNotes('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Move Car - {car?.model}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-sm"><strong>VIN:</strong> {car?.vinNumber}</p>
            <p className="text-sm"><strong>Model:</strong> {car?.model}</p>
            <p className="text-sm"><strong>Color:</strong> {car?.color}</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Select destination:</p>
            {destinations.map((dest) => (
              <Button
                key={dest.id}
                variant="outline"
                className="w-full justify-start"
                onClick={() => onMoveCar(dest.id)}
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