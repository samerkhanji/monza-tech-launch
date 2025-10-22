// Garage Workflow Manager
// Handles car movement and status updates when garage work is completed

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { 
  Car, 
  Wrench, 
  CheckCircle, 
  ArrowRight, 
  MapPin, 
  User,
  Calendar,
  Clock,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { CarInventoryService } from '@/services/carInventoryService';

interface GarageWorkflowManagerProps {
  isOpen: boolean;
  onClose: () => void;
  completedCar?: any;
}

const GarageWorkflowManager: React.FC<GarageWorkflowManagerProps> = ({
  isOpen,
  onClose,
  completedCar
}) => {
  const [selectedDestination, setSelectedDestination] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('in_stock');
  const [clientInfo, setClientInfo] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  });
  const [workNotes, setWorkNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedDestination('');
      setSelectedStatus('in_stock');
      setClientInfo({ name: '', phone: '', email: '', address: '' });
      setWorkNotes('');
    }
  }, [isOpen]);

  // Available destinations
  const destinations = [
    { value: 'Showroom Floor 1', label: 'Showroom Floor 1', description: 'Display for customers' },
    { value: 'Showroom Floor 2', label: 'Showroom Floor 2', description: 'Additional display area' },
    { value: 'Inventory', label: 'Inventory Storage', description: 'Back storage area' },
    { value: 'Inventory Floor 2', label: 'Inventory Floor 2', description: 'Secondary storage' },
    { value: 'Delivery Lot', label: 'Delivery Lot', description: 'Ready for customer pickup' },
    { value: 'Test Drive', label: 'Test Drive Area', description: 'Available for test drives' },
    { value: 'External Location', label: 'External Location', description: 'Off-site location' }
  ];

  // Available statuses
  const statuses = [
    { value: 'in_stock', label: 'In Stock', description: 'Available for sale' },
    { value: 'reserved', label: 'Reserved', description: 'Reserved for customer' },
    { value: 'sold', label: 'Sold', description: 'Car has been sold' }
  ];

  // Handle workflow completion
  const handleWorkflowComplete = async () => {
    if (!completedCar || !selectedDestination) {
      toast({
        title: "Missing Information",
        description: "Please select a destination for the car",
        variant: "destructive"
      });
      return;
    }

    if (selectedStatus === 'reserved' || selectedStatus === 'sold') {
      if (!clientInfo.name || !clientInfo.phone) {
        toast({
          title: "Missing Client Information",
          description: "Please provide client name and phone for reserved/sold cars",
          variant: "destructive"
        });
        return;
      }
    }

    setIsProcessing(true);

    try {
      // Get current data from localStorage
      const carInventoryData = JSON.parse(localStorage.getItem('carInventory') || '[]');
      const carIndex = carInventoryData.findIndex((car: any) => 
        car.id === completedCar.id || 
        car.carCode === completedCar.carCode ||
        car.vinNumber === completedCar.vinNumber
      );

      if (carIndex === -1) {
        throw new Error('Car not found in inventory');
      }

      // Update car with new information
      const updatedCar = {
        ...carInventoryData[carIndex],
        currentFloor: selectedDestination,
        status: selectedStatus,
        lastUpdated: new Date().toISOString(),
        workCompleted: true,
        workCompletionDate: new Date().toISOString(),
        workNotes: workNotes,
        moveHistory: [
          ...(carInventoryData[carIndex].moveHistory || []),
          {
            from: 'Garage',
            to: selectedDestination,
            date: new Date().toISOString(),
            reason: 'Work completed',
            notes: workNotes
          }
        ]
      };

      // Add client information if car is reserved or sold
      if (selectedStatus === 'reserved' || selectedStatus === 'sold') {
        updatedCar.clientName = clientInfo.name;
        updatedCar.clientPhone = clientInfo.phone;
        updatedCar.clientEmail = clientInfo.email;
        updatedCar.clientAddress = clientInfo.address;
        
        if (selectedStatus === 'sold') {
          updatedCar.soldDate = new Date().toISOString();
        } else if (selectedStatus === 'reserved') {
          updatedCar.reservedDate = new Date().toISOString();
        }
      }

      // Update car in inventory
      carInventoryData[carIndex] = updatedCar;
      localStorage.setItem('carInventory', JSON.stringify(carInventoryData));

      // Remove car from garage schedule
      const garageScheduleData = JSON.parse(localStorage.getItem('garageSchedule') || '[]');
      const updatedSchedule = garageScheduleData.filter((item: any) => 
        item.carId !== completedCar.id && 
        item.carCode !== completedCar.carCode
      );
      localStorage.setItem('garageSchedule', JSON.stringify(updatedSchedule));

      // Add activity log
      const activityLogs = JSON.parse(localStorage.getItem('activityLogs') || '[]');
      const newActivity = {
        id: `activity_${Date.now()}_${completedCar.id}`,
        timestamp: new Date().toISOString(),
        action: 'garage_work_completed',
        itemId: completedCar.id,
        itemType: 'car',
        description: `Work completed on ${completedCar.brand} ${completedCar.carModel}. Moved to ${selectedDestination} with status: ${selectedStatus}`,
        userId: 'employee',
        changes: {
          destination: selectedDestination,
          status: selectedStatus,
          workNotes: workNotes
        }
      };
      activityLogs.push(newActivity);
      localStorage.setItem('activityLogs', JSON.stringify(activityLogs));

      toast({
        title: "Work Completed Successfully",
        description: `${completedCar.model} moved to ${selectedDestination} with status: ${selectedStatus}`,
      });

      onClose();

    } catch (error) {
      console.error('Error completing workflow:', error);
      toast({
        title: "Error",
        description: "Failed to complete workflow. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock': return 'bg-green-100 text-green-800';
      case 'reserved': return 'bg-yellow-100 text-yellow-800';
      case 'sold': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get destination color
  const getDestinationColor = (destination: string) => {
    switch (destination) {
      case 'Showroom Floor 1': return 'bg-purple-100 text-purple-800';
      case 'Showroom Floor 2': return 'bg-purple-100 text-purple-800';
      case 'Inventory': return 'bg-orange-100 text-orange-800';
      case 'Inventory Floor 2': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!completedCar) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Complete Garage Work
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Car Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-4 w-4" />
                Car Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Car</Label>
                  <p className="text-sm text-muted-foreground">
                    {completedCar.brand} {completedCar.model}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">VIN</Label>
                  <p className="text-sm text-muted-foreground">
                    {completedCar.vinNumber}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Current Location</Label>
                  <Badge variant="secondary">Garage</Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Work Type</Label>
                  <p className="text-sm text-muted-foreground">
                    {completedCar.workType || 'General Service'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Destination Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Where should the car go?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="destination">Destination</Label>
                  <Select value={selectedDestination} onValueChange={setSelectedDestination}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select destination" />
                    </SelectTrigger>
                    <SelectContent>
                      {destinations.map(dest => (
                        <SelectItem key={dest.value} value={dest.value}>
                          <div className="flex flex-col">
                            <span>{dest.label}</span>
                            <span className="text-xs text-muted-foreground">{dest.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedDestination && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <ArrowRight className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">Car will be moved to:</span>
                      <Badge className={getDestinationColor(selectedDestination)}>
                        {selectedDestination}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Status Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Car Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map(status => (
                        <SelectItem key={status.value} value={status.value}>
                          <div className="flex flex-col">
                            <span>{status.label}</span>
                            <span className="text-xs text-muted-foreground">{status.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedStatus && (
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">Car status will be:</span>
                      <Badge className={getStatusColor(selectedStatus)}>
                        {statuses.find(s => s.value === selectedStatus)?.label}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Client Information (for reserved/sold) */}
          {(selectedStatus === 'reserved' || selectedStatus === 'sold') && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Client Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="clientName">Client Name *</Label>
                    <Input
                      id="clientName"
                      value={clientInfo.name}
                      onChange={(e) => setClientInfo(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter client name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="clientPhone">Phone *</Label>
                    <Input
                      id="clientPhone"
                      value={clientInfo.phone}
                      onChange={(e) => setClientInfo(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="clientEmail">Email</Label>
                    <Input
                      id="clientEmail"
                      value={clientInfo.email}
                      onChange={(e) => setClientInfo(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter email address"
                    />
                  </div>
                  <div>
                    <Label htmlFor="clientAddress">Address</Label>
                    <Input
                      id="clientAddress"
                      value={clientInfo.address}
                      onChange={(e) => setClientInfo(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Enter address"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Work Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Work Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="workNotes">Notes about completed work</Label>
                <Textarea
                  id="workNotes"
                  value={workNotes}
                  onChange={(e) => setWorkNotes(e.target.value)}
                  placeholder="Describe the work that was completed..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} disabled={isProcessing}>
              Cancel
            </Button>
            <Button 
              onClick={handleWorkflowComplete} 
              disabled={isProcessing || !selectedDestination}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? 'Processing...' : 'Complete Work'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GarageWorkflowManager; 