import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tool } from '@/services/toolsEquipmentService';
import { safeParseFloat } from '@/utils/errorHandling';
import { toast } from '@/hooks/use-toast';

interface AddToolDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (toolData: any) => void;
}

const AddToolDialog: React.FC<AddToolDialogProps> = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'tool',
    category: '',
    purchasePrice: '',
    location: 'garage',
    description: '',
    purchasedBy: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.category || !formData.purchasePrice) {
      toast({
        title: "Validation Error",
        description: "Please fill in required fields",
        variant: "destructive",
      });
      return;
    }

    const toolData = {
      ...formData,
      purchasePrice: safeParseFloat(formData.purchasePrice, 0),
      purchaseDate: new Date().toISOString().split('T')[0],
      supplier: '',
      usageHours: 0,
      lastUsed: null,
      depreciationRate: 20,
      condition: 'excellent',
      assignedTo: null,
      maintenanceHistory: [],
      notes: '',
      isActive: true
    };

    onSave(toolData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Tool/Equipment</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <select
              id="type"
              className="h-10 w-full rounded-md border px-3"
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
            >
              <option value="tool">Tool</option>
              <option value="equipment">Equipment</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <select
              id="location"
              className="h-10 w-full rounded-md border px-3"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            >
              <option value="garage">Garage</option>
              <option value="showroom">Showroom</option>
              <option value="events">Events</option>
              <option value="office">Office</option>
              <option value="storage">Storage</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="purchasePrice">Purchase Price ($) *</Label>
            <Input
              id="purchasePrice"
              type="number"
              step="0.01"
              value={formData.purchasePrice}
              onChange={(e) => setFormData(prev => ({ ...prev, purchasePrice: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="purchasedBy">Purchased By</Label>
            <Input
              id="purchasedBy"
              value={formData.purchasedBy}
              onChange={(e) => setFormData(prev => ({ ...prev, purchasedBy: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Add Tool
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddToolDialog; 