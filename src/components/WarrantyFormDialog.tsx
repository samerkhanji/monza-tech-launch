import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, X, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface WarrantyData {
  delivery_date: string;
  vehicle_expiry_date: string;
  battery_expiry_date: string;
  dms_deadline_date: string;
  warranty_life?: string;
}

interface WarrantyFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  carId: string;
  tableName: 'cars' | 'car_inventory' | 'garage_cars';
  currentWarranty?: {
    warranty_life?: string | null;
    delivery_date?: string | null;
    vehicle_expiry_date?: string | null;
    battery_expiry_date?: string | null;
    dms_deadline_date?: string | null;
  };
  onSave?: (warrantyData: WarrantyData) => void;
}

const WarrantyFormDialog: React.FC<WarrantyFormDialogProps> = ({
  isOpen,
  onClose,
  carId,
  tableName,
  currentWarranty,
  onSave
}) => {
  const [formData, setFormData] = useState<WarrantyData>({
    delivery_date: '',
    vehicle_expiry_date: '',
    battery_expiry_date: '',
    dms_deadline_date: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  // Load current warranty data when dialog opens
  useEffect(() => {
    if (isOpen && currentWarranty) {
      setFormData({
        delivery_date: currentWarranty.delivery_date || '',
        vehicle_expiry_date: currentWarranty.vehicle_expiry_date || '',
        battery_expiry_date: currentWarranty.battery_expiry_date || '',
        dms_deadline_date: currentWarranty.dms_deadline_date || ''
      });
    }
  }, [isOpen, currentWarranty]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const now = new Date();

    // Validate delivery date
    if (!formData.delivery_date) {
      newErrors.delivery_date = 'Delivery date is required';
    } else {
      const deliveryDate = new Date(formData.delivery_date);
      if (deliveryDate > now) {
        newErrors.delivery_date = 'Delivery date cannot be in the future';
      }
    }

    // Validate vehicle expiry date
    if (formData.vehicle_expiry_date) {
      const vehicleExpiry = new Date(formData.vehicle_expiry_date);
      const deliveryDate = formData.delivery_date ? new Date(formData.delivery_date) : now;
      
      if (vehicleExpiry <= deliveryDate) {
        newErrors.vehicle_expiry_date = 'Vehicle warranty must expire after delivery date';
      }
    }

    // Validate battery expiry date
    if (formData.battery_expiry_date) {
      const batteryExpiry = new Date(formData.battery_expiry_date);
      const deliveryDate = formData.delivery_date ? new Date(formData.delivery_date) : now;
      
      if (batteryExpiry <= deliveryDate) {
        newErrors.battery_expiry_date = 'Battery warranty must expire after delivery date';
      }
    }

    // Validate DMS deadline
    if (formData.dms_deadline_date) {
      const dmsDeadline = new Date(formData.dms_deadline_date);
      const deliveryDate = formData.delivery_date ? new Date(formData.delivery_date) : now;
      
      if (dmsDeadline <= deliveryDate) {
        newErrors.dms_deadline_date = 'DMS deadline must be after delivery date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateWarrantySummary = (): string => {
    const parts = [];
    
    if (formData.vehicle_expiry_date) {
      const delivery = new Date(formData.delivery_date);
      const expiry = new Date(formData.vehicle_expiry_date);
      const months = Math.ceil((expiry.getTime() - delivery.getTime()) / (1000 * 60 * 60 * 24 * 30));
      parts.push(`Vehicle: ${months} months`);
    }
    
    if (formData.battery_expiry_date) {
      const delivery = new Date(formData.delivery_date);
      const expiry = new Date(formData.battery_expiry_date);
      const months = Math.ceil((expiry.getTime() - delivery.getTime()) / (1000 * 60 * 60 * 24 * 30));
      parts.push(`Battery: ${months} months`);
    }
    
    if (formData.dms_deadline_date) {
      const delivery = new Date(formData.delivery_date);
      const deadline = new Date(formData.dms_deadline_date);
      const months = Math.ceil((deadline.getTime() - delivery.getTime()) / (1000 * 60 * 60 * 24 * 30));
      parts.push(`DMS: ${months} months`);
    }
    
    return parts.join(' | ') || 'No warranty set';
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const warrantySummary = generateWarrantySummary();
      
      // Update the database
      const { error } = await supabase
        .from(tableName)
        .update({
          delivery_date: formData.delivery_date || null,
          vehicle_expiry_date: formData.vehicle_expiry_date || null,
          battery_expiry_date: formData.battery_expiry_date || null,
          dms_deadline_date: formData.dms_deadline_date || null,
          warranty_life: warrantySummary
        })
        .eq('id', carId);

      if (error) {
        throw error;
      }

      // Call parent callback if provided
      if (onSave) {
        onSave({
          ...formData,
          warranty_life: warrantySummary
        });
      }

      toast({
        title: "Warranty Updated",
        description: "Warranty information has been saved successfully.",
      });

      onClose();
    } catch (error) {
      console.error('Error updating warranty:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update warranty information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof WarrantyData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Warranty Management
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Delivery Date */}
          <div className="space-y-2">
            <Label htmlFor="delivery_date" className="text-sm font-medium">
              Delivery Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="delivery_date"
              type="date"
              value={formData.delivery_date}
              onChange={(e) => handleInputChange('delivery_date', e.target.value)}
              className={errors.delivery_date ? 'border-red-500' : ''}
            />
            {errors.delivery_date && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {errors.delivery_date}
              </p>
            )}
          </div>

          {/* Vehicle Warranty Expiry */}
          <div className="space-y-2">
            <Label htmlFor="vehicle_expiry_date" className="text-sm font-medium">
              Vehicle Warranty Expiry Date
            </Label>
            <Input
              id="vehicle_expiry_date"
              type="date"
              value={formData.vehicle_expiry_date}
              onChange={(e) => handleInputChange('vehicle_expiry_date', e.target.value)}
              className={errors.vehicle_expiry_date ? 'border-red-500' : ''}
            />
            {errors.vehicle_expiry_date && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {errors.vehicle_expiry_date}
              </p>
            )}
          </div>

          {/* Battery Warranty Expiry */}
          <div className="space-y-2">
            <Label htmlFor="battery_expiry_date" className="text-sm font-medium">
              Battery Warranty Expiry Date
            </Label>
            <Input
              id="battery_expiry_date"
              type="date"
              value={formData.battery_expiry_date}
              onChange={(e) => handleInputChange('battery_expiry_date', e.target.value)}
              className={errors.battery_expiry_date ? 'border-red-500' : ''}
            />
            {errors.battery_expiry_date && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {errors.battery_expiry_date}
              </p>
            )}
          </div>

          {/* DMS Deadline */}
          <div className="space-y-2">
            <Label htmlFor="dms_deadline_date" className="text-sm font-medium">
              DMS Warranty Deadline
            </Label>
            <Input
              id="dms_deadline_date"
              type="date"
              value={formData.dms_deadline_date}
              onChange={(e) => handleInputChange('dms_deadline_date', e.target.value)}
              className={errors.dms_deadline_date ? 'border-red-500' : ''}
            />
            {errors.dms_deadline_date && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {errors.dms_deadline_date}
              </p>
            )}
          </div>

          {/* Warranty Summary Preview */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-600">
              Warranty Summary (Auto-generated)
            </Label>
            <div className="p-3 bg-gray-50 rounded-md text-sm text-gray-700">
              {generateWarrantySummary()}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Warranty'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WarrantyFormDialog;
