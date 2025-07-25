import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Package, Wrench, FileText, Calculator } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { GarageCostTrackingService, ToolsCost } from '@/services/garageCostTrackingService';

interface ManualCostEntryDialogProps {
  carVin: string;
  carModel: string;
  mechanicName: string;
  workOrderId?: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const ManualCostEntryDialog: React.FC<ManualCostEntryDialogProps> = ({
  carVin,
  carModel,
  mechanicName,
  workOrderId,
  isOpen,
  onOpenChange
}) => {
  const [activeTab, setActiveTab] = useState('parts');
  
  // Parts form
  const [partsForm, setPartsForm] = useState({
    partNumber: '',
    partName: '',
    quantity: '1',
    unitCost: '',
    supplier: '',
    notes: ''
  });

  // Tools form
  const [toolsForm, setToolsForm] = useState({
    toolName: '',
    toolType: '',
    cost: '',
    quantity: '1',
    usageHours: '',
    notes: ''
  });

  // Other costs form
  const [otherForm, setOtherForm] = useState({
    costCategory: '',
    description: '',
    cost: 0,
    notes: ''
  });

  const handleAddParts = async () => {
    if (!partsForm.partName.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please enter a part name',
        variant: 'destructive'
      });
      return;
    }

    try {
      GarageCostTrackingService.addPartsCost({
        carVin,
        carModel,
        partNumber: partsForm.partNumber,
        partName: partsForm.partName,
        quantity: Number(partsForm.quantity),
        unitCost: Number(partsForm.unitCost),
        totalCost: Number(partsForm.quantity) * Number(partsForm.unitCost),
        supplier: partsForm.supplier,
        mechanicName,
        workOrderId,
        notes: partsForm.notes
      });

      toast({
        title: 'Parts Cost Added',
        description: `Added ${partsForm.partName} cost: $${(Number(partsForm.quantity) * Number(partsForm.unitCost)).toFixed(2)}`,
      });

      // Reset form
      setPartsForm({
        partNumber: '',
        partName: '',
        quantity: '1',
        unitCost: '',
        supplier: '',
        notes: ''
      });

    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add parts cost',
        variant: 'destructive'
      });
    }
  };

  const handleAddTools = async () => {
    if (!toolsForm.toolName.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please enter a tool name',
        variant: 'destructive'
      });
      return;
    }

    try {
      GarageCostTrackingService.addToolsCost({
        carVin,
        carModel,
        toolName: toolsForm.toolName,
        toolType: toolsForm.toolType,
        cost: Number(toolsForm.cost),
        quantity: Number(toolsForm.quantity),
        usageHours: Number(toolsForm.usageHours),
        mechanicName,
        workOrderId,
        notes: toolsForm.notes
      });

      toast({
        title: 'Tools Cost Added',
        description: `Added ${toolsForm.toolName} cost: $${Number(toolsForm.cost).toFixed(2)}`,
      });

      // Reset form
      setToolsForm({
        toolName: '',
        toolType: '',
        cost: '',
        quantity: '1',
        usageHours: '',
        notes: ''
      });

    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add tools cost',
        variant: 'destructive'
      });
    }
  };

  const handleAddOther = async () => {
    if (!otherForm.description.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please enter a description',
        variant: 'destructive'
      });
      return;
    }

    try {
      GarageCostTrackingService.addOtherCost({
        carVin,
        carModel,
        costCategory: otherForm.costCategory,
        description: otherForm.description,
        cost: otherForm.cost,
        recordedBy: mechanicName,
        workOrderId
      });

      toast({
        title: 'Other Cost Added',
        description: `Added ${otherForm.costCategory || 'other'} cost: $${otherForm.cost.toFixed(2)}`,
      });

      // Reset form
      setOtherForm({
        costCategory: '',
        description: '',
        cost: 0,
        notes: ''
      });

    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add other cost',
        variant: 'destructive'
      });
    }
  };

  const handleCloseDialog = () => {
    onOpenChange(false);
    // Reset all forms when closing
    setPartsForm({
      partNumber: '',
      partName: '',
      quantity: '1',
      unitCost: '',
      supplier: '',
      notes: ''
    });
    setToolsForm({
      toolName: '',
      toolType: '',
      cost: '',
      quantity: '1',
      usageHours: '',
      notes: ''
    });
    setOtherForm({
      costCategory: '',
      description: '',
      cost: 0,
      notes: ''
    });
    setActiveTab('parts');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCloseDialog}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Manual Cost Entry
          </DialogTitle>
          <div className="flex gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">{carModel}</Badge>
            <Badge variant="outline">VIN: {carVin.slice(-6)}</Badge>
            <Badge variant="outline">{mechanicName}</Badge>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="parts" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Parts
            </TabsTrigger>
            <TabsTrigger value="tools" className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Tools
            </TabsTrigger>
            <TabsTrigger value="other" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Other
            </TabsTrigger>
          </TabsList>

          <TabsContent value="parts" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="partNumber">Part Number</Label>
                <Input
                  id="partNumber"
                  value={partsForm.partNumber}
                  onChange={(e) => setPartsForm({...partsForm, partNumber: e.target.value})}
                  placeholder="Part #"
                />
              </div>
              <div>
                <Label htmlFor="partName">Part Name *</Label>
                <Input
                  id="partName"
                  value={partsForm.partName}
                  onChange={(e) => setPartsForm({...partsForm, partName: e.target.value})}
                  placeholder="Part name"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={partsForm.quantity}
                  onChange={(e) => setPartsForm({...partsForm, quantity: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="unitCost">Unit Cost ($)</Label>
                <Input
                  id="unitCost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={partsForm.unitCost}
                  onChange={(e) => setPartsForm({...partsForm, unitCost: e.target.value})}
                />
              </div>
              <div>
                <Label>Total Cost</Label>
                <div className="flex items-center h-10 px-3 py-2 border border-input bg-muted rounded-md">
                  <Calculator className="h-4 w-4 mr-2 text-muted-foreground" />
                  ${((Number(partsForm.quantity) || 0) * (Number(partsForm.unitCost) || 0)).toFixed(2)}
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor="supplier">Supplier</Label>
              <Input
                id="supplier"
                value={partsForm.supplier}
                onChange={(e) => setPartsForm({...partsForm, supplier: e.target.value})}
                placeholder="Supplier name"
              />
            </div>
            <div>
              <Label htmlFor="partsNotes">Notes</Label>
              <Textarea
                id="partsNotes"
                value={partsForm.notes}
                onChange={(e) => setPartsForm({...partsForm, notes: e.target.value})}
                placeholder="Additional notes"
                rows={2}
              />
            </div>
            <Button onClick={handleAddParts} className="w-full">
              Add Parts Cost - ${((Number(partsForm.quantity) || 0) * (Number(partsForm.unitCost) || 0)).toFixed(2)}
            </Button>
          </TabsContent>

          <TabsContent value="tools" className="space-y-4">
            <div>
              <Label htmlFor="toolName">Tool Name *</Label>
              <Input
                id="toolName"
                value={toolsForm.toolName}
                onChange={(e) => setToolsForm({...toolsForm, toolName: e.target.value})}
                placeholder="Tool name"
              />
            </div>
            <div>
              <Label htmlFor="toolType">Tool Type</Label>
              <Input
                id="toolType"
                value={toolsForm.toolType}
                onChange={(e) => setToolsForm({...toolsForm, toolType: e.target.value})}
                placeholder="Custom tool type"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="toolCost">Cost ($)</Label>
                <Input
                  id="toolCost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={toolsForm.cost}
                  onChange={(e) => setToolsForm({...toolsForm, cost: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="toolQuantity">Quantity</Label>
                <Input
                  id="toolQuantity"
                  type="number"
                  min="1"
                  value={toolsForm.quantity}
                  onChange={(e) => setToolsForm({...toolsForm, quantity: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="usageHours">Usage Hours</Label>
                <Input
                  id="usageHours"
                  type="number"
                  step="0.1"
                  min="0"
                  value={toolsForm.usageHours}
                  onChange={(e) => setToolsForm({...toolsForm, usageHours: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="toolsNotes">Notes</Label>
              <Textarea
                id="toolsNotes"
                value={toolsForm.notes}
                onChange={(e) => setToolsForm({...toolsForm, notes: e.target.value})}
                placeholder="Additional notes"
                rows={2}
              />
            </div>
            <Button onClick={handleAddTools} className="w-full">
              Add Tools Cost - ${(Number(toolsForm.cost) || 0).toFixed(2)}
            </Button>
          </TabsContent>

          <TabsContent value="other" className="space-y-4">
            <div>
              <Label htmlFor="costCategory">Cost Category</Label>
              <Input
                id="costCategory"
                value={otherForm.costCategory}
                onChange={(e) => setOtherForm({...otherForm, costCategory: e.target.value})}
                placeholder="e.g., Materials, Services, Miscellaneous"
              />
            </div>
            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={otherForm.description}
                onChange={(e) => setOtherForm({...otherForm, description: e.target.value})}
                placeholder="Describe the expense"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="otherCost">Cost ($)</Label>
              <Input
                id="otherCost"
                type="number"
                step="0.01"
                min="0"
                value={otherForm.cost}
                onChange={(e) => setOtherForm({...otherForm, cost: Number(e.target.value)})}
              />
            </div>
            <Button onClick={handleAddOther} className="w-full">
              Add Other Cost - ${otherForm.cost.toFixed(2)}
            </Button>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={handleCloseDialog}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ManualCostEntryDialog; 