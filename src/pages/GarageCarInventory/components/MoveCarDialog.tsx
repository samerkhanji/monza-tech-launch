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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Car, Building, Wrench, Package, Truck, Users, Home, ArrowRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

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
  onUpdateLocation: (carId: string, destination: string, specificLocation?: string, notes?: string) => void;
}

const MoveCarDialog: React.FC<MoveCarDialogProps> = ({
  isOpen,
  onClose,
  car,
  onUpdateLocation
}) => {
  const [selectedDestination, setSelectedDestination] = useState('');
  const [specificLocation, setSpecificLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [moveReason, setMoveReason] = useState('');

  // Company-wide destinations
  const destinations = [
    {
      id: 'garage',
      name: 'Garage (Internal Move)',
      icon: Wrench,
      description: 'Move within garage locations',
      color: 'bg-orange-100 text-orange-800 border-orange-200',
      locations: [
        'Bay 1', 'Bay 2', 'Bay 3', 'Bay 4', 'Bay 5',
        'Lift 1', 'Lift 2', 'Wash Bay', 'Prep Area',
        'Storage Area A', 'Storage Area B', 'Outdoor Lot'
      ]
    },
    {
      id: 'showroom-floor1',
      name: 'Showroom Floor 1',
      icon: Building,
      description: 'Display area for customer viewing',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      locations: [
        'Front Display', 'Center Display', 'Premium Section',
        'Test Drive Area', 'Customer Lounge Area'
      ]
    },
    {
      id: 'showroom-floor2',
      name: 'Showroom Floor 2',
      icon: Building,
      description: 'Secondary display area',
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      locations: [
        'Main Display', 'VIP Section', 'Comparison Area',
        'Interactive Zone', 'Private Viewing Room'
      ]
    },
    {
      id: 'inventory',
      name: 'Main Car Inventory',
      icon: Package,
      description: 'General inventory storage',
      color: 'bg-green-100 text-green-800 border-green-200',
      locations: [
        'Section A', 'Section B', 'Section C', 'Section D',
        'Priority Storage', 'Quick Access Area'
      ]
    },
    {
      id: 'new-arrivals',
      name: 'New Car Arrivals',
      icon: Truck,
      description: 'Recently arrived vehicles',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      locations: [
        'Inspection Bay', 'Documentation Area', 'Staging Area',
        'Quality Check Zone', 'Processing Queue'
      ]
    },
    {
      id: 'customer-delivery',
      name: 'Customer Delivery Area',
      icon: Users,
      description: 'Ready for customer pickup',
      color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      locations: [
        'Delivery Bay 1', 'Delivery Bay 2', 'Handover Area',
        'Final Prep Zone', 'Customer Parking'
      ]
    },
    {
      id: 'external-location',
      name: 'External Location',
      icon: Home,
      description: 'Off-site storage or partner location',
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      locations: [
        'Partner Garage', 'External Storage', 'Transport Hub',
        'Specialist Service Center', 'Custom Location'
      ]
    }
  ];

  const moveReasons = [
    'Customer Request',
    'Display Change',
    'Maintenance Required',
    'Repair Needed',
    'PDI Completion',
    'Sale Preparation',
    'Storage Optimization',
    'Quality Issue',
    'Inventory Management',
    'Customer Delivery',
    'Test Drive Preparation',
    'Documentation Update',
    'Other'
  ];

  const selectedDestinationData = destinations.find(d => d.id === selectedDestination);

  const handleSubmit = () => {
    if (!selectedDestination) {
      toast({
        title: "Destination Required",
        description: "Please select a destination for the car.",
        variant: "destructive"
      });
      return;
    }

    if (!specificLocation && selectedDestinationData?.locations) {
      toast({
        title: "Specific Location Required",
        description: "Please select a specific location within the destination.",
        variant: "destructive"
      });
      return;
    }

    if (!moveReason) {
      toast({
        title: "Reason Required",
        description: "Please specify the reason for moving the car.",
        variant: "destructive"
      });
      return;
    }

    const moveNotes = `${notes} - Moved from Garage to ${selectedDestinationData?.name}${specificLocation ? ` (${specificLocation})` : ''} - Reason: ${moveReason} - Date: ${new Date().toLocaleDateString()}`.trim();
    
    onUpdateLocation(car.id, selectedDestination, specificLocation, moveNotes);
    onClose();
  };

  const handleClose = () => {
    setSelectedDestination('');
    setSpecificLocation('');
    setNotes('');
    setMoveReason('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Move Car Throughout Company
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          {/* Current Car Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Car className="h-5 w-5" />
                Current Vehicle
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Model</Label>
                  <div className="font-medium">{car.model}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">VIN</Label>
                  <div className="font-mono text-sm">{car.vinNumber}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Color</Label>
                  <div>{car.color}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Current Location</Label>
                  <Badge variant="outline" className="bg-orange-100 text-orange-800">
                    Garage - {car.garageLocation || 'Bay 1'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Destination Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Select Destination</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                {destinations.map((destination) => {
                  const Icon = destination.icon;
                  return (
                    <div
                      key={destination.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        selectedDestination === destination.id
                          ? 'border-monza-yellow bg-monza-yellow/5 ring-2 ring-monza-yellow/20'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => {
                        setSelectedDestination(destination.id);
                        setSpecificLocation('');
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-gray-600" />
                        <div className="flex-1">
                          <div className="font-medium">{destination.name}</div>
                          <div className="text-sm text-gray-600">{destination.description}</div>
                        </div>
                        <Badge variant="outline" className={destination.color}>
                          {destination.locations ? `${destination.locations.length} locations` : 'Available'}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Specific Location Selection */}
          {selectedDestinationData?.locations && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ArrowRight className="h-5 w-5" />
                  Specific Location in {selectedDestinationData.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={specificLocation} onValueChange={setSpecificLocation}>
                  <SelectTrigger>
                    <SelectValue placeholder={`Select location in ${selectedDestinationData.name}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedDestinationData.locations.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          )}

          {/* Move Reason */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Reason for Move</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={moveReason} onValueChange={setMoveReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason for moving the car" />
                </SelectTrigger>
                <SelectContent>
                  {moveReasons.map((reason) => (
                    <SelectItem key={reason} value={reason}>
                      {reason}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Additional Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Additional Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes about this move (optional)..."
                rows={3}
              />
            </CardContent>
          </Card>

          {/* Move Summary */}
          {selectedDestination && (
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg text-blue-800">Move Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">From:</span>
                    <Badge variant="outline" className="bg-orange-100 text-orange-800">
                      Garage - {car.garageLocation || 'Bay 1'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">To:</span>
                    <Badge variant="outline" className={selectedDestinationData?.color}>
                      {selectedDestinationData?.name}
                      {specificLocation && ` - ${specificLocation}`}
                    </Badge>
                  </div>
                  {moveReason && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Reason:</span>
                      <span>{moveReason}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="flex-shrink-0 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            className="bg-monza-yellow text-monza-black hover:bg-monza-yellow/80"
          >
            Move Car
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MoveCarDialog; 