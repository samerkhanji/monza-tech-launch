import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Car, MapPin, Package, Wrench } from 'lucide-react';
import { Car as CarType } from '@/pages/CarInventory/types';

interface DestinationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  foundCar: CarType | null;
  onDestinationSelect: (destination: string) => void;
}

const DestinationDialog: React.FC<DestinationDialogProps> = ({
  open,
  onOpenChange,
  foundCar,
  onDestinationSelect
}) => {
  const destinations = [
    {
      id: 'inventory',
      name: 'Car Inventory',
      description: 'Add to main inventory system',
      icon: Package,
      color: 'bg-blue-500'
    },
    {
      id: 'showroom',
      name: 'Showroom Display',
      description: 'Move to showroom for display',
      icon: Car,
      color: 'bg-green-500'
    },
    {
      id: 'garage',
      name: 'Garage/Repairs',
      description: 'Send to garage for maintenance',
      icon: Wrench,
      color: 'bg-orange-500'
    }
  ];

  const getStatusBadge = (status: string) => {
    const statusColors = {
      'in_stock': 'bg-green-100 text-green-800',
      'sold': 'bg-red-100 text-red-800',
      'reserved': 'bg-yellow-100 text-yellow-800'
    };
    return statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Select Destination for Vehicle
          </DialogTitle>
        </DialogHeader>
        
        {foundCar && (
          <div className="space-y-6">
            {/* Vehicle Information */}
            <div className="bg-slate-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3">Vehicle Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">VIN:</span> {foundCar.vinNumber}
                </div>
                <div>
                  <span className="font-medium">Model:</span> {foundCar.model}
                </div>
                <div>
                  <span className="font-medium">Color:</span> {foundCar.color}
                </div>
                <div>
                  <span className="font-medium">Year:</span> {foundCar.year}
                </div>
                <div>
                  <span className="font-medium">Category:</span> {foundCar.category}
                </div>
                <div>
                  <span className="font-medium">Status:</span> 
                  <Badge className={`ml-2 ${getStatusBadge(foundCar.status)}`}>
                    {foundCar.status}
                  </Badge>
                </div>
                {foundCar.batteryPercentage && (
                  <div>
                    <span className="font-medium">Battery:</span> {foundCar.batteryPercentage}%
                  </div>
                )}
                {foundCar.currentFloor && (
                  <div>
                    <span className="font-medium">Current Location:</span> {foundCar.currentFloor}
                  </div>
                )}
              </div>
            </div>

            {/* Destination Options */}
            <div>
              <h3 className="font-semibold mb-3">Choose Destination</h3>
              <div className="grid grid-cols-1 gap-3">
                {destinations.map((destination) => {
                  const Icon = destination.icon;
                  return (
                    <Button
                      key={destination.id}
                      variant="outline"
                      className="h-auto p-4 justify-start"
                      onClick={() => onDestinationSelect(destination.name)}
                    >
                      <div className={`w-10 h-10 rounded-full ${destination.color} flex items-center justify-center mr-3`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">{destination.name}</div>
                        <div className="text-sm text-muted-foreground">{destination.description}</div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DestinationDialog;
