import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Package, 
  AlertTriangle, 
  TrendingDown, 
  Search, 
  Filter,
  DollarSign,
  Calendar,
  BarChart3,
  Truck,
  CheckCircle,
  XCircle,
  Activity
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface InventoryItem {
  id: string;
  part_number: string;
  part_name: string;
  quantity: number;
  cost_per_unit: number | null;
  supplier: string | null;
  location: string;
  car_model: string;
  last_updated: string | null;
  created_at: string | null;
}

interface UsageRecord {
  id: string;
  part_number: string;
  part_name: string;
  quantity: number;
  car_vin: string;
  client_name: string;
  technician: string;
  usage_date: string;
  total_cost: number | null;
}

interface StockAlert {
  id: string;
  part_name: string;
  part_number: string;
  current_stock: number;
  alert_level: 'critical' | 'low' | 'medium';
  estimated_days_remaining: number;
}

const InventoryStockView: React.FC = () => {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [recentUsage, setRecentUsage] = useState<UsageRecord[]>([]);
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    loadInventoryData();
    loadRecentUsage();
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(() => {
      loadInventoryData();
      loadRecentUsage();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadInventoryData = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .order('last_updated', { ascending: false });

      if (error) {
        console.error('Error loading inventory:', error);
        toast({
          title: "Loading Error",
          description: "Failed to load inventory data.",
          variant: "destructive"
        });
        return;
      }

      setInventoryItems(data || []);
      generateStockAlerts(data || []);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading inventory:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRecentUsage = async () => {
    try {
      const { data, error } = await supabase
        .from('parts_usage_tracking')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error loading usage data:', error);
        return;
      }

      setRecentUsage(data || []);
    } catch (error) {
      console.error('Error loading usage data:', error);
    }
  };

  const generateStockAlerts = (items: InventoryItem[]) => {
    const alerts: StockAlert[] = items
      .filter(item => item.quantity <= 10) // Alert for items with 10 or fewer units
      .map(item => {
        let alertLevel: 'critical' | 'low' | 'medium' = 'medium';
        if (item.quantity === 0) alertLevel = 'critical';
        else if (item.quantity <= 3) alertLevel = 'low';
        
        return {
          id: item.id,
          part_name: item.part_name,
          part_number: item.part_number,
          current_stock: item.quantity,
          alert_level: alertLevel,
          estimated_days_remaining: Math.max(0, item.quantity * 7) // Rough estimate
        };
      })
      .sort((a, b) => {
        const levelOrder = { critical: 0, low: 1, medium: 2 };
        return levelOrder[a.alert_level] - levelOrder[b.alert_level];
      });

    setStockAlerts(alerts);
  };

  const getFilteredItems = () => {
    return inventoryItems.filter(item => {
      const matchesSearch = 
        item.part_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.part_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.car_model.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSupplier = 
        filterSupplier === 'all' || item.supplier === filterSupplier;
      
      return matchesSearch && matchesSupplier;
    });
  };

  const getStockStatusColor = (quantity: number) => {
    if (quantity === 0) return 'bg-red-100 text-red-800 border-red-200';
    if (quantity <= 3) return 'bg-orange-100 text-orange-800 border-orange-200';
    if (quantity <= 10) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  const getAlertLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'low': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getSuppliers = () => {
    const suppliers = [...new Set(inventoryItems.map(item => item.supplier).filter(Boolean))];
    return ['all', ...suppliers];
  };

  const getTotalValue = () => {
    return inventoryItems.reduce((total, item) => {
      return total + (item.cost_per_unit || 0) * item.quantity;
    }, 0);
  };

  const getCriticalStockCount = () => {
    return inventoryItems.filter(item => item.quantity === 0).length;
  };

  const getLowStockCount = () => {
    return inventoryItems.filter(item => item.quantity > 0 && item.quantity <= 5).length;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
        <span className="ml-2">Loading inventory data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Items</p>
                <p className="text-2xl font-bold">{inventoryItems.length}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critical Stock</p>
                <p className="text-2xl font-bold text-red-600">{getCriticalStockCount()}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Low Stock</p>
                <p className="text-2xl font-bold text-orange-600">{getLowStockCount()}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">${getTotalValue().toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stock Alerts */}
      {stockAlerts.length > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-700">
            <strong>Stock Alerts:</strong> {stockAlerts.length} items need attention. 
            {stockAlerts.filter(a => a.alert_level === 'critical').length > 0 && 
              ` ${stockAlerts.filter(a => a.alert_level === 'critical').length} are out of stock.`
            }
          </AlertDescription>
        </Alert>
      )}

      {/* Search and Filter */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search parts by name, number, or car model..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={filterSupplier}
          onChange={(e) => setFilterSupplier(e.target.value)}
          className="px-3 py-2 border rounded-md bg-background"
        >
          {getSuppliers().map(supplier => (
            <option key={supplier} value={supplier}>
              {supplier === 'all' ? 'All Suppliers' : supplier || 'Unknown'}
            </option>
          ))}
        </select>
      </div>

      <Tabs defaultValue="inventory" className="w-full">
        <TabsList>
          <TabsTrigger value="inventory">Current Stock</TabsTrigger>
          <TabsTrigger value="alerts">Stock Alerts ({stockAlerts.length})</TabsTrigger>
          <TabsTrigger value="usage">Recent Usage</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-4">
          <div className="grid gap-4">
            {getFilteredItems().map((item) => (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-lg">{item.part_name}</h3>
                      <p className="text-sm text-muted-foreground font-mono">{item.part_number}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>{item.location}</span>
                        <span>{item.car_model}</span>
                        {item.supplier && <span>🏭 {item.supplier}</span>}
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <Badge className={getStockStatusColor(item.quantity)}>
                        {item.quantity} units
                      </Badge>
                      {item.cost_per_unit && (
                        <div className="text-sm text-muted-foreground">
                          ${item.cost_per_unit.toFixed(2)}/unit
                        </div>
                      )}
                      {item.last_updated && (
                        <div className="text-xs text-muted-foreground">
                          Updated {new Date(item.last_updated).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          {stockAlerts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-green-700 mb-2">All Stock Levels Good!</h3>
                <p className="text-muted-foreground">No critical or low stock alerts at this time.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {stockAlerts.map((alert) => (
                <Card key={alert.id} className={`border-l-4 ${
                  alert.alert_level === 'critical' ? 'border-l-red-500' :
                  alert.alert_level === 'low' ? 'border-l-orange-500' : 'border-l-yellow-500'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{alert.part_name}</h3>
                        <p className="text-sm text-muted-foreground font-mono">{alert.part_number}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Est. {alert.estimated_days_remaining} days remaining at current usage
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge className={getAlertLevelColor(alert.alert_level)}>
                          {alert.current_stock} units - {alert.alert_level.toUpperCase()}
                        </Badge>
                        <Button size="sm" variant="outline" className="mt-2 ml-2">
                          <Truck className="h-3 w-3 mr-1" />
                          Reorder
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <div className="space-y-3">
            {recentUsage.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">No Recent Usage</h3>
                  <p className="text-muted-foreground">No parts have been used recently.</p>
                </CardContent>
              </Card>
            ) : (
              recentUsage.map((usage) => (
                <Card key={usage.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{usage.part_name}</h3>
                        <p className="text-sm text-muted-foreground font-mono">{usage.part_number}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span>{usage.car_vin}</span>
                          <span>👤 {usage.client_name}</span>
                          <span>{usage.technician}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">
                          -{usage.quantity} units
                        </Badge>
                        {usage.total_cost && (
                          <div className="text-sm text-muted-foreground mt-1">
                            ${usage.total_cost.toFixed(2)}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(usage.usage_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Live Update Indicator */}
      <div className="flex items-center justify-center gap-2 py-3 border-t bg-gray-50 rounded-lg">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-xs text-muted-foreground">
          Live inventory tracking • Last updated: {lastUpdate.toLocaleTimeString()}
        </span>
        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
          <Activity className="h-3 w-3 mr-1" />
          Real-time
        </Badge>
      </div>
    </div>
  );
};

export default InventoryStockView; 