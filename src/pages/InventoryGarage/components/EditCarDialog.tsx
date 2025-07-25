import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { InventoryItem } from '@/types/inventory';

interface EditCarDialogProps {
  isOpen: boolean;
  onClose: () => void;
  car: InventoryItem;
  onSave: (carId: string, updates: Partial<InventoryItem>) => void;
}

const EditCarDialog: React.FC<EditCarDialogProps> = ({
  isOpen,
  onClose,
  car,
  onSave
}) => {
  const [formData, setFormData] = useState({
    carModel: car.carModel,
    partName: car.partName,
    partNumber: car.partNumber,
    quantity: car.quantity,
    supplier: car.supplier || 'DF',
    notes: car.notes || '',
    exportCategory: car.exportCategory || 'Universal'
  });

  const handleSave = () => {
    onSave(car.id, formData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Part - {car.partName}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="carModel">Car Model</Label>
              <Input
                id="carModel"
                value={formData.carModel}
                onChange={(e) => setFormData({...formData, carModel: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="partName">Part Name</Label>
              <Input
                id="partName"
                value={formData.partName}
                onChange={(e) => setFormData({...formData, partName: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="partNumber">Part Number</Label>
              <Input
                id="partNumber"
                value={formData.partNumber}
                onChange={(e) => setFormData({...formData, partNumber: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 0})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="supplier">Supplier</Label>
              <Input
                id="supplier"
                value={formData.supplier}
                onChange={(e) => setFormData({...formData, supplier: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="exportCategory">Export Category</Label>
              <select
                id="exportCategory"
                value={formData.exportCategory}
                onChange={(e) => setFormData({...formData, exportCategory: e.target.value as any})}
                className="w-full h-10 px-3 border rounded-md"
              >
                <option value="Universal">Universal</option>
                <option value="EU">EU - European Export</option>
                <option value="REV">REV - Range Extended</option>
                <option value="ICEU">ICEU - ICE Universal</option>
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-blue-600 text-white hover:bg-blue-700">
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditCarDialog;
