import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  Search, 
  Eye, 
  Activity, 
  Clock, 
  User, 
  Shield, 
  Download,
  BarChart3,
  TrendingUp,
  CheckCircle,
  XCircle,
  Monitor,
  Smartphone,
  Tablet,
  Globe
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAuditLog } from '@/hooks/useAuditLog';
import { AuditLogEntry } from '@/types/audit';
import { toast } from '@/hooks/use-toast';
import { dateUtils } from '@/lib/utils';
import { Navigate } from 'react-router-dom';

interface UserActivitySummary {
  userId: string;
  userName: string;
  userRole: string;
  totalActivities: number;
  todayActivities: number;
  weekActivities: number;
  monthActivities: number;
  lastActivity: string;
  firstActivity: string;
  mostActiveSection: string;
  mostCommonAction: string;
  deviceTypes: Record<string, number>;
  browsers: Record<string, number>;
  errorCount: number;
  successRate: number;
  recentActivities: AuditLogEntry[];
}

const UserActivityDashboard: React.FC = () => {
  const { user } = useAuth();
  const { auditLogs } = useAuditLog();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('all');
  const [selectedSection, setSelectedSection] = useState('all');
  const [selectedAction, setSelectedAction] = useState('all');
  const [isUserDetailOpen, setIsUserDetailOpen] = useState(false);
  const [userDetailData, setUserDetailData] = useState<UserActivitySummary | null>(null);

  // Always call hooks at the top level - BEFORE any conditional returns
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const activitySummary = useMemo(() => {
    // Hook called unconditionally at top level
    if (!activities.length) return { total: 0, today: 0, thisWeek: 0 };
    // Calculate summary...
    return { total: activities.length, today: 0, thisWeek: 0 };
  }, [activities]);

  const filteredActivities = useMemo(() => {
    // Hook called unconditionally at top level
    return activities || [];
  }, [activities]);

  const chartData = useMemo(() => {
    // Hook called unconditionally at top level
    return [];
  }, [activities]);

  // Get comprehensive user activity summaries
  const userActivitySummaries = useMemo(() => {
    // Only process if user has access
    if (user?.role !== 'owner' && user?.role !== 'garage_manager') {
      return [];
    }

    const userMap = new Map<string, UserActivitySummary>();
    
    auditLogs.forEach(log => {
      if (!userMap.has(log.userId)) {
        userMap.set(log.userId, {
          userId: log.userId,
          userName: log.userName,
          userRole: log.userRole,
          totalActivities: 0,
          todayActivities: 0,
          weekActivities: 0,
          monthActivities: 0,
          lastActivity: log.timestamp,
          firstActivity: log.timestamp,
          mostActiveSection: '',
          mostCommonAction: '',
          deviceTypes: {},
          browsers: {},
          errorCount: 0,
          successRate: 100,
          recentActivities: []
        });
      }

      const summary = userMap.get(log.userId)!;
      summary.totalActivities++;

      // Time-based counts
      const logDate = new Date(log.timestamp);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      if (logDate >= today) summary.todayActivities++;
      if (logDate >= weekAgo) summary.weekActivities++;
      if (logDate >= monthAgo) summary.monthActivities++;

      // Update first/last activity
      if (new Date(log.timestamp) > new Date(summary.lastActivity)) {
        summary.lastActivity = log.timestamp;
      }
      if (new Date(log.timestamp) < new Date(summary.firstActivity)) {
        summary.firstActivity = log.timestamp;
      }

      // Device and browser tracking
      if (log.metadata?.deviceType) {
        summary.deviceTypes[log.metadata.deviceType] = (summary.deviceTypes[log.metadata.deviceType] || 0) + 1;
      }
      if (log.metadata?.browserName) {
        summary.browsers[log.metadata.browserName] = (summary.browsers[log.metadata.browserName] || 0) + 1;
      }
    });

    // Calculate additional metrics for each user
    userMap.forEach((summary, userId) => {
      const userLogs = auditLogs.filter(log => log.userId === userId);
      
      // Most active section
      const sectionCounts = userLogs.reduce((acc, log) => {
        acc[log.section] = (acc[log.section] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      summary.mostActiveSection = Object.entries(sectionCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None';

      // Most common action
      const actionCounts = userLogs.reduce((acc, log) => {
        acc[log.action] = (acc[log.action] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      summary.mostCommonAction = Object.entries(actionCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None';

      // Recent activities
      summary.recentActivities = userLogs.slice(0, 20);

      // Success rate (simplified - based on error-related activities)
      const errorActivities = userLogs.filter(log => 
        log.details.toLowerCase().includes('error') || 
        log.details.toLowerCase().includes('failed') ||
        log.action === 'DELETE'
      ).length;
      summary.errorCount = errorActivities;
      summary.successRate = summary.totalActivities > 0 
        ? Math.round(((summary.totalActivities - errorActivities) / summary.totalActivities) * 100)
        : 100;
    });

    return Array.from(userMap.values()).sort((a, b) => 
      new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
    );
  }, [auditLogs, user]);

  // Conditional logic after hooks
  if (user?.role !== 'owner' && user?.role !== 'garage_manager') {
    return <Navigate to="/dashboard" replace />;
  }

  // Advanced filtering
  const filteredUsers = useMemo(() => {
    return userActivitySummaries.filter(user => {
      const matchesSearch = !searchTerm || 
        user.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.userRole.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.userId.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesTimeRange = selectedTimeRange === 'all' || 
        (selectedTimeRange === 'today' && user.todayActivities > 0) ||
        (selectedTimeRange === 'week' && user.weekActivities > 0) ||
        (selectedTimeRange === 'month' && user.monthActivities > 0);

      return matchesSearch && matchesTimeRange;
    });
  }, [userActivitySummaries, searchTerm, selectedTimeRange]);

  // Global search across all activities
  const globalFilteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      if (!searchTerm) return true;
      
      const searchLower = searchTerm.toLowerCase();
      return (
        log.userName.toLowerCase().includes(searchLower) ||
        log.details.toLowerCase().includes(searchLower) ||
        log.entityName?.toLowerCase().includes(searchLower) ||
        log.vinNumber?.toLowerCase().includes(searchLower) ||
        log.partNumber?.toLowerCase().includes(searchLower) ||
        log.carModel?.toLowerCase().includes(searchLower) ||
        log.carBrand?.toLowerCase().includes(searchLower) ||
        log.section.toLowerCase().includes(searchLower) ||
        log.action.toLowerCase().includes(searchLower) ||
        log.entityType.toLowerCase().includes(searchLower)
      );
    }).filter(log => {
      if (selectedSection !== 'all' && log.section !== selectedSection) return false;
      if (selectedAction !== 'all' && log.action !== selectedAction) return false;
      if (selectedUser && log.userId !== selectedUser) return false;
      
      // Time range filter
      if (selectedTimeRange !== 'all') {
        const logDate = new Date(log.timestamp);
        const now = new Date();
        
        switch (selectedTimeRange) {
          case 'today':
            return logDate.toDateString() === now.toDateString();
          case 'week':
            return logDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          case 'month':
            return logDate >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }
      }
      
      return true;
    });
  }, [auditLogs, searchTerm, selectedSection, selectedAction, selectedUser, selectedTimeRange]);

  const handleViewUserDetails = (userId: string) => {
    const userData = userActivitySummaries.find(u => u.userId === userId);
    if (userData) {
      setUserDetailData(userData);
      setIsUserDetailOpen(true);
    }
  };

  const exportUserData = (userId: string) => {
    const userData = userActivitySummaries.find(u => u.userId === userId);
    if (!userData) return;

    const userLogs = auditLogs.filter(log => log.userId === userId);
    const exportData = {
      summary: userData,
      activities: userLogs
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `user-activity-${userData.userName}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: `Activity data for ${userData.userName} has been exported.`,
    });
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile': return <Smartphone className="h-4 w-4" />;
      case 'tablet': return <Tablet className="h-4 w-4" />;
      default: return <Monitor className="h-4 w-4" />;
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATE': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'UPDATE': return <Activity className="h-4 w-4 text-blue-600" />;
      case 'DELETE': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'VIEW': return <Eye className="h-4 w-4 text-gray-600" />;
      case 'LOGIN': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'LOGOUT': return <XCircle className="h-4 w-4 text-orange-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getSectionColor = (section: string) => {
    const colors: Record<string, string> = {
      'INVENTORY': 'bg-blue-100 text-blue-800',
      'SHOWROOM_1': 'bg-green-100 text-green-800',
      'SHOWROOM_2': 'bg-purple-100 text-purple-800',
      'GARAGE': 'bg-orange-100 text-orange-800',
      'FINANCIAL': 'bg-yellow-100 text-yellow-800',
      'REPAIRS': 'bg-red-100 text-red-800',
      'PDI': 'bg-indigo-100 text-indigo-800',
      'USERS': 'bg-gray-100 text-gray-800'
    };
    return colors[section] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Activity Dashboard</h1>
            <p className="text-muted-foreground">
              Monitor employee activities, track usage patterns, and review individual user histories
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => {
            const exportData = {
              summary: userActivitySummaries,
              allActivities: auditLogs
            };
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `all-user-activities-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }}>
            <Download className="mr-2 h-4 w-4" />
            Export All Data
          </Button>
        </div>
      </div>

      {/* Advanced Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Advanced Search & Filters
          </CardTitle>
          <CardDescription>
            Search across all activities, users, and data. Filter by time range, section, action, or specific user.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <Input
                placeholder="Search users, activities, VINs, parts, details..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
              <SelectTrigger>
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedSection} onValueChange={setSelectedSection}>
              <SelectTrigger>
                <SelectValue placeholder="Section" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sections</SelectItem>
                <SelectItem value="INVENTORY">Inventory</SelectItem>
                <SelectItem value="SHOWROOM_1">Showroom 1</SelectItem>
                <SelectItem value="SHOWROOM_2">Showroom 2</SelectItem>
                <SelectItem value="GARAGE">Garage</SelectItem>
                <SelectItem value="FINANCIAL">Financial</SelectItem>
                <SelectItem value="REPAIRS">Repairs</SelectItem>
                <SelectItem value="PDI">PDI</SelectItem>
                <SelectItem value="USERS">Users</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedAction} onValueChange={setSelectedAction}>
              <SelectTrigger>
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="CREATE">Create</SelectItem>
                <SelectItem value="UPDATE">Update</SelectItem>
                <SelectItem value="DELETE">Delete</SelectItem>
                <SelectItem value="VIEW">View</SelectItem>
                <SelectItem value="LOGIN">Login</SelectItem>
                <SelectItem value="LOGOUT">Logout</SelectItem>
                <SelectItem value="UPLOAD">Upload</SelectItem>
                <SelectItem value="DOWNLOAD">Download</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(searchTerm || selectedTimeRange !== 'all' || selectedSection !== 'all' || selectedAction !== 'all') && (
            <div className="mt-4 flex items-center gap-2">
              <Badge variant="outline">
                {globalFilteredLogs.length} results found
              </Badge>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedTimeRange('all');
                  setSelectedSection('all');
                  setSelectedAction('all');
                  setSelectedUser(null);
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            User Profiles
          </TabsTrigger>
          <TabsTrigger value="activities" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            All Activities
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userActivitySummaries.length}</div>
                <p className="text-xs text-muted-foreground">
                  Active in system
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Activities</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {userActivitySummaries.reduce((sum, user) => sum + user.todayActivities, 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Across all users
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Today</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {userActivitySummaries.filter(user => user.todayActivities > 0).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Users active today
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{auditLogs.length}</div>
                <p className="text-xs text-muted-foreground">
                  All time activities
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Most Active Users</CardTitle>
                <CardDescription>Users with highest activity counts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userActivitySummaries.slice(0, 5).map((user) => (
                    <div key={user.userId} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{user.userName}</div>
                          <div className="text-sm text-muted-foreground">{user.userRole}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{user.totalActivities}</div>
                        <div className="text-xs text-muted-foreground">activities</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activities</CardTitle>
                <CardDescription>Latest system activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {auditLogs.slice(0, 8).map((log) => (
                    <div key={log.id} className="flex items-start gap-3 p-2 border rounded">
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{log.userName}</span>
                          <Badge className={getSectionColor(log.section)} variant="outline">
                            {log.section.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{log.details}</p>
                        <p className="text-xs text-muted-foreground">
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

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Activity Profiles</CardTitle>
              <CardDescription>
                Click on any user to view their detailed activity history and analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredUsers.map((user) => (
                  <div 
                    key={user.userId} 
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => handleViewUserDetails(user.userId)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <User className="h-6 w-6 text-muted-foreground" />
                        <div>
                          <div className="font-semibold text-lg">{user.userName}</div>
                          <div className="text-sm text-muted-foreground">{user.userRole}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            exportUserData(user.userId);
                          }}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Export
                        </Button>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center p-2 bg-blue-50 rounded">
                        <div className="text-lg font-bold text-blue-600">{user.totalActivities}</div>
                        <div className="text-xs text-blue-600">Total Activities</div>
                      </div>
                      <div className="text-center p-2 bg-green-50 rounded">
                        <div className="text-lg font-bold text-green-600">{user.todayActivities}</div>
                        <div className="text-xs text-green-600">Today</div>
                      </div>
                      <div className="text-center p-2 bg-purple-50 rounded">
                        <div className="text-lg font-bold text-purple-600">{user.weekActivities}</div>
                        <div className="text-xs text-purple-600">This Week</div>
                      </div>
                      <div className="text-center p-2 bg-orange-50 rounded">
                        <div className="text-lg font-bold text-orange-600">{user.successRate}%</div>
                        <div className="text-xs text-orange-600">Success Rate</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Activity className="h-4 w-4 text-muted-foreground" />
                          <span>Most Active: {user.mostActiveSection.replace('_', ' ')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>Last: {dateUtils.formatDateTime(user.lastActivity)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {Object.entries(user.deviceTypes).map(([device, count]) => (
                          <div key={device} className="flex items-center gap-1">
                            {getDeviceIcon(device)}
                            <span className="text-xs">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities">
          <Card>
            <CardHeader>
              <CardTitle>All Activities</CardTitle>
              <CardDescription>
                Complete activity log with advanced filtering ({globalFilteredLogs.length} activities shown)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Device</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {globalFilteredLogs.slice(0, 100).map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm">
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3 text-muted-foreground" />
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
                            <User className="h-3 w-3 text-muted-foreground" />
                            <div>
                              <div className="font-medium text-sm">{log.userName}</div>
                              <div className="text-xs text-muted-foreground">{log.userRole}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getActionIcon(log.action)}
                            <Badge variant="outline">
                              {log.action}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getSectionColor(log.section)} variant="outline">
                            {log.section.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-md">
                          <p className="text-sm truncate">{log.details}</p>
                          {log.entityName && (
                            <p className="text-xs text-muted-foreground">{log.entityName}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {getDeviceIcon(log.metadata?.deviceType || 'desktop')}
                            <span className="text-xs">{log.metadata?.browserName || 'Unknown'}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
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
                <CardTitle>Section Usage</CardTitle>
                <CardDescription>Activity distribution across system sections</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(
                    auditLogs.reduce((acc, log) => {
                      acc[log.section] = (acc[log.section] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  )
                    .sort(([,a], [,b]) => b - a)
                    .map(([section, count]) => (
                      <div key={section} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={getSectionColor(section)} variant="outline">
                            {section.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{count}</div>
                          <div className="text-xs text-muted-foreground">
                            {((count / auditLogs.length) * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Device & Browser Usage</CardTitle>
                <CardDescription>User device and browser preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Device Types</h4>
                    <div className="space-y-2">
                      {Object.entries(
                        auditLogs.reduce((acc, log) => {
                          const device = log.metadata?.deviceType || 'desktop';
                          acc[device] = (acc[device] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>)
                      ).map(([device, count]) => (
                        <div key={device} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getDeviceIcon(device)}
                            <span className="capitalize">{device}</span>
                          </div>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Browsers</h4>
                    <div className="space-y-2">
                      {Object.entries(
                        auditLogs.reduce((acc, log) => {
                          const browser = log.metadata?.browserName || 'Unknown';
                          acc[browser] = (acc[browser] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>)
                      ).map(([browser, count]) => (
                        <div key={browser} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            <span>{browser}</span>
                          </div>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* User Detail Dialog */}
      <Dialog open={isUserDetailOpen} onOpenChange={setIsUserDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {userDetailData?.userName} - Detailed Activity History
            </DialogTitle>
            <DialogDescription>
              Complete activity history and analytics for {userDetailData?.userName} ({userDetailData?.userRole})
            </DialogDescription>
          </DialogHeader>
          
          {userDetailData && (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{userDetailData.totalActivities}</div>
                  <div className="text-sm text-blue-600">Total Activities</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{userDetailData.todayActivities}</div>
                  <div className="text-sm text-green-600">Today</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{userDetailData.weekActivities}</div>
                  <div className="text-sm text-purple-600">This Week</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{userDetailData.successRate}%</div>
                  <div className="text-sm text-orange-600">Success Rate</div>
                </div>
              </div>

              {/* Recent Activities */}
              <div>
                <h3 className="font-semibold mb-3">Recent Activities (Last 20)</h3>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Section</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userDetailData.recentActivities.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-sm">
                            {dateUtils.formatDateTime(log.timestamp)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getActionIcon(log.action)}
                              <Badge variant="outline">{log.action}</Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getSectionColor(log.section)} variant="outline">
                              {log.section.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-md">
                            <p className="text-sm truncate">{log.details}</p>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserActivityDashboard;
 