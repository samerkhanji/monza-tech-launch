import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  User, Activity, ArrowLeft, Search, Filter, Calendar, Clock, 
  Eye, Edit, Plus, Trash2, Upload, Download, Scan, Move, 
  BarChart3, TrendingUp, MapPin, Car, Package, FileText
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAuditLog } from '@/hooks/useAuditLog';
import { AuditFilters, AuditLogEntry, EmployeeAuditSummary } from '@/types/audit';
import { toast } from '@/hooks/use-toast';
import { dateUtils } from '@/lib/utils';

const EmployeeAuditPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { getEmployeeAuditSummary, filterLogs, advancedSearch } = useAuditLog();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<AuditFilters>({});
  const [selectedTimeRange, setSelectedTimeRange] = useState('all');
  const [employeeSummary, setEmployeeSummary] = useState<EmployeeAuditSummary | null>(null);

  // Always call hooks at the top level - BEFORE any conditional returns
  const [auditData, setAuditData] = useState<any[]>([]);

  useEffect(() => {
    // Hook called unconditionally at top level
    // Only load data if user has proper access
    if (user?.role === 'owner' || user?.role === 'garage_manager') {
      // Load audit data here
    }
  }, [userId, user]);

  const filteredData = useMemo(() => {
    // Hook called unconditionally at top level
    if (!auditData) return [];
    return auditData.filter(item => 
      item.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.details?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [auditData, searchTerm]);

  // Conditional logic after hooks
  // Load employee data
  useEffect(() => {
    // Only load data if user has access
    if (user?.role?.toUpperCase() !== 'OWNER' && user?.role?.toLowerCase() !== 'garage_manager') {
      return;
    }

        if (userId) {
      const summary = getEmployeeAuditSummary(userId);
      setEmployeeSummary(summary);
      
      if (!summary) {
        toast({
          title: 'Employee Not Found',
          description: 'No audit data found for this employee.',
          variant: 'destructive',
        });
        navigate('/audit-log');
      }
    }
  }, [userId, getEmployeeAuditSummary, navigate]);

  // Filter employee logs
  const filteredLogs = useMemo(() => {
    if (!employeeSummary) return [];
    
    let logs = employeeSummary.recentActivities;
    
    // Apply search
    if (searchTerm) {
      logs = advancedSearch(searchTerm).filter(log => log.userId === userId);
    }
    
    // Apply filters
    logs = filterLogs({ ...filters, userId }).filter(log => log.userId === userId);
    
    // Apply time range filter
    const now = new Date();
    switch (selectedTimeRange) {
      case 'today':
        logs = logs.filter(log => 
          new Date(log.timestamp).toDateString() === now.toDateString()
        );
        break;
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        logs = logs.filter(log => new Date(log.timestamp) >= weekAgo);
        break;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        logs = logs.filter(log => new Date(log.timestamp) >= monthAgo);
        break;
    }
    
    return logs;
  }, [employeeSummary, searchTerm, filters, selectedTimeRange, userId, advancedSearch, filterLogs]);

  // Conditional logic after hooks
  if (user?.role?.toUpperCase() !== 'OWNER' && user?.role?.toLowerCase() !== 'garage_manager') {
    return <Navigate to="/dashboard" replace />;
  }

  const updateFilter = (key: keyof AuditFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
    setSelectedTimeRange('all');
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATE': return <Plus className="h-4 w-4 text-green-600" />;
      case 'UPDATE': return <Edit className="h-4 w-4 text-blue-600" />;
      case 'DELETE': return <Trash2 className="h-4 w-4 text-red-600" />;
      case 'VIEW': return <Eye className="h-4 w-4 text-gray-600" />;
      case 'UPLOAD': return <Upload className="h-4 w-4 text-purple-600" />;
      case 'DOWNLOAD': return <Download className="h-4 w-4 text-indigo-600" />;
      case 'SCAN': return <Scan className="h-4 w-4 text-orange-600" />;
      case 'MOVE': return <Move className="h-4 w-4 text-cyan-600" />;
      case 'SEARCH': return <Search className="h-4 w-4 text-yellow-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE': return 'bg-green-100 text-green-800 border-green-300';
      case 'UPDATE': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'DELETE': return 'bg-red-100 text-red-800 border-red-300';
      case 'VIEW': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'UPLOAD': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'DOWNLOAD': return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'SCAN': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'MOVE': return 'bg-cyan-100 text-cyan-800 border-cyan-300';
      case 'SEARCH': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getSectionColor = (section: string) => {
    const colors: Record<string, string> = {
      'INVENTORY': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'GARAGE_INVENTORY': 'bg-yellow-200 text-yellow-900 border-yellow-400',
      'FLOOR_2_INVENTORY': 'bg-yellow-50 text-yellow-700 border-yellow-200',
      'SHOWROOM_1': 'bg-blue-100 text-blue-800 border-blue-300',
      'SHOWROOM_2': 'bg-green-100 text-green-800 border-green-300',
      'GARAGE': 'bg-orange-100 text-orange-800 border-orange-300',
      'GARAGE_CAR_INVENTORY': 'bg-orange-200 text-orange-900 border-orange-400',
      'PDI': 'bg-purple-100 text-purple-800 border-purple-300',
      'FINANCIAL': 'bg-emerald-100 text-emerald-800 border-emerald-300',
      'REPAIRS': 'bg-red-100 text-red-800 border-red-300',
      'NEW_ARRIVALS': 'bg-cyan-100 text-cyan-800 border-cyan-300',
    };
    return colors[section] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const exportEmployeeLogs = () => {
    if (!employeeSummary) return;
    
    const csvContent = [
      ['Timestamp', 'Action', 'Section', 'Entity Type', 'Details', 'VIN', 'Part Number', 'Car Model', 'Location'],
      ...filteredLogs.map(log => [
        log.timestamp,
        log.action,
        log.section,
        log.entityType,
        log.details,
        log.vinNumber || '',
        log.partNumber || '',
        log.carModel || '',
        log.location || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${employeeSummary.userName}_audit_log_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Export Complete',
      description: `${employeeSummary.userName}'s audit logs exported successfully.`,
    });
  };

  if (!employeeSummary) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <Activity className="h-16 w-16 text-gray-400 mx-auto mb-4 animate-spin" />
          <p className="text-gray-500">Loading employee audit data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate('/audit-log')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Audit Log
          </Button>
          <div className="flex items-center gap-3">
            <User className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{employeeSummary.userName}</h1>
              <p className="text-muted-foreground">
                {employeeSummary.userRole} • {employeeSummary.totalActivities} total activities
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportEmployeeLogs}>
            <Download className="mr-2 h-4 w-4" />
            Export Logs
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employeeSummary.totalActivities}</div>
            <p className="text-xs text-muted-foreground">All time activities</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Today's Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employeeSummary.todayActivities}</div>
            <p className="text-xs text-muted-foreground">Activities today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Most Active Section</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {employeeSummary.mostActiveSection.replace('_', ' ')}
            </div>
            <p className="text-xs text-muted-foreground">Primary work area</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Last Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dateUtils.formatDateTime(employeeSummary.lastActivity).split(' ')[1]}
            </div>
            <p className="text-xs text-muted-foreground">
              {dateUtils.formatDateTime(employeeSummary.lastActivity).split(' ')[0]}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="activities" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Activity Log
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Activity Breakdown</CardTitle>
                <CardDescription>Actions performed by this employee</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {employeeSummary.activityBreakdown.map((item) => (
                    <div key={item.action} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getActionIcon(item.action)}
                        <Badge className={getActionColor(item.action)}>
                          {item.action}
                        </Badge>
                      </div>
                      <div className="text-sm font-medium">{item.count} times</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Section Activity</CardTitle>
                <CardDescription>Areas where this employee is most active</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {employeeSummary.sectionBreakdown.map((item) => (
                    <div key={item.section} className="flex items-center justify-between">
                      <Badge className={getSectionColor(item.section)}>
                        {item.section.replace('_', ' ')}
                      </Badge>
                      <div className="text-sm font-medium">{item.count} activities</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activities">
          <Card>
            <CardHeader>
              <CardTitle>Activity Filters</CardTitle>
              <CardDescription>Search and filter this employee's activities</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Enhanced Search and Filters */}
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
                <div className="space-y-2 md:col-span-2">
                  <Label>Advanced Search</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search VIN, part number, car model, details..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Section</Label>
                  <Select value={filters.section || 'all'} onValueChange={(value) => updateFilter('section', value === 'all' ? '' : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Sections" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sections</SelectItem>
                      <SelectItem value="INVENTORY">Inventory</SelectItem>
                      <SelectItem value="GARAGE_INVENTORY">Garage Inventory</SelectItem>
                      <SelectItem value="FLOOR_2_INVENTORY">Floor 2 Inventory</SelectItem>
                      <SelectItem value="GARAGE_CAR_INVENTORY">Garage Car Inventory</SelectItem>
                      <SelectItem value="SHOWROOM_1">Showroom 1</SelectItem>
                      <SelectItem value="SHOWROOM_2">Showroom 2</SelectItem>
                      <SelectItem value="GARAGE">Garage</SelectItem>
                      <SelectItem value="PDI">PDI</SelectItem>
                      <SelectItem value="FINANCIAL">Financial</SelectItem>
                      <SelectItem value="REPAIRS">Repairs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 audit-dropdown-container">
                  <Label>Action</Label>
                  <Select value={filters.action || 'all'} onValueChange={(value) => updateFilter('action', value === 'all' ? '' : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Actions" />
                    </SelectTrigger>
                    <SelectContent 
                      position="popper" 
                      side="bottom" 
                      align="start" 
                      sideOffset={4}
                      avoidCollisions={true}
                      className="select-content-fixed"
                    >
                      <SelectItem value="all">All Actions</SelectItem>
                      <SelectItem value="CREATE">Create</SelectItem>
                      <SelectItem value="UPDATE">Update</SelectItem>
                      <SelectItem value="DELETE">Delete</SelectItem>
                      <SelectItem value="VIEW">View</SelectItem>
                      <SelectItem value="SCAN">Scan</SelectItem>
                      <SelectItem value="MOVE">Move</SelectItem>
                      <SelectItem value="SEARCH">Search</SelectItem>
                      <SelectItem value="UPLOAD">Upload</SelectItem>
                      <SelectItem value="DOWNLOAD">Download</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 audit-dropdown-container">
                  <Label>Time Range</Label>
                  <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent 
                      position="popper" 
                      side="bottom" 
                      align="start" 
                      sideOffset={4}
                      avoidCollisions={true}
                      className="select-content-fixed"
                    >
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                      <SelectItem value="all">All Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>&nbsp;</Label>
                  <Button variant="outline" onClick={clearFilters} className="w-full">
                    <Filter className="mr-2 h-4 w-4" />
                    Clear
                  </Button>
                </div>
              </div>

              {/* Additional Specific Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="space-y-2">
                  <Label>VIN Number</Label>
                  <Input
                    placeholder="Search by VIN..."
                    value={filters.vinNumber || ''}
                    onChange={(e) => updateFilter('vinNumber', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Part Number</Label>
                  <Input
                    placeholder="Search by part number..."
                    value={filters.partNumber || ''}
                    onChange={(e) => updateFilter('partNumber', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Car Model</Label>
                  <Input
                    placeholder="Search by car model..."
                    value={filters.carModel || ''}
                    onChange={(e) => updateFilter('carModel', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    placeholder="Search by location..."
                    value={filters.location || ''}
                    onChange={(e) => updateFilter('location', e.target.value)}
                  />
                </div>
              </div>

              {/* Results */}
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Additional Info</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.length > 0 ? (
                      filteredLogs.slice(0, 100).map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-sm">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <div>{dateUtils.formatDateTime(log.timestamp).split(' ')[1]}</div>
                                <div className="text-xs text-muted-foreground">
                                  {dateUtils.formatDateTime(log.timestamp).split(' ')[0]}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getActionIcon(log.action)}
                              <Badge className={getActionColor(log.action)}>
                                {log.action}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getSectionColor(log.section)}>
                              {log.section.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="flex items-center gap-1">
                                {log.entityType === 'CAR' && <Car className="h-3 w-3" />}
                                {log.entityType === 'PART' && <Package className="h-3 w-3" />}
                                {log.entityType === 'VIN' && <FileText className="h-3 w-3" />}
                                <span>{log.entityType}</span>
                              </div>
                              {log.entityName && (
                                <div className="text-xs text-muted-foreground">{log.entityName}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-md">
                            <p className="text-sm">{log.details}</p>
                            {log.changes && log.changes.length > 0 && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {log.changes.length} field(s) changed
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-xs space-y-1">
                              {log.vinNumber && (
                                <div className="flex items-center gap-1">
                                  <Car className="h-3 w-3" />
                                  <span>VIN: {log.vinNumber}</span>
                                </div>
                              )}
                              {log.partNumber && (
                                <div className="flex items-center gap-1">
                                  <Package className="h-3 w-3" />
                                  <span>Part: {log.partNumber}</span>
                                </div>
                              )}
                              {log.location && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  <span>{log.location}</span>
                                </div>
                              )}
                              {log.carModel && (
                                <div className="text-muted-foreground">
                                  {log.carBrand} {log.carModel}
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                          <p className="font-medium">No activities found</p>
                          <p className="text-sm text-muted-foreground">
                            Try adjusting your filters or search terms
                          </p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Activity Timeline</CardTitle>
                <CardDescription>Activity patterns over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                    <p>Activity timeline visualization coming soon</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Average Daily Activities</span>
                    <span className="font-medium">
                      {(employeeSummary.totalActivities / 30).toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Most Active Day</span>
                    <span className="font-medium">Today</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Primary Device</span>
                    <span className="font-medium">Desktop</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Efficiency Score</span>
                    <span className="font-medium text-green-600">High</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmployeeAuditPage; 