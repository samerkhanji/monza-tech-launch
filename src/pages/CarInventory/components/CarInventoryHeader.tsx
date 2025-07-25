import React from 'react';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface CarInventoryHeaderProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  modelFilter: string;
  onModelFilterChange: (model: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (category: string) => void;
  onAddCar: () => void;
  onScanVin: () => void;
  onQuickTestDrive?: () => void;
  onResetData?: () => void;
}

const CarInventoryHeader: React.FC<CarInventoryHeaderProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  modelFilter,
  onModelFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  onAddCar,
  onScanVin,
  onQuickTestDrive,
  onResetData
}) => {
  return (
    <div className="mb-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Car Inventory</h1>
        <div className="flex gap-2">
          {onResetData && (
            <Button 
              variant="outline" 
              onClick={onResetData}
              className="text-red-600 border-red-600 hover:bg-red-50"
            >
              Reset Data
            </Button>
          )}
          {onQuickTestDrive && (
            <Button 
              onClick={onQuickTestDrive}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Quick Test Drive
            </Button>
          )}
          <Button onClick={onScanVin}>Scan VIN</Button>
          <Button onClick={onAddCar}>Add Car</Button>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="w-full sm:w-1/4">
          <Input
            placeholder="Search by brand, model, VIN, etc."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full"
          />
        </div>
        
        <div className="w-full sm:w-1/4">
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="in_stock">In Stock</SelectItem>
              <SelectItem value="sold">Sold</SelectItem>
              <SelectItem value="reserved">Reserved</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="w-full sm:w-1/4">
          <Select value={modelFilter} onValueChange={onModelFilterChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filter by model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Models</SelectItem>
              <SelectItem value="Voyah Free">Voyah Free</SelectItem>
              <SelectItem value="Voyah Dream">Voyah Dream</SelectItem>
              <SelectItem value="Voyah Passion">Voyah Passion</SelectItem>
              <SelectItem value="Voyah Courage">Voyah Courage</SelectItem>
              <SelectItem value="MHero 917">MHero 917</SelectItem>
              <SelectItem value="Tesla Model 3">Tesla Model 3</SelectItem>
              <SelectItem value="Tesla Model Y">Tesla Model Y</SelectItem>
              <SelectItem value="BMW X3">BMW X3</SelectItem>
              <SelectItem value="Other">Other Models</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="w-full sm:w-1/4">
          <Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="EV">EV (Electric Vehicle)</SelectItem>
              <SelectItem value="REV">REV (Range Extended)</SelectItem>
              <SelectItem value="ICEV">ICEV (Internal Combustion)</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default CarInventoryHeader;
