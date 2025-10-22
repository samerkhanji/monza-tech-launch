import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PartsInventoryItem } from '@/hooks/usePartsInventory';
import { safeParseFloat, safeParseInt } from '@/utils/errorHandling';

interface EditPartDialogProps {
  isOpen: boolean;
  onClose: () => void;
  part: PartsInventoryItem | null;
  onSave: (updates: Partial<PartsInventoryItem>) => void;
}

const EditPartDialog: React.FC<EditPartDialogProps> = ({
  isOpen,
  onClose,
  part,
  onSave
}) => {
  const [formData, setFormData] = useState<Partial<PartsInventoryItem>>({});

  // Reset form data when part changes or dialog opens
  useEffect(() => {
    if (part && isOpen) {
      console.log('🔍 EditPartDialog: Populating form with part data:', part);
      setFormData({
        car_model: part.car_model,
        oe_number: part.oe_number,
        product_name: part.product_name,
        quantity: part.quantity,
        order_date: part.order_date,
        source: part.source,
        storage_zone: part.storage_zone,
      });
    } else {
      // Clear form when no part or dialog closes
      setFormData({});
    }
  }, [part, isOpen]);

  const handleSave = () => {
    if (formData && part) {
      console.log('🔍 EditPartDialog: Saving updates:', formData);
      onSave(formData);
      onClose();
    }
  };

  const handleInputChange = (field: keyof PartsInventoryItem, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!part) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] dialog-content">
        <DialogHeader>
          <DialogTitle>Edit Part: {part.product_name}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="oe_number" className="text-right">OE Number</Label>
            <Input
              id="oe_number"
              value={formData.oe_number || ''}
              onChange={e => handleInputChange('oe_number', e.target.value)}
              className="col-span-3"
              readOnly
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="product_name" className="text-right">Product Name</Label>
            <Input
              id="product_name"
              value={formData.product_name || ''}
              onChange={e => handleInputChange('product_name', e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="car_model" className="text-right">Car Model</Label>
            <Input
              id="car_model"
              value={formData.car_model || ''}
              onChange={e => handleInputChange('car_model', e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="quantity" className="text-right">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              value={formData.quantity || 0}
              onChange={e => handleInputChange('quantity', parseInt(e.target.value) || 0)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="storage_zone" className="text-right">Storage Zone</Label>
            <Input
              id="storage_zone"
              value={formData.storage_zone || ''}
              onChange={e => handleInputChange('storage_zone', e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="source" className="text-right">Source</Label>
            <Input
              id="source"
              value={formData.source || ''}
              onChange={e => handleInputChange('source', e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="order_date" className="text-right">Order Date</Label>
            <Input
              id="order_date"
              type="date"
              value={formData.order_date || ''}
              onChange={e => handleInputChange('order_date', e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditPartDialog;