import React, { useState, useEffect } from 'react';
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

import { Car } from '../types';

interface EditCarDialogProps {
  car: Car;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<Car>) => void;
}

const EditCarDialog: React.FC<EditCarDialogProps> = ({
  car,
  isOpen,
  onClose,
  onSave,
}) => {
  const [editValues, setEditValues] = useState<Partial<Car>>({});

  useEffect(() => {
    // Initialize form state with car data when dialog opens
    setEditValues({
      color: car.color || '',
      notes: car.notes || '',
      category: car.category || 'EV',
      batteryPercentage: car.batteryPercentage || undefined,
      status: car.status || 'in_stock',

      brand: car.brand || '',
      customModelName: car.customModelName || '',

      sellingPrice: car.sellingPrice || undefined,
      model: car.model || '',
      year: car.year || undefined,
      customerRequirements: car.customerRequirements || '',
      shipmentCode: car.shipmentCode || '',
    });
  }, [car]);

  const handleInputChange = (field: keyof Partial<Car>, value: any) => {
    setEditValues(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave(editValues);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Edit Car: {car.model} ({car.vinNumber})</DialogTitle>

        </DialogHeader>
        <div className="grid gap-4 py-4 overflow-y-auto flex-1 pr-2">
          {/* Add form fields for all editable properties */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="brand" className="text-right">Brand</Label>
            <Input id="brand" value={editValues.brand || ''} onChange={(e) => handleInputChange('brand', e.target.value)} className="col-span-3" />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="model" className="text-right">Model</Label>
            <Input id="model" value={editValues.model || ''} onChange={(e) => handleInputChange('model', e.target.value)} className="col-span-3" />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="year" className="text-right">Year</Label>
            <Input id="year" type="number" value={editValues.year || ''} onChange={(e) => handleInputChange('year', parseInt(e.target.value) || undefined)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="color" className="text-right">Color</Label>
            <Input id="color" value={editValues.color || ''} onChange={(e) => handleInputChange('color', e.target.value)} className="col-span-3" />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">Category</Label>
            <Select value={editValues.category || 'EV'} onValueChange={(value: 'EV' | 'REV' | 'ICEV' | 'Other') => handleInputChange('category', value)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EV">EV</SelectItem>
                  <SelectItem value="REV">REV</SelectItem>
                  <SelectItem value="ICEV">ICEV</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="batteryPercentage" className="text-right">Battery %</Label>
            <Input id="batteryPercentage" type="number" min="0" max="100" value={editValues.batteryPercentage || ''} onChange={(e) => handleInputChange('batteryPercentage', parseInt(e.target.value) || undefined)} className="col-span-3" />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">Status</Label>
             <Select value={editValues.status || 'in_stock'} onValueChange={(value: 'in_stock' | 'sold' | 'reserved') => handleInputChange('status', value)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_stock">In Stock</SelectItem>
                  <SelectItem value="sold">Sold</SelectItem>
                  <SelectItem value="reserved">Reserved</SelectItem>
                </SelectContent>
              </Select>
          </div>
           

           
           {/* Selling Price - Available to all */}
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="sellingPrice" className="text-right">Selling Price</Label>
            <Input id="sellingPrice" type="number" step="0.01" value={editValues.sellingPrice || ''} onChange={(e) => handleInputChange('sellingPrice', parseFloat(e.target.value) || undefined)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="shipmentCode" className="text-right">Shipment Code</Label>
            <div className="col-span-3 flex gap-2">
              <Input 
                id="shipmentCode" 
                value={editValues.shipmentCode || ''} 
                onChange={(e) => handleInputChange('shipmentCode', e.target.value)} 
                placeholder="Enter shipment code"
                className="flex-1"
              />
              {editValues.shipmentCode && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (editValues.shipmentCode) {
                      window.open(`/shipping-eta?track=${encodeURIComponent(editValues.shipmentCode)}`, '_blank');
                    }
                  }}
                  className="px-3"
                  title="Track Shipment"
                >
                  Track
                </Button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="notes" className="text-right">Notes</Label>
            <Textarea id="notes" value={editValues.notes || ''} onChange={(e) => handleInputChange('notes', e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="customerRequirements" className="text-right">Customer Requirements</Label>
            <Textarea id="customerRequirements" value={editValues.customerRequirements || ''} onChange={(e) => handleInputChange('customerRequirements', e.target.value)} className="col-span-3" placeholder="Specific customer requirements or special requests..." />
          </div>

          {/* Conditional Client Information Section */}
          {editValues.status === 'sold' && (
            <div className="grid gap-4 py-4 border-t mt-4 pt-4 md:grid-cols-2">
              <h3 className="text-lg font-semibold col-span-full">Client Information (Sale)</h3>
               <div className="grid gap-2">
                <Label htmlFor="clientName">Client Name</Label>
                <Input id="clientName" value={editValues.clientName || ''} onChange={(e) => handleInputChange('clientName', e.target.value)} />
              </div>
               <div className="grid gap-2">
                <Label htmlFor="clientPhone">Client Phone</Label>
                <Input id="clientPhone" value={editValues.clientPhone || ''} onChange={(e) => handleInputChange('clientPhone', e.target.value)} />
              </div>
               <div className="grid gap-2">
                <Label htmlFor="clientEmail">Client Email</Label>
                <Input id="clientEmail" type="email" value={editValues.clientEmail || ''} onChange={(e) => handleInputChange('clientEmail', e.target.value)} />
              </div>
               <div className="grid gap-2">
                <Label htmlFor="clientLicensePlate">Client License Plate</Label>
                <Input id="clientLicensePlate" value={editValues.clientLicensePlate || ''} onChange={(e) => handleInputChange('clientLicensePlate', e.target.value)} />
              </div>
               <div className="grid gap-2 col-span-full">
                <Label htmlFor="clientAddress">Client Address</Label>
                <Textarea id="clientAddress" value={editValues.clientAddress || ''} onChange={(e) => handleInputChange('clientAddress', e.target.value)} rows={3} />
              </div>
            </div>
          )}

        </div>
        <DialogFooter className="flex-shrink-0 border-t pt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditCarDialog; 