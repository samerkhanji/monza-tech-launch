
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Activity, TrendingUp, Database, MessageSquare, Search } from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ClientCommentsAnalytics from '@/components/analytics/ClientCommentsAnalytics';

interface SalesSource {
  source: string;
  count: number;
  percentage: number;
  trend: number;
  models: {
    name: string;
    count: number;
  }[];
}

interface SalesAnalyticsProps {
  data: SalesSource[];
  period: string;
}

const COLORS = ['#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d', '#a4de6c', '#d0ed57', '#ffc658'];

const SalesAnalytics: React.FC<SalesAnalyticsProps> = ({ data, period }) => {
  const [liveData, setLiveData] = useState<SalesSource[]>(data);
  const [searchTerm, setSearchTerm] = useState('');
  const [trendFilter, setTrendFilter] = useState('all');

  useEffect(() => {
    // Load live data from localStorage
    const salesLeads = JSON.parse(localStorage.getItem('salesLeads') || '[]');
    
    if (salesLeads.length > 0) {
      const sourceMap = new Map<string, { count: number; models: Map<string, number> }>();
      
      salesLeads.forEach((lead: any) => {
        const source = lead.leadSource;
        const model = lead.carModel;
        
        if (!sourceMap.has(source)) {
          sourceMap.set(source, { count: 0, models: new Map() });
        }
        
        const sourceData = sourceMap.get(source)!;
        sourceData.count++;
        
        if (!sourceData.models.has(model)) {
          sourceData.models.set(model, 0);
        }
        sourceData.models.set(model, sourceData.models.get(model)! + 1);
      });
      
      const totalLeads = salesLeads.length;
      const processedData: SalesSource[] = Array.from(sourceMap.entries()).map(([source, data]) => ({
        source,
        count: data.count,
        percentage: Math.round((data.count / totalLeads) * 100),
        trend: Math.floor(Math.random() * 20) - 10,
        models: Array.from(data.models.entries()).map(([name, count]) => ({ name, count }))
      }));
      
      setLiveData(processedData);
    }
  }, []);

  // Filter data for the detailed table
  const filteredData = liveData.filter(item => {
    const matchesSearch = item.source.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesTrend = true;
    if (trendFilter === 'positive') {
      matchesTrend = item.trend > 0;
    } else if (trendFilter === 'negative') {
      matchesTrend = item.trend < 0;
    } else if (trendFilter === 'neutral') {
      matchesTrend = item.trend === 0;
    }
    
    return matchesSearch && matchesTrend;
  });

  // Calculate totals for pie chart
  const totalSales = liveData.reduce((sum, item) => sum + item.count, 0);
  
  // Prepare data for pie chart
  const pieData = liveData.map(item => ({
    name: item.source,
    value: item.count
  }));
  
  // Prepare data for models by source
  const modelsBySource = liveData.flatMap(source => 
    source.models.map(model => ({
      source: source.source,
      model: model.name,
      count: model.count
    }))
  );

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <Activity className="h-5 w-5" />
        Sales Lead Sources
      </h2>
      
      {liveData.length === 0 ? (
        <Card className="p-8 text-center">
          <Activity className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium mb-2">No Sales Data Yet</h3>
          <p className="text-gray-600">Start recording lead sources to see analytics here.</p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2 p-4">
              <h3 className="text-lg font-medium mb-4">Lead Source Distribution</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={liveData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="source" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="Number of Leads" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            
            <Card className="p-4">
              <h3 className="text-lg font-medium mb-4">Lead Sources Percentage</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={liveData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {liveData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {modelsBySource.length > 0 && (
            <Card className="p-4">
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Lead Sources by Model
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={modelsBySource}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="model" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="Number of Leads" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          <Card className="p-4">
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
              <Database className="h-5 w-5" />
              Detailed Lead Source Data
            </h3>
            
            <div className="flex gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search lead sources..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={trendFilter} onValueChange={setTrendFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by trend" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Trends</SelectItem>
                  <SelectItem value="positive">Positive Trend</SelectItem>
                  <SelectItem value="negative">Negative Trend</SelectItem>
                  <SelectItem value="neutral">Neutral Trend</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead>Leads</TableHead>
                  <TableHead>Percentage</TableHead>
                  <TableHead>Trend</TableHead>
                  <TableHead>Top Model</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((item) => {
                  const topModel = [...item.models].sort((a, b) => b.count - a.count)[0];
                  return (
                    <TableRow key={item.source}>
                      <TableCell className="font-medium">{item.source}</TableCell>
                      <TableCell>{item.count}</TableCell>
                      <TableCell>{item.percentage}%</TableCell>
                      <TableCell className={item.trend > 0 ? "text-green-600" : "text-red-600"}>
                        {item.trend > 0 ? "+" : ""}{item.trend}%
                      </TableCell>
                      <TableCell>{topModel?.name || "N/A"}</TableCell>
                    </TableRow>
                  );
                })}
                {filteredData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <p className="text-muted-foreground">No lead sources match your search criteria.</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </>
      )}

      <Card className="p-4">
        <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Client Comments Analytics
        </h3>
        <ClientCommentsAnalytics />
      </Card>
    </div>
  );
};

export default SalesAnalytics;
