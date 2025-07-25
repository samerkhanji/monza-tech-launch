import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { dateUtils, numberUtils, stringUtils, validationUtils } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Download, Upload, Plus, Search, Edit, Package, Settings } from 'lucide-react';
import { InventoryItem, VehicleType } from '@/types/inventory';
import AddAccessoryDialog from './components/AddAccessoryDialog';
import EditAccessoryDialog from './components/EditAccessoryDialog';
import TechnicalSpecsDialog from '@/components/inventory/TechnicalSpecsDialog';
import RealExcelService from '@/services/realExcelService';
import RealExcelService from '@/services/realExcelService';

// Sample showroom inventory data - accessories only
const showroomInventory: InventoryItem[] = [
  {
    id: 'sr-1',
    carModel: 'Voyah Dream',
    partName: 'Floor Mats Premium',
    partNumber: 'VD-FM-001',
    quantity: 8,
    location: {
      shelf: 'A1',
      column: '1',
      row: '2',
      room: 'Display Storage',
      floor: 'Floor 1'
    },
    lastUpdated: '2025-05-20T14:30:00',
    supplier: 'DF',
    vehicleType: 'EV',
    category: 'accessory',
    vin: '',
    pdiStatus: 'pending'
  },
  {
    id: 'sr-2',
    carModel: 'Voyah Free',
    partName: 'Wireless Charger Pad',
    partNumber: 'VF-WC-003',
    quantity: 5,
    location: {
      shelf: 'B2',
      column: '2',
      row: '1',
      room: 'Premium Display',
      floor: 'Floor 2'
    },
    lastUpdated: '2025-05-18T11:45:00',
    supplier: 'AZ',
    vehicleType: 'EV',
    category: 'accessory',
    vin: '',
    pdiStatus: 'pending'
  },
  {
    id: 'sr-3',
    carModel: 'Voyah Passion',
    partName: 'Dashboard Camera',
    partNumber: 'VP-DC-007',
    quantity: 3,
    location: {
      shelf: 'C1',
      column: '1',
      row: '3',
      room: 'Customer Area',
      floor: 'Floor 1'
    },
    lastUpdated: '2025-05-16T16:20:00',
    supplier: 'DF',
    vehicleType: 'Hybrid',
    category: 'accessory',
    vin: '',
    pdiStatus: 'pending'
  },
  {
    id: 'sr-4',
    carModel: 'Mhero',
    partName: 'Seat Covers Leather',
    partNumber: 'MH-SC-012',
    quantity: 6,
    location: {
      shelf: 'D3',
      column: '2',
      row: '1',
      room: 'Display Storage',
      floor: 'Floor 1'
    },
    lastUpdated: '2025-05-15T09:30:00',
    supplier: 'AZ',
    vehicleType: 'ICE',
    category: 'accessory',
    vin: '',
    pdiStatus: 'pending'
  }
];

const ShowroomInventoryPage: React.FC = () => {
  const location = useLocation();
  const [inventory, setInventory] = useState<InventoryItem[]>(showroomInventory);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVehicleType, setSelectedVehicleType] = useState<'All' | VehicleType>('All');
  const [selectedSupplier, setSelectedSupplier] = useState('All Suppliers');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [techSpecsItem, setTechSpecsItem] = useState<InventoryItem | null>(null);
  const [isTechSpecsDialogOpen, setIsTechSpecsDialogOpen] = useState(false);

  // Handle URL parameters for VIN filtering
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const vinParam = urlParams.get('vin');
    
    if (vinParam) {
      setSearchTerm(vinParam);
      // Auto-scroll to the item row or show notification
      setTimeout(() => {
        const matchingItem = inventory.find(item => 
          item.partName?.toLowerCase().includes(vinParam.toLowerCase()) ||
          item.partNumber?.toLowerCase().includes(vinParam.toLowerCase()) ||
          item.carModel?.toLowerCase().includes(vinParam.toLowerCase())
        );
        if (matchingItem) {
          // Success toast
          toast({
            title: "Item Found in Showroom Inventory",
            description: `Showing ${matchingItem.partName} for ${matchingItem.carModel} (${matchingItem.partNumber})`,
            duration: 5000,
          });
        } else {
          // Warning toast if not found
          toast({
            title: "Item Not Found",
            description: `No item found with search term: ${vinParam} in Showroom Inventory`,
            variant: "destructive",
            duration: 5000,
          });
        }
      }, 500); // Small delay to ensure inventory is loaded
    }
  }, [location.search, inventory]);

  // Get unique suppliers for filter dropdown
  const uniqueSuppliers = ['All Suppliers', ...Array.from(new Set(inventory.map(item => item.supplier || 'DF')))];

  // Filter inventory
  const filteredInventory = inventory.filter(item => {
    const matchesSearch = 
      searchTerm === '' || 
      item.partName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.carModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.room?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesVehicleType = 
      selectedVehicleType === 'All' || item.vehicleType === selectedVehicleType;
    
    const matchesSupplier =
      selectedSupplier === 'All Suppliers' || item.supplier === selectedSupplier;
    
    return matchesSearch && matchesVehicleType && matchesSupplier;
  });

  const handleExportToExcel = async () => {
    try {
      // Prepare data for export with formatted columns
      const exportData = filteredInventory.map(item => ({
        'Car Model': item.carModel,
        'Accessory Name': item.partName,
        'Part Number': item.partNumber,
        'Vehicle Type': item.vehicleType,
        'Quantity': item.quantity,
        'Supplier': item.supplier,
        'Room': item.location.room,
        'Location': `${item.location.shelf}-${item.location.column}-${item.location.row}`,
        'Floor': item.location.floor,
        'Last Updated': dateUtils.formatDateTime(item.lastUpdated),
        'Category': item.category
      }));

      const result = await RealExcelService.exportToExcel(exportData, {
        fileName: 'showroom_accessories_inventory',
        sheetName: 'Showroom Accessories',
        includeTimestamp: true,
        uploadToSupabase: true
      });

      if (result.success) {
        toast({
          title: "Excel Export Successful",
          description: result.message,
        });
      } else {
        toast({
          title: "Export Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Export Error",
        description: "Failed to export data to Excel. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleImportFromExcel = () => {
    toast({
      title: "Excel Import",
      description: "Please select an Excel file to import showroom accessories data.",
    });
  };

  const handleAddAccessory = (newAccessory: Omit<InventoryItem, 'id' | 'lastUpdated' | 'category'>) => {
    const accessory: InventoryItem = {
      ...newAccessory,
      id: `sr-${Date.now()}`,
      lastUpdated: new Date().toISOString(),
      category: 'accessory'
    };

    setInventory(prev => [...prev, accessory]);
    
    toast({
      title: "Accessory Added",
      description: `${accessory.partName} has been added to showroom inventory.`,
    });
  };

  // Removed local formatDateTime - using dateUtils.formatDateTime from utils

  const handleEditAccessory = (item: InventoryItem) => {
    setEditingItem(item);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = (updates: Partial<InventoryItem>) => {
    if (editingItem) {
      setInventory(prev => prev.map(item => 
        item.id === editingItem.id 
          ? { ...item, ...updates, lastUpdated: new Date().toISOString() }
          : item
      ));
      
      toast({
        title: "Accessory Updated",
        description: `${editingItem.partName} has been updated successfully.`,
      });
    }
  };

  const handleOpenTechSpecs = (item: InventoryItem) => {
    setTechSpecsItem(item);
    setIsTechSpecsDialogOpen(true);
  };

  const handleSaveTechSpecs = (itemId: string, updates: Partial<InventoryItem>) => {
    setInventory(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, ...updates, lastUpdated: new Date().toISOString() }
        : item
    ));
    
    toast({
      title: "Technical Specifications Updated",
      description: "Technical specifications have been saved successfully.",
    });
  };

  const getVehicleTypeBadge = (vehicleType?: VehicleType) => {
    switch(vehicleType) {
      case 'EV':
        return <Badge className="bg-green-100 text-green-800">Electric Vehicle</Badge>;
      case 'Hybrid':
        return <Badge className="bg-blue-100 text-blue-800">Hybrid</Badge>;
      case 'ICE':
        return <Badge className="bg-orange-100 text-orange-800">Internal Combustion</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getSupplierBadge = (supplier?: string) => {
    switch(supplier) {
      case 'DF':
        return <Badge className="bg-monza-yellow/20 text-monza-black border border-monza-yellow/40">Dong Feng</Badge>;
      case 'AZ':
        return <Badge className="bg-monza-gray/15 text-monza-gray border border-monza-gray/30">AutoZone</Badge>;
      default:
        return <Badge variant="outline">{supplier || 'Unknown'}</Badge>;
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Showroom Accessories Inventory</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage accessories only - categorized by vehicle type (ICE, Hybrid, EV)
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleExportToExcel}>
            <Download className="mr-1 h-4 w-4" />
            Export to Excel
          </Button>
          <Button variant="outline" onClick={handleImportFromExcel}>
            <Upload className="mr-1 h-4 w-4" />
            Import from Excel
          </Button>
          <Button variant="default" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Add New Accessory
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search accessories, models, rooms..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className="h-10 rounded-md border border-input bg-background px-3 py-2"
          value={selectedVehicleType}
          onChange={(e) => setSelectedVehicleType(e.target.value as 'All' | VehicleType)}
        >
          <option value="All">All Vehicle Types</option>
          <option value="EV">Electric Vehicle (EV)</option>
          <option value="Hybrid">Hybrid</option>
          <option value="ICE">Internal Combustion (ICE)</option>
        </select>

        <select
          className="h-10 rounded-md border border-input bg-background px-3 py-2"
          value={selectedSupplier}
          onChange={(e) => setSelectedSupplier(e.target.value)}
        >
          {uniqueSuppliers.map(supplier => (
            <option key={supplier} value={supplier}>{supplier}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-lg border shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Car Model</TableHead>
                <TableHead>Accessory Name</TableHead>
                <TableHead>Part Number</TableHead>
                <TableHead>Vehicle Type</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInventory.length > 0 ? (
                filteredInventory.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{item.carModel}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        {item.partName}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{item.partNumber}</TableCell>
                    <TableCell>{getVehicleTypeBadge(item.vehicleType)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-semibold">
                        {item.quantity}
                      </Badge>
                    </TableCell>
                    <TableCell>{getSupplierBadge(item.supplier)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-purple-100 text-purple-800">
                        {item.location.room}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {`${item.location.shelf}-${item.location.column}-${item.location.row}`}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {dateUtils.formatDateTime(item.lastUpdated)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditAccessory(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleOpenTechSpecs(item)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Settings className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <Package className="h-8 w-8 text-muted-foreground" />
                      <p className="font-medium">No showroom accessories found</p>
                      <p className="text-sm text-muted-foreground">
                        No accessories match your search criteria.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <AddAccessoryDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAddAccessory={handleAddAccessory}
      />

      <EditAccessoryDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        item={editingItem}
        onSave={handleSaveEdit}
      />

      {techSpecsItem && (
        <TechnicalSpecsDialog
          isOpen={isTechSpecsDialogOpen}
          onClose={() => setIsTechSpecsDialogOpen(false)}
          item={techSpecsItem}
          onSave={handleSaveTechSpecs}
        />
      )}
    </div>
  );
};

export default ShowroomInventoryPage;
