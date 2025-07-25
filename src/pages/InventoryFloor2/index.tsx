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
import { toast } from '@/hooks/use-toast';
import { Download, Upload, Plus, Search } from 'lucide-react';
import { InventoryItem } from '@/types/inventory';
import AddPartDialog from '@/components/inventory/AddPartDialog';
import InventoryTableHeaders from '@/components/inventory/InventoryTableHeaders';
import EditInventoryDialog from './components/EditInventoryDialog';
import RealExcelService from '@/services/realExcelService';

import { useSorting } from '@/hooks/useSorting';
import { useInventoryFilters } from '@/hooks/useInventoryFilters';

// Sample inventory data for Floor 2 with supplier information
const floor2Inventory: InventoryItem[] = [
  {
    id: 'f2-1',
    carModel: 'Voyah Dream 2024',
    partName: 'Premium Leather Seat',
    partNumber: 'VD-2024-PLS-001',
    quantity: 4,
    location: {
      shelf: 'P1',
      column: '1',
      row: '2',
      room: 'Premium Display',
      floor: 'Floor 2'
    },
    lastUpdated: '2025-05-20T14:30:00',
    supplier: 'DF',
    vehicleType: 'EV',
    category: 'accessory',
    vin: 'VD2024PLS001',
    pdiStatus: 'completed'
  },
  {
    id: 'f2-2',
    carModel: 'Voyah Courage 2025',
    partName: 'Dashboard Display',
    partNumber: 'VC-2025-DD-003',
    quantity: 2,
    location: {
      shelf: 'P2',
      column: '2',
      row: '1',
      room: 'Executive Storage',
      floor: 'Floor 2'
    },
    lastUpdated: '2025-05-18T11:45:00',
    supplier: 'AutoZone',
    vehicleType: 'EV',
    category: 'part',
    vin: 'VC2025DD003',
    pdiStatus: 'completed'
  },
  {
    id: 'f2-3',
    carModel: 'MHero 917 2025',
    partName: 'Carbon Fiber Panel',
    partNumber: 'MH-2025-CFP-007',
    quantity: 3,
    location: {
      shelf: 'P3',
      column: '1',
      row: '3',
      room: 'VIP Lounge Storage',
      floor: 'Floor 2'
    },
    lastUpdated: '2025-05-16T16:20:00',
    supplier: 'Toyota Parts Co',
    vehicleType: 'EV',
    category: 'part',
    vin: 'MH2025CFP007',
    pdiStatus: 'completed'
  }
];

const InventoryFloor2Page: React.FC = () => {
  const location = useLocation();
  const [inventory, setInventory] = useState<InventoryItem[]>(floor2Inventory);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModel, setSelectedModel] = useState('All Models');
  const [selectedSupplier, setSelectedSupplier] = useState('All Suppliers');
  const [isAddPartDialogOpen, setIsAddPartDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { filters, updateFilter, filterInventory } = useInventoryFilters();

  // Handle URL parameters for VIN filtering
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const vinParam = urlParams.get('vin');
    
    if (vinParam) {
      setSearchTerm(vinParam);
      // Auto-scroll to the item row or show notification
      setTimeout(() => {
        const matchingItem = inventory.find(item => 
          item.vin?.toLowerCase().includes(vinParam.toLowerCase()) ||
          item.partNumber?.toLowerCase().includes(vinParam.toLowerCase()) ||
          item.carModel?.toLowerCase().includes(vinParam.toLowerCase())
        );
        if (matchingItem) {
          // Success toast
          toast({
            title: "Item Found in Floor 2",
            description: `Showing ${matchingItem.partName} for ${matchingItem.carModel} (${matchingItem.partNumber})`,
            duration: 5000,
          });
        } else {
          // Warning toast if not found
          toast({
            title: "Item Not Found",
            description: `No item found with VIN/Part: ${vinParam} in Floor 2 Inventory`,
            variant: "destructive",
            duration: 5000,
          });
        }
      }, 500); // Small delay to ensure inventory is loaded
    }
  }, [location.search, inventory]);

  // Get unique suppliers for filter dropdown
  const uniqueSuppliers = ['All Suppliers', ...Array.from(new Set(inventory.map(item => item.supplier || 'DF')))];

  // Apply filters first, then search, then sort
  const filteredInventory = filterInventory(inventory);
  const searchFilteredInventory = filteredInventory.filter(item => {
    const matchesSearch = 
      searchTerm === '' || 
      item.partName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.room?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplier?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesModel = 
      selectedModel === 'All Models' || item.carModel === selectedModel;
    
    const matchesSupplier =
      selectedSupplier === 'All Suppliers' || item.supplier === selectedSupplier;
    
    return matchesSearch && matchesModel && matchesSupplier;
  });

  const { sortedData, sortState, handleSort } = useSorting(searchFilteredInventory);

  const handleExportToExcel = async () => {
    try {
      // Prepare data for export with formatted columns
      const exportData = sortedData.map(item => ({
        'Car Model': item.carModel,
        'Part Name': item.partName,
        'Part Number': item.partNumber,
        'Quantity': item.quantity,
        'Supplier': item.supplier || 'DF',
        'Room': item.location.room,
        'Floor': item.location.floor,
        'Location': `${item.location.shelf}-${item.location.column}-${item.location.row}`,
        'Category': item.category,
        'VIN': item.vin || 'N/A',
        'PDI Status': item.pdiStatus,
        'Last Updated': dateUtils.formatDateTime(item.lastUpdated)
      }));

      const result = await RealExcelService.exportToExcel(exportData, {
        fileName: 'floor2_inventory',
        sheetName: 'Floor 2 Inventory',
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
        description: "Failed to export Floor 2 inventory to Excel. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleImportFromExcel = () => {
    toast({
      title: "Excel Import",
      description: "Please select an Excel file to import Floor 2 data.",
    });
  };

  const handleAddNewPart = () => {
    setIsAddPartDialogOpen(true);
  };

  const handleAddPart = (newPart: Omit<InventoryItem, 'id' | 'lastUpdated'>) => {
    const part: InventoryItem = {
      ...newPart,
      id: `f2-${Date.now()}`,
      lastUpdated: new Date().toISOString()
    };

    setInventory(prev => [...prev, part]);
    
    toast({
      title: "Part Added",
      description: `${part.partName} has been added to Floor 2 inventory.`,
    });
  };

  // Removed local formatDateTime - using dateUtils.formatDateTime from utils

  const handleEditPart = (item: InventoryItem) => {
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
        title: "Part Updated",
        description: `${editingItem.partName} has been updated successfully.`,
      });
    }
  };

  const handleRemovePart = (partId: string) => {
    setInventory(prev => prev.filter(item => item.id !== partId));
    toast({
      title: "Part Removed",
      description: "Part has been removed from Floor 2 inventory.",
    });
  };



  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Floor 2 Inventory</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage premium parts and accessories for Showroom Floor 2
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
          <Button variant="default" onClick={handleAddNewPart}>
            <Plus className="mr-1 h-4 w-4" />
            Add New Part
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search Floor 2 parts, rooms, suppliers..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className="h-10 rounded-md border border-input bg-background px-3 py-2"
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
        >
          <option value="All Models">All Models</option>
          <option value="Voyah Dream 2024">Voyah Dream 2024</option>
          <option value="Voyah Courage 2025">Voyah Courage 2025</option>
          <option value="MHero 917 2025">MHero 917 2025</option>
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
                <TableHead>Part Name</TableHead>
                <TableHead>Part Number</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.length > 0 ? (
                sortedData.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{item.carModel}</TableCell>
                    <TableCell>{item.partName}</TableCell>
                    <TableCell className="font-mono text-sm">{item.partNumber}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-monza-yellow/20 text-monza-black border border-monza-yellow/40">
                        {item.quantity}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 text-xs rounded-full bg-monza-gray/10 text-monza-gray border border-monza-gray/20">
                        {item.supplier || 'DF'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 text-xs rounded-full bg-monza-yellow/10 text-monza-black border border-monza-yellow/30">
                        {item.location.room}
                      </span>
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
                          onClick={() => handleEditPart(item)}
                        >
                          Edit
                        </Button>

                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleRemovePart(item.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Remove
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <p className="font-medium">No Floor 2 inventory items found</p>
                      <p className="text-sm text-muted-foreground">
                        No results match your search criteria.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <AddPartDialog
        isOpen={isAddPartDialogOpen}
        onClose={() => setIsAddPartDialogOpen(false)}
        onAddPart={handleAddPart}
        floor="Floor 2"
      />

      <EditInventoryDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        item={editingItem}
        onSave={handleSaveEdit}
        floor="Floor 2"
      />


    </div>
  );
};

export default InventoryFloor2Page;
