import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tool } from '@/services/toolsEquipmentService';
import { Clock, User, MapPin, DollarSign, Settings, AlertTriangle } from 'lucide-react';
import { safeParseFloat } from '@/utils/errorHandling';
import { toast } from '@/hooks/use-toast';

interface EditToolDialogProps {
  isOpen: boolean;
  tool: Tool | null;
  onClose: () => void;
  onSave: (toolData: any) => void;
}

const EditToolDialog: React.FC<EditToolDialogProps> = ({ isOpen, tool, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'tool',
    category: '',
    purchasePrice: '',
    location: 'garage',
    description: '',
    purchasedBy: '',
    supplier: '',
    usageHours: '',
    depreciationRate: '',
    condition: 'excellent',
    assignedTo: '',
    notes: '',
    serialNumber: '',
    warrantyExpiry: '',
    purchaseDate: ''
  });

  useEffect(() => {
    if (tool) {
      setFormData({
        name: tool.name || '',
        type: tool.type || 'tool',
        category: tool.category || '',
        purchasePrice: tool.purchasePrice?.toString() || '',
        location: tool.location || 'garage',
        description: tool.description || '',
        purchasedBy: tool.purchasedBy || '',
        supplier: tool.supplier || '',
        usageHours: tool.usageHours?.toString() || '0',
        depreciationRate: tool.depreciationRate?.toString() || '20',
        condition: tool.condition || 'excellent',
        assignedTo: tool.assignedTo || '',
        notes: tool.notes || '',
        serialNumber: tool.serialNumber || '',
        warrantyExpiry: tool.warrantyExpiry || '',
        purchaseDate: tool.purchaseDate?.split('T')[0] || ''
      });
    }
  }, [tool]);

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

    const updatedToolData = {
      name: formData.name,
      type: formData.type,
      category: formData.category,
      purchasePrice: safeParseFloat(formData.purchasePrice, 0),
      location: formData.location,
      description: formData.description,
      purchasedBy: formData.purchasedBy,
      supplier: formData.supplier,
      usageHours: safeParseFloat(formData.usageHours, 0),
      depreciationRate: safeParseFloat(formData.depreciationRate, 20),
      condition: formData.condition,
      assignedTo: formData.assignedTo || null,
      notes: formData.notes,
      serialNumber: formData.serialNumber || undefined,
      warrantyExpiry: formData.warrantyExpiry || undefined,
      purchaseDate: formData.purchaseDate
    };

    onSave(updatedToolData);
    onClose();
  };

  const handleReset = () => {
    if (tool) {
      setFormData({
        name: tool.name || '',
        type: tool.type || 'tool',
        category: tool.category || '',
        purchasePrice: tool.purchasePrice?.toString() || '',
        location: tool.location || 'garage',
        description: tool.description || '',
        purchasedBy: tool.purchasedBy || '',
        supplier: tool.supplier || '',
        usageHours: tool.usageHours?.toString() || '0',
        depreciationRate: tool.depreciationRate?.toString() || '20',
        condition: tool.condition || 'excellent',
        assignedTo: tool.assignedTo || '',
        notes: tool.notes || '',
        serialNumber: tool.serialNumber || '',
        warrantyExpiry: tool.warrantyExpiry || '',
        purchaseDate: tool.purchaseDate?.split('T')[0] || ''
      });
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'fair': return 'bg-yellow-100 text-yellow-800';
      case 'poor': return 'bg-orange-100 text-orange-800';
      case 'needs_repair': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!tool) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-600" />
            Edit Tool: {tool.name}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Information</TabsTrigger>
            <TabsTrigger value="financial">Financial & Usage</TabsTrigger>
            <TabsTrigger value="details">Additional Details</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit}>
            <TabsContent value="basic" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                      <SelectTrigger id="type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tool">Tool</SelectItem>
                        <SelectItem value="equipment">Equipment</SelectItem>
                      </SelectContent>
                    </Select>
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
                    <Select value={formData.location} onValueChange={(value) => setFormData(prev => ({ ...prev, location: value }))}>
                      <SelectTrigger id="location">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="garage">Garage</SelectItem>
                        <SelectItem value="showroom">Showroom</SelectItem>
                        <SelectItem value="events">Events</SelectItem>
                        <SelectItem value="office">Office</SelectItem>
                        <SelectItem value="storage">Storage</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="condition">Condition</Label>
                    <Select value={formData.condition} onValueChange={(value) => setFormData(prev => ({ ...prev, condition: value }))}>
                      <SelectTrigger id="condition">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="excellent">Excellent</SelectItem>
                        <SelectItem value="good">Good</SelectItem>
                        <SelectItem value="fair">Fair</SelectItem>
                        <SelectItem value="poor">Poor</SelectItem>
                        <SelectItem value="needs_repair">Needs Repair</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="assignedTo">Assigned To</Label>
                    <Input
                      id="assignedTo"
                      value={formData.assignedTo}
                      onChange={(e) => setFormData(prev => ({ ...prev, assignedTo: e.target.value }))}
                      placeholder="Employee name"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="financial" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Financial & Usage Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <Label htmlFor="purchaseDate">Purchase Date</Label>
                    <Input
                      id="purchaseDate"
                      type="date"
                      value={formData.purchaseDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, purchaseDate: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="depreciationRate">Depreciation Rate (% per year)</Label>
                    <Input
                      id="depreciationRate"
                      type="number"
                      step="0.1"
                      value={formData.depreciationRate}
                      onChange={(e) => setFormData(prev => ({ ...prev, depreciationRate: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="usageHours">Usage Hours</Label>
                    <Input
                      id="usageHours"
                      type="number"
                      step="0.1"
                      value={formData.usageHours}
                      onChange={(e) => setFormData(prev => ({ ...prev, usageHours: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="supplier">Supplier</Label>
                    <Input
                      id="supplier"
                      value={formData.supplier}
                      onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
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

                  {/* Current Tool Status */}
                  <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Current Status
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Current Value:</span>
                        <p className="font-medium">${tool.currentValue?.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Last Used:</span>
                        <p className="font-medium">
                          {tool.lastUsed ? new Date(tool.lastUsed).toLocaleDateString() : 'Never'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Condition:</span>
                        <Badge className={getConditionColor(tool.condition)}>
                          {tool.condition.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-gray-600">Status:</span>
                        <Badge variant={tool.isActive ? "default" : "secondary"}>
                          {tool.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Additional Details</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="serialNumber">Serial Number</Label>
                    <Input
                      id="serialNumber"
                      value={formData.serialNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, serialNumber: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="warrantyExpiry">Warranty Expiry</Label>
                    <Input
                      id="warrantyExpiry"
                      type="date"
                      value={formData.warrantyExpiry}
                      onChange={(e) => setFormData(prev => ({ ...prev, warrantyExpiry: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      rows={4}
                      placeholder="Additional notes, maintenance reminders, special instructions..."
                    />
                  </div>

                  {/* Maintenance History */}
                  {tool.maintenanceHistory && tool.maintenanceHistory.length > 0 && (
                    <div className="md:col-span-2">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Recent Maintenance History
                      </h4>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {tool.maintenanceHistory.slice(-3).map((record, index) => (
                          <div key={index} className="bg-gray-50 p-3 rounded border-l-4 border-blue-500">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-sm">{record.description}</p>
                                <p className="text-xs text-gray-600">
                                  {new Date(record.date).toLocaleDateString()} • ${record.cost} • {record.performedBy}
                                </p>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {record.type}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <div className="flex justify-between items-center pt-6 border-t">
              <div className="text-sm text-gray-500">
                Created: {new Date(tool.createdAt).toLocaleDateString()} • 
                Last Updated: {new Date(tool.updatedAt).toLocaleDateString()}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={handleReset}>
                  Reset
                </Button>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit">
                  Save Changes
                </Button>
              </div>
            </div>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default EditToolDialog; 