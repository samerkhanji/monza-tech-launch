import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, BarChart3 } from 'lucide-react';

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

interface SupplyDemandChartProps {
  cars: CarFinancialData[];
}

interface ModelAnalysis {
  model: string;
  brand: string;
  inStock: number;
  sold: number;
  reserved: number;
  avgDaysToSell: number;
  demandRatio: number;
  recommendation: 'increase' | 'maintain' | 'decrease';
  avgPrice: number;
  profitability: number;
}

const SupplyDemandChart: React.FC<SupplyDemandChartProps> = ({ cars }) => {
  const modelAnalysis = useMemo(() => {
    const models = new Map<string, ModelAnalysis>();

    cars.forEach(car => {
      const key = `${car.brand} ${car.model}`;
      if (!models.has(key)) {
        models.set(key, {
          model: car.model,
          brand: car.brand,
          inStock: 0,
          sold: 0,
          reserved: 0,
          avgDaysToSell: 0,
          demandRatio: 0,
          recommendation: 'maintain',
          avgPrice: 0,
          profitability: 0
        });
      }

      const analysis = models.get(key)!;
      
      if (car.status === 'in_stock') analysis.inStock++;
      if (car.status === 'sold') analysis.sold++;
      if (car.status === 'reserved') analysis.reserved++;
    });

    // Calculate metrics for each model
    models.forEach((analysis, key) => {
      const modelCars = cars.filter(car => `${car.brand} ${car.model}` === key);
      const soldCars = modelCars.filter(car => car.status === 'sold');
      
      // Average days to sell
      if (soldCars.length > 0) {
        const totalDays = soldCars.reduce((sum, car) => {
          const arrivalDate = new Date(car.arrivalDate);
          const soldDate = car.soldDate ? new Date(car.soldDate) : new Date();
          return sum + Math.floor((soldDate.getTime() - arrivalDate.getTime()) / (1000 * 60 * 60 * 24));
        }, 0);
        analysis.avgDaysToSell = totalDays / soldCars.length;
      }

      // Demand ratio (sold + reserved) / total
      const total = analysis.inStock + analysis.sold + analysis.reserved;
      analysis.demandRatio = total > 0 ? (analysis.sold + analysis.reserved) / total : 0;

      // Average price
      const carsWithPrice = modelCars.filter(car => car.sellingPrice || car.marketPrice);
      if (carsWithPrice.length > 0) {
        analysis.avgPrice = carsWithPrice.reduce((sum, car) => sum + (car.sellingPrice || car.marketPrice || 0), 0) / carsWithPrice.length;
      }

      // Profitability
      const profitableCars = modelCars.filter(car => car.profitMargin);
      if (profitableCars.length > 0) {
        analysis.profitability = profitableCars.reduce((sum, car) => sum + (car.profitMargin || 0), 0) / profitableCars.length;
      }

      // Recommendation logic
      if (analysis.demandRatio > 0.8 && analysis.avgDaysToSell < 30) {
        analysis.recommendation = 'increase';
      } else if (analysis.demandRatio < 0.3 || analysis.avgDaysToSell > 90) {
        analysis.recommendation = 'decrease';
      } else {
        analysis.recommendation = 'maintain';
      }
    });

    return Array.from(models.values()).sort((a, b) => b.demandRatio - a.demandRatio);
  }, [cars]);

  const getRecommendationBadge = (recommendation: string) => {
    switch (recommendation) {
      case 'increase':
        return <Badge className="bg-green-100 text-green-800"><TrendingUp className="h-3 w-3 mr-1" />Increase Supply</Badge>;
      case 'decrease':
        return <Badge className="bg-red-100 text-red-800"><TrendingDown className="h-3 w-3 mr-1" />Decrease Supply</Badge>;
      default:
        return <Badge className="bg-blue-100 text-blue-800"><CheckCircle className="h-3 w-3 mr-1" />Maintain</Badge>;
    }
  };

  const getDemandIndicator = (ratio: number) => {
    if (ratio > 0.7) return { color: 'bg-green-500', label: 'High Demand' };
    if (ratio > 0.4) return { color: 'bg-yellow-500', label: 'Medium Demand' };
    return { color: 'bg-red-500', label: 'Low Demand' };
  };

  const totalCars = cars.length;
  const soldCars = cars.filter(car => car.status === 'sold').length;
  const inStockCars = cars.filter(car => car.status === 'in_stock').length;
  const overallDemandRatio = totalCars > 0 ? soldCars / totalCars : 0;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Overall Demand</p>
                <p className="text-2xl font-bold">{(overallDemandRatio * 100).toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Models to Increase</p>
                <p className="text-2xl font-bold">
                  {modelAnalysis.filter(m => m.recommendation === 'increase').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Models to Maintain</p>
                <p className="text-2xl font-bold">
                  {modelAnalysis.filter(m => m.recommendation === 'maintain').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">Models to Decrease</p>
                <p className="text-2xl font-bold">
                  {modelAnalysis.filter(m => m.recommendation === 'decrease').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Supply & Demand Analysis Table */}
      <Card>
        <CardHeader>
          <CardTitle>Supply & Demand Analysis by Model</CardTitle>
          <CardDescription>
            Analyze supply and demand patterns to optimize inventory levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Model</th>
                  <th className="text-left p-3">Stock Levels</th>
                  <th className="text-left p-3">Demand Ratio</th>
                  <th className="text-left p-3">Avg Days to Sell</th>
                  <th className="text-left p-3">Avg Price</th>
                  <th className="text-left p-3">Profitability</th>
                  <th className="text-left p-3">Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {modelAnalysis.map((analysis, index) => {
                  const demandIndicator = getDemandIndicator(analysis.demandRatio);
                  
                  return (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div>
                          <p className="font-medium">{analysis.brand} {analysis.model}</p>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">
                          <p><span className="font-medium text-green-600">{analysis.sold}</span> sold</p>
                          <p><span className="font-medium text-blue-600">{analysis.inStock}</span> in stock</p>
                          <p><span className="font-medium text-orange-600">{analysis.reserved}</span> reserved</p>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${demandIndicator.color}`}></div>
                          <span className="font-medium">{(analysis.demandRatio * 100).toFixed(1)}%</span>
                        </div>
                        <p className="text-xs text-gray-500">{demandIndicator.label}</p>
                      </td>
                      <td className="p-3">
                        <span className="font-medium">
                          {analysis.avgDaysToSell > 0 ? `${Math.round(analysis.avgDaysToSell)} days` : '-'}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="font-medium">
                          {analysis.avgPrice > 0 ? `$${Math.round(analysis.avgPrice).toLocaleString()}` : '-'}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`font-medium ${analysis.profitability > 15 ? 'text-green-600' : analysis.profitability > 5 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {analysis.profitability > 0 ? `${analysis.profitability.toFixed(1)}%` : '-'}
                        </span>
                      </td>
                      <td className="p-3">
                        {getRecommendationBadge(analysis.recommendation)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Quarterly Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>3-4 Month Ordering Recommendations</CardTitle>
          <CardDescription>
            Based on current demand patterns and inventory turnover
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {modelAnalysis
              .filter(analysis => analysis.recommendation === 'increase')
              .map((analysis, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">{analysis.brand} {analysis.model}</p>
                      <p className="text-sm text-gray-600">
                        High demand ({(analysis.demandRatio * 100).toFixed(1)}%) • 
                        Fast turnover ({Math.round(analysis.avgDaysToSell)} days)
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-700">
                      Order {Math.max(3, Math.round(analysis.sold * 1.5))} units
                    </p>
                    <p className="text-sm text-gray-600">Next quarter</p>
                  </div>
                </div>
              ))}

            {modelAnalysis
              .filter(analysis => analysis.recommendation === 'decrease')
              .map((analysis, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <TrendingDown className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="font-medium">{analysis.brand} {analysis.model}</p>
                      <p className="text-sm text-gray-600">
                        Low demand ({(analysis.demandRatio * 100).toFixed(1)}%) • 
                        Slow turnover ({Math.round(analysis.avgDaysToSell)} days)
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-700">
                      Reduce by {Math.max(1, Math.round(analysis.inStock * 0.5))} units
                    </p>
                    <p className="text-sm text-gray-600">Clear excess inventory</p>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupplyDemandChart; 