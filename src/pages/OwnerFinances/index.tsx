import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Car, 
  Calculator, 
  PieChart, 
  BarChart3,
  Shield,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  X,
  Percent
} from 'lucide-react';
import { safeParseFloat } from '@/utils/errorHandling';

interface CarFinancialData {
  id: string;
  vinNumber: string;
  model: string;
  brand: string;
  year: number;
  color: string;
  status?: 'in_stock' | 'sold' | 'reserved';
  purchasePrice?: number;
  sellingPrice?: number;
  soldDate?: string;
  arrivalDate: string;
  daysInInventory: number;
  profitMargin?: number;
  totalCost?: number;
  netProfit?: number;
}

const OwnerFinancesPage: React.FC = () => {
  const { user } = useAuth();
  
  // Always call hooks at the top level - BEFORE any conditional returns
  const [financialData, setFinancialData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [carFinancials, setCarFinancials] = useState<CarFinancialData[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [showPrices, setShowPrices] = useState(true);

  useEffect(() => {
    // Hook called unconditionally at top level
    // Only load data if user has proper access
    if (user?.role?.toUpperCase() === 'OWNER') {
      // Load financial data here
      loadFinancialData();
    }
    setLoading(false);
  }, [user]);

  // Conditional logic after hooks
  if (user?.role?.toUpperCase() !== 'OWNER') {
    toast({
      title: "Access Denied",
      description: "Only owners can access financial data.",
      variant: "destructive"
    });
    return <Navigate to="/dashboard" />;
  }

  const loadFinancialData = async () => {
    try {
      setLoading(true);
      const savedInventory = localStorage.getItem('carInventory');
      
      if (savedInventory) {
        const inventory = JSON.parse(savedInventory);
        
        const financialData: CarFinancialData[] = inventory.map((car: any) => {
          const arrivalDate = new Date(car.arrivalDate);
          const soldDate = car.soldDate ? new Date(car.soldDate) : null;
          const currentDate = new Date();
          
          const daysInInventory = soldDate 
            ? Math.floor((soldDate.getTime() - arrivalDate.getTime()) / (1000 * 60 * 60 * 24))
            : Math.floor((currentDate.getTime() - arrivalDate.getTime()) / (1000 * 60 * 60 * 24));

          const purchasePrice = car.purchasePrice || 0;
          const sellingPrice = car.sellingPrice || 0;
          const profitMargin = purchasePrice > 0 && sellingPrice > 0 
            ? ((sellingPrice - purchasePrice) / purchasePrice) * 100 
            : 0;
          const netProfit = sellingPrice - purchasePrice;

          return {
            id: car.id,
            vinNumber: car.vinNumber,
            model: car.model,
            brand: car.brand || 'Unknown',
            year: car.year,
            color: car.color,
            status: car.status || 'in_stock',
            purchasePrice,
            sellingPrice,
            soldDate: car.soldDate,
            arrivalDate: car.arrivalDate,
            daysInInventory,
            profitMargin,
            totalCost: purchasePrice,
            netProfit
          };
        });
        
        setCarFinancials(financialData);
      }
    } catch (error) {
      console.error('Error loading financial data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load financial data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateCarPricing = (carId: string, purchasePrice: number, sellingPrice: number) => {
    setCarFinancials(prev => 
      prev.map(car => 
        car.id === carId 
          ? { 
              ...car, 
              purchasePrice, 
              sellingPrice,
              profitMargin: purchasePrice > 0 ? ((sellingPrice - purchasePrice) / purchasePrice) * 100 : 0,
              netProfit: sellingPrice - purchasePrice
            }
          : car
      )
    );
    
    const savedInventory = localStorage.getItem('carInventory');
    if (savedInventory) {
      const inventory = JSON.parse(savedInventory);
      const updatedInventory = inventory.map((car: any) => 
        car.id === carId ? { ...car, purchasePrice, sellingPrice } : car
      );
      localStorage.setItem('carInventory', JSON.stringify(updatedInventory));
    }

    toast({
      title: 'Pricing Updated',
      description: 'Purchase and selling prices have been updated',
    });
  };

  // Financial calculations
  const totalInventoryValue = carFinancials.reduce((sum, car) => sum + (car.purchasePrice || 0), 0);
  const totalProjectedRevenue = carFinancials
    .filter(car => car.status === 'in_stock')
    .reduce((sum, car) => sum + (car.sellingPrice || 0), 0);
  const totalActualRevenue = carFinancials
    .filter(car => car.status === 'sold')
    .reduce((sum, car) => sum + (car.sellingPrice || 0), 0);
  const totalActualCosts = carFinancials
    .filter(car => car.status === 'sold')
    .reduce((sum, car) => sum + (car.purchasePrice || 0), 0);
  const totalProfit = totalActualRevenue - totalActualCosts;
  const avgProfitMargin = carFinancials
    .filter(car => car.profitMargin && car.status === 'sold')
    .reduce((sum, car) => sum + (car.profitMargin || 0), 0) / 
    Math.max(1, carFinancials.filter(car => car.profitMargin && car.status === 'sold').length);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getProfitColor = (margin: number) => {
    if (margin > 20) return 'text-green-600';
    if (margin > 10) return 'text-yellow-600';
    if (margin > 0) return 'text-orange-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading financial data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-8 w-8 text-blue-600" />
            Owner Finances
          </h1>
          <p className="text-muted-foreground">
            Confidential financial data and purchase prices - Owner access only
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowPrices(!showPrices)}
          className="flex items-center gap-2"
        >
          {showPrices ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {showPrices ? 'Hide Prices' : 'Show Prices'}
        </Button>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {showPrices ? formatCurrency(totalInventoryValue) : '•••••••'}
            </div>
            <p className="text-xs text-muted-foreground">
              Based on purchase prices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projected Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {showPrices ? formatCurrency(totalProjectedRevenue) : '•••••••'}
            </div>
            <p className="text-xs text-muted-foreground">
              From current inventory
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actual Profit</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getProfitColor(avgProfitMargin)}`}>
              {showPrices ? formatCurrency(totalProfit) : '•••••••'}
            </div>
            <p className="text-xs text-muted-foreground">
              From sold vehicles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Profit Margin</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getProfitColor(avgProfitMargin)}`}>
              {avgProfitMargin.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              On sold vehicles
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Financial Overview</TabsTrigger>
          <TabsTrigger value="details">Car Details</TabsTrigger>
          <TabsTrigger value="pricing">Pricing Management</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Inventory Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Inventory Status Breakdown</CardTitle>
                <CardDescription>Financial breakdown by car status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {['in_stock', 'sold', 'reserved'].map(status => {
                  const statusCars = carFinancials.filter(car => car.status === status);
                  const statusValue = statusCars.reduce((sum, car) => sum + (car.purchasePrice || 0), 0);
                  const statusRevenue = statusCars.reduce((sum, car) => sum + (car.sellingPrice || 0), 0);
                  
                  return (
                    <div key={status} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <Badge variant={status === 'sold' ? 'default' : status === 'reserved' ? 'secondary' : 'outline'}>
                          {status.replace('_', ' ')} ({statusCars.length})
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {showPrices ? formatCurrency(statusValue) : '•••••••'}
                        </div>
                        {status === 'sold' && (
                          <div className="text-sm text-muted-foreground">
                            Revenue: {showPrices ? formatCurrency(statusRevenue) : '•••••••'}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Top Performers */}
            <Card>
              <CardHeader>
                <CardTitle>Top Profit Margins</CardTitle>
                <CardDescription>Best performing sold vehicles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {carFinancials
                    .filter(car => car.status === 'sold' && car.profitMargin)
                    .sort((a, b) => (b.profitMargin || 0) - (a.profitMargin || 0))
                    .slice(0, 5)
                    .map(car => (
                      <div key={car.id} className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{car.brand} {car.model}</div>
                          <div className="text-sm text-muted-foreground">{car.year} • {car.color}</div>
                        </div>
                        <div className="text-right">
                          <div className={`font-bold ${getProfitColor(car.profitMargin || 0)}`}>
                            {(car.profitMargin || 0).toFixed(1)}%
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {showPrices ? formatCurrency(car.netProfit || 0) : '•••••••'}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Financial Data</CardTitle>
              <CardDescription>Complete financial breakdown for all vehicles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Vehicle</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Purchase Price</th>
                      <th className="text-left p-2">Selling Price</th>
                      <th className="text-left p-2">Net Profit</th>
                      <th className="text-left p-2">Margin</th>
                      <th className="text-left p-2">Days in Inventory</th>
                    </tr>
                  </thead>
                  <tbody>
                    {carFinancials.map(car => (
                      <tr key={car.id} className="border-b hover:bg-gray-50">
                        <td className="p-2">
                          <div>
                            <div className="font-medium">{car.brand} {car.model}</div>
                            <div className="text-xs text-muted-foreground">{car.year} • {car.color}</div>
                          </div>
                        </td>
                        <td className="p-2">
                          <Badge variant={car.status === 'sold' ? 'default' : car.status === 'reserved' ? 'secondary' : 'outline'}>
                            {(car.status || 'in_stock').replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="p-2 font-medium">
                          {showPrices ? formatCurrency(car.purchasePrice || 0) : '••••••'}
                        </td>
                        <td className="p-2 font-medium">
                          {showPrices ? formatCurrency(car.sellingPrice || 0) : '••••••'}
                        </td>
                        <td className={`p-2 font-medium ${getProfitColor(car.profitMargin || 0)}`}>
                          {showPrices ? formatCurrency(car.netProfit || 0) : '••••••'}
                        </td>
                        <td className={`p-2 font-bold ${getProfitColor(car.profitMargin || 0)}`}>
                          {(car.profitMargin || 0).toFixed(1)}%
                        </td>
                        <td className="p-2">
                          {car.daysInInventory} days
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pricing Management</CardTitle>
              <CardDescription>Update purchase and selling prices for vehicles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {carFinancials
                  .filter(car => car.status !== 'sold')
                  .map(car => (
                    <PricingRow 
                      key={car.id} 
                      car={car} 
                      onUpdatePricing={updateCarPricing}
                      showPrices={showPrices}
                    />
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Pricing Row Component
interface PricingRowProps {
  car: CarFinancialData;
  onUpdatePricing: (carId: string, purchasePrice: number, sellingPrice: number) => void;
  showPrices: boolean;
}

const PricingRow: React.FC<PricingRowProps> = ({ car, onUpdatePricing, showPrices }) => {
  const [editing, setEditing] = useState(false);
  const [purchasePrice, setPurchasePrice] = useState(car.purchasePrice || 0);
  const [sellingPrice, setSellingPrice] = useState(car.sellingPrice || 0);

  const handleSave = () => {
    if (purchasePrice <= 0 || sellingPrice <= 0) {
      toast({
        title: 'Invalid Prices',
        description: 'Both purchase and selling prices must be greater than 0',
        variant: 'destructive'
      });
      return;
    }
    
    onUpdatePricing(car.id, purchasePrice, sellingPrice);
    setEditing(false);
  };

  const handleCancel = () => {
    setPurchasePrice(car.purchasePrice || 0);
    setSellingPrice(car.sellingPrice || 0);
    setEditing(false);
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex-1">
        <div className="font-medium">{car.brand} {car.model}</div>
        <div className="text-sm text-muted-foreground">{car.year} • {car.color} • {car.vinNumber}</div>
      </div>
      
      <div className="flex items-center gap-4">
        {editing ? (
          <>
            <div className="space-y-1">
              <Label className="text-xs">Purchase Price</Label>
              <Input
                type="number"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(safeParseFloat(e.target.value, 0))}
                className="w-32"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Selling Price</Label>
              <Input
                type="number"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(safeParseFloat(e.target.value, 0))}
                className="w-32"
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave}>
                <CheckCircle className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Purchase</div>
              <div className="font-medium">
                {showPrices ? `$${(car.purchasePrice || 0).toLocaleString()}` : '••••••'}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Selling</div>
              <div className="font-medium">
                {showPrices ? `$${(car.sellingPrice || 0).toLocaleString()}` : '••••••'}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Margin</div>
              <div className={`font-bold ${car.profitMargin && car.profitMargin > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {(car.profitMargin || 0).toFixed(1)}%
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              Edit
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default OwnerFinancesPage; 