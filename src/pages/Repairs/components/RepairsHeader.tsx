
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus } from 'lucide-react';
import { RepairsHeaderProps } from '../types';

const RepairsHeader: React.FC<RepairsHeaderProps> = ({ 
  handleAddNewRepair, 
  searchTerm, 
  setSearchTerm,
  showSearchOnly = false
}) => {
  if (showSearchOnly) {
    return (
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-2 top-3 h-4 w-4 text-monza-grey" />
        <Input
          placeholder="Search vehicles..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-monza-black">Repair Workflow</h1>
          <p className="text-monza-grey">Manage vehicle repairs through the workflow stages</p>
        </div>
        
        <Button variant="default" onClick={handleAddNewRepair}>
          <Plus className="mr-1" />
          New Repair
        </Button>
      </div>

      <div className="flex justify-between items-center gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2 top-3 h-4 w-4 text-monza-grey" />
          <Input
            placeholder="Search by code, customer, model, mechanic..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className="h-10 rounded-md border border-monza-grey/30 bg-background px-3 py-2 text-monza-grey"
          defaultValue="All Stages"
        >
          <option>All Stages</option>
          <option>Diagnosis</option>
          <option>Repair</option>
          <option>Quality Check</option>
          <option>Ready</option>
        </select>
      </div>
    </>
  );
};

export default RepairsHeader;
