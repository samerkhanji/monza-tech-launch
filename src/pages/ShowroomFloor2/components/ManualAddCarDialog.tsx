import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Car } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface CarData {
  id: string;
  vinNumber: string;
  model: string;
  year: number;
  color: string;
  price: number;
  status: 'sold' | 'reserved' | 'in_stock';
  category: 'EV' | 'REV' | 'ICEV';
  batteryPercentage: number;
  range: number;
  features?: string[];
  arrivalDate: string;
  pdiCompleted?: boolean;
  customs?: 'paid' | 'not paid';
  brand?: string;
  currentFloor?: "Inventory" | "Garage" | "Showroom 1" | "Showroom 2" | "New Arrivals";
  purchasePrice?: number;
  horsePower?: number;
  torque?: number;
  acceleration?: string;
  topSpeed?: number;
  chargingTime?: string;
  warranty?: string;
}

interface ManualAddCarDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCarAdded: (car: CarData) => void;
}

const ManualAddCarDialog: React.FC<ManualAddCarDialogProps> = ({
  isOpen,
  onClose,
  onCarAdded
}) => {
  const [formData, setFormData] = useState({
    vinNumber: '',
    model: 'Voyah Dream',
    brand: 'Voyah',
    year: new Date().getFullYear(),
    color: '',
    price: 0,
    batteryPercentage: 100,
    range: 0,
    category: 'EV' as 'EV' | 'REV' | 'ICEV',
    customs: 'not paid' as 'paid' | 'not paid',
    horsePower: 0,
    torque: 0,
    acceleration: '',
    topSpeed: 0,
    chargingTime: '',
    warranty: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.vinNumber.trim()) {
      newErrors.vinNumber = 'VIN number is required';
    } else if (formData.vinNumber.length < 17) {
      newErrors.vinNumber = 'VIN number must be 17 characters';
    }

    if (!formData.model.trim()) {
      newErrors.model = 'Model is required';
    }

    if (!formData.color.trim()) {
      newErrors.color = 'Color is required';
    }

    if (formData.price <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }

    if (formData.year < 2020 || formData.year > 2030) {
      newErrors.year = 'Year must be between 2020 and 2030';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleInputChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before submitting",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const newCar: CarData = {
        id: `floor2-manual-${Date.now()}`,
        ...formData,
        status: 'in_stock',
        features: [],
        arrivalDate: new Date().toISOString(),
        pdiCompleted: false,
        currentFloor: 'Showroom 2'
      };

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));

      onCarAdded(newCar);

      // Reset form
      setFormData({
        vinNumber: '',
        model: 'Voyah Dream',
        brand: 'Voyah',
        year: new Date().getFullYear(),
        color: '',
        price: 0,
        batteryPercentage: 100,
        range: 0,
        category: 'EV',
        customs: 'not paid',
        horsePower: 0,
        torque: 0,
        acceleration: '',
        topSpeed: 0,
        chargingTime: '',
        warranty: ''
      });

      toast({
        title: "Success",
        description: "Car added to Showroom Floor 2 successfully!",
      });

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add car. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, onCarAdded]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Add Car to Showroom Floor 2
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-medium text-lg border-b pb-2">Basic Information</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vinNumber">VIN Number *</Label>
                <Input
                  id="vinNumber"
                  value={formData.vinNumber}
                  onChange={(e) => handleInputChange('vinNumber', e.target.value.toUpperCase())}
                  placeholder="Enter 17-character VIN"
                  maxLength={17}
                  className={errors.vinNumber ? 'border-red-500' : ''}
                />
                {errors.vinNumber && (
                  <p className="text-sm text-red-500 mt-1">{errors.vinNumber}</p>
                )}
              </div>

              <div>
                <Label htmlFor="model">Model *</Label>
                <Select 
                  value={formData.model} 
                  onValueChange={(value) => handleInputChange('model', value)}
                >
                  <SelectTrigger className={errors.model ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Voyah Dream">Voyah Dream</SelectItem>
                    <SelectItem value="Voyah Free">Voyah Free</SelectItem>
                    <SelectItem value="Voyah Passion">Voyah Passion</SelectItem>
                    <SelectItem value="Voyah Free 318">Voyah Free 318</SelectItem>
                    <SelectItem value="Mhero">Mhero</SelectItem>
                  </SelectContent>
                </Select>
                {errors.model && (
                  <p className="text-sm text-red-500 mt-1">{errors.model}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="year">Year *</Label>
                <Input
                  id="year"
                  type="number"
                  min="2020"
                  max="2030"
                  value={formData.year}
                  onChange={(e) => handleInputChange('year', parseInt(e.target.value))}
                  className={errors.year ? 'border-red-500' : ''}
                />
                {errors.year && (
                  <p className="text-sm text-red-500 mt-1">{errors.year}</p>
                )}
              </div>

              <div>
                <Label htmlFor="color">Color *</Label>
                <Input
                  id="color"
                  value={formData.color}
                  onChange={(e) => handleInputChange('color', e.target.value)}
                  placeholder="e.g., Midnight Silver"
                  className={errors.color ? 'border-red-500' : ''}
                />
                {errors.color && (
                  <p className="text-sm text-red-500 mt-1">{errors.color}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => handleInputChange('category', value as 'EV' | 'REV' | 'ICEV')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EV">EV (Electric Vehicle)</SelectItem>
                    <SelectItem value="REV">REV (Range Extended Vehicle)</SelectItem>
                    <SelectItem value="ICEV">ICEV (Internal Combustion Engine)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="price">Price (USD) *</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', parseInt(e.target.value))}
                  placeholder="e.g., 85000"
                  className={errors.price ? 'border-red-500' : ''}
                />
                {errors.price && (
                  <p className="text-sm text-red-500 mt-1">{errors.price}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="batteryPercentage">Battery %</Label>
                <Input
                  id="batteryPercentage"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.batteryPercentage}
                  onChange={(e) => handleInputChange('batteryPercentage', parseInt(e.target.value))}
                />
              </div>

              <div>
                <Label htmlFor="range">Range (km)</Label>
                <Input
                  id="range"
                  type="number"
                  min="0"
                  value={formData.range}
                  onChange={(e) => handleInputChange('range', parseInt(e.target.value))}
                  placeholder="e.g., 520"
                />
              </div>
            </div>
          </div>

          {/* Technical Specifications */}
          <details className="border rounded-lg p-4">
            <summary className="font-medium cursor-pointer">Technical Specifications (Optional)</summary>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <Label htmlFor="horsePower">Horse Power</Label>
                <Input
                  id="horsePower"
                  type="number"
                  min="0"
                  value={formData.horsePower}
                  onChange={(e) => handleInputChange('horsePower', parseInt(e.target.value))}
                  placeholder="e.g., 350"
                />
              </div>

              <div>
                <Label htmlFor="torque">Torque (Nm)</Label>
                <Input
                  id="torque"
                  type="number"
                  min="0"
                  value={formData.torque}
                  onChange={(e) => handleInputChange('torque', parseInt(e.target.value))}
                  placeholder="e.g., 500"
                />
              </div>

              <div>
                <Label htmlFor="acceleration">0-100 km/h (seconds)</Label>
                <Input
                  id="acceleration"
                  value={formData.acceleration}
                  onChange={(e) => handleInputChange('acceleration', e.target.value)}
                  placeholder="e.g., 4.5"
                />
              </div>

              <div>
                <Label htmlFor="topSpeed">Top Speed (km/h)</Label>
                <Input
                  id="topSpeed"
                  type="number"
                  min="0"
                  value={formData.topSpeed}
                  onChange={(e) => handleInputChange('topSpeed', parseInt(e.target.value))}
                  placeholder="e.g., 250"
                />
              </div>

              <div>
                <Label htmlFor="chargingTime">Charging Time (10-80%)</Label>
                <Input
                  id="chargingTime"
                  value={formData.chargingTime}
                  onChange={(e) => handleInputChange('chargingTime', e.target.value)}
                  placeholder="e.g., 30 minutes"
                />
              </div>

              <div>
                <Label htmlFor="warranty">Warranty</Label>
                <Input
                  id="warranty"
                  value={formData.warranty}
                  onChange={(e) => handleInputChange('warranty', e.target.value)}
                  placeholder="e.g., 4 years / 80,000 km"
                />
              </div>
            </div>
          </details>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="w-full sm:w-auto"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            className="bg-monza-yellow hover:bg-monza-yellow/90 text-black w-full sm:w-auto"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Adding...' : 'Add Car to Showroom'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManualAddCarDialog; 