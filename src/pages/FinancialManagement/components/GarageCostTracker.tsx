import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Plus, 
  Wrench, 
  Zap, 
  Users, 
  Package, 
  FileText, 
  DollarSign,
  Clock,
  Car,
  Calculator,
  Save,
  Download,
  Upload
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { GarageCostTrackingService, GarageCostSettings, LaborCost, PartsCost, ToolsCost, OtherCosts, WorkOrderCostSummary } from '@/services/garageCostTrackingService';

const GarageCostTracker: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [settings, setSettings] = useState<GarageCostSettings>(GarageCostTrackingService.getSettings());
  const [workOrderSummaries, setWorkOrderSummaries] = useState<WorkOrderCostSummary[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddPartsOpen, setIsAddPartsOpen] = useState(false);
  const [isAddToolsOpen, setIsAddToolsOpen] = useState(false);
  const [isAddOtherOpen, setIsAddOtherOpen] = useState(false);
  
  // Forms state
  const [partsForm, setPartsForm] = useState({
    carVin: '',
    carModel: '',
    partNumber: '',
    partName: '',
    quantity: 1,
    unitCost: 0,
    supplier: '',
    mechanicName: '',
    notes: ''
  });

  const [toolsForm, setToolsForm] = useState({
    carVin: '',
    carModel: '',
    toolName: '',
    toolType: 'consumable' as ToolsCost['toolType'],
    cost: 0,
    quantity: 1,
    usageHours: 0,
    mechanicName: '',
    notes: ''
  });

  const [otherForm, setOtherForm] = useState({
    carVin: '',
    carModel: '',
    costCategory: '',
    description: '',
    cost: 0,
    recordedBy: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setWorkOrderSummaries(GarageCostTrackingService.getAllWorkOrderSummaries());
  };

  const handleUpdateSettings = () => {
    GarageCostTrackingService.updateSettings(settings);
    toast({
      title: 'Settings Updated',
      description: 'Garage cost settings have been saved successfully',
    });
    setIsSettingsOpen(false);
  };

  const handleAddParts = () => {
    if (!partsForm.carVin || !partsForm.partName || !partsForm.mechanicName) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    GarageCostTrackingService.addPartsCost({
      ...partsForm,
      totalCost: partsForm.quantity * partsForm.unitCost
    });

    toast({
      title: 'Parts Cost Added',
      description: `Added ${partsForm.partName} cost for ${partsForm.carModel}`,
    });

    setPartsForm({
      carVin: '',
      carModel: '',
      partNumber: '',
      partName: '',
      quantity: 1,
      unitCost: 0,
      supplier: '',
      mechanicName: '',
      notes: ''
    });
    setIsAddPartsOpen(false);
    loadData();
  };

  const handleAddTools = () => {
    if (!toolsForm.carVin || !toolsForm.toolName || !toolsForm.mechanicName) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    GarageCostTrackingService.addToolsCost(toolsForm);

    toast({
      title: 'Tools Cost Added',
      description: `Added ${toolsForm.toolName} cost for ${toolsForm.carModel}`,
    });

    setToolsForm({
      carVin: '',
      carModel: '',
      toolName: '',
      toolType: 'consumable',
      cost: 0,
      quantity: 1,
      usageHours: 0,
      mechanicName: '',
      notes: ''
    });
    setIsAddToolsOpen(false);
    loadData();
  };

  const handleAddOther = () => {
    if (!otherForm.carVin || !otherForm.description || !otherForm.recordedBy) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    GarageCostTrackingService.addOtherCost(otherForm);

    toast({
      title: 'Other Cost Added',
      description: `Added ${otherForm.costCategory} cost for ${otherForm.carModel}`,
    });

    setOtherForm({
      carVin: '',
      carModel: '',
      costCategory: '',
      description: '',
      cost: 0,
      recordedBy: ''
    });
    setIsAddOtherOpen(false);
    loadData();
  };

  const totalCosts = workOrderSummaries.reduce((sum, summary) => sum + summary.grandTotal, 0);
  const totalLaborHours = workOrderSummaries.reduce((sum, summary) => sum + summary.totalLaborHours, 0);
  const avgCostPerHour = totalLaborHours > 0 ? totalCosts / totalLaborHours : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Garage Cost Tracking</h2>
          <p className="text-muted-foreground">Track labor, parts, electricity, and other garage expenses</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Garage Cost Settings</DialogTitle>
                <DialogDescription>
                  Configure monthly averages and rates for automatic cost calculations
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="electricityRate">Electricity Rate ($/kWh)</Label>
                    <Input
                      id="electricityRate"
                      type="number"
                      step="0.01"
                      value={settings.monthlyElectricityRate}
                      onChange={(e) => setSettings({...settings, monthlyElectricityRate: Number(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="kwhPerHour">Avg kWh per Work Hour</Label>
                    <Input
                      id="kwhPerHour"
                      type="number"
                      step="0.1"
                      value={settings.averageKwhPerHour}
                      onChange={(e) => setSettings({...settings, averageKwhPerHour: Number(e.target.value)})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="laborRate">Labor Rate ($/hour)</Label>
                    <Input
                      id="laborRate"
                      type="number"
                      step="1"
                      value={settings.laborRatePerHour}
                      onChange={(e) => setSettings({...settings, laborRatePerHour: Number(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="overheadCost">Overhead Cost ($/day)</Label>
                    <Input
                      id="overheadCost"
                      type="number"
                      step="1"
                      value={settings.overheadCostPerDay}
                      onChange={(e) => setSettings({...settings, overheadCostPerDay: Number(e.target.value)})}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="equipmentDepreciation">Equipment Depreciation ($/hour)</Label>
                  <Input
                    id="equipmentDepreciation"
                    type="number"
                    step="0.1"
                    value={settings.equipmentDepreciationPerHour}
                    onChange={(e) => setSettings({...settings, equipmentDepreciationPerHour: Number(e.target.value)})}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleUpdateSettings}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Settings
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Costs</p>
                <p className="text-2xl font-bold">${totalCosts.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Labor Hours</p>
                <p className="text-2xl font-bold">{totalLaborHours.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calculator className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Avg Cost/Hour</p>
                <p className="text-2xl font-bold">${avgCostPerHour.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Car className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Work Orders</p>
                <p className="text-2xl font-bold">{workOrderSummaries.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="add-costs">Add Costs</TabsTrigger>
          <TabsTrigger value="work-orders">Work Orders</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Current Settings</CardTitle>
                <CardDescription>Current garage cost calculation settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Electricity Rate:</span>
                  <Badge variant="secondary">${settings.monthlyElectricityRate}/kWh</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Labor Rate:</span>
                  <Badge variant="secondary">${settings.laborRatePerHour}/hour</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Daily Overhead:</span>
                  <Badge variant="secondary">${settings.overheadCostPerDay}/day</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Equipment Depreciation:</span>
                  <Badge variant="secondary">${settings.equipmentDepreciationPerHour}/hour</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest cost entries</CardDescription>
              </CardHeader>
              <CardContent>
                {workOrderSummaries.slice(0, 5).map((summary) => (
                  <div key={summary.workOrderId} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium">{summary.carModel}</p>
                      <p className="text-sm text-muted-foreground">VIN: {summary.carVin}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${summary.grandTotal.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">{summary.totalLaborHours.toFixed(1)}h</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="add-costs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Add Parts Cost */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Add Parts Cost
                </CardTitle>
                <CardDescription>Record parts used and their costs</CardDescription>
              </CardHeader>
              <CardContent>
                <Dialog open={isAddPartsOpen} onOpenChange={setIsAddPartsOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Parts
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Add Parts Cost</DialogTitle>
                      <DialogDescription>Record parts used for a specific car</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="partsCarVin">Car VIN</Label>
                          <Input
                            id="partsCarVin"
                            value={partsForm.carVin}
                            onChange={(e) => setPartsForm({...partsForm, carVin: e.target.value})}
                            placeholder="Enter VIN"
                          />
                        </div>
                        <div>
                          <Label htmlFor="partsCarModel">Car Model</Label>
                          <Input
                            id="partsCarModel"
                            value={partsForm.carModel}
                            onChange={(e) => setPartsForm({...partsForm, carModel: e.target.value})}
                            placeholder="Enter model"
                          />
                        </div>
                      </div>
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
                            value={partsForm.quantity}
                            onChange={(e) => setPartsForm({...partsForm, quantity: Number(e.target.value)})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="unitCost">Unit Cost ($)</Label>
                          <Input
                            id="unitCost"
                            type="number"
                            step="0.01"
                            value={partsForm.unitCost}
                            onChange={(e) => setPartsForm({...partsForm, unitCost: Number(e.target.value)})}
                          />
                        </div>
                        <div>
                          <Label>Total Cost</Label>
                          <Input
                            value={`$${(partsForm.quantity * partsForm.unitCost).toFixed(2)}`}
                            disabled
                          />
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
                        <Label htmlFor="partsMechanic">Mechanic Name *</Label>
                        <Input
                          id="partsMechanic"
                          value={partsForm.mechanicName}
                          onChange={(e) => setPartsForm({...partsForm, mechanicName: e.target.value})}
                          placeholder="Mechanic name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="partsNotes">Notes</Label>
                        <Textarea
                          id="partsNotes"
                          value={partsForm.notes}
                          onChange={(e) => setPartsForm({...partsForm, notes: e.target.value})}
                          placeholder="Additional notes"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" onClick={handleAddParts}>
                        Add Parts Cost
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            {/* Add Tools Cost */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Add Tools Cost
                </CardTitle>
                <CardDescription>Record tool usage and costs</CardDescription>
              </CardHeader>
              <CardContent>
                <Dialog open={isAddToolsOpen} onOpenChange={setIsAddToolsOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Tools
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Add Tools Cost</DialogTitle>
                      <DialogDescription>Record tool usage for a specific car</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="toolsCarVin">Car VIN</Label>
                          <Input
                            id="toolsCarVin"
                            value={toolsForm.carVin}
                            onChange={(e) => setToolsForm({...toolsForm, carVin: e.target.value})}
                            placeholder="Enter VIN"
                          />
                        </div>
                        <div>
                          <Label htmlFor="toolsCarModel">Car Model</Label>
                          <Input
                            id="toolsCarModel"
                            value={toolsForm.carModel}
                            onChange={(e) => setToolsForm({...toolsForm, carModel: e.target.value})}
                            placeholder="Enter model"
                          />
                        </div>
                      </div>
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
                        <Select
                          value={toolsForm.toolType}
                          onValueChange={(value: ToolsCost['toolType']) => setToolsForm({...toolsForm, toolType: value})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="consumable">Consumable</SelectItem>
                            <SelectItem value="equipment_usage">Equipment Usage</SelectItem>
                            <SelectItem value="rental">Rental</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="toolCost">Cost ($)</Label>
                          <Input
                            id="toolCost"
                            type="number"
                            step="0.01"
                            value={toolsForm.cost}
                            onChange={(e) => setToolsForm({...toolsForm, cost: Number(e.target.value)})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="toolQuantity">Quantity</Label>
                          <Input
                            id="toolQuantity"
                            type="number"
                            value={toolsForm.quantity}
                            onChange={(e) => setToolsForm({...toolsForm, quantity: Number(e.target.value)})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="usageHours">Usage Hours</Label>
                          <Input
                            id="usageHours"
                            type="number"
                            step="0.1"
                            value={toolsForm.usageHours}
                            onChange={(e) => setToolsForm({...toolsForm, usageHours: Number(e.target.value)})}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="toolsMechanic">Mechanic Name *</Label>
                        <Input
                          id="toolsMechanic"
                          value={toolsForm.mechanicName}
                          onChange={(e) => setToolsForm({...toolsForm, mechanicName: e.target.value})}
                          placeholder="Mechanic name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="toolsNotes">Notes</Label>
                        <Textarea
                          id="toolsNotes"
                          value={toolsForm.notes}
                          onChange={(e) => setToolsForm({...toolsForm, notes: e.target.value})}
                          placeholder="Additional notes"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" onClick={handleAddTools}>
                        Add Tools Cost
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            {/* Add Other Costs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Add Other Costs
                </CardTitle>
                <CardDescription>Record miscellaneous expenses</CardDescription>
              </CardHeader>
              <CardContent>
                <Dialog open={isAddOtherOpen} onOpenChange={setIsAddOtherOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Other
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Add Other Cost</DialogTitle>
                      <DialogDescription>Record miscellaneous expenses for a specific car</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="otherCarVin">Car VIN</Label>
                          <Input
                            id="otherCarVin"
                            value={otherForm.carVin}
                            onChange={(e) => setOtherForm({...otherForm, carVin: e.target.value})}
                            placeholder="Enter VIN"
                          />
                        </div>
                        <div>
                          <Label htmlFor="otherCarModel">Car Model</Label>
                          <Input
                            id="otherCarModel"
                            value={otherForm.carModel}
                            onChange={(e) => setOtherForm({...otherForm, carModel: e.target.value})}
                            placeholder="Enter model"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="costCategory">Cost Category</Label>
                        <Input
                          id="costCategory"
                          value={otherForm.costCategory}
                          onChange={(e) => setOtherForm({...otherForm, costCategory: e.target.value})}
                          placeholder="e.g., Materials, Services, etc."
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">Description *</Label>
                        <Textarea
                          id="description"
                          value={otherForm.description}
                          onChange={(e) => setOtherForm({...otherForm, description: e.target.value})}
                          placeholder="Describe the expense"
                        />
                      </div>
                      <div>
                        <Label htmlFor="otherCost">Cost ($)</Label>
                        <Input
                          id="otherCost"
                          type="number"
                          step="0.01"
                          value={otherForm.cost}
                          onChange={(e) => setOtherForm({...otherForm, cost: Number(e.target.value)})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="recordedBy">Recorded By *</Label>
                        <Input
                          id="recordedBy"
                          value={otherForm.recordedBy}
                          onChange={(e) => setOtherForm({...otherForm, recordedBy: e.target.value})}
                          placeholder="Your name"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" onClick={handleAddOther}>
                        Add Other Cost
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="work-orders">
          <Card>
            <CardHeader>
              <CardTitle>Work Order Cost Summaries</CardTitle>
              <CardDescription>Detailed cost breakdown for each work order</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workOrderSummaries.map((summary) => (
                  <Card key={summary.workOrderId} className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold">{summary.carModel}</h3>
                        <p className="text-sm text-muted-foreground">VIN: {summary.carVin}</p>
                        <p className="text-sm text-muted-foreground">Work Order: {summary.workOrderId}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">${summary.grandTotal.toFixed(2)}</p>
                        <Badge variant={summary.isCompleted ? 'default' : 'secondary'}>
                          {summary.isCompleted ? 'Completed' : 'In Progress'}
                        </Badge>
                      </div>
                    </div>
                    <Separator className="my-4" />
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Labor</p>
                        <p className="font-medium">${summary.totalLaborCost.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">{summary.totalLaborHours.toFixed(1)}h</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Electricity</p>
                        <p className="font-medium">${summary.totalElectricityCost.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Parts</p>
                        <p className="font-medium">${summary.totalPartsCost.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Tools</p>
                        <p className="font-medium">${summary.totalToolsCost.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Other</p>
                        <p className="font-medium">${summary.totalOtherCosts.toFixed(2)}</p>
                      </div>
                    </div>
                  </Card>
                ))}
                {workOrderSummaries.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No work orders found. Costs will appear here when labor is tracked.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Export Data</CardTitle>
                <CardDescription>Download all garage cost data</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => {
                    const data = GarageCostTrackingService.exportData();
                    const blob = new Blob([data], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `garage-costs-${new Date().toISOString().split('T')[0]}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="w-full"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Data
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Import Data</CardTitle>
                <CardDescription>Upload previously exported data</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.json';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                          try {
                            const data = e.target?.result as string;
                            GarageCostTrackingService.importData(data);
                            loadData();
                            toast({
                              title: 'Data Imported',
                              description: 'Garage cost data has been imported successfully',
                            });
                          } catch (error) {
                            toast({
                              title: 'Import Failed',
                              description: 'Failed to import data. Please check the file format.',
                              variant: 'destructive'
                            });
                          }
                        };
                        reader.readAsText(file);
                      }
                    };
                    input.click();
                  }}
                  className="w-full"
                  variant="outline"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Import Data
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GarageCostTracker; 