import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { 
  Settings, 
  Plus, 
  Trash2, 
  Package, 
  Ruler, 
  Zap, 
  Gauge, 
  Thermometer, 
  Wrench 
} from 'lucide-react';
import { Car, TechnicalSpecification } from '../types';

interface CarTechnicalSpecsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  car: Car;
  onSave: (carId: string, updates: Partial<Car>) => void;
}

const CarTechnicalSpecsDialog: React.FC<CarTechnicalSpecsDialogProps> = ({
  isOpen,
  onClose,
  car,
  onSave
}) => {
  const [technicalSpecs, setTechnicalSpecs] = useState<TechnicalSpecification[]>(car.technicalSpecs || []);
  const [basicSpecs, setBasicSpecs] = useState({
    weight: car.weight?.toString() || '',
    material: car.material || '',
    dimensions: {
      length: car.dimensions?.length?.toString() || '',
      width: car.dimensions?.width?.toString() || '',
      height: car.dimensions?.height?.toString() || '',
      unit: car.dimensions?.unit || 'mm'
    },
    warranty: {
      duration: car.warranty?.duration?.toString() || '',
      unit: car.warranty?.unit || 'months',
      terms: car.warranty?.terms || ''
    },
    compatibleModels: car.compatibleModels?.join(', ') || '',
    installationNotes: car.installationNotes || '',
    safetyInstructions: car.safetyInstructions || '',
    customerRequirements: car.customerRequirements || ''
  });
  const [newSpec, setNewSpec] = useState<Partial<TechnicalSpecification>>({
    name: '',
    value: '',
    unit: '',
    category: 'other',
    description: ''
  });
  const [editingSpecId, setEditingSpecId] = useState<string | null>(null);

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

  const handleSave = () => {
    const updates: Partial<Car> = {
      technicalSpecs,
      weight: basicSpecs.weight ? Number(basicSpecs.weight) : undefined,
      material: basicSpecs.material || undefined,
      dimensions: {
        length: basicSpecs.dimensions.length ? Number(basicSpecs.dimensions.length) : undefined,
        width: basicSpecs.dimensions.width ? Number(basicSpecs.dimensions.width) : undefined,
        height: basicSpecs.dimensions.height ? Number(basicSpecs.dimensions.height) : undefined,
        unit: basicSpecs.dimensions.unit as 'mm' | 'cm' | 'in'
      },
      warranty: basicSpecs.warranty.duration ? {
        duration: Number(basicSpecs.warranty.duration),
        unit: basicSpecs.warranty.unit as 'months' | 'years',
        terms: basicSpecs.warranty.terms || undefined
      } : undefined,
      compatibleModels: basicSpecs.compatibleModels ? basicSpecs.compatibleModels.split(',').map(s => s.trim()).filter(Boolean) : undefined,
      installationNotes: basicSpecs.installationNotes || undefined,
      safetyInstructions: basicSpecs.safetyInstructions || undefined,
      customerRequirements: basicSpecs.customerRequirements || undefined
    };

    onSave(car.id, updates);
    onClose();

    toast({
      title: "Technical Specifications Updated",
      description: "Technical specifications have been saved successfully.",
    });
  };

  const handleBasicSpecChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setBasicSpecs(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as Record<string, any> || {}),
          [child]: value
        }
      }));
    } else {
      setBasicSpecs(prev => ({ ...prev, [field]: value }));
    }
  };

  const groupedSpecs = technicalSpecs.reduce((acc, spec) => {
    if (!acc[spec.category]) {
      acc[spec.category] = [];
    }
    acc[spec.category].push(spec);
    return acc;
  }, {} as Record<string, TechnicalSpecification[]>);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Technical Specifications - {car.brand} {car.model} ({car.year})
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="specs">Technical Specs</TabsTrigger>
            <TabsTrigger value="notes">Installation & Safety</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {/* Warranty & Compatibility */}
              <Card>
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
                        value={basicSpecs.warranty.duration}
                        onChange={(e) => handleBasicSpecChange('warranty.duration', e.target.value)}
                        placeholder="12"
                      />
                    </div>
                    <div>
                      <Label>Warranty Unit</Label>
                      <Select
                        value={basicSpecs.warranty.unit}
                        onValueChange={(value) => handleBasicSpecChange('warranty.unit', value)}
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
                        value={basicSpecs.warranty.terms}
                        onChange={(e) => handleBasicSpecChange('warranty.terms', e.target.value)}
                        placeholder="Limited warranty"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="compatible-models">Compatible Models (comma-separated)</Label>
                    <Input
                      id="compatible-models"
                      value={basicSpecs.compatibleModels}
                      onChange={(e) => handleBasicSpecChange('compatibleModels', e.target.value)}
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  value={basicSpecs.installationNotes}
                  onChange={(e) => handleBasicSpecChange('installationNotes', e.target.value)}
                  placeholder="Special installation requirements or notes..."
                  rows={3}
                />
              </div>

                              <div>
                  <Label htmlFor="safety-instructions">Safety Instructions</Label>
                  <Textarea
                    id="safety-instructions"
                    value={basicSpecs.safetyInstructions}
                    onChange={(e) => handleBasicSpecChange('safetyInstructions', e.target.value)}
                    placeholder="Important safety considerations..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="customer-requirements">Customer Requirements</Label>
                  <Textarea
                    id="customer-requirements"
                    value={basicSpecs.customerRequirements}
                    onChange={(e) => handleBasicSpecChange('customerRequirements', e.target.value)}
                    placeholder="Specific customer requirements or special requests..."
                    rows={3}
                  />
                </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Technical Specifications
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CarTechnicalSpecsDialog; 