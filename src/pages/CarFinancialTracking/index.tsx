import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Package, 
  Truck, 
  Calculator,
  FileText,
  Plus,
  Edit,
  Eye,
  Download
} from 'lucide-react';

interface CarFinancialData {
  id: string;
  vinNumber: string;
  model: string;
  year: number;
  purchaseCost: number;
  shippingCost: number;
  customsFees: number;
  taxes: number;
  otherExpenses: number;
  sellingPrice: number;
  profit: number;
  profitMargin: number;
  status: 'in_stock' | 'sold' | 'reserved';
  purchaseDate: string;
  saleDate?: string;
  notes: string;
}

const CarFinancialTrackingPage: React.FC = () => {
  const [financialData, setFinancialData] = useState<CarFinancialData[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState<CarFinancialData | null>(null);
  const [editingCar, setEditingCar] = useState<CarFinancialData | null>(null);

  const calculateProfit = (car: Partial<CarFinancialData>): number => {
    const totalCost = (car.purchaseCost || 0) + 
                     (car.shippingCost || 0) + 
                     (car.customsFees || 0) + 
                     (car.taxes || 0) + 
                     (car.otherExpenses || 0);
    return (car.sellingPrice || 0) - totalCost;
  };

  const calculateProfitMargin = (profit: number, sellingPrice: number): number => {
    return sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;
  };

  const handleAddCar = (carData: Omit<CarFinancialData, 'id' | 'profit' | 'profitMargin'>) => {
    const profit = calculateProfit(carData);
    const profitMargin = calculateProfitMargin(profit, carData.sellingPrice);
    
    const newCar: CarFinancialData = {
      ...carData,
      id: Date.now().toString(),
      profit,
      profitMargin
    };

    setFinancialData(prev => [...prev, newCar]);
    setIsAddDialogOpen(false);
    toast({
      title: "Car Added",
      description: `Financial data added for ${carData.model}`,
    });
  };

  const handleEditCar = (carId: string, updates: Partial<CarFinancialData>) => {
    const updatedCar = { ...updates };
    updatedCar.profit = calculateProfit(updatedCar);
    updatedCar.profitMargin = calculateProfitMargin(updatedCar.profit || 0, updatedCar.sellingPrice || 0);

    setFinancialData(prev => prev.map(car => 
      car.id === carId ? { ...car, ...updatedCar } : car
    ));
    setIsEditDialogOpen(false);
    setEditingCar(null);
    toast({
      title: "Car Updated",
      description: `Financial data updated for ${updates.model}`,
    });
  };

  const getTotalStats = () => {
    const totalPurchaseCost = financialData.reduce((sum, car) => sum + car.purchaseCost, 0);
    const totalShippingCost = financialData.reduce((sum, car) => sum + car.shippingCost, 0);
    const totalExpenses = financialData.reduce((sum, car) => 
      sum + car.purchaseCost + car.shippingCost + car.customsFees + car.taxes + car.otherExpenses, 0
    );
    const totalRevenue = financialData.reduce((sum, car) => sum + car.sellingPrice, 0);
    const totalProfit = financialData.reduce((sum, car) => sum + car.profit, 0);
    const averageProfitMargin = financialData.length > 0 
      ? financialData.reduce((sum, car) => sum + car.profitMargin, 0) / financialData.length 
      : 0;

    return {
      totalPurchaseCost,
      totalShippingCost,
      totalExpenses,
      totalRevenue,
      totalProfit,
      averageProfitMargin
    };
  };

  const stats = getTotalStats();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <DollarSign className="h-8 w-8 text-green-600" />
            Car Financial Tracking
          </h1>
          <p className="text-muted-foreground">
            Track purchase costs, shipping expenses, and sales profits
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-green-600 border-green-600">
            {financialData.length} Cars Tracked
          </Badge>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Car
          </Button>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Purchase Cost</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalPurchaseCost.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Average: ${financialData.length > 0 ? (stats.totalPurchaseCost / financialData.length).toLocaleString() : 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shipping Cost</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalShippingCost.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Average: ${financialData.length > 0 ? (stats.totalShippingCost / financialData.length).toLocaleString() : 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Average: ${financialData.length > 0 ? (stats.totalRevenue / financialData.length).toLocaleString() : 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
            <Calculator className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${stats.totalProfit.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Average: ${financialData.length > 0 ? (stats.totalProfit / financialData.length).toLocaleString() : 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Profit Margin</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.averageProfitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.averageProfitMargin.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {financialData.length} cars tracked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${stats.totalExpenses.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Purchase + Shipping + Fees + Taxes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Financial Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Car Financial Data
            <Badge variant="secondary" className="ml-auto">
              {financialData.length} cars
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {financialData.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>VIN</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Purchase Cost</TableHead>
                    <TableHead>Shipping</TableHead>
                    <TableHead>Total Expenses</TableHead>
                    <TableHead>Selling Price</TableHead>
                    <TableHead>Profit</TableHead>
                    <TableHead>Margin</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {financialData.map((car) => {
                    const totalExpenses = car.purchaseCost + car.shippingCost + car.customsFees + car.taxes + car.otherExpenses;
                    return (
                      <TableRow key={car.id}>
                        <TableCell className="font-mono text-sm">{car.vinNumber}</TableCell>
                        <TableCell className="font-medium">{car.model}</TableCell>
                        <TableCell>${car.purchaseCost.toLocaleString()}</TableCell>
                        <TableCell>${car.shippingCost.toLocaleString()}</TableCell>
                        <TableCell>${totalExpenses.toLocaleString()}</TableCell>
                        <TableCell>${car.sellingPrice.toLocaleString()}</TableCell>
                        <TableCell>
                          <span className={car.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                            ${car.profit.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={car.profitMargin >= 0 ? 'default' : 'destructive'}>
                            {car.profitMargin.toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={car.status === 'sold' ? 'default' : 'secondary'}>
                            {car.status === 'sold' ? 'Sold' : car.status === 'reserved' ? 'Reserved' : 'In Stock'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedCar(car);
                                setIsViewDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingCar(car);
                                setIsEditDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Financial Data</h3>
              <p className="text-muted-foreground mb-4">
                Start tracking car financial data by adding your first car.
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Car
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Car Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Car Financial Data</DialogTitle>
          </DialogHeader>
          <AddEditCarForm
            onSubmit={handleAddCar}
            onCancel={() => setIsAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Car Dialog */}
      {editingCar && (
        <Dialog open={isEditDialogOpen} onOpenChange={() => {
          setIsEditDialogOpen(false);
          setEditingCar(null);
        }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Car Financial Data</DialogTitle>
            </DialogHeader>
            <AddEditCarForm
              car={editingCar}
              onSubmit={(carData) => handleEditCar(editingCar.id, carData)}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setEditingCar(null);
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* View Car Dialog */}
      {selectedCar && (
        <Dialog open={isViewDialogOpen} onOpenChange={() => {
          setIsViewDialogOpen(false);
          setSelectedCar(null);
        }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Car Financial Details - {selectedCar.model}</DialogTitle>
            </DialogHeader>
            <ViewCarFinancialDetails car={selectedCar} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

// Add/Edit Car Form Component
interface AddEditCarFormProps {
  car?: CarFinancialData;
  onSubmit: (carData: Omit<CarFinancialData, 'id' | 'profit' | 'profitMargin'>) => void;
  onCancel: () => void;
}

const AddEditCarForm: React.FC<AddEditCarFormProps> = ({ car, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    vinNumber: car?.vinNumber || '',
    model: car?.model || '',
    year: car?.year || 2024,
    purchaseCost: car?.purchaseCost || 0,
    shippingCost: car?.shippingCost || 0,
    customsFees: car?.customsFees || 0,
    taxes: car?.taxes || 0,
    otherExpenses: car?.otherExpenses || 0,
    sellingPrice: car?.sellingPrice || 0,
    status: car?.status || 'in_stock',
    purchaseDate: car?.purchaseDate || new Date().toISOString().split('T')[0],
    saleDate: car?.saleDate || '',
    notes: car?.notes || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const totalCost = formData.purchaseCost + formData.shippingCost + formData.customsFees + formData.taxes + formData.otherExpenses;
  const profit = formData.sellingPrice - totalCost;
  const profitMargin = formData.sellingPrice > 0 ? (profit / formData.sellingPrice) * 100 : 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>VIN Number</Label>
          <Input
            value={formData.vinNumber}
            onChange={(e) => setFormData(prev => ({ ...prev, vinNumber: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label>Model</Label>
          <Input
            value={formData.model}
            onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label>Year</Label>
          <Input
            type="number"
            value={formData.year}
            onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
            required
          />
        </div>
        <div>
          <Label>Status</Label>
          <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="in_stock">In Stock</SelectItem>
              <SelectItem value="reserved">Reserved</SelectItem>
              <SelectItem value="sold">Sold</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Purchase Cost ($)</Label>
          <Input
            type="number"
            value={formData.purchaseCost}
            onChange={(e) => setFormData(prev => ({ ...prev, purchaseCost: parseFloat(e.target.value) || 0 }))}
            required
          />
        </div>
        <div>
          <Label>Shipping Cost ($)</Label>
          <Input
            type="number"
            value={formData.shippingCost}
            onChange={(e) => setFormData(prev => ({ ...prev, shippingCost: parseFloat(e.target.value) || 0 }))}
            required
          />
        </div>
        <div>
          <Label>Customs Fees ($)</Label>
          <Input
            type="number"
            value={formData.customsFees}
            onChange={(e) => setFormData(prev => ({ ...prev, customsFees: parseFloat(e.target.value) || 0 }))}
          />
        </div>
        <div>
          <Label>Taxes ($)</Label>
          <Input
            type="number"
            value={formData.taxes}
            onChange={(e) => setFormData(prev => ({ ...prev, taxes: parseFloat(e.target.value) || 0 }))}
          />
        </div>
        <div>
          <Label>Other Expenses ($)</Label>
          <Input
            type="number"
            value={formData.otherExpenses}
            onChange={(e) => setFormData(prev => ({ ...prev, otherExpenses: parseFloat(e.target.value) || 0 }))}
          />
        </div>
        <div>
          <Label>Selling Price ($)</Label>
          <Input
            type="number"
            value={formData.sellingPrice}
            onChange={(e) => setFormData(prev => ({ ...prev, sellingPrice: parseFloat(e.target.value) || 0 }))}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Purchase Date</Label>
          <Input
            type="date"
            value={formData.purchaseDate}
            onChange={(e) => setFormData(prev => ({ ...prev, purchaseDate: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label>Sale Date (if sold)</Label>
          <Input
            type="date"
            value={formData.saleDate}
            onChange={(e) => setFormData(prev => ({ ...prev, saleDate: e.target.value }))}
          />
        </div>
      </div>

      <div>
        <Label>Notes</Label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Additional notes about this car's financial data..."
        />
      </div>

      {/* Financial Summary */}
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="text-lg">Financial Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span>Total Cost:</span>
            <span className="font-semibold">${totalCost.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Profit:</span>
            <span className={`font-semibold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${profit.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Profit Margin:</span>
            <span className={`font-semibold ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {profitMargin.toFixed(1)}%
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {car ? 'Update Car' : 'Add Car'}
        </Button>
      </div>
    </form>
  );
};

// View Car Financial Details Component
interface ViewCarFinancialDetailsProps {
  car: CarFinancialData;
}

const ViewCarFinancialDetails: React.FC<ViewCarFinancialDetailsProps> = ({ car }) => {
  const totalExpenses = car.purchaseCost + car.shippingCost + car.customsFees + car.taxes + car.otherExpenses;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="font-semibold">VIN Number</Label>
          <p className="text-sm font-mono">{car.vinNumber}</p>
        </div>
        <div>
          <Label className="font-semibold">Model</Label>
          <p className="text-sm">{car.model}</p>
        </div>
        <div>
          <Label className="font-semibold">Year</Label>
          <p className="text-sm">{car.year}</p>
        </div>
        <div>
          <Label className="font-semibold">Status</Label>
          <Badge variant={car.status === 'sold' ? 'default' : 'secondary'}>
            {car.status === 'sold' ? 'Sold' : car.status === 'reserved' ? 'Reserved' : 'In Stock'}
          </Badge>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold">Cost Breakdown</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm">Purchase Cost</Label>
            <p className="text-lg font-semibold">${car.purchaseCost.toLocaleString()}</p>
          </div>
          <div>
            <Label className="text-sm">Shipping Cost</Label>
            <p className="text-lg font-semibold">${car.shippingCost.toLocaleString()}</p>
          </div>
          <div>
            <Label className="text-sm">Customs Fees</Label>
            <p className="text-lg font-semibold">${car.customsFees.toLocaleString()}</p>
          </div>
          <div>
            <Label className="text-sm">Taxes</Label>
            <p className="text-lg font-semibold">${car.taxes.toLocaleString()}</p>
          </div>
          <div>
            <Label className="text-sm">Other Expenses</Label>
            <p className="text-lg font-semibold">${car.otherExpenses.toLocaleString()}</p>
          </div>
          <div>
            <Label className="text-sm">Total Expenses</Label>
            <p className="text-lg font-semibold text-red-600">${totalExpenses.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold">Revenue & Profit</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm">Selling Price</Label>
            <p className="text-lg font-semibold text-green-600">${car.sellingPrice.toLocaleString()}</p>
          </div>
          <div>
            <Label className="text-sm">Profit</Label>
            <p className={`text-lg font-semibold ${car.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${car.profit.toLocaleString()}
            </p>
          </div>
          <div>
            <Label className="text-sm">Profit Margin</Label>
            <Badge variant={car.profitMargin >= 0 ? 'default' : 'destructive'}>
              {car.profitMargin.toFixed(1)}%
            </Badge>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold">Dates</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm">Purchase Date</Label>
            <p className="text-sm">{new Date(car.purchaseDate).toLocaleDateString()}</p>
          </div>
          {car.saleDate && (
            <div>
              <Label className="text-sm">Sale Date</Label>
              <p className="text-sm">{new Date(car.saleDate).toLocaleDateString()}</p>
            </div>
          )}
        </div>
      </div>

      {car.notes && (
        <div className="space-y-2">
          <Label className="font-semibold">Notes</Label>
          <p className="text-sm text-muted-foreground">{car.notes}</p>
        </div>
      )}
    </div>
  );
};

export default CarFinancialTrackingPage; 