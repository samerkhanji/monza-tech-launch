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
import { toast } from '@/hooks/use-toast';
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
              <select
                id="model"
                name="model"
                value={formData.model}
                onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autocomplete="off"
              >
                 <option value="">Select model</option>
                 {CAR_MODELS.map((model) => (
                   <option key={model.id} value={model.name}>
                     {model.name} ({model.year})
                   </option>
                 ))}
               </select>
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
              <Input
                id="shipmentCode"
                type="text"
                value={formData.shipmentCode}
                onChange={(e) => setFormData(prev => ({ ...prev, shipmentCode: e.target.value }))}
                placeholder="Enter shipment code"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              placeholder="Enter category (e.g., garage, showroom, voyah)"
              className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
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
