import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InventoryItem, VehicleType, Category } from '@/types/inventory';
import { safeParseInt } from '@/utils/errorHandling';

interface EditInventoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  onSave: (updates: Partial<InventoryItem>) => void;
  floor: string;
}

const EditInventoryDialog: React.FC<EditInventoryDialogProps> = ({
  isOpen,
  onClose,
  item,
  onSave,
  floor
}) => {
  const [formData, setFormData] = useState<Partial<InventoryItem>>({});

  useEffect(() => {
    if (item) {
      setFormData({
        carModel: item.carModel,
        partName: item.partName,
        partNumber: item.partNumber,
        quantity: item.quantity,
        location: { 
          room: item.location?.room || ''
        },
        supplier: item.supplier,
        vehicleType: item.vehicleType,
        category: item.category,
      });
    }
  }, [item]);

  const handleSave = () => {
    if (formData) {
      onSave(formData);
      onClose();
    }
  };

  const handleLocationChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location!,
        [field]: value
      }
    }));
  };

  if (!item) return null;

  const roomOptions = floor === 'Floor 2'
    ? ['Premium Display', 'Executive Storage', 'VIP Lounge Storage']
    : ['Main Storage', 'Quick Access', 'Overflow'];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] dialog-content">
        <DialogHeader>
          <DialogTitle>Edit Inventory Item</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="carModel" className="text-right">Car Model</Label>
            <Input
              id="carModel"
              value={formData.carModel || ''}
              onChange={e => setFormData(prev => ({ ...prev, carModel: e.target.value }))}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="partName" className="text-right">Part Name</Label>
            <Input
              id="partName"
              value={formData.partName || ''}
              onChange={e => setFormData(prev => ({ ...prev, partName: e.target.value }))}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="partNumber" className="text-right">Part Number</Label>
            <Input
              id="partNumber"
              value={formData.partNumber || ''}
              onChange={e => setFormData(prev => ({ ...prev, partNumber: e.target.value }))}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="quantity" className="text-right">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              value={formData.quantity || 0}
              onChange={e => setFormData(prev => ({ ...prev, quantity: safeParseInt(e.target.value, 0) }))}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="room" className="text-right">Room</Label>
            <select
              id="room"
              className="col-span-3 border rounded px-2 py-1"
              value={formData.location?.room || ''}
              onChange={e => handleLocationChange('room', e.target.value)}
              style={{ background: "#fff", color: "#000", borderColor: "#757575" }}
            >
              <option value="">Select room</option>
              {roomOptions.map(room => (
                <option key={room} value={room}>{room}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="supplier" className="text-right">Supplier</Label>
            <Input
              id="supplier"
              value={formData.supplier || ''}
              onChange={e => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
              className="col-span-3"
              placeholder="e.g., DF, AZ, ..."
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="vehicleType" className="text-right">Vehicle Type</Label>
            <select
              id="vehicleType"
              className="col-span-3 border rounded px-2 py-1"
              value={formData.vehicleType || ''}
              onChange={e => setFormData(prev => ({ ...prev, vehicleType: e.target.value as VehicleType }))}
              style={{ background: "#fff", color: "#000", borderColor: "#757575" }}
            >
              <option value="EV">Electric Vehicle (EV)</option>
              <option value="REV">Range Extended EV (REV)</option>
              <option value="ICEV">Internal Combustion (ICEV)</option>
            </select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">Category</Label>
            <Input
              id="category"
              className="col-span-3"
              value={formData.category || ''}
              onChange={e => setFormData(prev => ({ ...prev, category: e.target.value as Category }))}
              placeholder="Enter category (e.g., part, accessory)"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            style={{ borderColor: "#757575", color: "#424242" }}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            style={{ background: "#FFCB05", color: "#000", border: "none" }}
            onClick={handleSave}
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditInventoryDialog;
