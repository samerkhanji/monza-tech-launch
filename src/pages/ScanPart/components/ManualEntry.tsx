
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { QrCode, Camera } from 'lucide-react';
import PartNumberScannerDialog from '@/components/PartNumberScannerDialog';
import { safeParseInt } from '@/utils/errorHandling';

interface ManualEntryProps {
  manualPartId: string;
  carVIN: string;
  quantity: number;
  onPartIdChange: (partId: string) => void;
  onCarVINChange: (vin: string) => void;
  onQuantityChange: (quantity: number) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const ManualEntry: React.FC<ManualEntryProps> = ({
  manualPartId,
  carVIN,
  quantity,
  onPartIdChange,
  onCarVINChange,
  onQuantityChange,
  onSubmit
}) => {
  const handlePartNumberScanned = (partNumber: string) => {
    onPartIdChange(partNumber);
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm p-4 md:p-6">
      <div className="text-center mb-4 md:mb-6">
        <QrCode className="mx-auto h-8 w-8 md:h-12 md:w-12 text-primary mb-2" />
        <h2 className="text-lg md:text-xl font-semibold">Manual Entry</h2>
        <p className="text-xs md:text-sm text-muted-foreground">
          Enter part details manually or scan part number with camera
        </p>
      </div>
      
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="partId" className="text-sm font-medium">
            Part ID or Number
          </Label>
          <div className="flex gap-2 mt-1">
            <Input
              id="partId"
              value={manualPartId}
              onChange={(e) => onPartIdChange(e.target.value)}
              placeholder="Enter part ID or number"
              className="flex-1"
              required
            />
            <PartNumberScannerDialog onPartNumberScanned={handlePartNumberScanned}>
              <Button variant="outline" size="sm" type="button">
                <Camera className="h-4 w-4" />
              </Button>
            </PartNumberScannerDialog>
          </div>
        </div>
        
        <div>
          <Label htmlFor="carVIN" className="text-sm font-medium">
            Car VIN
          </Label>
          <Input
            id="carVIN"
            value={carVIN}
            onChange={(e) => onCarVINChange(e.target.value)}
            placeholder="Enter vehicle VIN"
            className="mt-1"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="quantity" className="text-sm font-medium">
            Quantity
          </Label>
          <Input
            id="quantity"
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => onQuantityChange(safeParseInt(e.target.value, 1))}
            className="mt-1"
            required
          />
        </div>
        
        <Button type="submit" className="w-full">
          Check Out Part
        </Button>
      </form>
    </div>
  );
};

export default ManualEntry;
