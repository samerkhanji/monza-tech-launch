
import React from 'react';
import { TableHead, TableHeader, TableRow } from '@/components/ui/table';
import SortableTableHead from '@/components/ui/sortable-table-head';
import SortableFilterHead from '@/components/ui/sortable-filter-head';
import { SortDirection } from '@/hooks/useSorting';

interface TableHeadersWithFiltersProps {
  filters: {
    model: string;
    vin: string;
    color: string;
    category: string;
    status: string;
    location: string;
    customDuty: string;
    notes: string;
    clientName: string;
  };
  onFilterChange: (key: string, value: string) => void;
  sortState: { key: string; direction: SortDirection };
  onSort: (key: string) => void;
}

const TableHeadersWithFilters: React.FC<TableHeadersWithFiltersProps> = ({
  filters,
  onFilterChange,
  sortState,
  onSort,
}) => {
  const handleCategoryClick = () => {
    const options = ['', 'EV', 'REV'];
    const currentIndex = options.indexOf(filters.category);
    const nextIndex = (currentIndex + 1) % options.length;
    onFilterChange('category', options[nextIndex]);
  };

  const handleStatusClick = () => {
    const options = ['', 'in_stock', 'sold', 'reserved'];
    const currentIndex = options.indexOf(filters.status);
    const nextIndex = (currentIndex + 1) % options.length;
    onFilterChange('status', options[nextIndex]);
  };

  const handleLocationClick = () => {
    const options = ['', 'Client', 'Showroom 1', 'Showroom 2', 'Garage'];
    const currentIndex = options.indexOf(filters.location);
    const nextIndex = (currentIndex + 1) % options.length;
    onFilterChange('location', options[nextIndex]);
  };

  const handleModelClick = () => {
    const options = ['', 'Voyah Free', 'Voyah Dream', 'Voyah Passion', 'Voyah Courage', 'MHero 917'];
    const currentIndex = options.indexOf(filters.model);
    const nextIndex = (currentIndex + 1) % options.length;
    onFilterChange('model', options[nextIndex]);
  };

  const handleCustomDutyClick = () => {
    const options = ['', 'paid', 'not paid'];
    const currentIndex = options.indexOf(filters.customDuty);
    const nextIndex = (currentIndex + 1) % options.length;
    onFilterChange('customDuty', options[nextIndex]);
  };

  return (
    <TableHeader>
      <TableRow>
        <SortableFilterHead 
          sortKey="model" 
          currentSort={sortState} 
          onSort={onSort}
          onFilterCycle={handleModelClick}
        >
          Model
        </SortableFilterHead>
        <SortableTableHead 
          sortKey="vinNumber" 
          currentSort={sortState} 
          onSort={onSort}
        >
          VIN
        </SortableTableHead>
        <SortableTableHead 
          sortKey="color" 
          currentSort={sortState} 
          onSort={onSort}
        >
          Color
        </SortableTableHead>
        <SortableFilterHead 
          sortKey="category" 
          currentSort={sortState} 
          onSort={onSort}
          onFilterCycle={handleCategoryClick}
        >
          Category
        </SortableFilterHead>
        <SortableTableHead 
          sortKey="batteryPercentage" 
          currentSort={sortState} 
          onSort={onSort}
        >
          Battery
        </SortableTableHead>
        <SortableFilterHead 
          sortKey="status" 
          currentSort={sortState} 
          onSort={onSort}
          onFilterCycle={handleStatusClick}
        >
          Status
        </SortableFilterHead>
        <SortableTableHead 
          sortKey="pdiCompleted" 
          currentSort={sortState} 
          onSort={onSort}
        >
          PDI
        </SortableTableHead>
        <SortableTableHead 
          sortKey="arrivalDate" 
          currentSort={sortState} 
          onSort={onSort}
        >
          Arrival Date
        </SortableTableHead>
        <SortableFilterHead 
          sortKey="currentFloor" 
          currentSort={sortState} 
          onSort={onSort}
          onFilterCycle={handleLocationClick}
        >
          Location
        </SortableFilterHead>
        <SortableFilterHead 
          sortKey="customDuty" 
          currentSort={sortState} 
          onSort={onSort}
          onFilterCycle={handleCustomDutyClick}
        >
          Custom Duty
        </SortableFilterHead>
        <SortableTableHead 
          sortKey="notes" 
          currentSort={sortState} 
          onSort={onSort}
        >
          Notes
        </SortableTableHead>
        <SortableTableHead 
          sortKey="clientName" 
          currentSort={sortState} 
          onSort={onSort}
        >
          Client Info
        </SortableTableHead>
        <TableHead className="text-right">Actions</TableHead>
      </TableRow>
    </TableHeader>
  );
};

export default TableHeadersWithFilters;
