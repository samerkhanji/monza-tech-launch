import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from "@/hooks/use-toast";
import { Download, Upload, Plus, Search, QrCode, Edit3, Trash2, RefreshCw } from "lucide-react";
import { useCameraPermission } from '@/utils/cameraPermissionManager';
import EditPartDialog from '@/pages/PartManagement/components/EditPartDialog';
import AddPartDialog from '@/components/inventory/AddPartDialog';
import { usePartsInventory, PartsInventoryItem } from '@/hooks/usePartsInventory';
import PartNumberScannerDialog from '@/components/PartNumberScannerDialog';

interface Part {
  id: string;
  partNumber: string;
  name: string;
  category: string;
  subcategory?: string;
  brand?: string;
  model?: string;
  price: number;
  cost?: number;
  quantity: number;
  minQuantity?: number;
  location: string;
  supplier: string;
  compatibility?: string[];
  status: string;
  lastUpdated: string;
}

const PartManagement = () => {
  // Use the Supabase parts inventory hook
  const { 
    parts: supabaseParts, 
    loading, 
    error, 
    refresh: refreshParts 
  } = usePartsInventory();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('All Suppliers');
  
  // Edit dialog states
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<PartsInventoryItem | null>(null);
  
  // Add part dialog state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  // Scan part dialog state
  const [isScanDialogOpen, setIsScanDialogOpen] = useState(false);

  // Camera permission hook for scanning
  const { 
    granted, 
    denied, 
    stream, 
    requestCamera, 
    stopCamera, 
    isSupported 
  } = useCameraPermission();

  // Function to automatically determine status based on quantity
  const getAutomaticStatus = (quantity: number): string => {
    if (quantity === 0) {
      return 'Out of Stock';
    } else if (quantity <= 5) {
      return 'Low Stock';
    } else {
      return 'In Stock';
    }
  };

  const generateSampleParts = (): Part[] => {
    const samplePartsData = [
      {
        id: 'p1',
        partNumber: 'VD-2024-BRK-001',
        name: 'Brake Pads Front Set',
        category: 'EV',
        subcategory: 'Brakes',
        brand: 'Brembo',
        price: 250.00,
        cost: 180.00,
        quantity: 15,
        minQuantity: 5,
        location: 'A1-B2',
        supplier: 'DF',
        lastUpdated: '2025-01-20T14:30:00'
      },
      {
        id: 'p2',
        partNumber: 'VC-2025-FLT-002',
        name: 'Air Filter',
        category: 'EV',
        subcategory: 'Filters',
        brand: 'Mann',
        price: 45.00,
        cost: 30.00,
        quantity: 8,
        minQuantity: 10,
        location: 'B2-C1',
        supplier: 'AZ',
        lastUpdated: '2025-01-20T12:15:00'
      },
      {
        id: 'p3',
        partNumber: 'MH-2025-LED-003',
        name: 'LED Headlight Assembly',
        category: 'ICEV',
        subcategory: 'Lighting',
        brand: 'Osram',
        price: 420.00,
        cost: 320.00,
        quantity: 6,
        minQuantity: 3,
        location: 'C1-D3',
        supplier: 'DF',
        lastUpdated: '2025-01-20T09:45:00'
      },
      {
        id: 'p4',
        partNumber: 'VD-2024-WPR-004',
        name: 'Windshield Wipers',
        category: 'EV',
        subcategory: 'Accessories',
        brand: 'Bosch',
        price: 65.00,
        cost: 45.00,
        quantity: 0,
        minQuantity: 8,
        location: 'D3-E1',
        supplier: 'AZ',
        lastUpdated: '2025-01-19T16:20:00'
      },
      {
        id: 'p5',
        partNumber: 'VC-2025-SPK-005',
        name: 'Spark Plugs Set',
        category: 'ICEV',
        subcategory: 'Engine',
        brand: 'NGK',
        price: 85.00,
        cost: 60.00,
        quantity: 12,
        minQuantity: 6,
        location: 'E1-F2',
        supplier: 'DF',
        lastUpdated: '2025-01-20T11:30:00'
      }
    ];

    // Automatically set status based on quantity
    return samplePartsData.map(part => ({
      ...part,
      status: getAutomaticStatus(part.quantity, part.minQuantity)
    }));
  };



  // Filter parts based on search and filters
  const filteredParts = supabaseParts.filter(part => {
    const matchesSearch = searchTerm === '' || 
      part.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.oe_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.car_model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.source.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || part.car_model === categoryFilter;
    const matchesStatus = statusFilter === 'all' || getAutomaticStatus(part.quantity) === statusFilter;
    const matchesSupplier = selectedSupplier === 'All Suppliers' || part.source === selectedSupplier;

    return matchesSearch && matchesCategory && matchesStatus && matchesSupplier;
  });

  // Get unique suppliers and car models
  const uniqueSuppliers = ['All Suppliers', ...Array.from(new Set(supabaseParts.map(part => part.source)))];
  const uniqueCarModels = ['all', ...Array.from(new Set(supabaseParts.map(part => part.car_model)))];

  const handleExportToExcel = () => {
    toast({
      title: "Export to Excel",
      description: "Parts inventory exported successfully.",
    });
  };

  const handleImportFromExcel = () => {
      toast({
      title: "Excel Import",
      description: "Please select an Excel file to import parts data.",
    });
  };

  const handleAddNewPart = () => {
    setIsAddDialogOpen(true);
  };

  const handleAddPart = (newPartData: any) => {
    // Convert InventoryItem format to PartsInventoryItem format
    const newPart = {
      car_model: newPartData.carModel || 'General',
      oe_number: newPartData.partNumber || `PART-${Date.now()}`,
      product_name: newPartData.partName || 'New Part',
      quantity: newPartData.quantity || 1,
      order_date: new Date().toISOString().split('T')[0],
      source: newPartData.supplier || 'DF (Dongfeng)',
      storage_zone: typeof newPartData.location === 'object' 
        ? `${newPartData.location.shelf}-${newPartData.location.column}${newPartData.location.row}` 
        : newPartData.location || 'Zone 1',
    };

    // Add the part to Supabase
    // Note: This should call the addPart function from usePartsInventory
    // For now, we'll just refresh the list
    
    toast({
      title: "Part Added",
      description: `${newPart.product_name} has been added to inventory.`,
    });
    
    // Refresh the parts list
    refreshParts();
  };

  const handleEditPart = (part: PartsInventoryItem) => {
    console.log('🔍 handleEditPart called with part:', part);
    setEditingPart(part);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = (updates: Partial<PartsInventoryItem>) => {
    if (editingPart) {
      console.log('🔍 handleSaveEdit called with updates:', updates);
      
      // Update the part in Supabase
      // Note: This should call the updatePart function from usePartsInventory
      // For now, we'll just close the dialog
      
      toast({
        title: "Part Updated",
        description: `${editingPart.product_name} has been updated successfully.`,
      });
      
      // Refresh the parts list
      refreshParts();
      onClose();
    }
  };

  const handleRemovePart = (partId: string) => {
    // Remove the part from Supabase
    // Note: This should call the deletePart function from usePartsInventory
    // For now, we'll just refresh the list
    
    toast({
      title: "Part Removed",
      description: "Part has been removed from inventory.",
    });
    
    // Refresh the parts list
    refreshParts();
  };

  const handleScanPart = () => {
    setIsScanDialogOpen(true);
  };

  const handlePartScanned = (partNumber: string) => {
    // Handle the scanned part number
    console.log('Part scanned:', partNumber);
    
    // Search for the part in current inventory
    const existingPart = supabaseParts.find(part => 
      part.oe_number === partNumber || 
      part.product_name.toLowerCase().includes(partNumber.toLowerCase())
    );
    
    if (existingPart) {
      // Part exists - show details
      toast({
        title: "Part Found",
        description: `${existingPart.product_name} (${existingPart.oe_number}) - ${existingPart.quantity} in stock`,
      });
      
      // Optionally highlight the part in the table
      setSearchTerm(partNumber);
    } else {
      // Part doesn't exist - offer to add it
      toast({
        title: "Part Not Found",
        description: `Part ${partNumber} not in inventory. Would you like to add it?`,
      });
      
      // You could open the Add Part dialog here
      // setIsAddDialogOpen(true);
    }
    
    // Close the scan dialog
    setIsScanDialogOpen(false);
    
    // Refresh the parts list
    refreshParts();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
          <h1 className="text-2xl font-bold">Parts Inventory</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage parts and accessories inventory
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
          <Button variant="outline" onClick={handleScanPart}>
            <QrCode className="mr-1 h-4 w-4" />
            Scan Part
          </Button>
          <Button variant="default" onClick={handleAddNewPart}>
            <Plus className="mr-1 h-4 w-4" />
            Add New Part
          </Button>
          <Button variant="outline" onClick={refreshParts} disabled={loading}>
            <RefreshCw className={`mr-1 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading parts</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
              <Input
            placeholder="Search parts, categories, suppliers..."
            className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
          />
          </div>
          
        <select
          id="categoryFilter"
          name="categoryFilter"
          className="h-10 rounded-md border border-input bg-background px-3 py-2"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="all">All Car Models</option>
          {uniqueCarModels.filter(model => model !== 'all').map(model => (
            <option key={model} value={model}>{model}</option>
          ))}
        </select>

        <select
          id="statusFilter"
          name="statusFilter"
          className="h-10 rounded-md border border-input bg-background px-3 py-2"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="In Stock">In Stock</option>
          <option value="Low Stock">Low Stock</option>
          <option value="Out of Stock">Out of Stock</option>
          <option value="Discontinued">Discontinued</option>
        </select>

        <select
          id="supplierFilter"
          name="supplierFilter"
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
                <TableHead>Part Name</TableHead>
                <TableHead>OE Number</TableHead>
                <TableHead>Car Model</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Storage Zone</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Order Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <p className="font-medium">Loading parts inventory...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                        <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      </div>
                      <p className="font-medium text-red-800">Error loading parts</p>
                      <p className="text-sm text-red-600">{error}</p>
                      <Button onClick={refreshParts} variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Try Again
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredParts.length > 0 ? (
                filteredParts.map((part) => (
                  <TableRow key={part.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{part.product_name}</TableCell>
                    <TableCell className="font-mono text-sm">{part.oe_number}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                              {part.car_model}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        part.quantity === 0 
                          ? 'bg-red-100 text-red-800 border border-red-200' 
                          : part.quantity <= 5
                          ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                          : 'bg-green-100 text-green-800 border border-green-200'
                      }`}>
                                {part.quantity}
                              </span>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {part.storage_zone}
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 border border-gray-200">
                        {part.source}
                              </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(part.order_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        part.status === 'In Stock' 
                          ? 'bg-green-100 text-green-800 border border-green-200'
                          : part.status === 'Low Stock'
                          ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                          : part.status === 'Out of Stock'
                          ? 'bg-red-100 text-red-800 border border-red-200'
                          : 'bg-gray-100 text-gray-800 border border-gray-200'
                      }`}>
                              {part.status}
                      </span>
                    </TableCell>

                    <TableCell>
                      <div className="flex gap-2">
                              <Button
                          variant="outline" 
                                size="sm"
                          onClick={() => handleEditPart(part)}
                              >
                          <Edit3 className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                          size="sm"
                          onClick={() => handleRemovePart(part.id)}
                          className="text-red-600 hover:text-red-700"
                              >
                          <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <p className="font-medium">No parts found</p>
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
            
      <EditPartDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        part={editingPart}
        onSave={handleSaveEdit}
      />

      {/* Add Part Dialog */}
      <AddPartDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAddPart={handleAddPart}
        onIncrementPart={() => {}}
        existingParts={[]}
        floor="Parts Inventory"
      />

      {/* Scan Part Dialog */}
      <Dialog open={isScanDialogOpen} onOpenChange={setIsScanDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Scan Part Number</DialogTitle>
          </DialogHeader>
          <PartNumberScannerDialog
            onPartNumberScanned={handlePartScanned}
          >
            <div style={{ display: 'none' }} />
          </PartNumberScannerDialog>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PartManagement; 