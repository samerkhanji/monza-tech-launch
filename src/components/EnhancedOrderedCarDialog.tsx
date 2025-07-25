
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
import { Camera, Upload, Plus, Minus } from 'lucide-react';
import { useMonzaBotCarAnalysis } from '@/hooks/useMonzaBotCarAnalysis';
import { useCameraCapture } from '@/hooks/useCameraCapture';

interface EnhancedOrderedCarDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (carData: any) => void;
}

export const EnhancedOrderedCarDialog: React.FC<EnhancedOrderedCarDialogProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState({
    model: '',
    year: new Date().getFullYear(),
    color: '',
    quantity: 1,
    vinNumber: '',
    supplier: '',
    orderReference: '',
    expectedDelivery: '',
    purchasePrice: '',
    shippingCost: '',
    customsDuty: '',
    totalCost: '',
    notes: '',
    shippingCompany: '',
    trackingCode: ''
  });

  const { analyzeCarImage, isAnalyzing } = useMonzaBotCarAnalysis();
  const { captureImage, isCapturing } = useCameraCapture();

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-calculate total cost when pricing fields change
      if (['purchasePrice', 'shippingCost', 'customsDuty'].includes(field)) {
        const purchase = parseFloat(updated.purchasePrice) || 0;
        const shipping = parseFloat(updated.shippingCost) || 0;
        const customs = parseFloat(updated.customsDuty) || 0;
        updated.totalCost = (purchase + shipping + customs).toFixed(2);
      }
      
      return updated;
    });
  };

  const handlePhotoCapture = async () => {
    try {
      const imageDataUrl = await captureImage();
      if (imageDataUrl) {
        const analysis = await analyzeCarImage(imageDataUrl, 'new_car_arrival');
        
        if (analysis.formFillData) {
          const data = analysis.formFillData;
          setFormData(prev => ({
            ...prev,
            model: data.model || prev.model,
            year: data.year || prev.year,
            color: data.color || prev.color,
            vinNumber: data.vinNumber || prev.vinNumber,
            notes: data.notes || prev.notes
          }));
        }
      }
    } catch (error) {
      console.error('Error capturing/analyzing photo:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageDataUrl = e.target?.result as string;
        try {
          const analysis = await analyzeCarImage(imageDataUrl, 'new_car_arrival');
          
          if (analysis.formFillData) {
            const data = analysis.formFillData;
            setFormData(prev => ({
              ...prev,
              model: data.model || prev.model,
              year: data.year || prev.year,
              color: data.color || prev.color,
              vinNumber: data.vinNumber || prev.vinNumber,
              notes: data.notes || prev.notes
            }));
          }
        } catch (error) {
          console.error('Error analyzing uploaded image:', error);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    const dataToSave = {
      ...formData,
      // Calculate profit margin (if selling price is provided later)
      costBreakdown: {
        purchase: parseFloat(formData.purchasePrice) || 0,
        shipping: parseFloat(formData.shippingCost) || 0,
        customs: parseFloat(formData.customsDuty) || 0,
        total: parseFloat(formData.totalCost) || 0
      }
    };
    
    onSave(dataToSave);
    setFormData({
      model: '',
      year: new Date().getFullYear(),
      color: '',
      quantity: 1,
      vinNumber: '',
      supplier: '',
      orderReference: '',
      expectedDelivery: '',
      purchasePrice: '',
      shippingCost: '',
      customsDuty: '',
      totalCost: '',
      notes: '',
      shippingCompany: '',
      trackingCode: ''
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Car Order</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* Photo capture section */}
          <div className="space-y-2">
            <Label>Vehicle Photo (Optional - MonzaBot will analyze)</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handlePhotoCapture}
                disabled={isCapturing || isAnalyzing}
                className="flex items-center gap-2"
              >
                <Camera className="h-4 w-4" />
                {isCapturing ? 'Capturing...' : 'Take Photo'}
              </Button>
              
              <label className="flex items-center gap-2 px-4 py-2 border border-input rounded-md cursor-pointer hover:bg-accent">
                <Upload className="h-4 w-4" />
                Upload Photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
            {isAnalyzing && (
              <p className="text-sm text-muted-foreground">
                MonzaBot is analyzing the image...
              </p>
            )}
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => handleInputChange('model', e.target.value)}
                placeholder="Enter car model"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                value={formData.year}
                onChange={(e) => handleInputChange('year', parseInt(e.target.value))}
                placeholder="Enter year"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                value={formData.color}
                onChange={(e) => handleInputChange('color', e.target.value)}
                placeholder="Enter color"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleInputChange('quantity', Math.max(1, formData.quantity - 1))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 1)}
                  className="text-center"
                  min="1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleInputChange('quantity', formData.quantity + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="vinNumber">VIN Number</Label>
              <Input
                id="vinNumber"
                value={formData.vinNumber}
                onChange={(e) => handleInputChange('vinNumber', e.target.value)}
                placeholder="Enter VIN"
              />
            </div>
          </div>

          {/* Order Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier</Label>
              <Input
                id="supplier"
                value={formData.supplier}
                onChange={(e) => handleInputChange('supplier', e.target.value)}
                placeholder="Enter supplier"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="orderReference">Order Reference</Label>
              <Input
                id="orderReference"
                value={formData.orderReference}
                onChange={(e) => handleInputChange('orderReference', e.target.value)}
                placeholder="Enter order reference"
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
              <Label htmlFor="customsDuty">Customs Duty ($)</Label>
              <Input
                id="customsDuty"
                type="number"
                step="0.01"
                value={formData.customsDuty}
                onChange={(e) => handleInputChange('customsDuty', e.target.value)}
                placeholder="Enter customs duty"
              />
            </div>
            
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
          </div>

          {/* Delivery Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expectedDelivery">Expected Delivery</Label>
              <Input
                id="expectedDelivery"
                type="date"
                value={formData.expectedDelivery}
                onChange={(e) => handleInputChange('expectedDelivery', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="shippingCompany">Shipping Company</Label>
              <Input
                id="shippingCompany"
                value={formData.shippingCompany}
                onChange={(e) => handleInputChange('shippingCompany', e.target.value)}
                placeholder="Enter shipping company"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="trackingCode">Tracking Code</Label>
            <Input
              id="trackingCode"
              value={formData.trackingCode}
              onChange={(e) => handleInputChange('trackingCode', e.target.value)}
              placeholder="Enter tracking code"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Enter any additional notes"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Add Car Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
