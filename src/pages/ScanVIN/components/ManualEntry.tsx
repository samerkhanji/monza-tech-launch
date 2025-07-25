
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Camera } from 'lucide-react';

interface ManualEntryProps {
  manualVIN: string;
  onVINChange: (vin: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  vehicleCategory?: 'EV' | 'REV';
  onCategoryChange?: (category: 'EV' | 'REV') => void;
}

const ManualEntry: React.FC<ManualEntryProps> = ({
  manualVIN,
  onVINChange,
  onSubmit,
  vehicleCategory = 'EV',
  onCategoryChange
}) => {
  return (
    <div className="bg-white rounded-lg border shadow-sm p-4 md:p-6">
      <div className="text-center mb-4 md:mb-6">
        <Camera className="mx-auto h-8 w-8 md:h-12 md:w-12 text-primary mb-2" />
        <h2 className="text-lg md:text-xl font-semibold">Manual Entry</h2>
        <p className="text-xs md:text-sm text-muted-foreground">
          Manually enter the vehicle identification number
        </p>
      </div>
      
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="vin" className="block text-sm md:text-base font-medium">
            VIN Number
          </Label>
          <Input 
            id="vin"
            type="text"
            value={manualVIN}
            onChange={(e) => onVINChange(e.target.value.toUpperCase())}
            placeholder="e.g., 1HGCM82633A123456"
            className="w-full h-10 md:h-12 text-base"
            maxLength={17}
          />
          <p className="text-xs text-muted-foreground">
            Enter the full 17-character Vehicle Identification Number
          </p>
        </div>

        {onCategoryChange && (
          <div className="space-y-2">
            <Label className="block text-sm md:text-base font-medium">
              Vehicle Type
            </Label>
            <RadioGroup 
              value={vehicleCategory} 
              onValueChange={(value) => onCategoryChange(value as 'EV' | 'REV')}
              className="flex flex-row gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="EV" id="ev" />
                <Label htmlFor="ev" className="text-sm cursor-pointer">
                  EV (Electric Vehicle)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="REV" id="rev" />
                <Label htmlFor="rev" className="text-sm cursor-pointer">
                  REV (Range Extended Vehicle)
                </Label>
              </div>
            </RadioGroup>
          </div>
        )}
        
        <Button type="submit" className="w-full h-10 md:h-12 text-sm md:text-base">
          Process VIN
        </Button>
      </form>
    </div>
  );
};

export default ManualEntry;
