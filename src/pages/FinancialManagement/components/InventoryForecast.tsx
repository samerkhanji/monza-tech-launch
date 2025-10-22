import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, AlertTriangle, Clock } from 'lucide-react';

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

interface InventoryForecastProps {
  cars: CarFinancialData[];
}

interface ForecastData {
  month: string;
  projected_sales: number;
  recommended_orders: number;
  projected_revenue: number;
  inventory_turnover: number;
}

interface ModelForecast {
  model: string;
  brand: string;
  current_stock: number;
  monthly_sales_rate: number;
  predicted_demand: number;
  reorder_point: number;
  optimal_stock_level: number;
  forecast_accuracy: number;
}

const InventoryForecast: React.FC<InventoryForecastProps> = ({ cars }) => {
  const { forecastData, modelForecasts } = useMemo(() => {
    // Calculate monthly sales patterns
    const monthlySales = new Map<string, number>();
    const soldCars = cars.filter(car => car.status === 'sold' && car.soldDate);
    
    soldCars.forEach(car => {
      const soldDate = new Date(car.soldDate!);
      const monthKey = `${soldDate.getFullYear()}-${String(soldDate.getMonth() + 1).padStart(2, '0')}`;
      monthlySales.set(monthKey, (monthlySales.get(monthKey) || 0) + 1);
    });

    // Calculate average monthly sales
    const avgMonthlySales = Array.from(monthlySales.values()).reduce((sum, sales) => sum + sales, 0) / Math.max(1, monthlySales.size);

    // Generate 12-month forecast
    const forecastData: ForecastData[] = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 12; i++) {
      const futureDate = new Date(currentDate);
      futureDate.setMonth(currentDate.getMonth() + i);
      
      // Seasonal adjustment (simplified)
      let seasonalMultiplier = 1;
      const month = futureDate.getMonth();
      if (month === 11 || month === 0) seasonalMultiplier = 1.3; // Holiday season
      if (month >= 3 && month <= 5) seasonalMultiplier = 1.1; // Spring
      if (month >= 6 && month <= 8) seasonalMultiplier = 0.9; // Summer
      
      const projectedSales = Math.round(avgMonthlySales * seasonalMultiplier);
      const recommendedOrders = Math.max(projectedSales, Math.round(projectedSales * 1.2));
      
      forecastData.push({
        month: futureDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
        projected_sales: projectedSales,
        recommended_orders: recommendedOrders,
        projected_revenue: projectedSales * 45000, // Average car price
        inventory_turnover: projectedSales / Math.max(1, cars.filter(c => c.status === 'in_stock').length)
      });
    }

    // Calculate model-specific forecasts
    const modelStats = new Map<string, ModelForecast>();
    
    // Group cars by model
    const modelGroups = new Map<string, CarFinancialData[]>();
    cars.forEach(car => {
      const key = `${car.brand} ${car.model}`;
      if (!modelGroups.has(key)) {
        modelGroups.set(key, []);
      }
      modelGroups.get(key)!.push(car);
    });

    modelGroups.forEach((modelCars, modelKey) => {
      const soldModelCars = modelCars.filter(car => car.status === 'sold' && car.soldDate);
      const inStockCount = modelCars.filter(car => car.status === 'in_stock').length;
      
      // Calculate monthly sales rate for this model
      const modelMonthlySales = new Map<string, number>();
      soldModelCars.forEach(car => {
        const soldDate = new Date(car.soldDate!);
        const monthKey = `${soldDate.getFullYear()}-${String(soldDate.getMonth() + 1).padStart(2, '0')}`;
        modelMonthlySales.set(monthKey, (modelMonthlySales.get(monthKey) || 0) + 1);
      });

      const avgModelMonthlySales = Array.from(modelMonthlySales.values()).reduce((sum, sales) => sum + sales, 0) / Math.max(1, modelMonthlySales.size);
      
      const [brand, model] = modelKey.split(' ', 2);
      
      modelStats.set(modelKey, {
        model: model,
        brand: brand,
        current_stock: inStockCount,
        monthly_sales_rate: avgModelMonthlySales,
        predicted_demand: avgModelMonthlySales * 3, // 3-month prediction
        reorder_point: Math.max(2, Math.round(avgModelMonthlySales * 1.5)),
        optimal_stock_level: Math.max(3, Math.round(avgModelMonthlySales * 2.5)),
        forecast_accuracy: Math.min(95, 60 + (soldModelCars.length * 2)) // Accuracy based on data points
      });
    });

    return {
      forecastData,
      modelForecasts: Array.from(modelStats.values()).sort((a, b) => b.monthly_sales_rate - a.monthly_sales_rate)
    };
  }, [cars]);

  const getStockStatus = (current: number, optimal: number, reorder: number) => {
    if (current <= reorder) {
      return { status: 'critical', color: 'bg-red-100 text-red-800', icon: AlertTriangle, label: 'Reorder Now' };
    } else if (current < optimal * 0.8) {
      return { status: 'low', color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Low Stock' };
    } else if (current > optimal * 1.5) {
      return { status: 'excess', color: 'bg-blue-100 text-blue-800', icon: TrendingUp, label: 'Excess Stock' };
    }
    return { status: 'optimal', color: 'bg-green-100 text-green-800', icon: TrendingUp, label: 'Optimal' };
  };

  const totalProjectedRevenue = forecastData.reduce((sum, month) => sum + month.projected_revenue, 0);
  const avgMonthlyTurnover = forecastData.reduce((sum, month) => sum + month.inventory_turnover, 0) / forecastData.length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">12-Month Revenue Projection</p>
                <p className="text-2xl font-bold">${(totalProjectedRevenue / 1000000).toFixed(1)}M</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Inventory Turnover</p>
                <p className="text-2xl font-bold">{avgMonthlyTurnover.toFixed(1)}x/month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">Models Need Reorder</p>
                <p className="text-2xl font-bold">
                  {modelForecasts.filter(m => m.current_stock <= m.reorder_point).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 12-Month Forecast */}
      <Card>
        <CardHeader>
          <CardTitle>12-Month Sales & Order Forecast</CardTitle>
          <CardDescription>
            Projected sales and recommended ordering schedule
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Month</th>
                  <th className="text-left p-3">Projected Sales</th>
                  <th className="text-left p-3">Recommended Orders</th>
                  <th className="text-left p-3">Projected Revenue</th>
                  <th className="text-left p-3">Inventory Turnover</th>
                </tr>
              </thead>
              <tbody>
                {forecastData.map((month, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{month.month}</td>
                    <td className="p-3">{month.projected_sales} units</td>
                    <td className="p-3">
                      <span className="font-medium text-blue-600">{month.recommended_orders} units</span>
                    </td>
                    <td className="p-3">${(month.projected_revenue / 1000).toFixed(0)}K</td>
                    <td className="p-3">
                      <span className={`font-medium ${month.inventory_turnover > 1 ? 'text-green-600' : month.inventory_turnover > 0.5 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {month.inventory_turnover.toFixed(2)}x
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Model-Specific Forecasts */}
      <Card>
        <CardHeader>
          <CardTitle>Model-Specific Inventory Forecasts</CardTitle>
          <CardDescription>
            Detailed forecasting and reorder recommendations by model
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Model</th>
                  <th className="text-left p-3">Current Stock</th>
                  <th className="text-left p-3">Monthly Sales Rate</th>
                  <th className="text-left p-3">3-Month Demand</th>
                  <th className="text-left p-3">Reorder Point</th>
                  <th className="text-left p-3">Optimal Stock</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Forecast Accuracy</th>
                </tr>
              </thead>
              <tbody>
                {modelForecasts.map((forecast, index) => {
                  const stockStatus = getStockStatus(forecast.current_stock, forecast.optimal_stock_level, forecast.reorder_point);
                  const StatusIcon = stockStatus.icon;

                  return (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div>
                          <p className="font-medium">{forecast.brand} {forecast.model}</p>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="font-medium">{forecast.current_stock}</span>
                      </td>
                      <td className="p-3">
                        <span className="text-gray-700">{forecast.monthly_sales_rate.toFixed(1)}/month</span>
                      </td>
                      <td className="p-3">
                        <span className="font-medium text-blue-600">{Math.round(forecast.predicted_demand)} units</span>
                      </td>
                      <td className="p-3">
                        <span className="font-medium text-orange-600">{forecast.reorder_point} units</span>
                      </td>
                      <td className="p-3">
                        <span className="font-medium text-green-600">{forecast.optimal_stock_level} units</span>
                      </td>
                      <td className="p-3">
                        <Badge className={stockStatus.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {stockStatus.label}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <span className={`font-medium ${forecast.forecast_accuracy > 80 ? 'text-green-600' : forecast.forecast_accuracy > 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {forecast.forecast_accuracy.toFixed(0)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Urgent Action Items */}
      {modelForecasts.filter(m => m.current_stock <= m.reorder_point).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Urgent Reorder Required
            </CardTitle>
            <CardDescription>
              These models have reached their reorder point and need immediate attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {modelForecasts
                .filter(m => m.current_stock <= m.reorder_point)
                .map((forecast, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      <div>
                        <p className="font-medium text-red-900">{forecast.brand} {forecast.model}</p>
                        <p className="text-sm text-red-700">
                          Current: {forecast.current_stock} units • Reorder at: {forecast.reorder_point} units
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-900">
                        Order {Math.max(forecast.optimal_stock_level - forecast.current_stock, forecast.reorder_point)} units
                      </p>
                      <p className="text-sm text-red-700">ASAP</p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InventoryForecast; 