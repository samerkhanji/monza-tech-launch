import React from 'react';
import { TableHead, TableHeader, TableRow } from '@/components/ui/table';
import SortableTableHead from '@/components/ui/sortable-table-head';
import SortableFilterHead from '@/components/ui/sortable-filter-head';
import { SortDirection } from '@/hooks/useSorting';

interface ShowroomFloor2TableHeadersProps {
  filters: {
    model: string;
    color: string;
    status: string;
  };
  onFilterChange: (key: string, value: string) => void;
  sortState: { key: string; direction: SortDirection };
  onSort: (key: string) => void;
}

const ShowroomFloor2TableHeaders: React.FC<ShowroomFloor2TableHeadersProps> = ({
  filters,
  onFilterChange,
  sortState,
  onSort,
}) => {
  const handleModelClick = () => {
    const options = ['', 'Voyah Free', 'Voyah Dream', 'Voyah Passion', 'Voyah Courage', 'MHero 917'];
    const currentIndex = options.indexOf(filters.model);
    const nextIndex = (currentIndex + 1) % options.length;
    onFilterChange('model', options[nextIndex]);
  };

  const handleColorClick = () => {
    const options = ['', 'Black', 'White', 'Silver', 'Blue', 'Red', 'Gray'];
    const currentIndex = options.indexOf(filters.color);
    const nextIndex = (currentIndex + 1) % options.length;
    onFilterChange('color', options[nextIndex]);
  };

  const handleStatusClick = () => {
    const options = ['', 'in_stock', 'sold', 'reserved'];
    const currentIndex = options.indexOf(filters.status);
    const nextIndex = (currentIndex + 1) % options.length;
    onFilterChange('status', options[nextIndex]);
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
          VIN Number
        </SortableTableHead>
        <SortableFilterHead 
          sortKey="color" 
          currentSort={sortState} 
          onSort={onSort}
          onFilterCycle={handleColorClick}
        >
          Color
        </SortableFilterHead>
        <SortableTableHead 
          sortKey="batteryPercentage" 
          currentSort={sortState} 
          onSort={onSort}
        >
          Battery
        </SortableTableHead>
        <SortableTableHead 
          sortKey="showroomEntryDate" 
          currentSort={sortState} 
          onSort={onSort}
        >
          Entry Date
        </SortableTableHead>
        <SortableTableHead 
          sortKey="showroomNote" 
          currentSort={sortState} 
          onSort={onSort}
        >
          Notes
        </SortableTableHead>
        <SortableFilterHead 
          sortKey="status" 
          currentSort={sortState} 
          onSort={onSort}
          onFilterCycle={handleStatusClick}
        >
          Status
        </SortableFilterHead>
        <TableHead>Software Model</TableHead>
        <TableHead className="text-right">Actions</TableHead>
      </TableRow>
    </TableHeader>
  );
};

export default ShowroomFloor2TableHeaders;
