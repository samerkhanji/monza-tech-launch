
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw } from 'lucide-react';

interface GarageTabActionsProps {
  handleRefresh: () => void;
  handleExportToExcel: () => void;
}

const GarageTabActions: React.FC<GarageTabActionsProps> = ({
  handleRefresh,
  handleExportToExcel
}) => {
  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={handleRefresh}>
        <RefreshCw className="h-4 w-4 mr-1" />
        Refresh
      </Button>
      <Button variant="outline" size="sm" onClick={handleExportToExcel}>
        <Download className="h-4 w-4 mr-1" />
        Export
      </Button>
    </div>
  );
};

export default GarageTabActions;
