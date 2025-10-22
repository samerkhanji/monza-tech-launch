import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MapPin, Building, Wrench, Package, Settings } from 'lucide-react';

interface OrderedCar {
  id: string;
  vin_number: string;
  model: string;
  brand: string;
  year: number;
  color: string;
  category: string;
  selling_price?: number;
}

interface OrderedCarMoveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  car: OrderedCar | null;
  onMoveCar: (destination: string) => void;
}

const OrderedCarMoveDialog: React.FC<OrderedCarMoveDialogProps> = ({ 
  isOpen, 
  onClose, 
  car, 
  onMoveCar 
}) => {
  if (!car) return null;

  const destinations = [
    { 
      value: 'floor1', 
      label: 'Showroom Floor 1', 
      icon: <Building className="h-4 w-4" />,
      description: 'Display on main showroom floor'
    },
    { 
      value: 'floor2', 
      label: 'Showroom Floor 2', 
      icon: <Building className="h-4 w-4" />,
      description: 'Display on second showroom floor'
    },
    { 
      value: 'garage', 
      label: 'Garage Inventory', 
      icon: <Wrench className="h-4 w-4" />,
      description: 'Store in garage for maintenance/prep'
    },
    { 
      value: 'garage-schedule', 
      label: 'Garage Schedule', 
      icon: <Settings className="h-4 w-4" />,
      description: 'Schedule for immediate service'
    },
    { 
      value: 'inventory', 
      label: 'Car Inventory', 
      icon: <Package className="h-4 w-4" />,
      description: 'Add to main inventory system'
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Move Car - {car.model}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><strong>VIN:</strong> {car.vin_number}</div>
              <div><strong>Model:</strong> {car.model}</div>
              <div><strong>Brand:</strong> {car.brand}</div>
              <div><strong>Year:</strong> {car.year}</div>
              <div><strong>Color:</strong> {car.color}</div>
              <div><strong>Category:</strong> {car.category}</div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Select destination:</p>
            <div className="space-y-2">
              {destinations.map((dest) => (
                <Button
                  key={dest.value}
                  variant="outline"
                  className="w-full justify-start h-auto p-4 hover:bg-blue-50 hover:border-blue-300"
                  onClick={() => onMoveCar(dest.value)}
                >
                  <div className="flex items-start gap-3 w-full">
                    <div className="text-blue-600 mt-0.5">
                      {dest.icon}
                    </div>
                    <div className="text-left">
                      <div className="font-medium">{dest.label}</div>
                      <div className="text-xs text-gray-500 mt-1">{dest.description}</div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
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

export default OrderedCarMoveDialog;