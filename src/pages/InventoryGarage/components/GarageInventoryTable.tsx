import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Upload, Plus, Search, Package } from 'lucide-react';
import { InventoryItem } from '@/types/inventory';
import { useSorting } from '@/hooks/useSorting';
import { toast } from '@/hooks/use-toast';
import { dateUtils } from '@/lib/utils';

interface GarageInventoryTableProps {
  initialInventory: InventoryItem[];
}

const GarageInventoryTable: React.FC<GarageInventoryTableProps> = ({ initialInventory }) => {
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModel, setSelectedModel] = useState('All Models');
  const [selectedSupplier, setSelectedSupplier] = useState('All Suppliers');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [deletingItem, setDeletingItem] = useState<string | null>(null);

  // Get unique car models and suppliers from garage inventory for filter dropdowns
  const uniqueModels = ['All Models', ...Array.from(new Set(inventory.map(item => item.carModel)))];
  const uniqueSuppliers = ['All Suppliers', ...Array.from(new Set(inventory.map(item => item.supplier || 'DF')))];

  // Apply filters first, then search, then sort
  const searchFilteredInventory = inventory.filter(item => {
    const matchesSearch =
      searchTerm === '' ||
      item.partName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location?.room?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplier?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesModel =
      selectedModel === 'All Models' || item.carModel === selectedModel;

    const matchesSupplier =
      selectedSupplier === 'All Suppliers' || item.supplier === selectedSupplier;

    return matchesSearch && matchesModel && matchesSupplier;
  });

  const { sortedData, sortState, handleSort } = useSorting(searchFilteredInventory);

  const handleExportToExcel = useCallback(async () => {
    setIsExporting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast({
        title: 'Excel Export',
        description: 'Garage inventory data exported to Excel successfully.',
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export garage inventory data.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  }, []);

  const handleImportFromExcel = useCallback(async () => {
    setIsImporting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast({
        title: 'Excel Import',
        description: 'Please select an Excel file to import Garage data.',
      });
    } catch (error) {
      toast({
        title: 'Import Failed',
        description: 'Failed to import garage inventory data.',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  }, []);

  const handleAddNewPart = useCallback(() => {
    toast({
      title: 'Add Part',
      description: 'Add part dialog would open here.',
    });
  }, []);

  const handleEditPart = useCallback((item: InventoryItem) => {
    toast({
      title: 'Edit Part',
      description: `Editing ${item.partName}`,
    });
  }, []);

  const handleRemovePart = useCallback(async (partId: string) => {
    setDeletingItem(partId);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      setInventory(prev => prev.filter(item => item.id !== partId));
      toast({
        title: 'Part Removed',
        description: 'Part has been removed from Garage inventory.',
      });
    } catch (error) {
      toast({
        title: 'Removal Failed',
        description: 'Failed to remove part from inventory.',
        variant: 'destructive',
      });
    } finally {
      setDeletingItem(null);
    }
  }, []);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Garage Inventory</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage garage parts and supplies inventory
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleExportToExcel} disabled={isExporting}>
            <Download className="mr-1 h-4 w-4" />
            Export to Excel
          </Button>
          <Button variant="outline" onClick={handleImportFromExcel} disabled={isImporting}>
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
            placeholder="Search parts by name, number, or model..."
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
          {uniqueModels.map(model => (
            <option key={model} value={model}>{model}</option>
          ))}
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
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        {item.quantity}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                        {item.supplier || 'DF'}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {item.location ? 
                        `${item.location.shelf}-${item.location.column}-${item.location.row}` : 
                        'N/A'
                      }
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
                          disabled={deletingItem === item.id}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleRemovePart(item.id)}
                          className="text-red-600 hover:text-red-700"
                          disabled={deletingItem === item.id}
                        >
                          {deletingItem === item.id ? 'Removing...' : 'Remove'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <Package className="h-12 w-12 text-muted-foreground" />
                      <p className="font-medium">No garage inventory items found</p>
                      <p className="text-sm text-muted-foreground">
                        {searchTerm || selectedModel !== 'All Models' || selectedSupplier !== 'All Suppliers'
                          ? 'No results match your search criteria.'
                          : 'Start by adding parts to your garage inventory.'
                        }
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

export default GarageInventoryTable;
