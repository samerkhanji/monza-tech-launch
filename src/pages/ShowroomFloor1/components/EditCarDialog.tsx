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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface EditCarDialogProps {
  isOpen: boolean;
  onClose: () => void;
  car: any;
  onSave: (carId: string, updates: any) => void;
}

const EditCarDialog: React.FC<EditCarDialogProps> = ({
  isOpen,
  onClose,
  car,
  onSave,
}) => {
  const [editedCar, setEditedCar] = useState({ ...car });

  const handleSave = () => {
    onSave(car.id, editedCar);
    onClose();
  };

  const updateField = (field: string, value: any) => {
    setEditedCar(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Car Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                value={editedCar.model}
                onChange={(e) => updateField('model', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                value={editedCar.year}
                onChange={(e) => updateField('year', parseInt(e.target.value))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                value={editedCar.color}
                onChange={(e) => updateField('color', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="number"
                value={editedCar.price}
                onChange={(e) => updateField('price', parseInt(e.target.value))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="vin">VIN Number</Label>
            <Input
              id="vin"
              value={editedCar.vinNumber}
              onChange={(e) => updateField('vinNumber', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="battery">Battery Percentage</Label>
              <Input
                id="battery"
                type="number"
                min="0"
                max="100"
                value={editedCar.batteryPercentage || ''}
                onChange={(e) => updateField('batteryPercentage', parseInt(e.target.value) || undefined)}
              />
            </div>
            <div>
              <Label htmlFor="range">Range (km)</Label>
              <Input
                id="range"
                type="number"
                value={editedCar.range || ''}
                onChange={(e) => updateField('range', parseInt(e.target.value) || undefined)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={editedCar.status || 'available'} onValueChange={(value) => updateField('status', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="reserved">Reserved</SelectItem>
                <SelectItem value="sold">Sold</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={editedCar.category || 'EV'} onValueChange={(value) => updateField('category', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EV">EV (Electric Vehicle)</SelectItem>
                <SelectItem value="REV">REV (Range Extended Vehicle)</SelectItem>
                <SelectItem value="ICEV">ICEV (Internal Combustion Engine)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="features">Features (comma-separated)</Label>
            <Textarea
              id="features"
              value={editedCar.features?.join(', ') || ''}
              onChange={(e) => updateField('features', e.target.value.split(',').map(f => f.trim()))}
              placeholder="Enter features separated by commas"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-monza-yellow hover:bg-monza-yellow/90 text-black">
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditCarDialog;
