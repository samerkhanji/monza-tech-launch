
import React from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface MechanicPerformanceFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  specializationFilter: string;
  onSpecializationChange: (value: string) => void;
  performanceFilter: string;
  onPerformanceChange: (value: string) => void;
  specializations: string[];
}

const MechanicPerformanceFilters: React.FC<MechanicPerformanceFiltersProps> = ({
  searchTerm,
  onSearchChange,
  specializationFilter,
  onSpecializationChange,
  performanceFilter,
  onPerformanceChange,
  specializations
}) => {
  return (
    <div className="flex gap-4 mb-4">
      <div className="relative flex-1">
        <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search mechanics..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <Select value={specializationFilter} onValueChange={onSpecializationChange}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Filter by specialization" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Specializations</SelectItem>
          {specializations.map(spec => (
            <SelectItem key={spec} value={spec}>{spec}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={performanceFilter} onValueChange={onPerformanceChange}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Filter by performance" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Performance</SelectItem>
          <SelectItem value="high">High (90%+)</SelectItem>
          <SelectItem value="medium">Medium (80-89%)</SelectItem>
          <SelectItem value="low">Low (&lt;80%)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default MechanicPerformanceFilters;
