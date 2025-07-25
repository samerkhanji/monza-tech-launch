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
    color: '',
    price: 0,
    batteryPercentage: 0,
    features: [] as string[],

  });

  useEffect(() => {
    if (car) {
      setFormData({
        model: car.model,
        color: car.color,
        price: car.price,
        batteryPercentage: car.batteryPercentage || 0,
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
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Input
              id="model"
              value={formData.model}
              onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <Input
              id="color"
              value={formData.color}
              onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
            />
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

          <div className="space-y-2">
            <Label htmlFor="battery">Battery Percentage</Label>
            <Input
              id="battery"
              type="number"
              min="0"
              max="100"
              value={formData.batteryPercentage}
              onChange={(e) => setFormData(prev => ({ ...prev, batteryPercentage: Number(e.target.value) }))}
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
