import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { CalendarIcon, Download, FileText, TrendingUp, DollarSign, Clock, Wrench } from 'lucide-react';
import { CustomCalendarIcon } from '@/components/icons/CustomCalendarIcon';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ReportCriteria {
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
  categories: {
    financial: string[];
    operational: string[];
    efficiency: string[];
    inventory: string[];
  };
  format: 'pdf' | 'excel' | 'csv';
  includeCharts: boolean;
}

const ReportGenerator: React.FC = () => {
  const [criteria, setCriteria] = useState<ReportCriteria>({
    dateRange: { from: undefined, to: undefined },
    categories: {
      financial: [],
      operational: [],
      efficiency: [],
      inventory: []
    },
    format: 'pdf',
    includeCharts: true
  });

  const financialMetrics = [
    { id: 'revenue', label: 'Total Revenue', description: 'Sales revenue from all sources' },
    { id: 'profit', label: 'Profit & Loss', description: 'P&L statement with breakdown' },
    { id: 'costs', label: 'Operational Costs', description: 'Parts, labor, and overhead costs' },
    { id: 'margins', label: 'Profit Margins', description: 'Gross and net profit margins' },
    { id: 'payment_methods', label: 'Payment Methods', description: 'Breakdown by payment type' },
    { id: 'customer_value', label: 'Customer Lifetime Value', description: 'Average customer value analysis' }
  ];

  const operationalMetrics = [
    { id: 'repairs_completed', label: 'Repairs Completed', description: 'Total repairs finished in period' },
    { id: 'cars_sold', label: 'Cars Sold', description: 'Vehicle sales performance' },
    { id: 'customer_satisfaction', label: 'Customer Satisfaction', description: 'Client feedback scores' },
    { id: 'warranty_claims', label: 'Warranty Claims', description: 'Warranty issues and resolutions' },
    { id: 'service_types', label: 'Service Types', description: 'Breakdown of service categories' },
    { id: 'repeat_customers', label: 'Repeat Customers', description: 'Customer retention analysis' }
  ];

  const efficiencyMetrics = [
    { id: 'repair_time', label: 'Average Repair Time', description: 'Time efficiency analysis' },
    { id: 'mechanic_productivity', label: 'Mechanic Productivity', description: 'Individual performance metrics' },
    { id: 'queue_times', label: 'Queue Times', description: 'Waiting time analysis' },
    { id: 'capacity_utilization', label: 'Capacity Utilization', description: 'Garage space and time usage' },
    { id: 'rework_rate', label: 'Rework Rate', description: 'Quality control metrics' },
    { id: 'delivery_schedule', label: 'Delivery Schedule', description: 'On-time delivery performance' }
  ];

  const inventoryMetrics = [
    { id: 'parts_usage', label: 'Parts Usage', description: 'Most/least used parts analysis' },
    { id: 'inventory_turnover', label: 'Inventory Turnover', description: 'Stock rotation efficiency' },
    { id: 'stock_levels', label: 'Stock Levels', description: 'Current inventory status' },
    { id: 'supplier_performance', label: 'Supplier Performance', description: 'Vendor analysis and costs' },
    { id: 'obsolete_inventory', label: 'Obsolete Inventory', description: 'Slow-moving stock identification' },
    { id: 'cost_analysis', label: 'Cost Analysis', description: 'Parts cost trends and optimization' }
  ];

  const handleCategoryChange = (category: keyof ReportCriteria['categories'], metricId: string, checked: boolean) => {
    setCriteria(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: checked 
          ? [...prev.categories[category], metricId]
          : prev.categories[category].filter(id => id !== metricId)
      }
    }));
  };

  const generateReport = async () => {
    console.log('Generating report with criteria:', criteria);
    // Here you would implement the actual report generation logic
    // This would call your API endpoints to gather data and generate the report
  };

  const MetricCheckbox = ({ metric, category }: { metric: any, category: keyof ReportCriteria['categories'] }) => (
    <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
      <Checkbox
        id={metric.id}
        checked={criteria.categories[category].includes(metric.id)}
        onCheckedChange={(checked) => handleCategoryChange(category, metric.id, checked as boolean)}
      />
      <div className="grid gap-1.5 leading-none">
        <label
          htmlFor={metric.id}
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
        >
          {metric.label}
        </label>
        <p className="text-xs text-muted-foreground">
          {metric.description}
        </p>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <FileText className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Generate Reports</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Date Range Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CustomCalendarIcon className="h-5 w-5" />
                Date Range
              </CardTitle>
              <CardDescription>
                Select the time period for your report
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>From Date</Label>
                  <div className="relative" style={{ zIndex: 9999, position: 'relative' }}>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !criteria.dateRange.from && "text-muted-foreground"
                          )}
                          style={{ zIndex: 9999 }}
                        >
                          <CustomCalendarIcon className="mr-2 h-4 w-4" />
                          {criteria.dateRange.from ? format(criteria.dateRange.from, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" style={{ zIndex: 99999 }}>
                        <Calendar
                          mode="single"
                          selected={criteria.dateRange.from}
                          onSelect={(date) => setCriteria(prev => ({
                            ...prev,
                            dateRange: { ...prev.dateRange, from: date }
                          }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <div>
                  <Label>To Date</Label>
                  <div className="relative" style={{ zIndex: 9999, position: 'relative' }}>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !criteria.dateRange.to && "text-muted-foreground"
                          )}
                          style={{ zIndex: 9999 }}
                        >
                          <CustomCalendarIcon className="mr-2 h-4 w-4" />
                          {criteria.dateRange.to ? format(criteria.dateRange.to, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" style={{ zIndex: 99999 }}>
                        <Calendar
                          mode="single"
                          selected={criteria.dateRange.to}
                          onSelect={(date) => setCriteria(prev => ({
                            ...prev,
                            dateRange: { ...prev.dateRange, to: date }
                          }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Report Categories */}
          <Card>
            <CardHeader>
              <CardTitle>Report Categories</CardTitle>
              <CardDescription>
                Select the metrics and data points to include in your report
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="financial" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="financial" className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    Financial
                  </TabsTrigger>
                  <TabsTrigger value="operational" className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    Operational
                  </TabsTrigger>
                  <TabsTrigger value="efficiency" className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Efficiency
                  </TabsTrigger>
                  <TabsTrigger value="inventory" className="flex items-center gap-1">
                    <Wrench className="h-4 w-4" />
                    Inventory
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="financial" className="space-y-4 mt-4">
                  <div className="grid gap-3">
                    {financialMetrics.map(metric => (
                      <MetricCheckbox key={metric.id} metric={metric} category="financial" />
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="operational" className="space-y-4 mt-4">
                  <div className="grid gap-3">
                    {operationalMetrics.map(metric => (
                      <MetricCheckbox key={metric.id} metric={metric} category="operational" />
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="efficiency" className="space-y-4 mt-4">
                  <div className="grid gap-3">
                    {efficiencyMetrics.map(metric => (
                      <MetricCheckbox key={metric.id} metric={metric} category="efficiency" />
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="inventory" className="space-y-4 mt-4">
                  <div className="grid gap-3">
                    {inventoryMetrics.map(metric => (
                      <MetricCheckbox key={metric.id} metric={metric} category="inventory" />
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Report Settings & Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Report Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Export Format</Label>
                <Select value={criteria.format} onValueChange={(value: 'pdf' | 'excel' | 'csv') => 
                  setCriteria(prev => ({ ...prev, format: value }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF Document</SelectItem>
                    <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                    <SelectItem value="csv">CSV File</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="charts"
                  checked={criteria.includeCharts}
                  onCheckedChange={(checked) => 
                    setCriteria(prev => ({ ...prev, includeCharts: checked as boolean }))
                  }
                />
                <Label htmlFor="charts">Include Charts & Graphs</Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Report Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Date Range:</span>
                  <span className="font-medium">
                    {criteria.dateRange.from && criteria.dateRange.to
                      ? `${format(criteria.dateRange.from, "MMM dd")} - ${format(criteria.dateRange.to, "MMM dd")}`
                      : "Not selected"
                    }
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Financial Metrics:</span>
                  <span className="font-medium">{criteria.categories.financial.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Operational Metrics:</span>
                  <span className="font-medium">{criteria.categories.operational.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Efficiency Metrics:</span>
                  <span className="font-medium">{criteria.categories.efficiency.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Inventory Metrics:</span>
                  <span className="font-medium">{criteria.categories.inventory.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Format:</span>
                  <span className="font-medium">{criteria.format.toUpperCase()}</span>
                </div>
              </div>

              <Button 
                onClick={generateReport} 
                className="w-full"
                disabled={!criteria.dateRange.from || !criteria.dateRange.to}
              >
                <Download className="mr-2 h-4 w-4" />
                Generate Report
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ReportGenerator;
