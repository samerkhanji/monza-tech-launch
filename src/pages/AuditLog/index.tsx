import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Shield, Activity, Users, Eye, Edit, Plus, Trash2, Upload, Download, 
  Filter, Calendar, Search, BarChart3, Clock, User, MapPin, FileText
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAuditLog } from '@/hooks/useAuditLog';
import { AuditFilters, AuditLogEntry } from '@/types/audit';
import { toast } from '@/hooks/use-toast';
import { dateUtils } from '@/lib/utils';
import { useNavigate, Navigate } from 'react-router-dom';

const AuditLogPage: React.FC = () => {
  const { user } = useAuth();
  const { auditLogs, filterLogs, getAuditStats, clearOldLogs } = useAuditLog();
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState<AuditFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTimeRange, setSelectedTimeRange] = useState('today');
  const navigate = useNavigate();

  // Always call hooks at the top level - BEFORE any conditional returns
  const filteredData = useMemo(() => {
    // Hook called unconditionally at top level
    return []; // Default empty data if no user access
  }, []);

  const activityData = useMemo(() => {
    // Hook called unconditionally at top level  
    return []; // Default empty data if no user access
  }, []);

  // Conditional logic after hooks
  if (user?.role !== 'owner' && user?.role !== 'garage_manager') {
    return <Navigate to="/dashboard" replace />;
  }

  const stats = useMemo(() => getAuditStats(), [getAuditStats]);
  
  const filteredLogs = useMemo(() => {
    let timeFilteredLogs = auditLogs;
    
    // Apply time range filter
    const now = new Date();
    switch (selectedTimeRange) {
      case 'today':
        timeFilteredLogs = auditLogs.filter(log => 
          new Date(log.timestamp).toDateString() === now.toDateString()
        );
        break;
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        timeFilteredLogs = auditLogs.filter(log => 
          new Date(log.timestamp) >= weekAgo
        );
        break;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        timeFilteredLogs = auditLogs.filter(log => 
          new Date(log.timestamp) >= monthAgo
        );
        break;
    }

    return filterLogs({ ...filters, searchTerm }).filter(log => 
      timeFilteredLogs.includes(log)
    );
  }, [auditLogs, filters, searchTerm, selectedTimeRange, filterLogs]);

  const updateFilter = (key: keyof AuditFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
    setSelectedTimeRange('today');
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATE': return <Plus className="h-4 w-4 text-green-600" />;
      case 'UPDATE': return <Edit className="h-4 w-4 text-blue-600" />;
      case 'DELETE': return <Trash2 className="h-4 w-4 text-red-600" />;
      case 'VIEW': return <Eye className="h-4 w-4 text-gray-600" />;
      case 'UPLOAD': return <Upload className="h-4 w-4 text-purple-600" />;
      case 'DOWNLOAD': return <Download className="h-4 w-4 text-indigo-600" />;
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
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getSectionColor = (section: string) => {
    const colors: Record<string, string> = {
      'INVENTORY': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'SHOWROOM_1': 'bg-blue-100 text-blue-800 border-blue-300',
      'SHOWROOM_2': 'bg-green-100 text-green-800 border-green-300',
      'GARAGE': 'bg-orange-100 text-orange-800 border-orange-300',
      'PDI': 'bg-purple-100 text-purple-800 border-purple-300',
      'FINANCIAL': 'bg-emerald-100 text-emerald-800 border-emerald-300',
      'REPAIRS': 'bg-red-100 text-red-800 border-red-300',
      'NEW_ARRIVALS': 'bg-cyan-100 text-cyan-800 border-cyan-300',
    };
    return colors[section] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const exportLogs = () => {
    const csvContent = [
      ['Timestamp', 'User', 'Role', 'Action', 'Section', 'Entity Type', 'Details'],
      ...filteredLogs.map(log => [
        log.timestamp,
        log.userName,
        log.userRole,
        log.action,
        log.section,
        log.entityType,
        log.details
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit_log_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Export Complete',
      description: 'Audit logs have been exported to CSV file.',
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Activity Monitor</h1>
            <p className="text-muted-foreground">
              Track all user activities and changes across the CMS
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportLogs}>
            <Download className="mr-2 h-4 w-4" />
            Export Logs
          </Button>
          <Button variant="outline" onClick={clearOldLogs}>
            <Trash2 className="mr-2 h-4 w-4" />
            Clear Old Logs
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalActivities.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All time activities</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Today's Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayActivities}</div>
            <p className="text-xs text-muted-foreground">Activities today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">Users active today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Most Active Section</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.sectionsActivity[0]?.section.replace('_', ' ') || 'None'}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.sectionsActivity[0]?.count || 0} activities
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
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            User Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Section Activity</CardTitle>
                <CardDescription>Activity breakdown by system sections</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.sectionsActivity.slice(0, 8).map((item) => (
                    <div key={item.section} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={getSectionColor(item.section)}>
                          {item.section.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{item.count} activities</div>
                        <div className="text-xs text-muted-foreground">
                          Last: {dateUtils.formatDateTime(item.lastActivity)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activities</CardTitle>
                <CardDescription>Latest 10 system activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {auditLogs.slice(0, 10).map((log) => (
                    <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{log.userName}</span>
                          <Badge className={getActionColor(log.action)}>
                            {log.action}
                          </Badge>
                          <Badge className={getSectionColor(log.section)}>
                            {log.section.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{log.details}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {dateUtils.formatDateTime(log.timestamp)}
                        </p>
                      </div>
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
              <CardDescription>Filter activities by section, action, user, and time range</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                <div className="space-y-2">
                  <Label>Search</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search activities..."
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
                      <SelectItem value="SHOWROOM_1">Showroom 1</SelectItem>
                      <SelectItem value="SHOWROOM_2">Showroom 2</SelectItem>
                      <SelectItem value="GARAGE">Garage</SelectItem>
                      <SelectItem value="PDI">PDI</SelectItem>
                      <SelectItem value="FINANCIAL">Financial</SelectItem>
                      <SelectItem value="REPAIRS">Repairs</SelectItem>
                      <SelectItem value="NEW_ARRIVALS">New Arrivals</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Action</Label>
                  <Select value={filters.action || 'all'} onValueChange={(value) => updateFilter('action', value === 'all' ? '' : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Actions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Actions</SelectItem>
                      <SelectItem value="CREATE">Create</SelectItem>
                      <SelectItem value="UPDATE">Update</SelectItem>
                      <SelectItem value="DELETE">Delete</SelectItem>
                      <SelectItem value="VIEW">View</SelectItem>
                      <SelectItem value="UPLOAD">Upload</SelectItem>
                      <SelectItem value="DOWNLOAD">Download</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Time Range</Label>
                  <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
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
                    Clear Filters
                  </Button>
                </div>
              </div>

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.length > 0 ? (
                      filteredLogs.slice(0, 100).map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-sm">
                            {dateUtils.formatDateTime(log.timestamp)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <div className="font-medium">{log.userName}</div>
                                <div className="text-xs text-muted-foreground">{log.userRole}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getActionColor(log.action)}>
                              {log.action}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getSectionColor(log.section)}>
                              {log.section.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{log.entityType}</div>
                              {log.entityName && (
                                <div className="text-xs text-muted-foreground">{log.entityName}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-md">
                            <p className="text-sm truncate">{log.details}</p>
                            {log.changes && log.changes.length > 0 && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {log.changes.length} field(s) changed
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                          <p className="font-medium">No activities found</p>
                          <p className="text-sm text-muted-foreground">
                            Try adjusting your filters or time range
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

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Employee Activity Summary</CardTitle>
              <CardDescription>Click on any employee to view their detailed audit logs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(
                  filteredLogs.reduce((acc, log) => {
                    if (!acc[log.userId]) {
                      acc[log.userId] = {
                        userName: log.userName,
                        userRole: log.userRole,
                        totalActivities: 0,
                        lastActivity: log.timestamp,
                        actions: {} as Record<string, number>
                      };
                    }
                    acc[log.userId].totalActivities++;
                    acc[log.userId].actions[log.action] = (acc[log.userId].actions[log.action] || 0) + 1;
                    if (new Date(log.timestamp) > new Date(acc[log.userId].lastActivity)) {
                      acc[log.userId].lastActivity = log.timestamp;
                    }
                    return acc;
                  }, {} as Record<string, any>)
                ).map(([userId, userData]) => (
                  <div key={userId} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                       onClick={() => window.open(`/employee-audit/${userId}`, '_blank')}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{userData.userName}</div>
                          <div className="text-sm text-muted-foreground">{userData.userRole}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{userData.totalActivities} activities</div>
                        <div className="text-xs text-muted-foreground">
                          Last: {dateUtils.formatDateTime(userData.lastActivity)}
                        </div>
                        <Button variant="outline" size="sm" className="mt-2">
                          View Details
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(userData.actions).map(([action, count]) => (
                        <Badge key={action} variant="outline" className={getActionColor(action)}>
                          {action}: {count as number}
                        </Badge>
                      ))}
                    </div>
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

export default AuditLogPage; 