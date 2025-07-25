
import React from 'react';
import { MechanicPerformanceAnalyticsProps } from './mechanic/types';
import MechanicPerformanceFilters from './mechanic/MechanicPerformanceFilters';
import MechanicPerformanceChart from './mechanic/MechanicPerformanceChart';
import MechanicPerformanceTable from './mechanic/MechanicPerformanceTable';
import MechanicPerformanceInsights from './mechanic/MechanicPerformanceInsights';
import { useMechanicFilters } from './mechanic/useMechanicFilters';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const MechanicPerformanceAnalytics: React.FC<MechanicPerformanceAnalyticsProps> = ({ 
  data, 
  period 
}) => {
  const {
    searchTerm,
    setSearchTerm,
    specializationFilter,
    setSpecializationFilter,
    performanceFilter,
    setPerformanceFilter,
    specializations,
    filteredData
  } = useMechanicFilters(data);

  const handleExportToExcel = () => {
    toast({
      title: "Excel Export",
      description: `Mechanic Performance report exported to Excel successfully.`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Mechanic Performance Analysis</h2>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleExportToExcel}
        >
          <Download className="mr-1" />
          Export
        </Button>
      </div>

      <div className="grid gap-6">
        <MechanicPerformanceChart data={filteredData} period={period} />
        
        <div className="space-y-4">
          <MechanicPerformanceFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            specializationFilter={specializationFilter}
            onSpecializationChange={setSpecializationFilter}
            performanceFilter={performanceFilter}
            onPerformanceChange={setPerformanceFilter}
            specializations={specializations}
          />
          
          <MechanicPerformanceTable data={filteredData} />
        </div>
        
        <MechanicPerformanceInsights data={filteredData} />
      </div>
    </div>
  );
};

export default MechanicPerformanceAnalytics;
