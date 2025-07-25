import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Edit3, Settings, Ruler, Zap, Wrench, Package, Gauge, Thermometer } from 'lucide-react';
import { TechnicalSpecification, InventoryItem } from '@/types/inventory';

interface TechnicalSpecsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem;
  onSave: (itemId: string, updates: Partial<InventoryItem>) => void;
}

const TechnicalSpecsDialog: React.FC<TechnicalSpecsDialogProps> = ({
  isOpen,
  onClose,
  item,
  onSave
}) => {
  const [technicalSpecs, setTechnicalSpecs] = useState<TechnicalSpecification[]>(item.technicalSpecs || []);
  const [basicSpecs, setBasicSpecs] = useState({
    weight: item.weight || '',
    material: item.material || '',
    color: item.color || '',
    dimensions: {
      length: item.dimensions?.length || '',
      width: item.dimensions?.width || '',
      height: item.dimensions?.height || '',
      unit: item.dimensions?.unit || 'mm'
    },
    warranty: {
      duration: item.warranty?.duration || '',
      unit: item.warranty?.unit || 'months',
      terms: item.warranty?.terms || ''
    },
    compatibleModels: item.compatibleModels?.join(', ') || '',
    installationNotes: item.installationNotes || '',
    safetyInstructions: item.safetyInstructions || ''
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
      name: newSpec.name,
      value: newSpec.value,
      unit: newSpec.unit,
      category: newSpec.category as TechnicalSpecification['category'],
      description: newSpec.description
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
            name: newSpec.name,
            value: newSpec.value,
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
    const updates: Partial<InventoryItem> = {
      technicalSpecs,
      weight: basicSpecs.weight ? Number(basicSpecs.weight) : undefined,
      material: basicSpecs.material || undefined,
      color: basicSpecs.color || undefined,
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
      safetyInstructions: basicSpecs.safetyInstructions || undefined
    };

    onSave(item.id, updates);
    onClose();
  };

  const handleBasicSpecChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setBasicSpecs(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev],
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
            Technical Specifications - {item.partName}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="specs">Technical Specs</TabsTrigger>
            <TabsTrigger value="notes">Installation & Safety</TabsTrigger>
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
                    <Label htmlFor="weight">Weight</Label>
                    <div className="flex gap-2">
                      <Input
                        id="weight"
                        type="number"
                        step="0.01"
                        value={basicSpecs.weight}
                        onChange={(e) => handleBasicSpecChange('weight', e.target.value)}
                        placeholder="0.00"
                        className="flex-1"
                      />
                      <span className="flex items-center px-3 text-sm text-muted-foreground">kg</span>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="material">Material</Label>
                    <Input
                      id="material"
                      value={basicSpecs.material}
                      onChange={(e) => handleBasicSpecChange('material', e.target.value)}
                      placeholder="e.g., Aluminum, Steel, Plastic"
                    />
                  </div>

                  <div>
                    <Label htmlFor="color">Color</Label>
                    <Input
                      id="color"
                      value={basicSpecs.color}
                      onChange={(e) => handleBasicSpecChange('color', e.target.value)}
                      placeholder="e.g., Black, Silver, Red"
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
                      value={basicSpecs.dimensions.unit}
                      onValueChange={(value) => handleBasicSpecChange('dimensions.unit', value)}
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
                        value={basicSpecs.dimensions.length}
                        onChange={(e) => handleBasicSpecChange('dimensions.length', e.target.value)}
                        placeholder="0.0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="width">Width</Label>
                      <Input
                        id="width"
                        type="number"
                        step="0.1"
                        value={basicSpecs.dimensions.width}
                        onChange={(e) => handleBasicSpecChange('dimensions.width', e.target.value)}
                        placeholder="0.0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="height">Height</Label>
                      <Input
                        id="height"
                        type="number"
                        step="0.1"
                        value={basicSpecs.dimensions.height}
                        onChange={(e) => handleBasicSpecChange('dimensions.height', e.target.value)}
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
                      placeholder="Model 1, Model 2, Model 3"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="specs" className="space-y-4">
            {/* Add New Spec */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {editingSpecId ? 'Edit Specification' : 'Add New Specification'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div>
                    <Label htmlFor="spec-name">Name</Label>
                    <Input
                      id="spec-name"
                      value={newSpec.name || ''}
                      onChange={(e) => setNewSpec({ ...newSpec, name: e.target.value })}
                      placeholder="e.g., Voltage"
                    />
                  </div>
                  <div>
                    <Label htmlFor="spec-value">Value</Label>
                    <Input
                      id="spec-value"
                      value={newSpec.value || ''}
                      onChange={(e) => setNewSpec({ ...newSpec, value: e.target.value })}
                      placeholder="e.g., 12"
                    />
                  </div>
                  <div>
                    <Label htmlFor="spec-unit">Unit</Label>
                    <Input
                      id="spec-unit"
                      value={newSpec.unit || ''}
                      onChange={(e) => setNewSpec({ ...newSpec, unit: e.target.value })}
                      placeholder="e.g., V, A, °C"
                    />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Select
                      value={newSpec.category || 'other'}
                      onValueChange={(value) => setNewSpec({ ...newSpec, category: value as TechnicalSpecification['category'] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {specCategories.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={editingSpecId ? handleUpdateSpec : handleAddSpec}
                      disabled={!newSpec.name || !newSpec.value}
                      className="w-full"
                    >
                      {editingSpecId ? 'Update' : <><Plus className="h-4 w-4 mr-1" /> Add</>}
                    </Button>
                  </div>
                </div>
                {newSpec.description !== undefined && (
                  <div className="mt-4">
                    <Label htmlFor="spec-description">Description (Optional)</Label>
                    <Input
                      id="spec-description"
                      value={newSpec.description}
                      onChange={(e) => setNewSpec({ ...newSpec, description: e.target.value })}
                      placeholder="Additional details about this specification"
                    />
                  </div>
                )}
                {editingSpecId && (
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setNewSpec({ name: '', value: '', unit: '', category: 'other', description: '' });
                        setEditingSpecId(null);
                      }}
                    >
                      Cancel Edit
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Display Specs by Category */}
            <div className="space-y-4">
              {Object.entries(groupedSpecs).map(([category, specs]) => (
                <Card key={category}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {getCategoryIcon(category)}
                      {specCategories.find(cat => cat.value === category)?.label || 'Other'}
                      <Badge variant="secondary">{specs.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {specs.map(spec => (
                        <div key={spec.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{spec.name}:</span>
                              <span>{spec.value}</span>
                              {spec.unit && <span className="text-sm text-muted-foreground">{spec.unit}</span>}
                            </div>
                            {spec.description && (
                              <p className="text-sm text-muted-foreground mt-1">{spec.description}</p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditSpec(spec.id)}
                            >
                              <Edit3 className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteSpec(spec.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {technicalSpecs.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Technical Specifications</h3>
                  <p className="text-muted-foreground">
                    Add technical specifications to provide detailed information about this part.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="notes" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Installation Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={basicSpecs.installationNotes}
                    onChange={(e) => handleBasicSpecChange('installationNotes', e.target.value)}
                    placeholder="Enter installation instructions, requirements, or special notes..."
                    rows={6}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Safety Instructions</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={basicSpecs.safetyInstructions}
                    onChange={(e) => handleBasicSpecChange('safetyInstructions', e.target.value)}
                    placeholder="Enter safety warnings, precautions, or special handling instructions..."
                    rows={6}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Technical Specifications
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TechnicalSpecsDialog; 