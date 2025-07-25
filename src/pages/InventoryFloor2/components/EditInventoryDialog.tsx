import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InventoryItem, VehicleType, Category } from '@/types/inventory';

type PdiStatus = 'pending' | 'in progress' | 'completed' | 'failed';

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
  const [formData, setFormData] = useState<Partial<InventoryItem & { pdiFile?: File | null }>>({});

  useEffect(() => {
    if (item) {
      setFormData({
        carModel: item.carModel,
        partName: item.partName,
        partNumber: item.partNumber,
        quantity: item.quantity,
        location: { ...item.location },
        supplier: item.supplier,
        vehicleType: item.vehicleType,
        category: item.category,
        vin: item.vin,
        pdiStatus: item.pdiStatus,
        pdiNotes: item.pdiNotes,
        pdiFile: undefined,
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
              onChange={e => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
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
          <div className="grid grid-cols-2 gap-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="shelf" className="text-right">Shelf</Label>
              <Input
                id="shelf"
                value={formData.location?.shelf || ''}
                onChange={e => handleLocationChange('shelf', e.target.value)}
                className="col-span-3"
                placeholder="P1, P2..."
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="column" className="text-right">Column</Label>
              <Input
                id="column"
                value={formData.location?.column || ''}
                onChange={e => handleLocationChange('column', e.target.value)}
                className="col-span-3"
                placeholder="1, 2, 3..."
              />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="row" className="text-right">Row</Label>
            <Input
              id="row"
              value={formData.location?.row || ''}
              onChange={e => handleLocationChange('row', e.target.value)}
              className="col-span-3"
              placeholder="1, 2, 3..."
            />
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
            <select
              id="category"
              className="col-span-3 border rounded px-2 py-1"
              value={formData.category || ''}
              onChange={e => setFormData(prev => ({ ...prev, category: e.target.value as Category }))}
              style={{ background: "#fff", color: "#000", borderColor: "#757575" }}
            >
              <option value="part">Part</option>
              <option value="accessory">Accessory</option>
            </select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="vin" className="text-right">VIN</Label>
            <Input
              id="vin"
              value={formData.vin || ''}
              onChange={e => setFormData(prev => ({ ...prev, vin: e.target.value }))}
              className="col-span-3"
              placeholder="Enter VIN"
            />
          </div>
          {/* --- PDI Section --- */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="pdiStatus" className="text-right">PDI Status</Label>
            <select
              id="pdiStatus"
              className="col-span-3 border rounded px-2 py-1"
              value={formData.pdiStatus || ''}
              onChange={e => setFormData(prev => ({ ...prev, pdiStatus: e.target.value as PdiStatus }))}
              style={{ background: "#fff", color: "#000", borderColor: "#757575" }}
            >
              <option value="pending">Pending</option>
              <option value="in progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="pdiNotes" className="text-right">PDI Notes</Label>
            <Input
              id="pdiNotes"
              value={formData.pdiNotes || ''}
              onChange={e => setFormData(prev => ({ ...prev, pdiNotes: e.target.value }))}
              className="col-span-3"
              placeholder="Enter PDI notes"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="pdiFile" className="text-right">PDI File</Label>
            <input
              id="pdiFile"
              type="file"
              accept=".pdf,image/*"
              className="col-span-3"
              onChange={e => {
                const file = e.target.files?.[0] || null;
                setFormData(prev => ({ ...prev, pdiFile: file }));
              }}
              style={{ background: "#fff", color: "#000" }}
            />
            {formData.pdiFile && (
              <div className="col-span-4 mt-2 text-xs text-green-700">
                Selected file: {formData.pdiFile.name}
              </div>
            )}
          </div>
          {/* --- End PDI Section --- */}
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
