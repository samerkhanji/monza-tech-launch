
import React, { useState } from 'react';
import { Car } from '../types';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Car as CarIcon, QrCode } from 'lucide-react';

interface ShowroomToggleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  car: Car;
  onConfirm: (note: string, removeReason?: 'sold' | 'moved' | 'other') => void;
}

const ShowroomToggleDialog: React.FC<ShowroomToggleDialogProps> = ({
  isOpen,
  onClose,
  car,
  onConfirm
}) => {
  const [note, setNote] = useState(car.showroomNote || '');
  const [removeReason, setRemoveReason] = useState<'sold' | 'moved' | 'other'>('moved');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(note, car.inShowroom ? removeReason : undefined);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {car.inShowroom ? (
              <>
                <QrCode className="h-5 w-5 text-red-500" />
                Remove from Showroom
              </>
            ) : (
              <>
                <CarIcon className="h-5 w-5 text-green-500" />
                Move to Showroom
              </>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <div className="bg-slate-50 p-3 rounded-md">
                <div className="flex justify-between">
                  <span className="font-medium">{car.model} ({car.year})</span>
                  <span className="text-sm text-muted-foreground">VIN: {car.vinNumber}</span>
                </div>
                <div className="text-sm mt-1 flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: getColorHex(car.color) }}
                  ></div>
                  {car.color}
                </div>
              </div>
            </div>
            
            {car.inShowroom && (
              <div className="space-y-3">
                <Label>Reason for removal</Label>
                <RadioGroup value={removeReason} onValueChange={(value) => setRemoveReason(value as 'sold' | 'moved' | 'other')}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sold" id="sold" />
                    <Label htmlFor="sold">Car was sold</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="moved" id="moved" />
                    <Label htmlFor="moved">Move back to stock</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="other" id="other" />
                    <Label htmlFor="other">Other reason</Label>
                  </div>
                </RadioGroup>
                <div className="text-sm text-muted-foreground">
                  {removeReason === 'sold' && "Car status will be updated to 'sold' and location set to N/A"}
                  {removeReason === 'moved' && "Car will be moved back to stock with location 'In Stock'"}
                  {removeReason === 'other' && "Car will remain at current location"}
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="note">Note</Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={car.inShowroom 
                  ? "Reason for removing from showroom..." 
                  : "Reason for displaying in showroom..."
                }
                required
                className="min-h-[100px]"
              />
              <p className="text-sm text-muted-foreground">
                Please provide a reason for {car.inShowroom ? 'removing' : 'adding'} this vehicle 
                {car.inShowroom ? ' from' : ' to'} the showroom.
              </p>
            </div>
          </div>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button 
              type="submit" 
              variant={car.inShowroom ? "destructive" : "default"}
            >
              {car.inShowroom ? 'Remove from Showroom' : 'Move to Showroom'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Helper function to get color hex values
const getColorHex = (colorName: string): string => {
  const colorMap: Record<string, string> = {
    'Pearl White': '#FFFFFF',
    'Midnight Blue': '#145DA0',
    'Scarlet Red': '#FF2400',
    'Silver Frost': '#C0C0C0',
    'Obsidian Black': '#1A1A1A',
    'Electric Green': '#00FF00',
    'Desert Sand': '#EDC9AF',
    'Ocean Teal': '#0A7E8C',
  };
  return colorMap[colorName] || '#CCCCCC';
};

export default ShowroomToggleDialog;
