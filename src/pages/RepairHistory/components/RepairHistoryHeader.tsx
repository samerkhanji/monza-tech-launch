
import React from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, History, Filter } from 'lucide-react';

interface RepairHistoryHeaderProps {
  totalRepairs: number;
  filteredCount: number;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterCars: (cars: any[]) => any[];
}

const RepairHistoryHeader: React.FC<RepairHistoryHeaderProps> = ({
  totalRepairs,
  filteredCount,
  searchTerm,
  setSearchTerm
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <History className="h-8 w-8" />
            Repair History
          </h1>
          <p className="text-muted-foreground">
            Complete history of all completed repairs
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {filteredCount} of {totalRepairs} repairs
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search repairs by car model, customer, or issue..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Badge variant="secondary" className="flex items-center gap-1">
          <Filter className="h-3 w-3" />
          Active Filters
        </Badge>
      </div>
    </div>
  );
};

export default RepairHistoryHeader;
