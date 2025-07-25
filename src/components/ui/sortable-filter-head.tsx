
import React from 'react';
import { TableHead } from '@/components/ui/table';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SortDirection = 'asc' | 'desc' | null;

interface SortableFilterHeadProps {
  children: React.ReactNode;
  sortKey: string;
  currentSort: { key: string; direction: SortDirection };
  onSort: (key: string) => void;
  onFilterCycle?: () => void;
  className?: string;
}

const SortableFilterHead: React.FC<SortableFilterHeadProps> = ({
  children,
  sortKey,
  currentSort,
  onSort,
  onFilterCycle,
  className,
}) => {
  const isActive = currentSort.key === sortKey;
  const direction = isActive ? currentSort.direction : null;

  const handleArrowClick = (e: React.MouseEvent, arrowType: 'up' | 'down') => {
    e.stopPropagation();
    if (onFilterCycle) {
      onFilterCycle();
    } else {
      onSort(sortKey);
    }
  };

  return (
    <TableHead 
      className={cn("cursor-pointer hover:bg-muted/50 select-none", className)}
      onClick={() => !onFilterCycle && onSort(sortKey)}
    >
      <div className="flex items-center gap-1">
        {children}
        <div className="flex flex-col">
          <ArrowUp 
            className={cn(
              "h-3 w-3 transition-colors cursor-pointer",
              isActive && direction === 'asc' ? "text-primary" : "text-muted-foreground/50"
            )}
            onClick={(e) => handleArrowClick(e, 'up')}
          />
          <ArrowDown 
            className={cn(
              "h-3 w-3 transition-colors -mt-1 cursor-pointer",
              isActive && direction === 'desc' ? "text-primary" : "text-muted-foreground/50"
            )}
            onClick={(e) => handleArrowClick(e, 'down')}
          />
        </div>
      </div>
    </TableHead>
  );
};

export default SortableFilterHead;
