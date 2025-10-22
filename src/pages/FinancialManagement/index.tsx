import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, TrendingUp, TrendingDown, DollarSign, Car, FileText, BarChart3, Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuditLog } from '@/hooks/useAuditLog';
import CarPricingTable from './components/CarPricingTable';
import SupplyDemandChart from './components/SupplyDemandChart';
import InventoryForecast from './components/InventoryForecast';
import ProfitabilityAnalysis from './components/ProfitabilityAnalysis';
import ReceiptUploader from './components/ReceiptUploader';
import GarageCostTracker from './components/GarageCostTracker';
import FinancialInputDialog, { FinancialData } from '@/components/FinancialInputDialog';
import MarketingBudgetCalendar from './components/MarketingBudgetCalendar';

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

const FinancialManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('pricing');
  const [carFinancialData, setCarFinancialData] = useState<CarFinancialData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFinancialDialogOpen, setIsFinancialDialogOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState<CarFinancialData | null>(null);
  
  const { logActivity } = useAuditLog();

  // Load car inventory data and transform to financial data
  useEffect(() => {
    loadFinancialData();
  }, []);

  const loadFinancialData = async () => {
    try {
      setLoading(true);
      // Get cars from inventory
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

          return {
            id: car.id,
            vinNumber: car.vinNumber,
            model: car.model,
            brand: car.brand || 'Unknown',
            year: car.year,
            color: car.color,
            arrivalDate: car.arrivalDate,
            soldDate: car.soldDate,
            purchasePrice: car.purchasePrice,
            sellingPrice: car.sellingPrice,
            marketPrice: estimateMarketPrice(car),
            receipts: car.receipts || [],
            status: car.status,
            daysInInventory,
            profitMargin: calculateProfitMargin(car.purchasePrice, car.sellingPrice)
          };
        });
        
        setCarFinancialData(financialData);
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

  const estimateMarketPrice = (car: any): number => {
    // Basic market price estimation based on model, year, and category
    const basePrice = getBasePriceByModel(car.model, car.category);
    const yearFactor = Math.max(0.7, 1 - (new Date().getFullYear() - car.year) * 0.05);
    return Math.round(basePrice * yearFactor);
  };

  const getBasePriceByModel = (model: string, category: string): number => {
    // Market price estimates for different models
    const prices: Record<string, number> = {
      'Voyah Free': 45000,
      'Voyah Dream': 55000,
      'Voyah Passion': 65000,
      'Voyah Courage': 75000,
      'MHero 917': 85000,
      'Tesla Model 3': 35000,
      'Tesla Model Y': 45000,
      'BMW X3': 50000,
    };
    
    return prices[model] || (category === 'EV' ? 40000 : 35000);
  };

  const calculateProfitMargin = (purchasePrice?: number, sellingPrice?: number): number => {
    if (!purchasePrice || !sellingPrice) return 0;
    return ((sellingPrice - purchasePrice) / purchasePrice) * 100;
  };

  const updateCarPricing = (carId: string, purchasePrice: number, sellingPrice: number) => {
    setCarFinancialData(prev => 
      prev.map(car => 
        car.id === carId 
          ? { 
              ...car, 
              purchasePrice, 
              sellingPrice,
              profitMargin: calculateProfitMargin(purchasePrice, sellingPrice)
            }
          : car
      )
    );
    
    // Update in localStorage as well
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
      description: 'Car pricing has been successfully updated',
    });
  };

  const addReceipt = (carId: string, receipt: any) => {
    const existingCar = carFinancialData.find(car => car.id === carId);
    const newReceipt = { ...receipt, id: Date.now().toString() };
    
    setCarFinancialData(prev => 
      prev.map(car => 
        car.id === carId 
          ? { ...car, receipts: [...car.receipts, newReceipt] }
          : car
      )
    );

    // Log the receipt upload activity
    logActivity(
      'UPLOAD',
      'FINANCIAL',
      'RECEIPT',
      `Uploaded ${receipt.type} receipt for ${existingCar?.model} (VIN: ${existingCar?.vinNumber}) - Amount: $${receipt.amount.toLocaleString()}`,
      {
        entityId: newReceipt.id,
        entityName: `${receipt.type} receipt - ${existingCar?.model}`,
        changes: [
          { field: 'receiptType', oldValue: null, newValue: receipt.type },
          { field: 'amount', oldValue: null, newValue: receipt.amount },
          { field: 'description', oldValue: null, newValue: receipt.description }
        ]
      }
    );

    toast({
      title: 'Receipt Added',
      description: 'Receipt has been uploaded and saved',
    });
  };

  const handleOpenFinancialDialog = (car?: CarFinancialData) => {
    setSelectedCar(car || null);
    setIsFinancialDialogOpen(true);
  };

  const handleSaveFinancialData = async (data: FinancialData) => {
    try {
      // Update the car financial data with comprehensive information
      if (selectedCar) {
        setCarFinancialData(prev => 
          prev.map(car => 
            car.id === selectedCar.id 
              ? {
                  ...car,
                  purchasePrice: data.purchasePrice || car.purchasePrice,
                  sellingPrice: data.finalSalePrice || car.sellingPrice,
                  profitMargin: calculateProfitMargin(
                    data.purchasePrice || car.purchasePrice,
                    data.finalSalePrice || car.sellingPrice
                  )
                }
              : car
          )
        );

        // Update localStorage
        const savedInventory = localStorage.getItem('carInventory');
        if (savedInventory) {
          const inventory = JSON.parse(savedInventory);
          const updatedInventory = inventory.map((car: any) => 
            car.id === selectedCar.id 
              ? { 
                  ...car, 
                  purchasePrice: data.purchasePrice || car.purchasePrice,
                  sellingPrice: data.finalSalePrice || car.sellingPrice
                }
              : car
          );
          localStorage.setItem('carInventory', JSON.stringify(updatedInventory));
        }
      }

      // Log the activity
      await logActivity(
        selectedCar ? 'UPDATE' : 'CREATE',
        'FINANCIAL',
        'FINANCIAL_RECORD',
        `${selectedCar ? 'Updated' : 'Created'} comprehensive financial record for ${data.entityName}`,
        {
          entityId: data.entityId,
          entityName: data.entityName,
          metadata: {
            pageUrl: window.location.href,
            deviceType: 'desktop' as const
          }
        }
      );

      toast({
        title: "Financial Data Saved",
        description: `Comprehensive financial information for ${data.entityName} has been saved successfully.`,
      });

      setIsFinancialDialogOpen(false);
      setSelectedCar(null);

    } catch (error) {
      console.error('Error saving financial data:', error);
      toast({
        title: "Error",
        description: "Failed to save financial data. Please try again.",
        variant: "destructive",
      });
    }
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
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Management</h1>
          <p className="text-muted-foreground">
            Manage car pricing, analyze supply & demand, and forecast inventory needs
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button onClick={() => handleOpenFinancialDialog()} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-1 h-4 w-4" />
            Add Financial Record
          </Button>
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Inventory Value</p>
                <p className="text-lg font-semibold">
                  ${carFinancialData.reduce((sum, car) => sum + (car.marketPrice || 0), 0).toLocaleString()}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Car className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Cars in Stock</p>
                <p className="text-lg font-semibold">
                  {carFinancialData.filter(car => car.status === 'in_stock').length}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="pricing" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Pricing & Receipts
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Supply & Demand
          </TabsTrigger>
          <TabsTrigger value="forecast" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Inventory Forecast
          </TabsTrigger>
          <TabsTrigger value="profitability" className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            Profitability
          </TabsTrigger>
          <TabsTrigger value="garage-costs" className="flex items-center gap-2">
            <Car className="h-4 w-4" />
            Garage Costs
          </TabsTrigger>
          <TabsTrigger value="receipts" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Receipt Manager
          </TabsTrigger>
          <TabsTrigger value="marketing-budget" className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
            Marketing Budget
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pricing">
          <CarPricingTable 
            cars={carFinancialData} 
            onUpdatePricing={updateCarPricing}
          />
        </TabsContent>

        <TabsContent value="analytics">
          <SupplyDemandChart cars={carFinancialData} />
        </TabsContent>

        <TabsContent value="forecast">
          <InventoryForecast cars={carFinancialData} />
        </TabsContent>

        <TabsContent value="profitability">
          <ProfitabilityAnalysis cars={carFinancialData} />
        </TabsContent>

        <TabsContent value="garage-costs">
          <GarageCostTracker />
        </TabsContent>

        <TabsContent value="receipts">
          <ReceiptUploader 
            cars={carFinancialData}
            onAddReceipt={addReceipt}
          />
        </TabsContent>

        <TabsContent value="marketing-budget">
          <MarketingBudgetCalendar />
        </TabsContent>
      </Tabs>

      {/* Financial Input Dialog */}
      <FinancialInputDialog
        isOpen={isFinancialDialogOpen}
        onClose={() => setIsFinancialDialogOpen(false)}
        onSave={handleSaveFinancialData}
        initialData={selectedCar ? {
          entityId: selectedCar.id,
          entityName: `${selectedCar.brand} ${selectedCar.model}`,
          type: 'car_sale' as const,
          date: new Date().toISOString().split('T')[0],
          purchasePrice: selectedCar.purchasePrice,
          finalSalePrice: selectedCar.sellingPrice,
          currency: 'USD' as const,
          status: 'draft' as const
        } : undefined}
      />
    </div>
  );
};

export default FinancialManagementPage; 