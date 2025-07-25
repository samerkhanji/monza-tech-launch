import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, Percent } from 'lucide-react';

interface CarFinancialData {
  id: string;
  vinNumber: string;
  model: string;
  brand: string;
  year: number;
  color: string;
  arrivalDate: string;
  soldDate?: string;
  purchasePrice?: number;
  sellingPrice?: number;
  marketPrice?: number;
  receipts: Array<{
    id: string;
    type: 'purchase' | 'customs' | 'shipping' | 'maintenance' | 'other';
    amount: number;
    date: string;
    description: string;
    fileName?: string;
    fileUrl?: string;
  }>;
  status: 'in_stock' | 'sold' | 'reserved';
  daysInInventory?: number;
  profitMargin?: number;
}

interface ProfitabilityAnalysisProps {
  cars: CarFinancialData[];
}

const ProfitabilityAnalysis: React.FC<ProfitabilityAnalysisProps> = ({ cars }) => {
  const profitabilityData = useMemo(() => {
    const soldCars = cars.filter(car => car.status === 'sold' && car.purchasePrice && car.sellingPrice);
    const totalRevenue = soldCars.reduce((sum, car) => sum + (car.sellingPrice || 0), 0);
    const totalCost = soldCars.reduce((sum, car) => sum + (car.purchasePrice || 0), 0);
    const totalProfit = totalRevenue - totalCost;
    const avgProfitMargin = soldCars.length > 0 ? soldCars.reduce((sum, car) => sum + (car.profitMargin || 0), 0) / soldCars.length : 0;

    // Model profitability
    const modelProfitability = new Map<string, { profit: number, margin: number, count: number, revenue: number }>();
    
    soldCars.forEach(car => {
      const key = `${car.brand} ${car.model}`;
      const profit = (car.sellingPrice || 0) - (car.purchasePrice || 0);
      
      if (!modelProfitability.has(key)) {
        modelProfitability.set(key, { profit: 0, margin: 0, count: 0, revenue: 0 });
      }
      
      const data = modelProfitability.get(key)!;
      data.profit += profit;
      data.revenue += car.sellingPrice || 0;
      data.count += 1;
      data.margin = data.count > 0 ? ((data.revenue - (data.revenue - data.profit)) / (data.revenue - data.profit)) * 100 : 0;
    });

    return {
      totalRevenue,
      totalCost,
      totalProfit,
      avgProfitMargin,
      soldCount: soldCars.length,
      modelProfitability: Array.from(modelProfitability.entries()).map(([model, data]) => ({
        model,
        ...data,
        avgProfit: data.profit / data.count
      })).sort((a, b) => b.margin - a.margin)
    };
  }, [cars]);

  const getProfitabilityBadge = (margin: number) => {
    if (margin > 25) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    if (margin > 15) return <Badge className="bg-blue-100 text-blue-800">Good</Badge>;
    if (margin > 5) return <Badge className="bg-yellow-100 text-yellow-800">Fair</Badge>;
    return <Badge className="bg-red-100 text-red-800">Poor</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">${profitabilityData.totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Profit</p>
                <p className="text-2xl font-bold">${profitabilityData.totalProfit.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Percent className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Profit Margin</p>
                <p className="text-2xl font-bold">{profitabilityData.avgProfitMargin.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Cars Sold</p>
                <p className="text-2xl font-bold">{profitabilityData.soldCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Model Profitability Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Profitability by Model</CardTitle>
          <CardDescription>
            Analyze profit margins and performance by car model
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Model</th>
                  <th className="text-left p-3">Units Sold</th>
                  <th className="text-left p-3">Total Revenue</th>
                  <th className="text-left p-3">Total Profit</th>
                  <th className="text-left p-3">Avg Profit/Unit</th>
                  <th className="text-left p-3">Profit Margin</th>
                  <th className="text-left p-3">Performance</th>
                </tr>
              </thead>
              <tbody>
                {profitabilityData.modelProfitability.map((model, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <p className="font-medium">{model.model}</p>
                    </td>
                    <td className="p-3">
                      <span className="font-medium">{model.count}</span>
                    </td>
                    <td className="p-3">
                      <span className="font-medium">${model.revenue.toLocaleString()}</span>
                    </td>
                    <td className="p-3">
                      <span className={`font-medium ${model.profit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${model.profit.toLocaleString()}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="font-medium">${Math.round(model.avgProfit).toLocaleString()}</span>
                    </td>
                    <td className="p-3">
                      <span className={`font-medium ${model.margin > 15 ? 'text-green-600' : model.margin > 5 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {model.margin.toFixed(1)}%
                      </span>
                    </td>
                    <td className="p-3">
                      {getProfitabilityBadge(model.margin)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfitabilityAnalysis; 