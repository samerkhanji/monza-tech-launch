import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
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

// No sample data - start with empty state
const floor2Inventory: any[] = [];

const InventoryFloor2Page: React.FC = () => {
  const location = useLocation();
  const [inventory, setInventory] = useState(floor2Inventory);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModel, setSelectedModel] = useState('All Models');
  const [selectedSupplier, setSelectedSupplier] = useState('All Suppliers');

  // Handle URL parameters for VIN filtering
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const vinParam = urlParams.get('vin');
    
    if (vinParam) {
      setSearchTerm(vinParam);
      setTimeout(() => {
        const matchingItem = inventory.find(item => 
          item.vin?.toLowerCase().includes(vinParam.toLowerCase()) ||
          item.partNumber?.toLowerCase().includes(vinParam.toLowerCase()) ||
          item.carModel?.toLowerCase().includes(vinParam.toLowerCase())
        );
        if (matchingItem) {
          toast({
            title: "Item Found in Floor 2",
            description: `Showing ${matchingItem.partName} for ${matchingItem.carModel} (${matchingItem.partNumber})`,
            duration: 5000,
          });
        } else {
          toast({
            title: "Item Not Found",
            description: `No item found with VIN/Part: ${vinParam} in Floor 2 Inventory`,
            variant: "destructive",
            duration: 5000,
          });
        }
      }, 500);
    }
  }, [location.search, inventory]);

  // Get unique suppliers for filter dropdown
  const uniqueSuppliers = ['All Suppliers', ...Array.from(new Set(inventory.map(item => item.supplier || 'DF')))];

  // Apply filters
  const filteredInventory = inventory.filter(item => {
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

  const handleExportToExcel = () => {
    toast({
      title: "Export Feature",
      description: "Export functionality will be implemented soon.",
    });
  };

  const handleImportFromExcel = () => {
    toast({
      title: "Import Feature",
      description: "Import functionality will be implemented soon.",
    });
  };

  const handleAddNewPart = () => {
    toast({
      title: "Add Part Feature",
      description: "Add part functionality will be implemented soon.",
    });
  };

  const formatDateTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return 'Invalid Date';
    }
  };

  const handleEditPart = (item: any) => {
    toast({
      title: "Edit Feature",
      description: `Edit functionality for ${item.partName} will be implemented soon.`,
    });
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
              {filteredInventory.length > 0 ? (
                filteredInventory.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{item.carModel}</TableCell>
                    <TableCell>{item.partName}</TableCell>
                    <TableCell className="font-mono text-sm">{item.partNumber}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-300">
                        {item.quantity}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700 border border-gray-300">
                        {item.supplier || 'DF'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 border border-blue-300">
                        {item.location.room}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {`${item.location.shelf}-${item.location.column}-${item.location.row}`}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateTime(item.lastUpdated)}
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
    </div>
  );
};

export default InventoryFloor2Page;
