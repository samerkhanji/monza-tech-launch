import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Car, Info } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface KilometersUpdateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  car: {
    id: string;
    vinNumber: string;
    model: string;
    year: number;
    currentKilometers?: number;
  } | null;
  onUpdate: (carId: string, kilometers: number) => void;
}

const KilometersUpdateDialog: React.FC<KilometersUpdateDialogProps> = ({
  isOpen,
  onClose,
  car,
  onUpdate
}) => {
  const [kilometers, setKilometers] = useState<string>('');

  useEffect(() => {
    if (car) {
      setKilometers(car.currentKilometers?.toString() || '0');
    }
  }, [car]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!car) return;

    const kilometersNum = parseInt(kilometers, 10);
    
    if (isNaN(kilometersNum) || kilometersNum < 0) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid number of kilometers (0 or greater).",
        variant: "destructive",
      });
      return;
    }

    onUpdate(car.id, kilometersNum);
    toast({
      title: "Kilometers Updated",
      description: `Updated ${car.model} (${car.vinNumber}) to ${kilometersNum} km driven.`,
    });
    onClose();
  };

  const handleClose = () => {
    setKilometers('');
    onClose();
  };

  if (!car) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            Update Kilometers Driven
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Car className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-900">{car.model} ({car.year})</span>
            </div>
            <p className="text-sm text-blue-700 font-mono">{car.vinNumber}</p>
          </div>

          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Depreciation Tracking</p>
                <p>This value tracks actual kilometers driven for depreciation calculations. Update when the vehicle is moved, test driven, or used.</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="kilometers" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Kilometers Driven
              </Label>
              <Input
                id="kilometers"
                type="number"
                min="0"
                value={kilometers}
                onChange={(e) => setKilometers(e.target.value)}
                placeholder="Enter kilometers driven"
                className="font-mono text-lg"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Update Kilometers
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default KilometersUpdateDialog; 