import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { ShowroomCar } from './ShowroomCar';

interface EditCarDialogProps {
  isOpen: boolean;
  onClose: () => void;
  car: ShowroomCar | null;
  onSave: (carId: string, updates: Partial<ShowroomCar>) => void;
}

export const EditCarDialog: React.FC<EditCarDialogProps> = ({
  isOpen,
  onClose,
  car,
  onSave
}) => {
  const [formData, setFormData] = useState({
    model: '',
    year: new Date().getFullYear(),
    color: '',
    interiorColor: '',
    price: 0,
    vinNumber: '',
    category: 'EV',
    batteryPercentage: 0,
    range: 0,
    kmDriven: 0,
    features: [] as string[],
  });

  useEffect(() => {
    if (car) {
      setFormData({
        model: car.model,
        year: car.year || new Date().getFullYear(),
        color: car.color,
        interiorColor: (car as any).interiorColor || '',
        price: car.price,
        vinNumber: (car as any).vinNumber || '',
        category: (car as any).category || 'EV',
        batteryPercentage: car.batteryPercentage || 0,
        range: (car as any).range || 0,
        kmDriven: (car as any).kmDriven || (car as any).kilometersDriven || 0,
        features: car.features || [],
      });
    }
  }, [car]);

  const handleSave = () => {
    if (!car) return;

    onSave(car.id, formData);
    onClose();
    toast({
      title: "Car Updated",
      description: "Car information has been successfully updated",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Car Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                value={formData.year}
                onChange={(e) => setFormData(prev => ({ ...prev, year: Number(e.target.value) }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vinNumber">VIN Number</Label>
            <Input
              id="vinNumber"
              value={formData.vinNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, vinNumber: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                value={formData.color}
                onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="interiorColor">Color interior</Label>
              <Input
                id="interiorColor"
                value={formData.interiorColor}
                onChange={(e) => setFormData(prev => ({ ...prev, interiorColor: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full h-10 rounded-none border border-input bg-background px-3 py-2"
            >
              <option value="EV">EV (Electric Vehicle)</option>
              <option value="REV">REV (Range Extended Vehicle)</option>
              <option value="ICEV">ICEV (Internal Combustion Engine)</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              type="number"
              value={formData.price}
              onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="battery">Battery %</Label>
              <Input
                id="battery"
                type="number"
                min="0"
                max="100"
                value={formData.batteryPercentage}
                onChange={(e) => setFormData(prev => ({ ...prev, batteryPercentage: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="range">Range Capacity (km)</Label>
              <Input
                id="range"
                type="number"
                min="0"
                value={formData.range}
                onChange={(e) => setFormData(prev => ({ ...prev, range: Number(e.target.value) }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="kmDriven">Km Driven</Label>
            <Input
              id="kmDriven"
              type="number"
              min="0"
              value={formData.kmDriven}
              onChange={(e) => setFormData(prev => ({ ...prev, kmDriven: Number(e.target.value) }))}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-monza-yellow text-monza-black hover:bg-monza-yellow/80">
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditCarDialog;
