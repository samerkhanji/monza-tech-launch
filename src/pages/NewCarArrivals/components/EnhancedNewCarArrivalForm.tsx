
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Bot, Car, Save } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import EnhancedVoiceCameraInterface from '@/components/EnhancedVoiceCameraInterface';

interface NewCarData {
  vin_number: string;
  model: string;
  color: string;
  vehicle_category: string;
  battery_percentage: number;
  has_damages: boolean;
  damage_description: string;
  notes: string;
  pdi_technician: string;
  pdi_notes: string;
}

const EnhancedNewCarArrivalForm: React.FC = () => {
  const [formData, setFormData] = useState<NewCarData>({
    vin_number: '',
    model: '',
    color: '',
    vehicle_category: 'EV',
    battery_percentage: 50,
    has_damages: false,
    damage_description: '',
    notes: '',
    pdi_technician: '',
    pdi_notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMonzaBotAssist, setShowMonzaBotAssist] = useState(false);

  const handleInputChange = (field: keyof NewCarData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleMonzaBotDataExtracted = (extractedData: any, formType: string) => {
    if (formType === 'new_car_arrival') {
      const updatedData = { ...formData };
      
      if (extractedData.vin) updatedData.vin_number = extractedData.vin;
      if (extractedData.model) updatedData.model = extractedData.model;
      if (extractedData.color) updatedData.color = extractedData.color;
      if (extractedData.year) {
        updatedData.model = `${updatedData.model} ${extractedData.year}`.trim();
      }
      if (extractedData.damageDescription) {
        updatedData.has_damages = true;
        updatedData.damage_description = extractedData.damageDescription;
      }
      
      setFormData(updatedData);
      
      toast({
        title: "Form auto-filled",
        description: "MonzaBot has filled the form with extracted data. Please review before saving.",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.vin_number || !formData.model || !formData.color) {
      toast({
        title: "Missing required fields",
        description: "Please fill in VIN, model, and color before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('new_car_arrivals')
        .insert([formData]);

      if (error) throw error;

      toast({
        title: "Car arrival recorded",
        description: "New car has been successfully added to the system.",
      });

      // Reset form
      setFormData({
        vin_number: '',
        model: '',
        color: '',
        vehicle_category: 'EV',
        battery_percentage: 50,
        has_damages: false,
        damage_description: '',
        notes: '',
        pdi_technician: '',
        pdi_notes: ''
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Error",
        description: "Failed to record car arrival. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Car className="h-6 w-6" />
          <h1 className="text-2xl font-bold">New Car Arrival</h1>
        </div>
        
        <Button
          onClick={() => setShowMonzaBotAssist(!showMonzaBotAssist)}
          variant="outline"
          className="bg-monza-yellow hover:bg-monza-yellow/90"
        >
          <Bot className="h-4 w-4 mr-2" />
          {showMonzaBotAssist ? 'Hide' : 'Show'} MonzaBot Assist
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* MonzaBot Assistant */}
        {showMonzaBotAssist && (
          <div className="lg:col-span-1">
            <EnhancedVoiceCameraInterface
              onDataExtracted={handleMonzaBotDataExtracted}
              formType="new_car_arrival"
              showFormFillButton={true}
            />
          </div>
        )}

        {/* Main Form */}
        <div className={showMonzaBotAssist ? "lg:col-span-2" : "lg:col-span-3"}>
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Vehicle Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vin">VIN Number *</Label>
                    <Input
                      id="vin"
                      value={formData.vin_number}
                      onChange={(e) => handleInputChange('vin_number', e.target.value)}
                      placeholder="17-character VIN"
                      maxLength={17}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="model">Model *</Label>
                    <Input
                      id="model"
                      value={formData.model}
                      onChange={(e) => handleInputChange('model', e.target.value)}
                      placeholder="e.g., Tesla Model 3 2024"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="color">Color *</Label>
                    <Input
                      id="color"
                      value={formData.color}
                      onChange={(e) => handleInputChange('color', e.target.value)}
                      placeholder="e.g., Pearl White"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="category">Vehicle Category</Label>
                    <Select value={formData.vehicle_category} onValueChange={(value) => handleInputChange('vehicle_category', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EV">Electric Vehicle</SelectItem>
                        <SelectItem value="Hybrid">Hybrid</SelectItem>
                        <SelectItem value="ICE">Internal Combustion</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                {/* Condition Assessment */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Condition Assessment</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="battery">Battery Percentage</Label>
                      <Input
                        id="battery"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.battery_percentage}
                        onChange={(e) => handleInputChange('battery_percentage', parseInt(e.target.value))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Has Damages?</Label>
                      <Select 
                        value={formData.has_damages.toString()} 
                        onValueChange={(value) => handleInputChange('has_damages', value === 'true')}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="false">No Damages</SelectItem>
                          <SelectItem value="true">Has Damages</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {formData.has_damages && (
                    <div className="space-y-2">
                      <Label htmlFor="damage_description">Damage Description</Label>
                      <Textarea
                        id="damage_description"
                        value={formData.damage_description}
                        onChange={(e) => handleInputChange('damage_description', e.target.value)}
                        placeholder="Describe any damages found..."
                        rows={3}
                      />
                    </div>
                  )}
                </div>

                <Separator />

                {/* PDI Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">PDI Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="pdi_technician">PDI Technician</Label>
                      <Input
                        id="pdi_technician"
                        value={formData.pdi_technician}
                        onChange={(e) => handleInputChange('pdi_technician', e.target.value)}
                        placeholder="Technician name"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="pdi_notes">PDI Notes</Label>
                    <Textarea
                      id="pdi_notes"
                      value={formData.pdi_notes}
                      onChange={(e) => handleInputChange('pdi_notes', e.target.value)}
                      placeholder="Pre-delivery inspection notes..."
                      rows={3}
                    />
                  </div>
                </div>

                <Separator />

                {/* Additional Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Any additional notes about this vehicle..."
                    rows={3}
                  />
                </div>

                {/* Submit Button */}
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  {isSubmitting ? 'Saving...' : 'Save Car Arrival'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EnhancedNewCarArrivalForm;
