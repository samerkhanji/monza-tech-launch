import { useState } from 'react';
import { InventoryItem } from '@/types/inventory';

interface FilterState {
  carModel: string;
  partName: string;
  room: string;
}

export const useInventoryFilters = () => {
  const [filters, setFilters] = useState<FilterState>({
    carModel: '',
    partName: '',
    room: ''
  });

  const updateFilter = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const filterInventory = (inventory: InventoryItem[]) => {
    return inventory.filter(item => {
      return (
        (filters.carModel === '' || item.carModel === filters.carModel) &&
        (filters.partName === '' || item.partName.toLowerCase().includes(filters.partName.toLowerCase())) &&
        (filters.room === '' || item.location.room === filters.room)
      );
    });
  };

  return {
    filters,
    updateFilter,
    filterInventory,
  };
};
