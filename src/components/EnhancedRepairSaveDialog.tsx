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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, Star } from 'lucide-react';
import { PartUsed } from '@/types';
import { enhancedRepairHistoryService } from '@/services/enhancedRepairHistoryService';
import { toast } from '@/hooks/use-toast';

interface EnhancedRepairSaveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  repairData?: any; // Existing repair data to pre-fill
}

const EnhancedRepairSaveDialog: React.FC<EnhancedRepairSaveDialogProps> = ({
  isOpen,
  onClose,
  repairData
}) => {
  const [formData, setFormData] = useState({
    car_vin: repairData?.carCode || '',
    car_model: repairData?.carModel || '',
    car_year: new Date().getFullYear(),
    car_color: '',
    client_name: repairData?.customerName || '',
    client_phone: '',
    client_email: '',
    client_license_plate: '',
    issue_description: repairData?.issueDescription || '',
    solution_description: '',
    repair_steps: [''],
    labor_hours: 0,
    total_cost: 0,
    technician_name: repairData?.assignedEmployee || '',
    repair_date: new Date().toISOString().split('T')[0],
    completion_date: new Date().toISOString().split('T')[0],
    repair_category: '',
    difficulty_level: 'medium' as 'easy' | 'medium' | 'hard' | 'expert',
    quality_rating: 5,
    client_satisfaction: 5,
    warranty_period: 12,
    follow_up_required: false
  });

  const [partsUsed, setPartsUsed] = useState<PartUsed[]>([
    { part_number: '', part_name: '', quantity: 1, cost: 0, supplier: '' }
  ]);

  const [saving, setSaving] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRepairStepChange = (index: number, value: string) => {
    const newSteps = [...formData.repair_steps];
    newSteps[index] = value;
    setFormData(prev => ({ ...prev, repair_steps: newSteps }));
  };

  const addRepairStep = () => {
    setFormData(prev => ({ 
      ...prev, 
      repair_steps: [...prev.repair_steps, ''] 
    }));
  };

  const removeRepairStep = (index: number) => {
    if (formData.repair_steps.length > 1) {
      setFormData(prev => ({ 
        ...prev, 
        repair_steps: prev.repair_steps.filter((_, i) => i !== index) 
      }));
    }
  };

  const handlePartChange = (index: number, field: keyof PartUsed, value: any) => {
    const newParts = [...partsUsed];
    newParts[index] = { ...newParts[index], [field]: value };
    setPartsUsed(newParts);
  };

  const addPart = () => {
    setPartsUsed(prev => [...prev, { 
      part_number: '', 
      part_name: '', 
      quantity: 1, 
      cost: 0, 
      supplier: '' 
    }]);
  };

  const removePart = (index: number) => {
    if (partsUsed.length > 1) {
      setPartsUsed(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSave = async () => {
    if (!formData.car_vin || !formData.client_name || !formData.issue_description || !formData.solution_description) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const repairHistory = {
        ...formData,
        parts_used: partsUsed.filter(part => part.part_number && part.part_name)
      };

      await enhancedRepairHistoryService.saveRepairHistory(repairHistory);

      toast({
        title: "Success",
        description: "Enhanced repair history saved successfully",
      });

      onClose();
    } catch (error) {
      console.error('Error saving repair history:', error);
      toast({
        title: "Error",
        description: "Failed to save repair history",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const renderStarRating = (value: number, onChange: (value: number) => void) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <Star
          key={star}
          className={`h-5 w-5 cursor-pointer ${
            star <= value ? 'text-yellow-400 fill-current' : 'text-gray-300'
          }`}
          onClick={() => onChange(star)}
        />
      ))}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[95vh] bg-white opacity-100 flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0 sticky top-0 bg-white z-10 border-b pb-4">
          <DialogTitle>Save Enhanced Repair History</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1 pb-4">
          <div className="space-y-6 py-4">
            {/* Car Information */}
            <div className="space-y-4">
              <h3 className="font-medium">Car Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>VIN Number *</Label>
                  <Input
                    value={formData.car_vin}
                    onChange={(e) => handleInputChange('car_vin', e.target.value)}
                    placeholder="Enter VIN number"
                  />
                </div>
                <div>
                  <Label>Car Model *</Label>
                  <Input
                    value={formData.car_model}
                    onChange={(e) => handleInputChange('car_model', e.target.value)}
                    placeholder="e.g., Voyah Free 2024"
                  />
                </div>
                <div>
                  <Label>Year</Label>
                  <Input
                    type="number"
                    value={formData.car_year}
                    onChange={(e) => handleInputChange('car_year', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label>Color</Label>
                  <Input
                    value={formData.car_color}
                    onChange={(e) => handleInputChange('car_color', e.target.value)}
                    placeholder="Car color"
                  />
                </div>
              </div>
            </div>

            {/* Client Information */}
            <div className="space-y-4">
              <h3 className="font-medium">Client Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Client Name *</Label>
                  <Input
                    value={formData.client_name}
                    onChange={(e) => handleInputChange('client_name', e.target.value)}
                    placeholder="Client full name"
                  />
                </div>
                <div>
                  <Label>Phone Number</Label>
                  <Input
                    value={formData.client_phone}
                    onChange={(e) => handleInputChange('client_phone', e.target.value)}
                    placeholder="Client phone number"
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.client_email}
                    onChange={(e) => handleInputChange('client_email', e.target.value)}
                    placeholder="Client email"
                  />
                </div>
                <div>
                  <Label>License Plate</Label>
                  <Input
                    value={formData.client_license_plate}
                    onChange={(e) => handleInputChange('client_license_plate', e.target.value)}
                    placeholder="License plate number"
                  />
                </div>
              </div>
            </div>

            {/* Issue & Solution */}
            <div className="space-y-4">
              <h3 className="font-medium">Issue & Solution</h3>
              <div>
                <Label>Issue Description *</Label>
                <Textarea
                  value={formData.issue_description}
                  onChange={(e) => handleInputChange('issue_description', e.target.value)}
                  placeholder="Describe the issue in detail"
                  rows={3}
                />
              </div>
              <div>
                <Label>Solution Description *</Label>
                <Textarea
                  value={formData.solution_description}
                  onChange={(e) => handleInputChange('solution_description', e.target.value)}
                  placeholder="Describe the solution applied"
                  rows={3}
                />
              </div>
            </div>

            {/* Repair Steps */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Repair Steps</h3>
                <Button type="button" variant="outline" size="sm" onClick={addRepairStep}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.repair_steps.map((step, index) => (
                <div key={index} className="flex gap-2">
                  <Badge variant="outline" className="mt-2">
                    {index + 1}
                  </Badge>
                  <Input
                    value={step}
                    onChange={(e) => handleRepairStepChange(index, e.target.value)}
                    placeholder={`Step ${index + 1}`}
                  />
                  {formData.repair_steps.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeRepairStep(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Parts Used */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Parts Used</h3>
                <Button type="button" variant="outline" size="sm" onClick={addPart}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {partsUsed.map((part, index) => (
                <div key={index} className="space-y-2 p-3 border rounded">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <Input
                      placeholder="Part Number"
                      value={part.part_number}
                      onChange={(e) => handlePartChange(index, 'part_number', e.target.value)}
                    />
                    <Input
                      placeholder="Part Name"
                      value={part.part_name}
                      onChange={(e) => handlePartChange(index, 'part_name', e.target.value)}
                    />
                    <Input
                      placeholder="Quantity"
                      type="number"
                      value={part.quantity}
                      onChange={(e) => handlePartChange(index, 'quantity', parseInt(e.target.value))}
                    />
                    <Input
                      placeholder="Cost"
                      type="number"
                      value={part.cost}
                      onChange={(e) => handlePartChange(index, 'cost', parseFloat(e.target.value))}
                    />
                    <Input
                      placeholder="Supplier"
                      value={part.supplier}
                      onChange={(e) => handlePartChange(index, 'supplier', e.target.value)}
                    />
                    {partsUsed.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removePart(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Repair Details */}
            <div className="space-y-4">
              <h3 className="font-medium">Repair Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Technician Name *</Label>
                  <Input
                    value={formData.technician_name}
                    onChange={(e) => handleInputChange('technician_name', e.target.value)}
                    placeholder="Technician name"
                  />
                </div>
                <div>
                  <Label>Repair Category</Label>
                  <Select value={formData.repair_category} onValueChange={(value) => handleInputChange('repair_category', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Electrical">Electrical</SelectItem>
                      <SelectItem value="Mechanical">Mechanical</SelectItem>
                      <SelectItem value="Body Work">Body Work</SelectItem>
                      <SelectItem value="Paint">Paint</SelectItem>
                      <SelectItem value="Interior">Interior</SelectItem>
                      <SelectItem value="Software">Software</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Difficulty Level</Label>
                  <Select value={formData.difficulty_level} onValueChange={(value) => handleInputChange('difficulty_level', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Labor Hours</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={formData.labor_hours}
                    onChange={(e) => handleInputChange('labor_hours', parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <Label>Total Cost</Label>
                  <Input
                    type="number"
                    value={formData.total_cost}
                    onChange={(e) => handleInputChange('total_cost', parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <Label>Warranty (months)</Label>
                  <Input
                    type="number"
                    value={formData.warranty_period}
                    onChange={(e) => handleInputChange('warranty_period', parseInt(e.target.value))}
                  />
                </div>
              </div>
            </div>

            {/* Ratings */}
            <div className="space-y-4">
              <h3 className="font-medium">Quality & Satisfaction</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Quality Rating</Label>
                  {renderStarRating(formData.quality_rating, (value) => handleInputChange('quality_rating', value))}
                </div>
                <div>
                  <Label>Client Satisfaction</Label>
                  {renderStarRating(formData.client_satisfaction, (value) => handleInputChange('client_satisfaction', value))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 mt-4">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Enhanced Repair History'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedRepairSaveDialog;
