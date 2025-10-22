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
import { toast } from '@/hooks/use-toast';
import { safeParseInt } from '@/utils/errorHandling';

interface ManualCarAddDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (carData: any) => void;
}

const ManualCarAddDialog: React.FC<ManualCarAddDialogProps> = ({
  isOpen,
  onClose,
  onAdd
}) => {
  const [formData, setFormData] = useState({
    vinNumber: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    price: 0,
    batteryPercentage: 100,
    range: 0,
    features: ''
  });

  const handleSubmit = () => {
    if (!formData.vinNumber || !formData.model || !formData.color) {
      toast({
        title: "Missing Information",
        description: "Please fill in VIN, model, and color",
        variant: "destructive"
      });
      return;
    }

    const carData = {
      ...formData,
      features: formData.features.split(',').map(f => f.trim()).filter(f => f)
    };

    onAdd(carData);
    setFormData({
      vinNumber: '',
      model: '',
      year: new Date().getFullYear(),
      color: '',
      price: 0,
      batteryPercentage: 100,
      range: 0,
      features: ''
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Car Manually to Floor 2</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="vin">VIN Number *</Label>
            <Input
              id="vin"
              value={formData.vinNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, vinNumber: e.target.value }))}
              placeholder="Enter VIN number"
            />
          </div>
          
          <div>
            <Label htmlFor="model">Model *</Label>
            <Input
              id="model"
              value={formData.model}
              onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
              placeholder="Enter car model"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                value={formData.year}
                onChange={(e) => setFormData(prev => ({ ...prev, year: safeParseInt(e.target.value, 2024) }))}
              />
            </div>
            <div>
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: safeParseInt(e.target.value, 0) }))}
                placeholder="Enter price"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="color">Color *</Label>
            <Input
              id="color"
              value={formData.color}
              onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
              placeholder="Enter car color"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="battery">Battery %</Label>
              <Input
                id="battery"
                type="number"
                min="0"
                max="100"
                value={formData.batteryPercentage}
                onChange={(e) => setFormData(prev => ({ ...prev, batteryPercentage: safeParseInt(e.target.value, 85) }))}
              />
            </div>
            <div>
              <Label htmlFor="range">Range (km)</Label>
              <Input
                id="range"
                type="number"
                value={formData.range}
                onChange={(e) => setFormData(prev => ({ ...prev, range: safeParseInt(e.target.value, 520) }))}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="features">Features (comma-separated)</Label>
            <Textarea
              id="features"
              value={formData.features}
              onChange={(e) => setFormData(prev => ({ ...prev, features: e.target.value }))}
              placeholder="Enter features separated by commas"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">
            Add Car
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ManualCarAddDialog;
