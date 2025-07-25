
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PartsUsageChart from './PartsUsageChart';
import CarModelsChart from './CarModelsChart';
import PartsInventoryTable from './PartsInventoryTable';

// Types
interface PartsUsageSectionProps {
  partUsageData: {
    name: string;
    count: number;
    inStock: number;
  }[];
  carModelRepairs: {
    name: string;
    value: number;
  }[];
  colors: string[];
}

export const PartsUsageSection: React.FC<PartsUsageSectionProps> = ({ 
  partUsageData, 
  carModelRepairs,
  colors 
}) => {
  const handleExportToExcel = () => {
    toast({
      title: "Excel Export",
      description: `Parts Usage report exported to Excel successfully.`,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Parts Usage Analysis</h2>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleExportToExcel}
        >
          <Download className="mr-1" />
          Export
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PartsUsageChart data={partUsageData} />
        <CarModelsChart data={carModelRepairs} colors={colors} />
      </div>

      <PartsInventoryTable data={partUsageData} />
    </div>
  );
};

export default PartsUsageSection;
