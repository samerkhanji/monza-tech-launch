import React from 'react';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TableSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

const TableSearch: React.FC<TableSearchProps> = ({
  value,
  onChange,
  placeholder = "Search VINs, clients, parts, models...",
  className = "",
  id
}) => {
  return (
    <div className={`relative flex items-center w-full max-w-md ${className}`}>
      <Search className="absolute left-3 h-4 w-4 text-gray-400" />
      <Input
        type="text"
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-10 pr-10 h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
      />
      {value && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-1 h-8 w-8 p-0 hover:bg-gray-100"
          onClick={() => onChange('')}
        >
          <X className="h-4 w-4 text-gray-400" />
        </Button>
      )}
    </div>
  );
};

export default TableSearch; 