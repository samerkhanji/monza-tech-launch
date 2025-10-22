import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Car, User, Wrench, FileText, CheckCircle, Settings, Plus, Trash2, Package, Ruler, Zap, Gauge, Thermometer } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { TechnicalSpecification } from '../types';

interface AddCarDialogProps {
  onClose: () => void;
  onAdd: (carData: any) => Promise<void>;
}

interface CarFormData {
  // Basic Car Information
  vin: string;
  brand: string;
  model: string;
  year: string;
  color: string;
  category: 'EV' | 'REV' | 'ICEV' | 'Other';
  customModelName?: string;
  batteryPercentage?: number;
  
  // Location & Status
  currentLocation: 'Garage' | 'Inventory' | 'Showroom 1' | 'Showroom 2';
  status: 'in_stock' | 'sold' | 'reserved';
  customs?: 'paid' | 'not_paid' | 'pending';
  
  // Additional Information
  notes: string;
  
  // Technical Specifications
  weight?: string;
  material?: string;
  dimensions?: {
    length?: string;
    width?: string;
    height?: string;
    unit: 'mm' | 'cm' | 'in';
  };
  warranty?: {
    duration?: string;
    unit: 'months' | 'years';
    terms?: string;
  };
  compatibleModels?: string;
  installationNotes?: string;
  safetyInstructions?: string;
  customerRequirements?: string;
}

export default function AddCarDialog({ onClose, onAdd }: AddCarDialogProps) {
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState('basic');
  const [formData, setFormData] = useState<CarFormData>({
    vin: '',
    brand: '',
    model: '',
    year: new Date().getFullYear().toString(),
    color: '',
    category: 'EV',
    batteryPercentage: 100,
    status: 'in_stock',
    notes: '',
    currentLocation: 'Inventory',
    customs: 'not_paid',
    weight: '',
    material: '',
    dimensions: {
      length: '',
      width: '',
      height: '',
      unit: 'mm'
    },
    warranty: {
      duration: '',
      unit: 'months',
      terms: ''
    },
    compatibleModels: '',
    installationNotes: '',
    safetyInstructions: '',
    customerRequirements: ''
  });

  const [technicalSpecs, setTechnicalSpecs] = useState<TechnicalSpecification[]>([]);
  const [newSpec, setNewSpec] = useState<Partial<TechnicalSpecification>>({
    name: '',
    value: '',
    unit: '',
    category: 'other',
    description: ''
  });
  const [editingSpecId, setEditingSpecId] = useState<string | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = (step: string): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 'basic':
        if (!formData.vin) newErrors.vin = 'VIN is required';
        if (!formData.brand) newErrors.brand = 'Brand is required';
        if (!formData.model) newErrors.model = 'Model is required';
        if (!formData.year) newErrors.year = 'Year is required';
        if (!formData.color) newErrors.color = 'Color is required';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;

    const steps = ['basic', 'location', 'tech', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const handlePrevious = () => {
    const steps = ['basic', 'location', 'tech', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const updateFormData = (field: keyof CarFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFormDataChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as Record<string, any> || {}),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = async () => {
    if (!validateStep('location')) return;

    setLoading(true);

    try {
      const carData = {
        vinNumber: formData.vin,
        brand: formData.brand,
        model: formData.model,
        year: parseInt(formData.year),
        color: formData.color,
        category: formData.category,
        customModelName: formData.customModelName,
        batteryPercentage: formData.batteryPercentage,
        customs: formData.customs,
        currentFloor: formData.currentLocation,
        status: formData.status,
        notes: formData.notes,
        arrivalDate: new Date().toISOString(),
        inShowroom: formData.currentLocation === 'Showroom 1' || formData.currentLocation === 'Showroom 2',
        showroomEntryDate: (formData.currentLocation === 'Showroom 1' || formData.currentLocation === 'Showroom 2') ? new Date().toISOString() : undefined,
        pdiCompleted: false,
        // Include technical specifications
        technicalSpecs: technicalSpecs,
        weight: formData.weight ? Number(formData.weight) : undefined,
        material: formData.material || undefined,
        dimensions: {
          length: formData.dimensions?.length ? Number(formData.dimensions.length) : undefined,
          width: formData.dimensions?.width ? Number(formData.dimensions.width) : undefined,
          height: formData.dimensions?.height ? Number(formData.dimensions.height) : undefined,
          unit: formData.dimensions?.unit || 'mm'
        },
        warranty: formData.warranty?.duration ? {
          duration: Number(formData.warranty.duration),
          unit: formData.warranty.unit,
          terms: formData.warranty.terms || undefined
        } : undefined,
        compatibleModels: formData.compatibleModels ? formData.compatibleModels.split(',').map(s => s.trim()).filter(Boolean) : undefined,
        installationNotes: formData.installationNotes || undefined,
        safetyInstructions: formData.safetyInstructions || undefined,
        customerRequirements: formData.customerRequirements || undefined
      };

      await onAdd(carData);

      toast({
        title: 'Success!',
        description: `Car ${formData.brand} ${formData.model} has been added to inventory.`,
      });

      onClose();
      resetForm();
    } catch (error) {
      console.error('Error adding car:', error);
      toast({
        title: 'Error',
        description: 'Failed to add car. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      vin: '',
      brand: '',
      model: '',
      year: new Date().getFullYear().toString(),
      color: '',
      category: 'EV',
      batteryPercentage: 100,
      status: 'in_stock',
      notes: '',
      currentLocation: 'Inventory',
      customs: 'not_paid',
      weight: '',
      material: '',
      dimensions: {
        length: '',
        width: '',
        height: '',
        unit: 'mm'
      },
      warranty: {
        duration: '',
        unit: 'months',
        terms: ''
      },
      compatibleModels: '',
      installationNotes: '',
      safetyInstructions: '',
      customerRequirements: ''
    });
    setTechnicalSpecs([]);
    setNewSpec({ name: '', value: '', unit: '', category: 'other', description: '' });
    setEditingSpecId(null);
    setCurrentStep('basic');
    setErrors({});
  };

  const specCategories = [
    { value: 'dimensions', label: 'Dimensions', icon: Ruler },
    { value: 'electrical', label: 'Electrical', icon: Zap },
    { value: 'mechanical', label: 'Mechanical', icon: Wrench },
    { value: 'material', label: 'Material', icon: Package },
    { value: 'performance', label: 'Performance', icon: Gauge },
    { value: 'environmental', label: 'Environmental', icon: Thermometer },
    { value: 'other', label: 'Other', icon: Settings }
  ];

  const getCategoryIcon = (category: string) => {
    const categoryData = specCategories.find(cat => cat.value === category);
    const Icon = categoryData?.icon || Settings;
    return <Icon className="h-4 w-4" />;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      dimensions: 'bg-blue-100 text-blue-800',
      electrical: 'bg-yellow-100 text-yellow-800',
      mechanical: 'bg-green-100 text-green-800',
      material: 'bg-purple-100 text-purple-800',
      performance: 'bg-red-100 text-red-800',
      environmental: 'bg-teal-100 text-teal-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[category as keyof typeof colors] || colors.other;
  };

  const handleAddSpec = () => {
    if (!newSpec.name || !newSpec.value) return;

    const spec: TechnicalSpecification = {
      id: Date.now().toString(),
      name: newSpec.name || '',
      value: newSpec.value || '',
      unit: newSpec.unit || '',
      category: newSpec.category as TechnicalSpecification['category'],
      description: newSpec.description || ''
    };

    setTechnicalSpecs([...technicalSpecs, spec]);
    setNewSpec({ name: '', value: '', unit: '', category: 'other', description: '' });
  };

  const handleEditSpec = (specId: string) => {
    const spec = technicalSpecs.find(s => s.id === specId);
    if (spec) {
      setNewSpec(spec);
      setEditingSpecId(specId);
    }
  };

  const handleUpdateSpec = () => {
    if (!newSpec.name || !newSpec.value || !editingSpecId) return;

    const updatedSpecs = technicalSpecs.map(spec =>
      spec.id === editingSpecId
        ? {
            ...spec,
            name: newSpec.name || '',
            value: newSpec.value || '',
            unit: newSpec.unit || '',
            category: newSpec.category as TechnicalSpecification['category'],
            description: newSpec.description || ''
          }
        : spec
    );

    setTechnicalSpecs(updatedSpecs);
    setNewSpec({ name: '', value: '', unit: '', category: 'other', description: '' });
    setEditingSpecId(null);
  };

  const handleDeleteSpec = (specId: string) => {
    setTechnicalSpecs(technicalSpecs.filter(spec => spec.id !== specId));
  };

  const getStepIcon = (step: string) => {
    switch (step) {
      case 'basic': return <Car className="h-4 w-4" />;
      case 'location': return <Clock className="h-4 w-4" />;
      case 'tech': return <Settings className="h-4 w-4" />;
      case 'review': return <CheckCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getStepTitle = (step: string) => {
    switch (step) {
      case 'basic': return 'Vehicle Information';
      case 'location': return 'Location & Status';
      case 'tech': return 'Technical Specs';
      case 'review': return 'Review & Submit';
      default: return 'Step';
    }
  };

  const steps = ['basic', 'location', 'tech', 'review'];
  const currentStepIndex = steps.indexOf(currentStep);

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Add New Car to Inventory
          </DialogTitle>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {steps.map((step, index) => (
            <div
              key={step}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                index <= currentStepIndex
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {getStepIcon(step)}
              <span className="text-sm font-medium">{getStepTitle(step)}</span>
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="space-y-6">
          {currentStep === 'basic' && (
            <Card>
              <CardHeader>
                <CardTitle>Vehicle Information</CardTitle>
                <CardDescription>Enter basic vehicle details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="vin">VIN Number *</Label>
                    <Input
                      id="vin"
                      value={formData.vin}
                      onChange={(e) => updateFormData('vin', e.target.value)}
                      placeholder="17-character VIN"
                      className={errors.vin ? 'border-red-500' : ''}
                    />
                    {errors.vin && <p className="text-red-500 text-sm mt-1">{errors.vin}</p>}
                  </div>
                  <div>
                    <Label htmlFor="brand">Brand *</Label>
                    <Input
                      id="brand"
                      value={formData.brand}
                      onChange={(e) => updateFormData('brand', e.target.value)}
                      placeholder="e.g. Voyah, MHero, Tesla, BMW, Mercedes"
                      className={errors.brand ? 'border-red-500' : ''}
                    />
                    {errors.brand && <p className="text-red-500 text-sm mt-1">{errors.brand}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="model">Model *</Label>
                    <Input
                      id="model"
                      value={formData.model}
                      onChange={(e) => updateFormData('model', e.target.value)}
                      placeholder="e.g. Free, Dream, Model 3"
                      className={errors.model ? 'border-red-500' : ''}
                    />
                    {errors.model && <p className="text-red-500 text-sm mt-1">{errors.model}</p>}
                  </div>
                  <div>
                    <Label htmlFor="year">Year *</Label>
                    <Input
                      id="year"
                      type="number"
                      value={formData.year}
                      onChange={(e) => updateFormData('year', e.target.value)}
                      min="2020"
                      max="2025"
                      className={errors.year ? 'border-red-500' : ''}
                    />
                    {errors.year && <p className="text-red-500 text-sm mt-1">{errors.year}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="color">Color *</Label>
                    <Input
                      id="color"
                      value={formData.color}
                      onChange={(e) => updateFormData('color', e.target.value)}
                      placeholder="e.g. Pearl White, Midnight Silver"
                      className={errors.color ? 'border-red-500' : ''}
                    />
                    {errors.color && <p className="text-red-500 text-sm mt-1">{errors.color}</p>}
                  </div>
                  <div>
                    <Label htmlFor="category">Vehicle Category</Label>
                    <Select value={formData.category} onValueChange={(value) => updateFormData('category', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EV">EV (Electric Vehicle)</SelectItem>
                        <SelectItem value="REV">REV (Range Extended)</SelectItem>
                        <SelectItem value="ICEV">ICEV (Internal Combustion)</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customModelName">Custom Model Name (Optional)</Label>
                    <Input
                      id="customModelName"
                      value={formData.customModelName || ''}
                      onChange={(e) => updateFormData('customModelName', e.target.value)}
                      placeholder="Custom display name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="batteryPercentage">Battery Percentage</Label>
                    <Input
                      id="batteryPercentage"
                      type="number"
                      value={formData.batteryPercentage || 100}
                      onChange={(e) => updateFormData('batteryPercentage', parseInt(e.target.value))}
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 'location' && (
            <Card>
              <CardHeader>
                <CardTitle>Location & Status</CardTitle>
                <CardDescription>Enter location and status details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customs">Customs Status</Label>
                    <Select value={formData.customs} onValueChange={(value) => updateFormData('customs', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="not_paid">Not Paid</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="status">Initial Status</Label>
                    <Select value={formData.status} onValueChange={(value) => updateFormData('status', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="in_stock">In Stock</SelectItem>
                        <SelectItem value="reserved">Reserved</SelectItem>
                        <SelectItem value="sold">Sold</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="currentLocation">Current Location</Label>
                  <Select value={formData.currentLocation} onValueChange={(value) => updateFormData('currentLocation', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Inventory">Inventory</SelectItem>
                      <SelectItem value="Garage">Garage</SelectItem>
                      <SelectItem value="Showroom 1">Showroom 1</SelectItem>
                      <SelectItem value="Showroom 2">Showroom 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => updateFormData('notes', e.target.value)}
                    placeholder="Additional notes about this vehicle..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="customerRequirements">Customer Requirements (Optional)</Label>
                  <Textarea
                    id="customerRequirements"
                    value={formData.customerRequirements || ''}
                    onChange={(e) => handleFormDataChange('customerRequirements', e.target.value)}
                    placeholder="Specific customer requirements or special requests..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 'tech' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Technical Specifications (Optional)
                </CardTitle>
                <CardDescription>Add technical specifications and dimensions for this vehicle</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="basic">Basic Info</TabsTrigger>
                    <TabsTrigger value="specs">Technical Specs</TabsTrigger>
                    <TabsTrigger value="notes">Notes</TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Physical Properties */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            Physical Properties
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <Label htmlFor="weight">Weight (kg)</Label>
                            <Input
                              id="weight"
                              type="number"
                              step="0.01"
                              value={formData.weight || ''}
                              onChange={(e) => handleFormDataChange('weight', e.target.value)}
                              placeholder="e.g., 1800"
                            />
                          </div>

                          <div>
                            <Label htmlFor="material">Primary Material</Label>
                            <Input
                              id="material"
                              value={formData.material || ''}
                              onChange={(e) => handleFormDataChange('material', e.target.value)}
                              placeholder="e.g., Aluminum, Steel, Carbon Fiber"
                            />
                          </div>
                        </CardContent>
                      </Card>

                      {/* Dimensions */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Ruler className="h-4 w-4" />
                            Dimensions
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <Label>Unit</Label>
                            <Select
                              value={formData.dimensions?.unit}
                              onValueChange={(value) => handleFormDataChange('dimensions.unit', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="mm">Millimeters (mm)</SelectItem>
                                <SelectItem value="cm">Centimeters (cm)</SelectItem>
                                <SelectItem value="in">Inches (in)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <Label htmlFor="length">Length</Label>
                              <Input
                                id="length"
                                type="number"
                                step="0.1"
                                value={formData.dimensions?.length || ''}
                                onChange={(e) => handleFormDataChange('dimensions.length', e.target.value)}
                                placeholder="0.0"
                              />
                            </div>
                            <div>
                              <Label htmlFor="width">Width</Label>
                              <Input
                                id="width"
                                type="number"
                                step="0.1"
                                value={formData.dimensions?.width || ''}
                                onChange={(e) => handleFormDataChange('dimensions.width', e.target.value)}
                                placeholder="0.0"
                              />
                            </div>
                            <div>
                              <Label htmlFor="height">Height</Label>
                              <Input
                                id="height"
                                type="number"
                                step="0.1"
                                value={formData.dimensions?.height || ''}
                                onChange={(e) => handleFormDataChange('dimensions.height', e.target.value)}
                                placeholder="0.0"
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Warranty & Compatibility */}
                      <Card className="md:col-span-2">
                        <CardHeader>
                          <CardTitle className="text-lg">Warranty & Compatibility</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <Label htmlFor="warranty-duration">Warranty Duration</Label>
                              <Input
                                id="warranty-duration"
                                type="number"
                                value={formData.warranty?.duration || ''}
                                onChange={(e) => handleFormDataChange('warranty.duration', e.target.value)}
                                placeholder="12"
                              />
                            </div>
                            <div>
                              <Label>Warranty Unit</Label>
                              <Select
                                value={formData.warranty?.unit}
                                onValueChange={(value) => handleFormDataChange('warranty.unit', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="months">Months</SelectItem>
                                  <SelectItem value="years">Years</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="warranty-terms">Warranty Terms</Label>
                              <Input
                                id="warranty-terms"
                                value={formData.warranty?.terms || ''}
                                onChange={(e) => handleFormDataChange('warranty.terms', e.target.value)}
                                placeholder="Limited warranty"
                              />
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="compatible-models">Compatible Models (comma-separated)</Label>
                            <Input
                              id="compatible-models"
                              value={formData.compatibleModels || ''}
                              onChange={(e) => handleFormDataChange('compatibleModels', e.target.value)}
                              placeholder="e.g., Voyah Free, Voyah Dream, Voyah Passion"
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="specs" className="space-y-4">
                    {/* Add New Specification */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          {editingSpecId ? 'Edit Specification' : 'Add New Specification'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <Label htmlFor="spec-name">Name</Label>
                            <Input
                              id="spec-name"
                              value={newSpec.name || ''}
                              onChange={(e) => setNewSpec(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="e.g., Top Speed"
                            />
                          </div>
                          <div>
                            <Label htmlFor="spec-value">Value</Label>
                            <Input
                              id="spec-value"
                              value={newSpec.value || ''}
                              onChange={(e) => setNewSpec(prev => ({ ...prev, value: e.target.value }))}
                              placeholder="e.g., 250"
                            />
                          </div>
                          <div>
                            <Label htmlFor="spec-unit">Unit</Label>
                            <Input
                              id="spec-unit"
                              value={newSpec.unit || ''}
                              onChange={(e) => setNewSpec(prev => ({ ...prev, unit: e.target.value }))}
                              placeholder="e.g., km/h"
                            />
                          </div>
                          <div>
                            <Label>Category</Label>
                            <Select
                              value={newSpec.category}
                              onValueChange={(value) => setNewSpec(prev => ({ ...prev, category: value as TechnicalSpecification['category'] }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {specCategories.map(cat => (
                                  <SelectItem key={cat.value} value={cat.value}>
                                    <div className="flex items-center gap-2">
                                      {getCategoryIcon(cat.value)}
                                      {cat.label}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="spec-description">Description (Optional)</Label>
                          <Textarea
                            id="spec-description"
                            value={newSpec.description || ''}
                            onChange={(e) => setNewSpec(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Additional description..."
                            rows={2}
                          />
                        </div>

                        <div className="flex gap-2">
                          <Button
                            type="button"
                            onClick={editingSpecId ? handleUpdateSpec : handleAddSpec}
                            disabled={!newSpec.name || !newSpec.value}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            {editingSpecId ? 'Update Specification' : 'Add Specification'}
                          </Button>
                          {editingSpecId && (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setNewSpec({ name: '', value: '', unit: '', category: 'other', description: '' });
                                setEditingSpecId(null);
                              }}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Existing Specifications */}
                    {technicalSpecs.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Current Technical Specifications</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {technicalSpecs.map((spec) => (
                              <div key={spec.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <Badge className={getCategoryColor(spec.category)}>
                                    {getCategoryIcon(spec.category)}
                                    {specCategories.find(cat => cat.value === spec.category)?.label || 'Other'}
                                  </Badge>
                                  <div>
                                    <div className="font-medium">
                                      {spec.name}: {spec.value} {spec.unit}
                                    </div>
                                    {spec.description && (
                                      <div className="text-sm text-muted-foreground">{spec.description}</div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditSpec(spec.id)}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteSpec(spec.id)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  <TabsContent value="notes" className="space-y-4">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="installation-notes">Installation Notes</Label>
                        <Textarea
                          id="installation-notes"
                          value={formData.installationNotes || ''}
                          onChange={(e) => handleFormDataChange('installationNotes', e.target.value)}
                          placeholder="Special installation requirements or notes..."
                          rows={3}
                        />
                      </div>

                      <div>
                        <Label htmlFor="safety-instructions">Safety Instructions</Label>
                        <Textarea
                          id="safety-instructions"
                          value={formData.safetyInstructions || ''}
                          onChange={(e) => handleFormDataChange('safetyInstructions', e.target.value)}
                          placeholder="Important safety considerations..."
                          rows={3}
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}

          {currentStep === 'review' && (
            <Card>
              <CardHeader>
                <CardTitle>Review & Submit</CardTitle>
                <CardDescription>Please review the information before adding to inventory</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-sm text-gray-600">Vehicle Information</h4>
                    <p><strong>VIN:</strong> {formData.vin}</p>
                    <p><strong>Brand:</strong> {formData.brand}</p>
                    <p><strong>Model:</strong> {formData.model}</p>
                    <p><strong>Year:</strong> {formData.year}</p>
                    <p><strong>Color:</strong> {formData.color}</p>
                    <p><strong>Category:</strong> {formData.category}</p>
                    {formData.customModelName && <p><strong>Custom Name:</strong> {formData.customModelName}</p>}
                    <p><strong>Battery:</strong> {formData.batteryPercentage}%</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-600">Location & Status</h4>
                    <p><strong>Customs:</strong> {formData.customs}</p>
                    <p><strong>Status:</strong> {formData.status}</p>
                    <p><strong>Location:</strong> {formData.currentLocation}</p>
                    {formData.notes && <p><strong>Notes:</strong> {formData.notes}</p>}
                    {formData.customerRequirements && <p><strong>Customer Requirements:</strong> {formData.customerRequirements}</p>}
                  </div>
                </div>

                {/* Technical Specifications Summary */}
                {(technicalSpecs.length > 0 || formData.weight || formData.material || formData.dimensions?.length || formData.warranty?.duration) && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-sm text-gray-600 mb-3">Technical Specifications</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        {formData.weight && <p><strong>Weight:</strong> {formData.weight} kg</p>}
                        {formData.material && <p><strong>Material:</strong> {formData.material}</p>}
                        {(formData.dimensions?.length || formData.dimensions?.width || formData.dimensions?.height) && (
                          <p><strong>Dimensions:</strong> {formData.dimensions?.length || 0} × {formData.dimensions?.width || 0} × {formData.dimensions?.height || 0} {formData.dimensions?.unit}</p>
                        )}
                        {formData.warranty?.duration && (
                          <p><strong>Warranty:</strong> {formData.warranty.duration} {formData.warranty.unit} {formData.warranty.terms && `(${formData.warranty.terms})`}</p>
                        )}
                        {formData.compatibleModels && <p><strong>Compatible Models:</strong> {formData.compatibleModels}</p>}
                      </div>
                      <div>
                        {technicalSpecs.length > 0 && (
                          <div>
                            <p className="font-medium mb-2">Custom Specifications ({technicalSpecs.length}):</p>
                            <div className="space-y-1">
                              {technicalSpecs.slice(0, 3).map((spec) => (
                                <p key={spec.id} className="text-sm">
                                  <strong>{spec.name}:</strong> {spec.value} {spec.unit}
                                </p>
                              ))}
                              {technicalSpecs.length > 3 && (
                                <p className="text-sm text-muted-foreground">
                                  + {technicalSpecs.length - 3} more specifications...
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <div className="flex gap-2">
            {currentStep !== 'basic' && (
              <Button type="button" variant="outline" onClick={handlePrevious}>
                Previous
              </Button>
            )}
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
          <div>
            {currentStep !== 'review' ? (
              <Button type="button" onClick={handleNext}>
                Next
              </Button>
            ) : (
              <Button type="button" onClick={handleSubmit} disabled={loading}>
                {loading ? 'Adding...' : 'Add Car'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 