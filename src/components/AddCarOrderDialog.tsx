import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Truck } from 'lucide-react';
import { CAR_MODELS } from '@/types';

interface AddCarOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddOrder: (orderData: any) => void;
}

const AddCarOrderDialog: React.FC<AddCarOrderDialogProps> = ({
  isOpen,
  onClose,
  onAddOrder
}) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    model: '',
    year: new Date().getFullYear(),
    color: '',
    supplier: '',
    orderReference: '',
    expectedDelivery: '',
    shipmentCode: '',
    notes: '',
    category: 'garage'
  });

  const handleTrackShipment = () => {
    if (!formData.shipmentCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a shipment code to track.",
        variant: "destructive"
      });
      return;
    }
    
    // Navigate to shipping ETA page with the tracking code
    navigate(`/shipping-eta?track=${encodeURIComponent(formData.shipmentCode.trim())}`);
  };

  const handleSubmit = () => {
    if (!formData.model || !formData.supplier || !formData.orderReference) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    const orderData = {
      ...formData,
      shipmentCode: formData.shipmentCode || null,
      expectedDelivery: formData.expectedDelivery || null,
      orderDate: new Date().toISOString(),
      status: 'ordered'
    };

    onAddOrder(orderData);
    
    toast({
      title: "Car Order Added",
      description: `Order for ${formData.model} has been added successfully.`,
    });

    // Reset form
    setFormData({
      model: '',
      year: new Date().getFullYear(),
      color: '',
      supplier: '',
      orderReference: '',
      expectedDelivery: '',
      shipmentCode: '',
      notes: '',
      category: 'garage'
    });

    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Car Order</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="model">Car Model *</Label>
              <Select
                value={formData.model}
                onValueChange={(value) => setFormData(prev => ({ ...prev, model: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {CAR_MODELS.map((model) => (
                    <SelectItem key={model.id} value={model.name}>
                      {model.name} ({model.year})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                value={formData.year}
                onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                min="2020"
                max="2030"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <Input
              id="color"
              value={formData.color}
              onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
              placeholder="Enter car color"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier *</Label>
              <Input
                id="supplier"
                value={formData.supplier}
                onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                placeholder="Enter supplier name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="orderReference">Order Reference *</Label>
              <Input
                id="orderReference"
                value={formData.orderReference}
                onChange={(e) => setFormData(prev => ({ ...prev, orderReference: e.target.value }))}
                placeholder="Enter order reference"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expectedDelivery">Expected Delivery</Label>
              <Input
                id="expectedDelivery"
                type="date"
                value={formData.expectedDelivery}
                onChange={(e) => setFormData(prev => ({ ...prev, expectedDelivery: e.target.value }))}
                className="pdi-date-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shipmentCode">Shipment Code</Label>
              <div className="flex gap-2">
              <Input
                  id="shipmentCode"
                  type="text"
                  value={formData.shipmentCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, shipmentCode: e.target.value }))}
                  placeholder="Enter shipment code"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleTrackShipment}
                  disabled={!formData.shipmentCode.trim()}
                  className="px-3"
                >
                  <Truck className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="garage">Garage</SelectItem>
                <SelectItem value="showroom">Showroom</SelectItem>
                <SelectItem value="voyah">Voyah</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes about the order..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Add Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddCarOrderDialog;
