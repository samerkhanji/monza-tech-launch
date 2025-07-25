
import React, { useState } from 'react';
import { dateUtils, numberUtils, stringUtils, validationUtils } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calculator, 
  Wrench, 
  Package, 
  Zap, 
  Clock,
  BarChart3
} from 'lucide-react';
import { useFinancialAnalytics } from '@/hooks/useFinancialAnalytics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const FinancialAnalytics: React.FC = () => {
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    end: new Date().toISOString().split('T')[0] // today
  });

  const {
    repairFinancials,
    vehicleSalesFinancials,
    equipmentAssets,
    inventoryValuation,
    operationalCosts,
    financialSummary,
    loading,
    error
  } = useFinancialAnalytics(dateRange);

  // Removed local formatCurrency - using numberUtils.formatCurrency from utils

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
            <p className="text-muted-foreground">Loading financial analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Card className="border-red-200">
          <CardContent className="p-6">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  // Prepare chart data
  const profitByCategory = [
    { name: 'Repair Services', value: financialSummary?.totalRepairProfit || 0 },
    { name: 'Vehicle Sales', value: financialSummary?.totalVehicleSalesProfit || 0 }
  ];

  const costBreakdown = [
    { name: 'Labor', value: repairFinancials.reduce((sum, r) => sum + r.total_labor_cost, 0) },
    { name: 'Parts', value: repairFinancials.reduce((sum, r) => sum + r.total_parts_cost, 0) },
    { name: 'Equipment', value: repairFinancials.reduce((sum, r) => sum + r.equipment_usage_cost, 0) },
    { name: 'Electricity', value: financialSummary?.totalElectricityCosts || 0 },
    { name: 'Overhead', value: repairFinancials.reduce((sum, r) => sum + r.overhead_cost, 0) }
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive financial analysis for repairs, sales, and operations
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            className="w-40"
          />
          <span className="text-muted-foreground">to</span>
          <Input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            className="w-40"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {numberUtils.formatCurrency((financialSummary?.totalRepairRevenue || 0) + (financialSummary?.totalVehicleSalesRevenue || 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              Repairs: {numberUtils.formatCurrency(financialSummary?.totalRepairRevenue || 0)} | 
              Sales: {numberUtils.formatCurrency(financialSummary?.totalVehicleSalesRevenue || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {numberUtils.formatCurrency((financialSummary?.totalRepairProfit || 0) + (financialSummary?.totalVehicleSalesProfit || 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              Margin: {formatPercentage(financialSummary?.overallProfitMargin || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Equipment Value</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {numberUtils.formatCurrency(financialSummary?.totalEquipmentValue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Depreciation: {numberUtils.formatCurrency(financialSummary?.totalEquipmentDepreciation || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {numberUtils.formatCurrency(financialSummary?.totalInventoryValue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {inventoryValuation.length} items tracked
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Labor Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(financialSummary?.totalLaborHours || 0).toFixed(1)}h
            </div>
            <p className="text-xs text-muted-foreground">
              Rate: {numberUtils.formatCurrency(financialSummary?.averageHourlyRate || 0)}/hour
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Electricity Costs</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {numberUtils.formatCurrency(financialSummary?.totalElectricityCosts || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Operational expense
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Repair Profit Margin</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPercentage(financialSummary?.repairProfitMargin || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Service profitability
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sales Profit Margin</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPercentage(financialSummary?.vehicleSalesProfitMargin || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Vehicle sales profitability
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Profit by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={profitByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {profitByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => numberUtils.formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cost Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={costBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => numberUtils.formatCurrency(Number(value))} />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tables */}
      <Tabs defaultValue="repairs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="repairs">Repair Financials</TabsTrigger>
          <TabsTrigger value="sales">Vehicle Sales</TabsTrigger>
          <TabsTrigger value="equipment">Equipment & Tools</TabsTrigger>
          <TabsTrigger value="inventory">Inventory Valuation</TabsTrigger>
          <TabsTrigger value="costs">Operational Costs</TabsTrigger>
        </TabsList>

        <TabsContent value="repairs">
          <Card>
            <CardHeader>
              <CardTitle>Repair Service Financials</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>VIN</TableHead>
                      <TableHead>Labor Hours</TableHead>
                      <TableHead>Total Cost</TableHead>
                      <TableHead>Final Price</TableHead>
                      <TableHead>Profit</TableHead>
                      <TableHead>Margin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {repairFinancials.map((repair) => (
                      <TableRow key={repair.id}>
                        <TableCell>{new Date(repair.repair_date).toLocaleDateString()}</TableCell>
                        <TableCell>{repair.client_name}</TableCell>
                        <TableCell className="font-mono text-sm">{repair.car_vin}</TableCell>
                        <TableCell>{repair.labor_hours}h</TableCell>
                        <TableCell>{numberUtils.formatCurrency(repair.total_cost)}</TableCell>
                        <TableCell>{numberUtils.formatCurrency(repair.final_price)}</TableCell>
                        <TableCell className={repair.gross_profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {numberUtils.formatCurrency(repair.gross_profit)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={repair.profit_margin_percentage >= 20 ? 'default' : 'secondary'}>
                            {formatPercentage(repair.profit_margin_percentage)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales">
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Sales Financials</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Model</TableHead>
                      <TableHead>VIN</TableHead>
                      <TableHead>Purchase Price</TableHead>
                      <TableHead>Total Cost</TableHead>
                      <TableHead>Sale Price</TableHead>
                      <TableHead>Profit</TableHead>
                      <TableHead>Margin</TableHead>
                      <TableHead>Days in Inventory</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vehicleSalesFinancials.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell>{sale.model} {sale.year}</TableCell>
                        <TableCell className="font-mono text-sm">{sale.vin_number}</TableCell>
                        <TableCell>{numberUtils.formatCurrency(sale.purchase_price)}</TableCell>
                        <TableCell>{numberUtils.formatCurrency(sale.total_cost)}</TableCell>
                        <TableCell>{numberUtils.formatCurrency(sale.final_sale_price)}</TableCell>
                        <TableCell className={sale.gross_profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {numberUtils.formatCurrency(sale.gross_profit)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={sale.profit_margin_percentage >= 15 ? 'default' : 'secondary'}>
                            {formatPercentage(sale.profit_margin_percentage)}
                          </Badge>
                        </TableCell>
                        <TableCell>{sale.days_in_inventory} days</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="equipment">
          <Card>
            <CardHeader>
              <CardTitle>Equipment & Tools Valuation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Purchase Price</TableHead>
                      <TableHead>Current Value</TableHead>
                      <TableHead>Depreciation</TableHead>
                      <TableHead>Condition</TableHead>
                      <TableHead>Maintenance Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {equipmentAssets.map((asset) => (
                      <TableRow key={asset.id}>
                        <TableCell>{asset.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{asset.category}</Badge>
                        </TableCell>
                        <TableCell>{numberUtils.formatCurrency(asset.purchase_price)}</TableCell>
                        <TableCell>{numberUtils.formatCurrency(asset.current_value)}</TableCell>
                        <TableCell className="text-red-600">
                          -{numberUtils.formatCurrency(asset.purchase_price - asset.current_value)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            asset.condition === 'excellent' ? 'default' :
                            asset.condition === 'good' ? 'secondary' :
                            asset.condition === 'fair' ? 'outline' : 'destructive'
                          }>
                            {asset.condition}
                          </Badge>
                        </TableCell>
                        <TableCell>{numberUtils.formatCurrency(asset.maintenance_cost)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Valuation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Part Number</TableHead>
                      <TableHead>Part Name</TableHead>
                      <TableHead>Unit Cost</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Total Value</TableHead>
                      <TableHead>Monthly Usage</TableHead>
                      <TableHead>Months Supply</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventoryValuation.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-sm">{item.part_number}</TableCell>
                        <TableCell>{item.part_name}</TableCell>
                        <TableCell>{numberUtils.formatCurrency(item.unit_cost)}</TableCell>
                        <TableCell>{item.quantity_on_hand}</TableCell>
                        <TableCell>{numberUtils.formatCurrency(item.total_value)}</TableCell>
                        <TableCell>{item.usage_rate_per_month}</TableCell>
                        <TableCell>
                          <Badge variant={item.months_of_supply > 6 ? 'destructive' : 
                                        item.months_of_supply > 3 ? 'outline' : 'default'}>
                            {item.months_of_supply.toFixed(1)} months
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costs">
          <Card>
            <CardHeader>
              <CardTitle>Operational Costs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead>Subcategory</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Garage Allocation</TableHead>
                      <TableHead>Units</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {operationalCosts.map((cost) => (
                      <TableRow key={cost.id}>
                        <TableCell>
                          <Badge variant="outline">{cost.cost_category}</Badge>
                        </TableCell>
                        <TableCell>{cost.subcategory || '-'}</TableCell>
                        <TableCell>{numberUtils.formatCurrency(cost.cost_amount)}</TableCell>
                        <TableCell>
                          {new Date(cost.billing_period_start).toLocaleDateString()} - {new Date(cost.billing_period_end).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{cost.garage_allocation_percentage}%</TableCell>
                        <TableCell>
                          {cost.units_consumed && cost.unit_type ? 
                            `${cost.units_consumed} ${cost.unit_type}` : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinancialAnalytics;
