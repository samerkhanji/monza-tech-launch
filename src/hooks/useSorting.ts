
import { useState, useMemo } from 'react';

export type SortDirection = 'asc' | 'desc' | null;

export interface SortState {
  key: string;
  direction: SortDirection;
}

export const useSorting = <T extends Record<string, any>>(
  data: T[],
  initialSort: SortState = { key: '', direction: null }
) => {
  const [sortState, setSortState] = useState<SortState>(initialSort);

  const handleSort = (key: string) => {
    setSortState(prev => {
      if (prev.key !== key) {
        // For battery percentage, start with descending (highest to lowest)
        if (key === 'batteryPercentage') {
          return { key, direction: 'desc' };
        }
        return { key, direction: 'asc' };
      }
      
      // For battery percentage, cycle: desc -> asc -> null
      if (key === 'batteryPercentage') {
        if (prev.direction === 'desc') {
          return { key, direction: 'asc' };
        }
        if (prev.direction === 'asc') {
          return { key, direction: null };
        }
        return { key, direction: 'desc' };
      }
      
      // For other fields, cycle: asc -> desc -> null
      if (prev.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      
      if (prev.direction === 'desc') {
        return { key, direction: null };
      }
      
      return { key, direction: 'asc' };
    });
  };

  const sortedData = useMemo(() => {
    if (!sortState.key || !sortState.direction) {
      return data;
    }

    return [...data].sort((a, b) => {
      const aValue = getNestedValue(a, sortState.key);
      const bValue = getNestedValue(b, sortState.key);

      // Handle custom duty sorting (paid/not paid)
      if (sortState.key === 'customDuty') {
        const aStatus = aValue === 'paid' ? 1 : 0;
        const bStatus = bValue === 'paid' ? 1 : 0;
        return sortState.direction === 'asc' ? aStatus - bStatus : bStatus - aStatus;
      }

      // Handle date sorting
      if (sortState.key.includes('Date') || sortState.key.includes('date')) {
        const aDate = aValue ? new Date(aValue).getTime() : 0;
        const bDate = bValue ? new Date(bValue).getTime() : 0;
        return sortState.direction === 'asc' ? aDate - bDate : bDate - aDate;
      }

      // Handle numeric sorting (including battery percentage)
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortState.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // Handle battery percentage with null/undefined values
      if (sortState.key === 'batteryPercentage') {
        const aNum = aValue ?? -1; // Treat null/undefined as -1 for sorting
        const bNum = bValue ?? -1;
        return sortState.direction === 'asc' ? aNum - bNum : bNum - aNum;
      }

      // Handle string sorting
      const aStr = String(aValue || '').toLowerCase();
      const bStr = String(bValue || '').toLowerCase();
      
      if (sortState.direction === 'asc') {
        return aStr.localeCompare(bStr);
      } else {
        return bStr.localeCompare(aStr);
      }
    });
  }, [data, sortState]);

  return {
    sortedData,
    sortState,
    handleSort,
  };
};

const getNestedValue = (obj: any, path: string): any => {
  return path.split('.').reduce((current, key) => current?.[key], obj);
};
