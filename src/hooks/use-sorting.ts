import { useState, useMemo } from 'react';

type SortConfig = {
  key: string;
  direction: 'ascending' | 'descending';
};

export function useSorting<T>(items: T[]) {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

  const sortedItems = useMemo(() => {
    const sortableItems = [...items];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof T];
        const bValue = b[sortConfig.key as keyof T];

        if (aValue === bValue) {
          return 0;
        }

        if (aValue === null || aValue === undefined) {
          return 1;
        }

        if (bValue === null || bValue === undefined) {
          return -1;
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }

        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }

        return 0;
      });
    }
    return sortableItems;
  }, [items, sortConfig]);

  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === 'ascending'
    ) {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  return { sortedItems, sortConfig, requestSort };
} 