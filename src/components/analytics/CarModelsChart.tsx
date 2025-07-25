
import React from 'react';
import { Card } from '@/components/ui/card';
import {
  PieChart as RechartsPieChart,
  Pie as RechartsPie,
  Tooltip,
  Legend,
  Cell,
  ResponsiveContainer
} from 'recharts';

// Types
interface CarModelsChartProps {
  data: {
    name: string;
    value: number;
  }[];
  colors: string[];
}

export const CarModelsChart: React.FC<CarModelsChartProps> = ({ data, colors }) => {
  return (
    <Card className="p-4">
      <h3 className="text-lg font-medium mb-4">Car Models Serviced</h3>
      <div className="w-full h-72 flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsPieChart>
            <RechartsPie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </RechartsPie>
            <Tooltip />
            <Legend />
          </RechartsPieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default CarModelsChart;
