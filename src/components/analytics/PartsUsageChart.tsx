
import React from 'react';
import { Card } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart as RechartsBarChart,
  Bar as RechartsBar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

// Types
interface PartsUsageChartProps {
  data: {
    name: string;
    count: number;
    inStock: number;
  }[];
}

export const PartsUsageChart: React.FC<PartsUsageChartProps> = ({ data }) => {
  return (
    <Card className="p-4">
      <h3 className="text-lg font-medium mb-4">Most Used Parts</h3>
      <div className="w-full h-72">
        <ChartContainer
          config={{
            most: { label: "Most Used Parts" },
            least: { label: "Least Used Parts" },
          }}
        >
          <RechartsBarChart
            data={data.sort((a, b) => b.count - a.count).slice(0, 5)}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip content={<ChartTooltipContent />} />
            <Legend />
            <RechartsBar dataKey="count" name="Usage Count" fill="#8884d8" />
            <RechartsBar dataKey="inStock" name="Current Stock" fill="#82ca9d" />
          </RechartsBarChart>
        </ChartContainer>
      </div>
    </Card>
  );
};

export default PartsUsageChart;
