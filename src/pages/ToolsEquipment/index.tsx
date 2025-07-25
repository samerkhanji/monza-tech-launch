import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Wrench, 
  Package, 
  Search, 
  Plus, 
  Download, 
  Upload, 
  Calculator,
  MapPin,
  Calendar,
  TrendingDown,
  Activity,
  DollarSign,
  Building,
  Zap,
  Settings,
  Edit,
  Eye,
  Clock,
  User,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { toolsEquipmentService, Tool, DepreciationCalculation } from '@/services/toolsEquipmentService';
import AddToolDialog from './components/AddToolDialog';
import EditToolDialog from './components/EditToolDialog';
import ToolDetailsDialog from './components/ToolDetailsDialog';
import DepreciationCalculatorDialog from './components/DepreciationCalculatorDialog';
import SellToolDialog from './components/SellToolDialog';
import TableSearch from '@/components/ui/table-search';

const ToolsEquipmentPage: React.FC = () => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [filteredTools, setFilteredTools] = useState<Tool[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCondition, setSelectedCondition] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [viewingTool, setViewingTool] = useState<Tool | null>(null);
  const [isDepreciationCalculatorOpen, setIsDepreciationCalculatorOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState('tools');
  const [sellingTool, setSellingTool] = useState<Tool | null>(null);

  useEffect(() => {
    loadTools();
  }, []);

  useEffect(() => {
    filterTools();
  }, [tools, searchQuery, selectedLocation, selectedType, selectedCondition]);

  const loadTools = () => {
    const allTools = toolsEquipmentService.getAllTools();
    setTools(allTools);
  };

  const filterTools = () => {
    let filtered = tools.filter(tool => {
      const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           tool.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           tool.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (tool.serialNumber && tool.serialNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
                           tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           tool.supplier.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           tool.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (tool.assignedTo && tool.assignedTo.toLowerCase().includes(searchQuery.toLowerCase())) ||
                           tool.condition.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (tool.notes && tool.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesLocation = selectedLocation === 'all' || tool.location === selectedLocation;
      const matchesType = selectedType === 'all' || tool.type === selectedType;
      const matchesCondition = selectedCondition === 'all' || tool.condition === selectedCondition;

      return matchesSearch && matchesLocation && matchesType && matchesCondition;
    });

    setFilteredTools(filtered);
  };

  const handleAddTool = (toolData: any) => {
    toolsEquipmentService.addTool(toolData);
    loadTools();
    setIsAddDialogOpen(false);
    toast({
      title: "Tool Added",
      description: "New tool has been successfully added to the inventory.",
    });
  };

  const handleEditTool = (toolData: any) => {
    if (editingTool) {
      toolsEquipmentService.updateTool(editingTool.id, toolData);
      loadTools();
      setEditingTool(null);
      toast({
        title: "Tool Updated",
        description: "Tool information has been successfully updated.",
      });
    }
  };

  const handleDeleteTool = (toolId: string) => {
    if (window.confirm('Are you sure you want to delete this tool?')) {
      toolsEquipmentService.deleteTool(toolId);
      loadTools();
      toast({
        title: "Tool Deleted",
        description: "Tool has been successfully removed from the inventory.",
        variant: "destructive"
      });
    }
  };

  const handleSellTool = (saleData: {
    salePrice: number;
    soldTo: string;
    soldBy: string;
    saleReason: string;
    saleNotes?: string;
  }) => {
    if (sellingTool) {
      toolsEquipmentService.sellTool(sellingTool.id, saleData);
      loadTools();
      setSellingTool(null);
      toast({
        title: "Tool Sold",
        description: `${sellingTool.name} has been successfully sold for $${saleData.salePrice.toLocaleString()}.`,
      });
    }
  };

  const handleExport = () => {
    const exportData = toolsEquipmentService.exportData();
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tools-equipment-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: "Tools and equipment data has been exported successfully.",
    });
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (toolsEquipmentService.importData(content)) {
        loadTools();
        toast({
          title: "Import Complete",
          description: "Tools and equipment data has been imported successfully.",
        });
      } else {
        toast({
          title: "Import Failed",
          description: "Failed to import data. Please check the file format.",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
  };

  const getConditionColor = (condition: Tool['condition']) => {
    switch (condition) {
      case 'excellent': return 'bg-green-100 text-green-800 border-green-300';
      case 'good': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'fair': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'poor': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'needs_repair': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getLocationIcon = (location: Tool['location']) => {
    switch (location) {
      case 'garage': return <Wrench className="h-4 w-4" />;
      case 'showroom': return <Building className="h-4 w-4" />;
      case 'events': return <Zap className="h-4 w-4" />;
      case 'office': return <Settings className="h-4 w-4" />;
      case 'storage': return <Package className="h-4 w-4" />;
      default: return <MapPin className="h-4 w-4" />;
    }
  };

  const summary = toolsEquipmentService.getToolsSummary();

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Tools & Equipment Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track tools, equipment, depreciation, and usage across all locations
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => setIsDepreciationCalculatorOpen(true)}
            className="border-purple-200 text-purple-700 hover:bg-purple-50"
          >
            <Calculator className="mr-2 h-4 w-4" />
            Depreciation Calculator
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <label htmlFor="import-tools" className="cursor-pointer">
            <Button variant="outline" asChild>
              <span>
                <Upload className="mr-2 h-4 w-4" />
                Import
              </span>
            </Button>
          </label>
          <input
            id="import-tools"
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImport}
          />
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Tool/Equipment
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Items</p>
                <p className="text-2xl font-bold">{summary.totalTools}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Original Value</p>
                <p className="text-2xl font-bold">${summary.totalValue.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Value</p>
                <p className="text-2xl font-bold">${summary.totalCurrentValue.toLocaleString()}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Depreciation</p>
                <p className="text-2xl font-bold text-orange-600">${summary.totalDepreciation.toLocaleString()}</p>
              </div>
              <Calculator className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList>
          <TabsTrigger value="tools">All Tools & Equipment</TabsTrigger>
          <TabsTrigger value="garage">Garage ({summary.byLocation.garage || 0})</TabsTrigger>
          <TabsTrigger value="showroom">Showroom ({summary.byLocation.showroom || 0})</TabsTrigger>
          <TabsTrigger value="events">Events ({summary.byLocation.events || 0})</TabsTrigger>
          <TabsTrigger value="office">Office ({summary.byLocation.office || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tools..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <select
              className="h-10 rounded-md border border-input bg-background px-3 py-2"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
            >
              <option value="all">All Locations</option>
              <option value="garage">Garage</option>
              <option value="showroom">Showroom</option>
              <option value="events">Events</option>
              <option value="office">Office</option>
              <option value="storage">Storage</option>
            </select>

            <select
              className="h-10 rounded-md border border-input bg-background px-3 py-2"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="tool">Tools</option>
              <option value="equipment">Equipment</option>
            </select>

            <select
              className="h-10 rounded-md border border-input bg-background px-3 py-2"
              value={selectedCondition}
              onChange={(e) => setSelectedCondition(e.target.value)}
            >
              <option value="all">All Conditions</option>
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
              <option value="needs_repair">Needs Repair</option>
            </select>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {filteredTools.length} items
              </span>
            </div>
          </div>

          {/* Tools Table */}
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tool/Equipment</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Purchase Price</TableHead>
                    <TableHead>Current Value</TableHead>
                    <TableHead>Condition</TableHead>
                    <TableHead>Usage Hours</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTools.map((tool) => {
                    const depreciation = toolsEquipmentService.calculateDepreciation(tool);
                    return (
                      <TableRow key={tool.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{tool.name}</div>
                            <div className="text-sm text-muted-foreground">{tool.description}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {tool.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{tool.category}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getLocationIcon(tool.location)}
                            <span className="capitalize">{tool.location}</span>
                          </div>
                        </TableCell>
                        <TableCell>${tool.purchasePrice.toLocaleString()}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">${depreciation.currentValue.toLocaleString()}</div>
                            <div className="text-sm text-red-600">
                              -{depreciation.depreciationRate}%/year
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getConditionColor(tool.condition)}>
                            {tool.condition.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            {tool.usageHours}h
                          </div>
                        </TableCell>
                        <TableCell>
                          {tool.assignedTo ? (
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4 text-muted-foreground" />
                              {tool.assignedTo}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Unassigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setViewingTool(tool)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingTool(tool)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSellingTool(tool)}
                              className="text-green-600 hover:text-green-700"
                              title="Sell tool"
                            >
                              <DollarSign className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      {isAddDialogOpen && (
        <AddToolDialog
          isOpen={isAddDialogOpen}
          onClose={() => setIsAddDialogOpen(false)}
          onSave={handleAddTool}
        />
      )}

      {editingTool && (
        <EditToolDialog
          isOpen={!!editingTool}
          tool={editingTool}
          onClose={() => setEditingTool(null)}
          onSave={handleEditTool}
        />
      )}

      {viewingTool && (
        <ToolDetailsDialog
          isOpen={!!viewingTool}
          tool={viewingTool}
          onClose={() => setViewingTool(null)}
        />
      )}

      {isDepreciationCalculatorOpen && (
        <DepreciationCalculatorDialog
          isOpen={isDepreciationCalculatorOpen}
          onClose={() => setIsDepreciationCalculatorOpen(false)}
        />
      )}

      <SellToolDialog
        isOpen={!!sellingTool}
        tool={sellingTool}
        onClose={() => setSellingTool(null)}
        onSell={handleSellTool}
      />
    </div>
  );
};

export default ToolsEquipmentPage; 