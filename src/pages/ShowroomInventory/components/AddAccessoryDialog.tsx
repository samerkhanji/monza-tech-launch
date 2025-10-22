import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { InventoryItem, VehicleType } from '@/types/inventory';
import { safeParseInt } from '@/utils/errorHandling';

interface AddAccessoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddAccessory: (accessory: Omit<InventoryItem, 'id' | 'lastUpdated' | 'category'>) => void;
}

const AddAccessoryDialog: React.FC<AddAccessoryDialogProps> = ({
  isOpen,
  onClose,
  onAddAccessory
}) => {
  const [formData, setFormData] = useState({
    carModel: 'Voyah Dream',
    partName: '',
    partNumber: '',
    quantity: 1,
    shelf: '',
    column: '',
    row: '',
    room: '',
    floor: 'Floor 1' as 'Floor 1' | 'Floor 2' | 'Garage',
    supplier: 'DF' as 'DF' | 'AZ' | string,
    vehicleType: 'EV' as VehicleType
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newAccessory: Omit<InventoryItem, 'id' | 'lastUpdated' | 'category'> = {
      carModel: formData.carModel,
      partName: formData.partName,
      partNumber: formData.partNumber,
      quantity: formData.quantity,
      location: {
        shelf: formData.shelf,
        column: formData.column,
        row: formData.row,
        room: formData.room,
        floor: formData.floor
      },
      supplier: formData.supplier,
      vehicleType: formData.vehicleType,
      vin: '',
      pdiStatus: 'pending'
    };
    
    onAddAccessory(newAccessory);
    
    // Reset form
    setFormData({
      carModel: 'Voyah Dream',
      partName: '',
      partNumber: '',
      quantity: 1,
      shelf: '',
      column: '',
      row: '',
      room: '',
      floor: 'Floor 1',
      supplier: 'DF',
      vehicleType: 'EV'
    });
    
    onClose();
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const roomsByFloor = {
    'Floor 1': ['Display Storage', 'Customer Area', 'Waiting Room Storage'],
    'Floor 2': ['Premium Display', 'Executive Storage', 'VIP Lounge Storage'],
    'Garage': ['Tool Storage', 'Accessories Room', 'Parts Storage']
  };

  const voyahCarModels = [
    'Voyah Dream',
    'Voyah Free',
    'Voyah Passion', 
    'Voyah Free 318',
    'Mhero'
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Showroom Accessory</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="carModel">Car Model</Label>
              <select
                id="carModel"
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
                value={formData.carModel}
                onChange={(e) => handleInputChange('carModel', e.target.value)}
                required
              >
                {voyahCarModels.map(model => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            </div>
            
            <div>
              <Label htmlFor="vehicleType">Vehicle Type</Label>
              <select
                id="vehicleType"
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
                value={formData.vehicleType}
                onChange={(e) => handleInputChange('vehicleType', e.target.value)}
                required
              >
                <option value="EV">Electric Vehicle (EV)</option>
                <option value="Hybrid">Hybrid</option>
                <option value="ICE">Internal Combustion (ICE)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="partName">Accessory Name</Label>
              <Input
                id="partName"
                value={formData.partName}
                onChange={(e) => handleInputChange('partName', e.target.value)}
                placeholder="e.g., Floor Mats Premium"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="partNumber">Part Number</Label>
              <Input
                id="partNumber"
                value={formData.partNumber}
                onChange={(e) => handleInputChange('partNumber', e.target.value)}
                placeholder="e.g., TM3-FM-001"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', safeParseInt(e.target.value, 0))}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="supplier">Supplier</Label>
              <select
                id="supplier"
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
                value={formData.supplier}
                onChange={(e) => handleInputChange('supplier', e.target.value)}
                required
              >
                <option value="DF">Dong Feng (DF)</option>
                <option value="AZ">AutoZone (AZ)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="floor">Floor</Label>
              <select
                id="floor"
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
                value={formData.floor}
                onChange={(e) => handleInputChange('floor', e.target.value)}
                required
              >
                <option value="Floor 1">Floor 1</option>
                <option value="Floor 2">Floor 2</option>
                <option value="Garage">Garage</option>
              </select>
            </div>
            
            <div>
              <Label htmlFor="room">Room</Label>
              <select
                id="room"
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
                value={formData.room}
                onChange={(e) => handleInputChange('room', e.target.value)}
                required
              >
                <option value="">Select Room</option>
                {roomsByFloor[formData.floor].map(room => (
                  <option key={room} value={room}>{room}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="shelf">Shelf</Label>
              <Input
                id="shelf"
                value={formData.shelf}
                onChange={(e) => handleInputChange('shelf', e.target.value)}
                placeholder="e.g., A1"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="column">Column</Label>
              <Input
                id="column"
                value={formData.column}
                onChange={(e) => handleInputChange('column', e.target.value)}
                placeholder="e.g., 1"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="row">Row</Label>
              <Input
                id="row"
                value={formData.row}
                onChange={(e) => handleInputChange('row', e.target.value)}
                placeholder="e.g., 3"
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Add Accessory
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddAccessoryDialog;
