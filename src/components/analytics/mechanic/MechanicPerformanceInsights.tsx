
import React from 'react';
import { Card } from '@/components/ui/card';
import { MechanicData } from './types';

interface MechanicPerformanceInsightsProps {
  data: MechanicData[];
}

const MechanicPerformanceInsights: React.FC<MechanicPerformanceInsightsProps> = ({ data }) => {
  const totalRepairs = data.reduce((total, mechanic) => total + mechanic.completedRepairs, 0);
  const avgRepairTime = data.length > 0 ? 
    (data.reduce((total, mechanic) => total + mechanic.avgRepairTime, 0) / data.length).toFixed(1) : 0;
  const avgOnTimeRate = data.length > 0 ? 
    Math.round(data.reduce((total, mechanic) => total + mechanic.onTimeRate, 0) / data.length) : 0;
  const topPerformer = data.sort((a, b) => b.completedRepairs - a.completedRepairs)[0]?.name || 'N/A';

  return (
    <Card className="p-4">
      <h3 className="text-lg font-medium mb-4">Performance Insights</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border rounded-md p-4">
          <p className="text-sm text-muted-foreground">Total Repairs Completed</p>
          <p className="text-2xl font-bold">{totalRepairs}</p>
        </div>
        <div className="border rounded-md p-4">
          <p className="text-sm text-muted-foreground">Average Repair Time</p>
          <p className="text-2xl font-bold">{avgRepairTime} days</p>
        </div>
        <div className="border rounded-md p-4">
          <p className="text-sm text-muted-foreground">Average On-Time Rate</p>
          <p className="text-2xl font-bold">{avgOnTimeRate}%</p>
        </div>
        <div className="border rounded-md p-4">
          <p className="text-sm text-muted-foreground">Top Performer</p>
          <p className="text-2xl font-bold">{topPerformer}</p>
        </div>
      </div>
    </Card>
  );
};

export default MechanicPerformanceInsights;
