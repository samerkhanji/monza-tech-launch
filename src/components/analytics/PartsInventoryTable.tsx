import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow,
  StatusBadge
} from '@/components/ui/table';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search } from 'lucide-react';

// Types
interface PartsInventoryTableProps {
  data: {
    name: string;
    count: number;
    inStock: number;
  }[];
}

export const PartsInventoryTable: React.FC<PartsInventoryTableProps> = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  const filteredData = data.filter(part => {
    const matchesSearch = part.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || 
      (filter === 'low' && part.inStock < 10) ||
      (filter === 'moderate' && part.inStock >= 10 && part.inStock < 20) ||
      (filter === 'good' && part.inStock >= 20);
    return matchesSearch && matchesFilter;
  });

  const getStockStatus = (inStock: number) => {
    if (inStock < 10) return { variant: 'error' as const, label: 'Low Stock' };
    if (inStock < 20) return { variant: 'warning' as const, label: 'Moderate' };
    return { variant: 'success' as const, label: 'Good' };
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Parts Usage History</h3>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search parts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
          />
        </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by stock level" />
          </SelectTrigger>
          <SelectContent>
              <SelectItem value="all">All Stock Levels</SelectItem>
            <SelectItem value="low">Low Stock</SelectItem>
            <SelectItem value="moderate">Moderate</SelectItem>
            <SelectItem value="good">Good</SelectItem>
          </SelectContent>
        </Select>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Part Name</TableHead>
            <TableHead>Times Used</TableHead>
            <TableHead>Currently in Stock</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredData.map((part) => {
            const status = getStockStatus(part.inStock);
            return (
            <TableRow key={part.name}>
                <TableCell className="font-medium">{part.name}</TableCell>
              <TableCell>{part.count}</TableCell>
              <TableCell>{part.inStock}</TableCell>
              <TableCell>
                  <StatusBadge variant={status.variant}>
                    {status.label}
                  </StatusBadge>
              </TableCell>
            </TableRow>
            );
          })}
          {filteredData.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8">
                <p className="text-gray-500">No parts match your search criteria.</p>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
};

export default PartsInventoryTable;
