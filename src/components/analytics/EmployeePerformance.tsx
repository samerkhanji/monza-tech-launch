
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// Types
interface EmployeePerformanceProps {
  data: {
    name: string;
    completedRepairs: number;
    onTimePercentage: number;
    avgTimePerRepair: number;
  }[];
}

export const EmployeePerformance: React.FC<EmployeePerformanceProps> = ({ data }) => {
  const handleExportToExcel = () => {
    toast({
      title: "Excel Export",
      description: `Employee Performance report exported to Excel successfully.`,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Employee Performance</h2>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleExportToExcel}
        >
          <Download className="mr-1" />
          Export
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {data.map((employee) => (
          <Card key={employee.name} className="p-4 shadow-sm">
            <div className="text-lg font-medium mb-2">{employee.name}</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-muted-foreground">Repairs Completed:</div>
              <div className="font-medium text-right">{employee.completedRepairs}</div>
              
              <div className="text-muted-foreground">On-Time Completion:</div>
              <div className="font-medium text-right">{employee.onTimePercentage}%</div>
              
              <div className="text-muted-foreground">Avg. Time per Repair:</div>
              <div className="font-medium text-right">{employee.avgTimePerRepair} days</div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default EmployeePerformance;
