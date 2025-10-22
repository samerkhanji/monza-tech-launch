import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Clock, Timer, User, Car, Users, TrendingUp, BarChart3, 
  Activity, Calendar, Download, Filter, Search, 
  CheckCircle, AlertTriangle, PlayCircle, StopCircle
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { timeTrackingService, TimeTrackingEvent, ActivityType, EmployeePerformanceSummary, ActivityAnalytics } from '@/services/timeTrackingService';

const TimeTrackingDashboard: React.FC = () => {
  // State for dashboard data
  const [timeTrackingData, setTimeTrackingData] = useState<TimeTrackingEvent[]>([]);
  const [filteredData, setFilteredData] = useState<TimeTrackingEvent[]>([]);
  const [employeePerformance, setEmployeePerformance] = useState<EmployeePerformanceSummary[]>([]);
  const [activityAnalytics, setActivityAnalytics] = useState<ActivityAnalytics[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [dateRange, setDateRange] = useState('today');
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [selectedActivity, setSelectedActivity] = useState<ActivityType | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Summary stats
  const [totalActiveTime, setTotalActiveTime] = useState(0);
  const [totalActivities, setTotalActivities] = useState(0);
  const [averageEfficiency, setAverageEfficiency] = useState(0);
  const [activeEmployees, setActiveEmployees] = useState(0);

  useEffect(() => {
    loadTimeTrackingData();
  }, [dateRange]);

  useEffect(() => {
    applyFilters();
  }, [timeTrackingData, selectedEmployee, selectedActivity, searchTerm]);

  const loadTimeTrackingData = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange(dateRange);
      
      // Load time tracking events
      const events = await timeTrackingService.getAllTimeTrackingData(startDate, endDate);
      setTimeTrackingData(events);

      // Calculate summary statistics
      const activeTime = events.reduce((sum, event) => sum + (event.durationMinutes || 0), 0);
      const completedActivities = events.filter(e => !e.isActive).length;
      const avgEfficiency = events.reduce((sum, event) => sum + (event.efficiencyRating || 3), 0) / events.length;
      const uniqueEmployees = new Set(events.map(e => e.employeeName)).size;

      setTotalActiveTime(activeTime);
      setTotalActivities(completedActivities);
      setAverageEfficiency(avgEfficiency);
      setActiveEmployees(uniqueEmployees);

      // Load employee performance summaries
      const employees = Array.from(new Set(events.map(e => e.employeeName)));
      const performancePromises = employees.map(emp => 
        timeTrackingService.getEmployeePerformance(emp, startDate, endDate)
      );
      const performances = await Promise.all(performancePromises);
      setEmployeePerformance(performances.filter(p => p !== null) as EmployeePerformanceSummary[]);

      // Load activity analytics
      const activityTypes: ActivityType[] = [
        'test_drive_employee', 'test_drive_client', 'repair_start', 'repair_complete',
        'pdi_start', 'pdi_complete', 'client_interaction', 'car_inspection'
      ];
      const analyticsPromises = activityTypes.map(type =>
        timeTrackingService.getActivityAnalytics(type, startDate, endDate)
      );
      const analytics = await Promise.all(analyticsPromises);
      setActivityAnalytics(analytics.filter(a => a !== null) as ActivityAnalytics[]);

    } catch (error) {
      console.error('Error loading time tracking data:', error);
      toast({
        title: "Error Loading Data",
        description: "Failed to load time tracking data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = (range: string) => {
    const now = new Date();
    let startDate: string;
    let endDate: string = now.toISOString();

    switch (range) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        break;
      case 'week': {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        startDate = weekStart.toISOString();
        break;
      }
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        break;
      case 'quarter': {
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1).toISOString();
        break;
      }
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    }

    return { startDate, endDate };
  };

  const applyFilters = () => {
    let filtered = [...timeTrackingData];

    // Filter by employee
    if (selectedEmployee !== 'all') {
      filtered = filtered.filter(event => event.employeeName === selectedEmployee);
    }

    // Filter by activity type
    if (selectedActivity !== 'all') {
      filtered = filtered.filter(event => event.activityType === selectedActivity);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(event =>
        event.activityDescription.toLowerCase().includes(term) ||
        event.carModel?.toLowerCase().includes(term) ||
        event.clientName?.toLowerCase().includes(term) ||
        event.carVin?.toLowerCase().includes(term)
      );
    }

    setFilteredData(filtered);
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getActivityTypeColor = (type: ActivityType): string => {
    const colors = {
      'test_drive_client': 'bg-blue-100 text-blue-800',
      'test_drive_employee': 'bg-green-100 text-green-800',
      'repair_start': 'bg-orange-100 text-orange-800',
      'repair_complete': 'bg-purple-100 text-purple-800',
      'pdi_start': 'bg-yellow-100 text-yellow-800',
      'pdi_complete': 'bg-teal-100 text-teal-800',
      'client_interaction': 'bg-indigo-100 text-indigo-800',
      'car_inspection': 'bg-gray-100 text-gray-800',
      'other': 'bg-gray-100 text-gray-800'
    };
    return colors[type] || colors.other;
  };

  const getEfficiencyBadge = (rating: number) => {
    if (rating >= 4.5) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    if (rating >= 3.5) return <Badge className="bg-blue-100 text-blue-800">Good</Badge>;
    if (rating >= 2.5) return <Badge className="bg-yellow-100 text-yellow-800">Average</Badge>;
    return <Badge className="bg-red-100 text-red-800">Needs Improvement</Badge>;
  };

  const exportData = () => {
    // Create CSV export of time tracking data
    const headers = [
      'Employee', 'Activity Type', 'Description', 'Start Time', 'End Time', 
      'Duration (minutes)', 'Car VIN', 'Car Model', 'Client', 'Location', 'Efficiency Rating'
    ];
    
    const csvData = filteredData.map(event => [
      event.employeeName,
      event.activityType,
      event.activityDescription,
      event.startTime,
      event.endTime || 'In Progress',
      event.durationMinutes || 0,
      event.carVin || '',
      event.carModel || '',
      event.clientName || '',
      event.location || '',
      event.efficiencyRating || 'N/A'
    ]);

    const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `time-tracking-data-${dateRange}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Data Exported",
      description: "Time tracking data has been exported to CSV",
    });
  };

  const uniqueEmployees = Array.from(new Set(timeTrackingData.map(e => e.employeeName)));
  const uniqueActivities: ActivityType[] = Array.from(new Set(timeTrackingData.map(e => e.activityType))) as ActivityType[];

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Timer className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p>Loading time tracking data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Time Tracking Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor employee activities and performance metrics</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportData} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          <Button onClick={loadTimeTrackingData} variant="outline">
            <Activity className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Total Active Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(totalActiveTime)}</div>
            <p className="text-xs text-gray-500 mt-1">Across all activities</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Completed Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalActivities}</div>
            <p className="text-xs text-gray-500 mt-1">In selected period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Average Efficiency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageEfficiency.toFixed(1)}/5</div>
            <p className="text-xs text-gray-500 mt-1">{getEfficiencyBadge(averageEfficiency)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Active Employees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeEmployees}</div>
            <p className="text-xs text-gray-500 mt-1">Contributing data</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger id="dateRange">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger id="employee">
                <SelectValue placeholder="Employee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                {uniqueEmployees.map(emp => (
                  <SelectItem key={emp} value={emp}>{emp}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedActivity} onValueChange={(value) => setSelectedActivity(value as ActivityType | 'all')}>
              <SelectTrigger id="activityType">
                <SelectValue placeholder="Activity Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Activities</SelectItem>
                {uniqueActivities.map(activity => (
                  <SelectItem key={activity} value={activity}>
                    {activity.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search activities, cars, clients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="activities" className="space-y-4">
        <TabsList>
          <TabsTrigger value="activities">Activity Log</TabsTrigger>
          <TabsTrigger value="employees">Employee Performance</TabsTrigger>
          <TabsTrigger value="analytics">Activity Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Activity Log Tab */}
        <TabsContent value="activities">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activities ({filteredData.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredData.slice(0, 50).map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <Badge className={getActivityTypeColor(event.activityType)}>
                          {event.activityType.replace('_', ' ')}
                        </Badge>
                        {event.isActive && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <PlayCircle className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        )}
                        {event.efficiencyRating && getEfficiencyBadge(event.efficiencyRating)}
                      </div>
                      <div className="font-medium">{event.activityDescription}</div>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">{event.employeeName}</span>
                        {event.carModel && <span> • {event.carModel}</span>}
                        {event.clientName && <span> • Client: {event.clientName}</span>}
                        {event.location && <span> • {event.location}</span>}
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <div className="font-medium">
                        {event.durationMinutes ? formatDuration(event.durationMinutes) : 'In Progress'}
                      </div>
                      <div className="text-gray-500">
                        {new Date(event.startTime).toLocaleString()}
                      </div>
                      {event.endTime && (
                        <div className="text-gray-500">
                          to {new Date(event.endTime).toLocaleTimeString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {filteredData.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Timer className="h-8 w-8 mx-auto mb-4 text-gray-300" />
                    <p>No activities found for the selected filters</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Employee Performance Tab */}
        <TabsContent value="employees">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {employeePerformance.map((performance) => (
              <Card key={performance.employeeName}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {performance.employeeName}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-2xl font-bold">{performance.totalHours}h</div>
                        <div className="text-sm text-gray-600">Total Time</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{performance.activitiesCompleted}</div>
                        <div className="text-sm text-gray-600">Activities</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{performance.carsWorkedOn}</div>
                        <div className="text-sm text-gray-600">Cars</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{performance.onTimePerformance}%</div>
                        <div className="text-sm text-gray-600">On Time</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Efficiency Score:</span>
                        <span className="font-medium">{performance.efficiencyScore.toFixed(1)}/5</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(performance.efficiencyScore / 5) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      {Object.entries(performance.activitiesByType).map(([type, data]) => (
                        <div key={type} className="flex justify-between text-sm">
                          <span className="capitalize">{type.replace('_', ' ')}:</span>
                          <span>{data.count} activities ({formatDuration(data.totalMinutes)})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Activity Analytics Tab */}
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {activityAnalytics.map((analytics) => (
              <Card key={analytics.activityType}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    {analytics.activityType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-2xl font-bold">{analytics.totalOccurrences}</div>
                        <div className="text-sm text-gray-600">Total Count</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{formatDuration(analytics.averageDurationMinutes)}</div>
                        <div className="text-sm text-gray-600">Avg Duration</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{formatDuration(analytics.fastestDurationMinutes)}</div>
                        <div className="text-sm text-gray-600">Fastest</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{formatDuration(analytics.slowestDurationMinutes)}</div>
                        <div className="text-sm text-gray-600">Slowest</div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Top Performers</h4>
                      <div className="space-y-1">
                        {analytics.employeeRankings.slice(0, 3).map((ranking, index) => (
                          <div key={ranking.employeeName} className="flex justify-between text-sm">
                            <span className="flex items-center gap-2">
                              <Badge variant="outline" className="w-6 h-6 text-xs p-0 flex items-center justify-center">
                                {index + 1}
                              </Badge>
                              {ranking.employeeName}
                            </span>
                            <span>{formatDuration(ranking.averageDuration)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Time Tracking Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center py-8 text-gray-500">
                  <h3 className="font-medium mb-2">Comprehensive Time Reports</h3>
                  <p className="mb-4">All employee activities are being tracked automatically in the background.</p>
                  <p className="text-sm">Key metrics collected:</p>
                  <ul className="text-sm mt-2 space-y-1">
                    <li>• Test drive durations (employee & client)</li>
                    <li>• Repair and maintenance time</li>
                    <li>• PDI completion time</li>
                    <li>• Client interaction duration</li>
                    <li>• Car inspection and movement time</li>
                    <li>• Efficiency ratings and performance metrics</li>
                  </ul>
                  <Button onClick={exportData} className="mt-4">
                    <Download className="h-4 w-4 mr-2" />
                    Export Current Data
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TimeTrackingDashboard; 