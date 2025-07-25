
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface WorkflowAnalytics {
  totalScans: number;
  totalPartUsage: number;
  mostUsedParts: Array<{ part_number: string; total_quantity: number; part_name: string }>;
  scansByMethod: Array<{ scan_method: string; count: number }>;
  clientInteractions: Array<{ interaction_type: string; count: number }>;
  workflowEvents: Array<{ event_type: string; count: number }>;
}

const WorkflowAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<WorkflowAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);

      // For now, use mock data since the new tables haven't been created yet
      // Once the database tables are created, this will be replaced with real queries
      
      // Get some basic counts from existing tables that might be relevant
      const { count: garageCars } = await supabase
        .from('garage_cars')
        .select('*', { count: 'exact', head: true });

      const { count: inventoryItems } = await supabase
        .from('inventory_items')
        .select('*', { count: 'exact', head: true });

      // Mock data for workflow analytics - this will be replaced with real data once tables are created
      const mockAnalytics: WorkflowAnalytics = {
        totalScans: (garageCars || 0) + (inventoryItems || 0),
        totalPartUsage: inventoryItems || 0,
        mostUsedParts: [
          { part_number: 'PART-001', part_name: 'Brake Pads', total_quantity: 45 },
          { part_number: 'PART-002', part_name: 'Oil Filter', total_quantity: 38 },
          { part_number: 'PART-003', part_name: 'Air Filter', total_quantity: 32 },
          { part_number: 'PART-004', part_name: 'Spark Plugs', total_quantity: 28 },
          { part_number: 'PART-005', part_name: 'Battery', total_quantity: 22 }
        ],
        scansByMethod: [
          { scan_method: 'camera', count: 85 },
          { scan_method: 'manual', count: 45 }
        ],
        clientInteractions: [
          { interaction_type: 'check_in', count: 24 },
          { interaction_type: 'repair_update', count: 18 },
          { interaction_type: 'delivery', count: 12 },
          { interaction_type: 'invoice', count: 8 }
        ],
        workflowEvents: [
          { event_type: 'vin_scan', count: 45 },
          { event_type: 'part_scan', count: 38 },
          { event_type: 'repair_start', count: 22 },
          { event_type: 'repair_complete', count: 18 }
        ]
      };

      setAnalytics(mockAnalytics);

    } catch (error) {
      console.error('Error loading analytics:', error);
      
      // Fallback to basic mock data if there's any error
      setAnalytics({
        totalScans: 0,
        totalPartUsage: 0,
        mostUsedParts: [],
        scansByMethod: [],
        clientInteractions: [],
        workflowEvents: []
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-4">Loading analytics...</div>;
  }

  if (!analytics) {
    return <div className="p-4">No analytics data available</div>;
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold">Workflow Analytics</h2>
      
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-700">
          <strong>Preview Mode:</strong> This dashboard is showing sample data. Once the workflow tracking database tables are created, it will display real-time analytics from your scans, part usage, and client interactions.
        </p>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Scans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalScans}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Parts Used</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalPartUsage}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Client Interactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.clientInteractions.reduce((sum, item) => sum + item.count, 0)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Workflow Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.workflowEvents.reduce((sum, item) => sum + item.count, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="parts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="parts">Parts Analysis</TabsTrigger>
          <TabsTrigger value="scans">Scan Methods</TabsTrigger>
          <TabsTrigger value="interactions">Client Interactions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="parts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Most Used Parts</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.mostUsedParts.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="part_number" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="total_quantity" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="scans" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scan Methods Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.scansByMethod}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {analytics.scansByMethod.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="interactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Client Interaction Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {analytics.clientInteractions.map((interaction, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <Badge variant="outline">{interaction.interaction_type}</Badge>
                    <span className="font-semibold">{interaction.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WorkflowAnalytics;
