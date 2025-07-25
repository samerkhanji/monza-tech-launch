
import React from 'react';
import { TableHead, TableHeader, TableRow } from '@/components/ui/table';
import SortableTableHead from '@/components/ui/sortable-table-head';
import SortableFilterHead from '@/components/ui/sortable-filter-head';
import { SortDirection } from '@/hooks/useSorting';

interface InventoryTableHeadersProps {
  filters: {
    carModel: string;
    partName: string;
    room: string;
  };
  onFilterChange: (key: string, value: string) => void;
  sortState: { key: string; direction: SortDirection };
  onSort: (key: string) => void;
  floor: string;
}

const InventoryTableHeaders: React.FC<InventoryTableHeadersProps> = ({
  filters,
  onFilterChange,
  sortState,
  onSort,
  floor,
}) => {
  const handleCarModelClick = () => {
    const options = floor === 'Floor 2' 
      ? ['', 'Voyah Dream 2024', 'Voyah Courage 2025', 'MHero 917 2025']
      : ['', 'Voyah Free 2024', 'Voyah Passion 2024', 'Voyah Dream 2024', 'MHero 917 2024'];
    const currentIndex = options.indexOf(filters.carModel);
    const nextIndex = (currentIndex + 1) % options.length;
    onFilterChange('carModel', options[nextIndex]);
  };

  const handleRoomClick = () => {
    const options = floor === 'Floor 2' 
      ? ['', 'Premium Display', 'Executive Storage', 'VIP Lounge Storage']
      : ['', 'Engine Parts Room', 'Maintenance Bay', 'Accessories Room', 'Tool Storage'];
    const currentIndex = options.indexOf(filters.room);
    const nextIndex = (currentIndex + 1) % options.length;
    onFilterChange('room', options[nextIndex]);
  };

  return (
    <TableHeader>
      <TableRow>
        <SortableFilterHead 
          sortKey="carModel" 
          currentSort={sortState} 
          onSort={onSort}
          onFilterCycle={handleCarModelClick}
        >
          Car Model
        </SortableFilterHead>
        <SortableTableHead 
          sortKey="partName" 
          currentSort={sortState} 
          onSort={onSort}
        >
          Part Name
        </SortableTableHead>
        <SortableTableHead 
          sortKey="partNumber" 
          currentSort={sortState} 
          onSort={onSort}
        >
          Part Number
        </SortableTableHead>
        <SortableTableHead 
          sortKey="quantity" 
          currentSort={sortState} 
          onSort={onSort}
        >
          Quantity
        </SortableTableHead>
        <SortableFilterHead 
          sortKey="location.room" 
          currentSort={sortState} 
          onSort={onSort}
          onFilterCycle={handleRoomClick}
        >
          Room
        </SortableFilterHead>
        <SortableTableHead 
          sortKey="location" 
          currentSort={sortState} 
          onSort={onSort}
        >
          Location
        </SortableTableHead>
        <SortableTableHead 
          sortKey="lastUpdated" 
          currentSort={sortState} 
          onSort={onSort}
        >
          Last Updated
        </SortableTableHead>
        <TableHead>Actions</TableHead>
      </TableRow>
    </TableHeader>
  );
};

export default InventoryTableHeaders;
