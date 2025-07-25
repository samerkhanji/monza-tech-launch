
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
import { Camera, Scan } from 'lucide-react';
import { useCameraCapture } from '@/hooks/useCameraCapture';
import { extractPartNumberFromImage } from '@/utils/partNumberOcrUtils';
import { toast } from '@/hooks/use-toast';

interface EnhancedInventoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (partData: any) => void;
}

export const EnhancedInventoryDialog: React.FC<EnhancedInventoryDialogProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState({
    partName: '',
    partNumber: '',
    carModel: '',
    quantity: 1,
    location: 'Garage Inventory', // Default to Garage Inventory
    supplier: '',
    costPerUnit: '',
    purchasePrice: '',
    shippingCost: '',
    totalCost: '',
    shelf: '',
    rowPosition: '',
    columnPosition: ''
  });

  const [isScanning, setIsScanning] = useState(false);
  const { captureImage, isCapturing } = useCameraCapture();

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-calculate total cost for parts
      if (['purchasePrice', 'shippingCost'].includes(field)) {
        const purchase = parseFloat(updated.purchasePrice) || 0;
        const shipping = parseFloat(updated.shippingCost) || 0;
        updated.totalCost = (purchase + shipping).toFixed(2);
        updated.costPerUnit = updated.quantity > 0 ? (purchase / updated.quantity).toFixed(2) : '0';
      }
      
      return updated;
    });
  };

  const handlePartNumberScan = async () => {
    try {
      setIsScanning(true);
      const imageDataUrl = await captureImage();
      
      if (imageDataUrl) {
        const extractedPartNumber = await extractPartNumberFromImage(imageDataUrl);
        
        if (extractedPartNumber) {
          setFormData(prev => ({
            ...prev,
            partNumber: extractedPartNumber
          }));
          
          toast({
            title: "Part Number Scanned",
            description: `Extracted: ${extractedPartNumber}`,
          });
        } else {
          toast({
            title: "No Part Number Found",
            description: "Please try again or enter manually",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error('Error scanning part number:', error);
      toast({
        title: "Scan Failed",
        description: "Please try again or enter manually",
        variant: "destructive"
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleSave = () => {
    const dataToSave = {
      ...formData,
      // Add profit calculation fields
      costBreakdown: {
        purchase: parseFloat(formData.purchasePrice) || 0,
        shipping: parseFloat(formData.shippingCost) || 0,
        total: parseFloat(formData.totalCost) || 0,
        unitCost: parseFloat(formData.costPerUnit) || 0
      }
    };
    
    onSave(dataToSave);
    setFormData({
      partName: '',
      partNumber: '',
      carModel: '',
      quantity: 1,
      location: 'Garage Inventory',
      supplier: '',
      costPerUnit: '',
      purchasePrice: '',
      shippingCost: '',
      totalCost: '',
      shelf: '',
      rowPosition: '',
      columnPosition: ''
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Part to Garage Inventory</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* Part number scanning section */}
          <div className="space-y-2">
            <Label>Part Number Scanner</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handlePartNumberScan}
                disabled={isCapturing || isScanning}
                className="flex items-center gap-2"
              >
                <Scan className="h-4 w-4" />
                {isScanning ? 'Scanning...' : 'Scan Part Number'}
              </Button>
            </div>
            {(isCapturing || isScanning) && (
              <p className="text-sm text-muted-foreground">
                Scanning part number with OCR...
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="partName">Part Name</Label>
              <Input
                id="partName"
                value={formData.partName}
                onChange={(e) => handleInputChange('partName', e.target.value)}
                placeholder="Enter part name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="partNumber">Part Number</Label>
              <Input
                id="partNumber"
                value={formData.partNumber}
                onChange={(e) => handleInputChange('partNumber', e.target.value)}
                placeholder="Enter or scan part number"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="carModel">Car Model</Label>
              <Input
                id="carModel"
                value={formData.carModel}
                onChange={(e) => handleInputChange('carModel', e.target.value)}
                placeholder="Enter car model"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', parseInt(e.target.value))}
                placeholder="Enter quantity"
              />
            </div>
          </div>

          {/* Pricing Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="purchasePrice">Purchase Price ($)</Label>
              <Input
                id="purchasePrice"
                type="number"
                step="0.01"
                value={formData.purchasePrice}
                onChange={(e) => handleInputChange('purchasePrice', e.target.value)}
                placeholder="Enter purchase price"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="shippingCost">Shipping Cost ($)</Label>
              <Input
                id="shippingCost"
                type="number"
                step="0.01"
                value={formData.shippingCost}
                onChange={(e) => handleInputChange('shippingCost', e.target.value)}
                placeholder="Enter shipping cost"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="totalCost">Total Cost ($)</Label>
              <Input
                id="totalCost"
                type="number"
                step="0.01"
                value={formData.totalCost}
                onChange={(e) => handleInputChange('totalCost', e.target.value)}
                placeholder="Auto-calculated"
                className="bg-gray-50"
                readOnly
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="costPerUnit">Cost Per Unit ($)</Label>
              <Input
                id="costPerUnit"
                type="number"
                step="0.01"
                value={formData.costPerUnit}
                onChange={(e) => handleInputChange('costPerUnit', e.target.value)}
                placeholder="Auto-calculated"
                className="bg-gray-50"
                readOnly
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="Garage Inventory"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier</Label>
              <Input
                id="supplier"
                value={formData.supplier}
                onChange={(e) => handleInputChange('supplier', e.target.value)}
                placeholder="Enter supplier"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="shelf">Shelf</Label>
              <Input
                id="shelf"
                value={formData.shelf}
                onChange={(e) => handleInputChange('shelf', e.target.value)}
                placeholder="Shelf"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="rowPosition">Row</Label>
              <Input
                id="rowPosition"
                value={formData.rowPosition}
                onChange={(e) => handleInputChange('rowPosition', e.target.value)}
                placeholder="Row"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="columnPosition">Column</Label>
              <Input
                id="columnPosition"
                value={formData.columnPosition}
                onChange={(e) => handleInputChange('columnPosition', e.target.value)}
                placeholder="Column"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Add Part to Garage Inventory
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
