import React, { useState, useEffect } from 'react';
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

interface EditAccessoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  onSave: (updates: Partial<InventoryItem>) => void;
}

const EditAccessoryDialog: React.FC<EditAccessoryDialogProps> = ({
  isOpen,
  onClose,
  item,
  onSave
}) => {
  const [formData, setFormData] = useState({
    carModel: '',
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

  useEffect(() => {
    if (item) {
      setFormData({
        carModel: item.carModel,
        partName: item.partName,
        partNumber: item.partNumber,
        quantity: item.quantity,
        shelf: item.location.shelf,
        column: item.location.column,
        row: item.location.row,
        room: item.location.room || '',
        floor: item.location.floor,
        supplier: item.supplier || 'DF',
        vehicleType: item.vehicleType || 'EV'
      });
    }
  }, [item]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updates: Partial<InventoryItem> = {
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
      vehicleType: formData.vehicleType
    };
    
    onSave(updates);
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

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Accessory</DialogTitle>
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
                required
              />
            </div>
            
            <div>
              <Label htmlFor="partNumber">Part Number</Label>
              <Input
                id="partNumber"
                value={formData.partNumber}
                onChange={(e) => handleInputChange('partNumber', e.target.value)}
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
                onChange={(e) => handleInputChange('quantity', parseInt(e.target.value))}
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
                required
              />
            </div>
            
            <div>
              <Label htmlFor="column">Column</Label>
              <Input
                id="column"
                value={formData.column}
                onChange={(e) => handleInputChange('column', e.target.value)}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="row">Row</Label>
              <Input
                id="row"
                value={formData.row}
                onChange={(e) => handleInputChange('row', e.target.value)}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditAccessoryDialog;
