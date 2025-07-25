
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import RepairsHeader from './RepairsHeader';

interface PageHeaderProps {
  handleAddNewRepair: () => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

const PageHeader: React.FC<PageHeaderProps> = ({ 
  handleAddNewRepair, 
  searchTerm, 
  setSearchTerm 
}) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h1 className="text-2xl font-bold text-monza-black">Vehicle Management</h1>
        <p className="text-monza-grey">Manage all vehicles in the garage</p>
      </div>
      <div className="flex gap-2">
        <Button 
          onClick={handleAddNewRepair}
          variant="default"
        >
          <Plus className="h-4 w-4 mr-1" />
          New Repair
        </Button>
        <RepairsHeader 
          handleAddNewRepair={handleAddNewRepair}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          showSearchOnly={true}
        />
      </div>
    </div>
  );
};

export default PageHeader;
