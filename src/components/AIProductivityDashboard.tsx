
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert-fixed';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock, Users, Wrench, Brain } from 'lucide-react';
import { productivityTrackingService, WeeklyProductivitySummary } from '@/services/productivityTrackingService';
import { useAuth } from '@/contexts/AuthContext';

interface AIInsight {
  id: string;
  insight_type: string;
  priority: string;
  title: string;
  description: string;
  affected_area: string;
  affected_entity?: string;
  efficiency_drop?: number;
  delay_increase?: number;
  recommended_actions: string[];
  expected_improvement: string;
  status: string;
  created_at: string;
}

const AIProductivityDashboard: React.FC = () => {
  const { user } = useAuth();
  const [weeklyData, setWeeklyData] = useState<WeeklyProductivitySummary[]>([]);
  const [currentWeekData, setCurrentWeekData] = useState<WeeklyProductivitySummary | null>(null);
  const [mechanicPerformance, setMechanicPerformance] = useState<any[]>([]);
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get current week start
      const now = new Date();
      const currentWeekStart = new Date(now.setDate(now.getDate() - now.getDay()));
      const weekStartStr = currentWeekStart.toISOString().split('T')[0];
      
      // Load current week data
      const currentWeek = await productivityTrackingService.getWeeklyProductivity(weekStartStr);
      setCurrentWeekData(currentWeek);
      
      // Load last 8 weeks of data for trends
      const weeklyDataPromises = [];
      for (let i = 0; i < 8; i++) {
        const weekDate = new Date(currentWeekStart);
        weekDate.setDate(weekDate.getDate() - (i * 7));
        const weekStr = weekDate.toISOString().split('T')[0];
        weeklyDataPromises.push(productivityTrackingService.getWeeklyProductivity(weekStr));
      }
      
      const weeklyResults = await Promise.all(weeklyDataPromises);
      const validWeeklyData = weeklyResults.filter(data => data !== null) as WeeklyProductivitySummary[];
      setWeeklyData(validWeeklyData.reverse());
      
      // Load mechanic performance
      const mechanicData = await productivityTrackingService.getMechanicPerformance(weekStartStr);
      setMechanicPerformance(mechanicData);
      
      // Load AI insights
      const insights = await productivityTrackingService.getAIInsights(15);
      setAiInsights(insights);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledgeInsight = async (insightId: string) => {
    try {
      await productivityTrackingService.acknowledgeInsight(insightId, user?.name || 'Unknown User');
      await loadDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error acknowledging insight:', error);
    }
  };

  const formatEfficiency = (efficiency: number) => {
    if (efficiency > 100) return `${efficiency.toFixed(1)}%`;
    return `${efficiency.toFixed(1)}%`;
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'efficiency': return <TrendingDown className="h-4 w-4" />;
      case 'bottleneck': return <AlertTriangle className="h-4 w-4" />;
      case 'recommendation': return <Brain className="h-4 w-4" />;
      default: return <TrendingUp className="h-4 w-4" />;
    }
  };

  const getInsightColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const workTypeData = currentWeekData ? [
    { name: 'Electrical', hours: currentWeekData.electricalHours, color: '#8884d8' },
    { name: 'Painting', hours: currentWeekData.painterHours, color: '#82ca9d' },
    { name: 'Detailing', hours: currentWeekData.detailerHours, color: '#ffc658' },
    { name: 'Mechanical', hours: currentWeekData.mechanicHours, color: '#ff7300' },
    { name: 'Body Work', hours: currentWeekData.bodyWorkHours, color: '#0088fe' }
  ].filter(item => item.hours > 0) : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading AI insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-2 mb-6">
        <Brain className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold">AI-Powered Productivity Analytics</h2>
      </div>
      
      {/* Current Week Overview */}
      {currentWeekData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Cars Worked
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentWeekData.totalCarsWorked}</div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <CheckCircle className="h-3 w-3 text-green-500" />
                {currentWeekData.carsCompletedOnTime} on time
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Efficiency
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatEfficiency(currentWeekData.overallEfficiencyPercentage || 0)}
              </div>
              <div className="text-sm text-muted-foreground">
                {currentWeekData.totalActualHours}h actual vs {currentWeekData.totalEstimatedHours}h estimated
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Avg Delay
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {currentWeekData.averageDelayHours?.toFixed(1) || '0'}h
              </div>
              <div className="text-sm text-muted-foreground">
                {currentWeekData.carsDelayed} cars delayed
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Team Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mechanicPerformance.length}</div>
              <div className="text-sm text-muted-foreground">Active mechanics</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="insights" className="space-y-4">
        <TabsList>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="trends">Productivity Trends</TabsTrigger>
          <TabsTrigger value="mechanics">Mechanic Performance</TabsTrigger>
          <TabsTrigger value="workload">Work Distribution</TabsTrigger>
        </TabsList>
        
        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI-Generated Insights & Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {aiInsights.length > 0 ? (
                <div className="space-y-4">
                  {aiInsights.map((insight) => (
                    <Alert key={insight.id} className="relative">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          {getInsightIcon(insight.insight_type)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertTitle className="text-sm font-medium">{insight.title}</AlertTitle>
                              <Badge variant={getInsightColor(insight.priority)}>
                                {insight.priority}
                              </Badge>
                              {insight.status === 'acknowledged' && (
                                <Badge variant="outline" className="text-green-600">
                                  Acknowledged
                                </Badge>
                              )}
                            </div>
                            <AlertDescription className="text-sm mb-3">
                              {insight.description}
                            </AlertDescription>
                            <div className="mb-3">
                              <h4 className="text-xs font-medium mb-1">Recommended Actions:</h4>
                              <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
                                {insight.recommended_actions.map((action, index) => (
                                  <li key={index}>{action}</li>
                                ))}
                              </ul>
                            </div>
                            <div className="text-xs text-green-600 font-medium">
                              Expected: {insight.expected_improvement}
                            </div>
                          </div>
                        </div>
                        {insight.status === 'new' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleAcknowledgeInsight(insight.id)}
                          >
                            Acknowledge
                          </Button>
                        )}
                      </div>
                    </Alert>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No AI insights available yet.</p>
                  <p className="text-sm text-gray-400">Complete more repairs to generate insights.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Efficiency Trends (Last 8 Weeks)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="weekStart" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="overallEfficiencyPercentage" 
                    stroke="#8884d8" 
                    name="Efficiency %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Cars Completed vs Delayed</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="weekStart" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="carsCompletedOnTime" fill="#82ca9d" name="On Time" />
                  <Bar dataKey="carsDelayed" fill="#ff7300" name="Delayed" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="mechanics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Individual Mechanic Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {mechanicPerformance.length > 0 ? (
                <div className="space-y-4">
                  {mechanicPerformance.map((mechanic, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-medium">{mechanic.mechanic_name}</h3>
                        <Badge variant="outline">{mechanic.specialization}</Badge>
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Cars: </span>
                          <span className="font-medium">{mechanic.cars_worked}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Hours: </span>
                          <span className="font-medium">{mechanic.total_hours_worked}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Efficiency: </span>
                          <span className="font-medium">{formatEfficiency(mechanic.efficiency_percentage || 0)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">On Time: </span>
                          <span className="font-medium">{mechanic.on_time_completions}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No mechanic performance data available.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="workload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Work Type Distribution (Current Week)</CardTitle>
            </CardHeader>
            <CardContent>
              {workTypeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={workTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}h`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="hours"
                    >
                      {workTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 text-center py-8">No work distribution data available for current week.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIProductivityDashboard;
