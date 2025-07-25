import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Edit, Save, X, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

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

interface CarPricingTableProps {
  cars: CarFinancialData[];
  onUpdatePricing: (carId: string, purchasePrice: number, sellingPrice: number) => void;
}

const CarPricingTable: React.FC<CarPricingTableProps> = ({ cars, onUpdatePricing }) => {
  const [editingCar, setEditingCar] = useState<string | null>(null);
  const [editPurchasePrice, setEditPurchasePrice] = useState<number>(0);
  const [editSellingPrice, setEditSellingPrice] = useState<number>(0);

  const handleEditStart = (car: CarFinancialData) => {
    setEditingCar(car.id);
    setEditPurchasePrice(car.purchasePrice || 0);
    setEditSellingPrice(car.sellingPrice || 0);
  };

  const handleEditCancel = () => {
    setEditingCar(null);
    setEditPurchasePrice(0);
    setEditSellingPrice(0);
  };

  const handleEditSave = (carId: string) => {
    if (editPurchasePrice <= 0 || editSellingPrice <= 0) {
      toast({
        title: 'Invalid Prices',
        description: 'Purchase and selling prices must be greater than 0',
        variant: 'destructive'
      });
      return;
    }

    onUpdatePricing(carId, editPurchasePrice, editSellingPrice);
    setEditingCar(null);
  };

  const getProfitStatus = (profitMargin: number) => {
    if (profitMargin > 20) return { color: 'bg-green-100 text-green-800', icon: TrendingUp };
    if (profitMargin > 10) return { color: 'bg-yellow-100 text-yellow-800', icon: TrendingUp };
    if (profitMargin > 0) return { color: 'bg-orange-100 text-orange-800', icon: TrendingUp };
    return { color: 'bg-red-100 text-red-800', icon: TrendingDown };
  };

  const totalInventoryValue = cars.reduce((sum, car) => sum + (car.purchasePrice || car.marketPrice || 0), 0);
  const totalProjectedRevenue = cars.filter(car => car.status === 'in_stock').reduce((sum, car) => sum + (car.sellingPrice || car.marketPrice || 0), 0);
  const carsWithProfitMargin = cars.filter(car => car.profitMargin);
  const avgProfitMargin = carsWithProfitMargin.length > 0 
    ? carsWithProfitMargin.reduce((sum, car) => sum + (car.profitMargin || 0), 0) / carsWithProfitMargin.length 
    : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Investment</p>
                <p className="text-2xl font-bold">${totalInventoryValue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Projected Revenue</p>
                <p className="text-2xl font-bold">${totalProjectedRevenue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Profit Margin</p>
                <p className="text-2xl font-bold">{avgProfitMargin.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pricing Table */}
      <Card>
        <CardHeader>
          <CardTitle>Car Pricing Management</CardTitle>
          <CardDescription>
            Manage purchase and selling prices for all vehicles in inventory
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Vehicle</th>
                  <th className="text-left p-3">VIN</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Purchase Price</th>
                  <th className="text-left p-3">Selling Price</th>
                  <th className="text-left p-3">Market Value</th>
                  <th className="text-left p-3">Profit Margin</th>
                  <th className="text-left p-3">Days in Stock</th>
                  <th className="text-left p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {cars.map((car) => {
                  const isEditing = editingCar === car.id;
                  const profitStatus = getProfitStatus(car.profitMargin || 0);
                  const ProfitIcon = profitStatus.icon;

                  return (
                    <tr key={car.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div>
                          <p className="font-medium">{car.brand} {car.model}</p>
                          <p className="text-sm text-gray-600">{car.year} • {car.color}</p>
                        </div>
                      </td>
                      <td className="p-3">
                        <p className="text-sm font-mono">{car.vinNumber}</p>
                      </td>
                      <td className="p-3">
                        <Badge variant={car.status === 'sold' ? 'default' : car.status === 'reserved' ? 'secondary' : 'outline'}>
                          {(car.status || 'in_stock').replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="p-3">
                        {isEditing ? (
                          <Input
                            type="number"
                            value={editPurchasePrice}
                            onChange={(e) => setEditPurchasePrice(parseFloat(e.target.value) || 0)}
                            className="w-24"
                          />
                        ) : (
                          <span className="font-medium">
                            {car.purchasePrice ? `$${car.purchasePrice.toLocaleString()}` : 'Not set'}
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        {isEditing ? (
                          <Input
                            type="number"
                            value={editSellingPrice}
                            onChange={(e) => setEditSellingPrice(parseFloat(e.target.value) || 0)}
                            className="w-24"
                          />
                        ) : (
                          <span className="font-medium">
                            {car.sellingPrice ? `$${car.sellingPrice.toLocaleString()}` : 'Not set'}
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className="text-gray-600">
                          ${(car.marketPrice || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="p-3">
                        {car.profitMargin ? (
                          <div className="flex items-center gap-1">
                            <ProfitIcon className="h-4 w-4" />
                            <Badge className={profitStatus.color}>
                              {car.profitMargin.toFixed(1)}%
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className="text-sm">
                          {car.daysInInventory || 0} days
                        </span>
                      </td>
                      <td className="p-3">
                        {isEditing ? (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              onClick={() => handleEditSave(car.id)}
                              className="h-8 w-8 p-0"
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleEditCancel}
                              className="h-8 w-8 p-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditStart(car)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CarPricingTable; 