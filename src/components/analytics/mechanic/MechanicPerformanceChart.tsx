
import React from 'react';
import { Card } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MechanicData } from './types';

interface MechanicPerformanceChartProps {
  data: MechanicData[];
  period: string;
}

const MechanicPerformanceChart: React.FC<MechanicPerformanceChartProps> = ({ data, period }) => {
  const chartData = data.map(mechanic => ({
    name: mechanic.name,
    'Completed Repairs': mechanic.completedRepairs,
    'Average Repair Time (days)': mechanic.avgRepairTime,
    'On-Time Rate (%)': mechanic.onTimeRate
  }));

  return (
    <Card className="p-4">
      <h3 className="text-lg font-medium mb-4">Repair Metrics by Mechanic - {period}</h3>
      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
            <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="Completed Repairs" fill="#8884d8" />
            <Bar yAxisId="left" dataKey="Average Repair Time (days)" fill="#82ca9d" />
            <Bar yAxisId="right" dataKey="On-Time Rate (%)" fill="#ffc658" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default MechanicPerformanceChart;
