import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Car, User, Settings, FileText } from 'lucide-react';

interface GarageCar {
  id: string;
  vinNumber?: string;
  model: string;
  year?: number;
  color: string;
  brand?: string;
  category?: string;
  arrivalDate?: string;
  batteryPercentage?: number;
  sellingPrice?: number;
  customs?: string;
  shipmentCode?: string;
  garageLocation?: string;
  garageEntryDate?: string;
  garageNotes?: string;
  garageStatus?: 'stored' | 'in_repair' | 'ready_for_pickup' | 'awaiting_parts';
  pdiCompleted?: boolean;
  pdiDate?: string;
  pdiTechnician?: string;
  pdiNotes?: string;
  notes?: string;
  manufacturingDate?: string;
  rangeExtenderNumber?: string;
  highVoltageBatteryNumber?: string;
  frontMotorNumber?: string;
  rearMotorNumber?: string;
  clientName?: string;
  clientPhone?: string;
  clientEmail?: string;
  reservedDate?: string;
  soldDate?: string;
  [key: string]: any; // Allow for additional properties
}

interface EditGarageCarDialogProps {
  isOpen: boolean;
  onClose: () => void;
  car: GarageCar;
  onSave: (carId: string, updates: Record<string, any>) => void;
}

const EditGarageCarDialog: React.FC<EditGarageCarDialogProps> = ({
  isOpen,
  onClose,
  car,
  onSave
}) => {
  const [formData, setFormData] = useState({
    // Basic Info
    model: car.model || '',
    year: car.year || new Date().getFullYear(),
    color: car.color || '',
    interiorColor: (car as any).interiorColor || '',
    brand: car.brand || '',
    category: car.category || 'EV',
    vinNumber: car.vinNumber || '',
    
    // Pricing
    sellingPrice: car.sellingPrice || 0,

    // Technical Specs
    batteryPercentage: car.batteryPercentage || 0,
    range: (car as any).range || 0,
    kmDriven: (car as any).kmDriven || (car as any).kilometersDriven || 0,
    
    // Garage Info
    garageLocation: car.garageLocation || 'Bay 1',
    garageStatus: car.garageStatus || 'stored',
    garageNotes: car.garageNotes || '',
    
    // Technical Details
    manufacturingDate: car.manufacturingDate || '',
    rangeExtenderNumber: car.rangeExtenderNumber || '',
    highVoltageBatteryNumber: car.highVoltageBatteryNumber || '',
    frontMotorNumber: car.frontMotorNumber || '',
    rearMotorNumber: car.rearMotorNumber || '',
    shipmentCode: car.shipmentCode || '',
    
    // Client Info
    clientName: car.clientName || '',
    clientPhone: car.clientPhone || '',
    clientEmail: car.clientEmail || '',
    
    // General Notes
    notes: car.notes || ''
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    const updates: Record<string, any> = {};
    
    // Only include changed fields
    Object.keys(formData).forEach(key => {
      const newValue = formData[key as keyof typeof formData];
      const oldValue = car[key as keyof GarageCar];
      
      if (newValue !== oldValue) {
        updates[key as string] = newValue;
      }
    });
    
    if (Object.keys(updates).length > 0) {
      onSave(car.id, updates);
    }
    onClose();
  };

  const garageLocations = [
    'Bay 1', 'Bay 2', 'Bay 3', 'Bay 4', 'Bay 5',
    'Lift 1', 'Lift 2', 'Wash Bay', 'Prep Area',
    'Storage Area A', 'Storage Area B', 'Outdoor Lot'
  ];

  const statusOptions = [
    { value: 'stored', label: 'Stored' },
    { value: 'in_repair', label: 'In Repair' },
    { value: 'ready_for_pickup', label: 'Ready for Pickup' },
    { value: 'awaiting_parts', label: 'Awaiting Parts' }
  ];



  const categories = [
    { value: 'EV', label: 'Electric Vehicle' },
    { value: 'REV', label: 'Range Extended Vehicle' },
    { value: 'ICE', label: 'Internal Combustion Engine' }
  ];

  const customsOptions = [
    { value: 'paid', label: 'Paid' },
    { value: 'not paid', label: 'Not Paid' },
    { value: 'pending', label: 'Pending' }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Edit Car: {car.model} ({car.vinNumber})
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="basic" className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic" className="flex items-center gap-1">
              <Car className="h-4 w-4" />
              Basic Info
            </TabsTrigger>
            <TabsTrigger value="garage" className="flex items-center gap-1">
              <Settings className="h-4 w-4" />
              Garage Details
            </TabsTrigger>
            <TabsTrigger value="technical" className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              Technical
            </TabsTrigger>
            <TabsTrigger value="client" className="flex items-center gap-1">
              <User className="h-4 w-4" />
              Client Info
            </TabsTrigger>
          </TabsList>

          <div className="overflow-y-auto flex-1 mt-4">
            <TabsContent value="basic" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Vehicle Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="model">Model *</Label>
                    <Input
                      id="model"
                      value={formData.model}
                      onChange={(e) => handleInputChange('model', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="brand">Brand</Label>
                    <Input
                      id="brand"
                      value={formData.brand}
                      onChange={(e) => handleInputChange('brand', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="year">Year</Label>
                    <Input
                      id="year"
                      type="number"
                      value={formData.year}
                      onChange={(e) => handleInputChange('year', parseInt(e.target.value) || new Date().getFullYear())}
                    />
                  </div>
                  <div>
                    <Label htmlFor="color">Color</Label>
                    <Input
                      id="color"
                      value={formData.color}
                      onChange={(e) => handleInputChange('color', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="interiorColor">Color interior</Label>
                    <Input
                      id="interiorColor"
                      value={formData.interiorColor}
                      onChange={(e) => handleInputChange('interiorColor', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="vinNumber">VIN Number</Label>
                    <Input
                      id="vinNumber"
                      value={formData.vinNumber}
                      onChange={(e) => handleInputChange('vinNumber', e.target.value)}
                      className="font-mono"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Status & Pricing</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">

                  <div>
                    <Label htmlFor="sellingPrice">Selling Price ($)</Label>
                    <Input
                      id="sellingPrice"
                      type="number"
                      min="0"
                      value={formData.sellingPrice || ''}
                      onChange={(e) => handleInputChange('sellingPrice', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="batteryPercentage">Battery Level (%)</Label>
                    <Input
                      id="batteryPercentage"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.batteryPercentage}
                      onChange={(e) => handleInputChange('batteryPercentage', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="range">Range Capacity (km)</Label>
                    <Input
                      id="range"
                      type="number"
                      min="0"
                      value={formData.range || ''}
                      onChange={(e) => handleInputChange('range', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="kmDriven">Km Driven</Label>
                    <Input
                      id="kmDriven"
                      type="number"
                      min="0"
                      value={formData.kmDriven || ''}
                      onChange={(e) => handleInputChange('kmDriven', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="garage" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Garage Location & Status</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="garageLocation">Current Location</Label>
                    <Select value={formData.garageLocation} onValueChange={(value) => handleInputChange('garageLocation', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {garageLocations.map((location) => (
                          <SelectItem key={location} value={location}>
                            {location}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="garageStatus">Garage Status</Label>
                    <Select value={formData.garageStatus} onValueChange={(value) => handleInputChange('garageStatus', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="garageNotes">Garage Notes</Label>
                    <Textarea
                      id="garageNotes"
                      value={formData.garageNotes}
                      onChange={(e) => handleInputChange('garageNotes', e.target.value)}
                      rows={3}
                      placeholder="Add notes about garage operations, repairs, or status..."
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="technical" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Technical Details</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="manufacturingDate">Manufacturing Date</Label>
                    <Input
                      id="manufacturingDate"
                      type="date"
                      value={formData.manufacturingDate}
                      onChange={(e) => handleInputChange('manufacturingDate', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="shipmentCode">Shipment Code</Label>
                    <Input
                      id="shipmentCode"
                      value={formData.shipmentCode}
                      onChange={(e) => handleInputChange('shipmentCode', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="rangeExtenderNumber">Range Extender Number</Label>
                    <Input
                      id="rangeExtenderNumber"
                      value={formData.rangeExtenderNumber}
                      onChange={(e) => handleInputChange('rangeExtenderNumber', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="highVoltageBatteryNumber">HV Battery Number</Label>
                    <Input
                      id="highVoltageBatteryNumber"
                      value={formData.highVoltageBatteryNumber}
                      onChange={(e) => handleInputChange('highVoltageBatteryNumber', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="frontMotorNumber">Front Motor Number</Label>
                    <Input
                      id="frontMotorNumber"
                      value={formData.frontMotorNumber}
                      onChange={(e) => handleInputChange('frontMotorNumber', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="rearMotorNumber">Rear Motor Number</Label>
                    <Input
                      id="rearMotorNumber"
                      value={formData.rearMotorNumber}
                      onChange={(e) => handleInputChange('rearMotorNumber', e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="client" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Client Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="clientName">Client Name</Label>
                    <Input
                      id="clientName"
                      value={formData.clientName}
                      onChange={(e) => handleInputChange('clientName', e.target.value)}
                      placeholder="Full name of the client"
                    />
                  </div>
                  <div>
                    <Label htmlFor="clientPhone">Phone Number</Label>
                    <Input
                      id="clientPhone"
                      value={formData.clientPhone}
                      onChange={(e) => handleInputChange('clientPhone', e.target.value)}
                      placeholder="+971-XX-XXX-XXXX"
                    />
                  </div>
                  <div>
                    <Label htmlFor="clientEmail">Email Address</Label>
                    <Input
                      id="clientEmail"
                      type="email"
                      value={formData.clientEmail}
                      onChange={(e) => handleInputChange('clientEmail', e.target.value)}
                      placeholder="client@email.com"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="notes">General Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      rows={4}
                      placeholder="Add any additional notes about the vehicle or client..."
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t flex-shrink-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-monza-yellow text-monza-black hover:bg-monza-yellow/80">
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditGarageCarDialog; 