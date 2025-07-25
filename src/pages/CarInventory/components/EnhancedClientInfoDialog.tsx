
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
import { toast } from '@/hooks/use-toast';
import { Car } from '../types';

interface EnhancedClientInfoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  car: Car;
  onSave: (carId: string, clientInfo: {
    clientName: string;
    clientPhone: string;
    clientEmail: string;
    clientAddress: string;
    clientLicensePlate: string;
    status: 'reserved' | 'sold';
    reservedDate?: string;
    soldDate?: string;
  }) => void;
}

export const EnhancedClientInfoDialog: React.FC<EnhancedClientInfoDialogProps> = ({
  isOpen,
  onClose,
  car,
  onSave
}) => {
  const [clientName, setClientName] = useState(car.clientName || '');
  const [clientPhone, setClientPhone] = useState(car.clientPhone || '');
  const [clientEmail, setClientEmail] = useState(car.clientEmail || '');
  const [clientAddress, setClientAddress] = useState(car.clientAddress || '');
  const [clientLicensePlate, setClientLicensePlate] = useState(car.clientLicensePlate || '');
  const [status, setStatus] = useState<'reserved' | 'sold'>(car.status === 'sold' ? 'sold' : 'reserved');

  const handleSubmit = () => {
    if (!clientName.trim() || !clientPhone.trim()) {
      toast({
        title: "Error",
        description: "Client name and phone are required fields.",
        variant: "destructive"
      });
      return;
    }

    const clientInfo = {
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      clientEmail: clientEmail.trim(),
      clientAddress: clientAddress.trim(),
      clientLicensePlate: clientLicensePlate.trim(),
      status,
      ...(status === 'reserved' ? { reservedDate: new Date().toISOString() } : {}),
      ...(status === 'sold' ? { soldDate: new Date().toISOString() } : {})
    };

    onSave(car.id, clientInfo);
    
    toast({
      title: "Client Information Saved",
      description: `Client information for ${car.model} has been ${status === 'sold' ? 'updated with sale details' : 'saved for reservation'}.`,
    });

    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {status === 'sold' ? 'Sale Information' : 'Reservation Information'} - {car.model}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-sm"><strong>VIN:</strong> {car.vinNumber}</p>
            <p className="text-sm"><strong>Model:</strong> {car.model}</p>
            <p className="text-sm"><strong>Color:</strong> {car.color}</p>
            <p className="text-sm"><strong>Current Status:</strong> {car.status}</p>
          </div>

          <div className="space-y-2">
            <Label>Transaction Type *</Label>
            <Select value={status} onValueChange={(value: 'reserved' | 'sold') => setStatus(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reserved">Reserve Car</SelectItem>
                <SelectItem value="sold">Sell Car</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientName">Client Name *</Label>
            <Input
              id="clientName"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Enter client full name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientPhone">Client Phone *</Label>
            <Input
              id="clientPhone"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              placeholder="Enter client phone number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientEmail">Client Email</Label>
            <Input
              id="clientEmail"
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder="Enter client email address"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientAddress">Client Address</Label>
            <Textarea
              id="clientAddress"
              value={clientAddress}
              onChange={(e) => setClientAddress(e.target.value)}
              placeholder="Enter client address"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientLicensePlate">Client License Plate</Label>
            <Input
              id="clientLicensePlate"
              value={clientLicensePlate}
              onChange={(e) => setClientLicensePlate(e.target.value)}
              placeholder="Enter client license plate number"
            />
          </div>

          {status === 'sold' && (
            <div className="bg-green-50 p-3 rounded">
              <p className="text-sm text-green-800">
                <strong>Sale Date:</strong> {new Date().toLocaleDateString()}
              </p>
              <p className="text-sm text-green-700">
                This car will be marked as sold and removed from inventory.
              </p>
            </div>
          )}

          {status === 'reserved' && (
            <div className="bg-blue-50 p-3 rounded">
              <p className="text-sm text-blue-800">
                <strong>Reservation Date:</strong> {new Date().toLocaleDateString()}
              </p>
              <p className="text-sm text-blue-700">
                This car will be marked as reserved for the client.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {status === 'sold' ? 'Complete Sale' : 'Reserve Car'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
