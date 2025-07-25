
import React from 'react';
import { TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SortableTableHead from '@/components/ui/sortable-table-head';
import { SortState } from '@/hooks/useSorting';

interface NewCarArrivalsTableHeadersProps {
  filters: {
    model: string;
    status: string;
    category: string;
  };
  onFilterChange: (key: string, value: string) => void;
  sortState: SortState;
  onSort: (field: string) => void;
}

const NewCarArrivalsTableHeaders: React.FC<NewCarArrivalsTableHeadersProps> = ({
  filters,
  onFilterChange,
  sortState,
  onSort
}) => {
  return (
    <TableHeader>
      <TableRow>
        <TableHead>
          <div className="space-y-2">
            <SortableTableHead
              sortKey="vin"
              currentSort={sortState}
              onSort={onSort}
            >
              VIN
            </SortableTableHead>
          </div>
        </TableHead>
        <TableHead>
          <div className="space-y-2">
            <SortableTableHead
              sortKey="model"
              currentSort={sortState}
              onSort={onSort}
            >
              Model
            </SortableTableHead>
            <Select value={filters.model} onValueChange={(value) => onFilterChange('model', value)}>
              <SelectTrigger className="h-8 text-xs">
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
                <SelectItem value="BMW iX3">BMW iX3</SelectItem>
                <SelectItem value="Mercedes EQC">Mercedes EQC</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </TableHead>
        <TableHead>
          <SortableTableHead
            sortKey="arrivalDate"
            currentSort={sortState}
            onSort={onSort}
          >
            Arrival Date
          </SortableTableHead>
        </TableHead>
        <TableHead>
          <div className="space-y-2">
            <SortableTableHead
              sortKey="status"
              currentSort={sortState}
              onSort={onSort}
            >
              Status
            </SortableTableHead>
            <Select value={filters.status} onValueChange={(value) => onFilterChange('status', value)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="arrived">Arrived</SelectItem>
                <SelectItem value="taken_to_garage">In Garage</SelectItem>
                <SelectItem value="ready_for_inventory">Ready for Inventory</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </TableHead>
        <TableHead>
          <div className="space-y-2">
            <span className="font-medium text-sm">Battery %</span>
            <Select value={filters.category} onValueChange={(value) => onFilterChange('category', value)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="EV">EV (Electric)</SelectItem>
                <SelectItem value="REV">REV (Range Extended)</SelectItem>
                <SelectItem value="ICEV">ICEV (Combustion)</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </TableHead>
        <TableHead>Damages</TableHead>
        <TableHead>Damage Details</TableHead>
        <TableHead>Notes & Photos</TableHead>
        <TableHead className="text-right">Actions</TableHead>
      </TableRow>
    </TableHeader>
  );
};

export default NewCarArrivalsTableHeaders;
