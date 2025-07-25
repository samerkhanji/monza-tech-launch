
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RefreshCw, FileText } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface GarageOverviewHeaderProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  isGarageManager: boolean;
}

const GarageOverviewHeader: React.FC<GarageOverviewHeaderProps> = ({
  searchTerm,
  setSearchTerm,
  isGarageManager
}) => {
  const handleRefresh = () => {
    toast({
      title: "Data Refreshed",
      description: "Garage overview has been updated with latest information"
    });
  };

  const handleExport = () => {
    toast({
      title: "Export Started",
      description: "Garage report is being generated..."
    });
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Garage Overview</h1>
        <p className="text-muted-foreground">
          {isGarageManager ? 
            "Manage and track all garage operations" : 
            "View current garage status"
          }
        </p>
      </div>
      
      <div className="flex items-center gap-3">
        <Input
          placeholder="Search cars..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-64"
        />
        
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
        
        {isGarageManager && (
          <Button variant="outline" size="sm" onClick={handleExport}>
            <FileText className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        )}
      </div>
    </div>
  );
};

export default GarageOverviewHeader;
