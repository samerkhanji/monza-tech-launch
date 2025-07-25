
import React from 'react';
import { TableHead } from '@/components/ui/table';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SortDirection = 'asc' | 'desc' | null;

interface SortableTableHeadProps {
  children: React.ReactNode;
  sortKey: string;
  currentSort: { key: string; direction: SortDirection };
  onSort: (key: string) => void;
  className?: string;
}

const SortableTableHead: React.FC<SortableTableHeadProps> = ({
  children,
  sortKey,
  currentSort,
  onSort,
  className,
}) => {
  const isActive = currentSort.key === sortKey;
  const direction = isActive ? currentSort.direction : null;

  return (
    <TableHead 
      className={cn("cursor-pointer hover:bg-muted/50 select-none", className)}
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center gap-1">
        {children}
        <div className="flex flex-col">
          <ArrowUp 
            className={cn(
              "h-3 w-3 transition-colors",
              isActive && direction === 'asc' ? "text-primary" : "text-muted-foreground/50"
            )} 
          />
          <ArrowDown 
            className={cn(
              "h-3 w-3 transition-colors -mt-1",
              isActive && direction === 'desc' ? "text-primary" : "text-muted-foreground/50"
            )} 
          />
        </div>
      </div>
    </TableHead>
  );
};

export default SortableTableHead;
