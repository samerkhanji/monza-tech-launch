import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert-fixed';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  MapPin, 
  Clock, 
  AlertTriangle, 
  Users, 
  Globe, 
  Smartphone,
  Download,
  RefreshCw,
  Filter,
  Search
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { locationTrackingService } from '@/services/locationTrackingService';
import { format } from 'date-fns';

interface LoginRecord {
  id: number;
  user_name?: string;
  email: string;
  role?: string;
  login_time: string;
  ip_address: string;
  country?: string;
  region?: string;
  city?: string;
  device_type?: string;
  browser?: string;
  os?: string;
  is_suspicious: boolean;
  is_new_location: boolean;
  success: boolean;
}

interface LoginStats {
  login_date: string;
  total_logins: number;
  successful_logins: number;
  failed_logins: number;
  suspicious_logins: number;
  new_location_logins: number;
  unique_users: number;
  unique_ips: number;
}

interface LoginNotification {
  id: number;
  notification_type: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  login_tracking?: {
    email: string;
    login_time: string;
    ip_address: string;
    country?: string;
    city?: string;
  };
}

export default function LoginTracking() {
  const { user } = useAuth();
  const [suspiciousLogins, setSuspiciousLogins] = useState<LoginRecord[]>([]);
  const [loginStats, setLoginStats] = useState<LoginStats[]>([]);
  const [notifications, setNotifications] = useState<LoginNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('suspicious');
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');

  // Check if user has permission to view login tracking
  const canViewLoginTracking = user?.role?.toUpperCase() === 'OWNER';

  useEffect(() => {
    if (canViewLoginTracking) {
      loadData();
    }
  }, [canViewLoginTracking]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [suspiciousData, statsData, notificationsData] = await Promise.all([
        locationTrackingService.getSuspiciousLogins(),
        loadLoginStats(),
        locationTrackingService.getLoginNotifications()
      ]);

      setSuspiciousLogins(suspiciousData);
      setLoginStats(statsData);
      setNotifications(notificationsData);
    } catch (error) {
      console.error('Error loading login tracking data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLoginStats = async () => {
    try {
      // This would call a Supabase view or function
      // For now, return empty array - implement based on your needs
      return [];
    } catch (error) {
      console.error('Error loading login stats:', error);
      return [];
    }
  };

  const exportData = () => {
    const csv = generateCSV(suspiciousLogins);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `login-tracking-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const generateCSV = (data: LoginRecord[]) => {
    const headers = ['Date', 'Email', 'Role', 'IP Address', 'Location', 'Device', 'Status', 'Flags'];
    const rows = data.map(record => [
      format(new Date(record.login_time), 'yyyy-MM-dd HH:mm:ss'),
      record.email,
      record.role || 'Unknown',
      record.ip_address,
      `${record.city || 'Unknown'}, ${record.country || 'Unknown'}`,
      `${record.device_type || 'Unknown'} - ${record.browser || 'Unknown'}`,
      record.success ? 'Success' : 'Failed',
      [
        record.is_suspicious && 'Suspicious',
        record.is_new_location && 'New Location'
      ].filter(Boolean).join(', ')
    ]);
    
    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getLocationString = (record: LoginRecord) => {
    const parts = [record.city, record.region, record.country].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Unknown Location';
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.login_tracking?.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || notification.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  if (!canViewLoginTracking) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Access Denied: Only OWNER users can view login tracking data.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading login tracking data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Login Tracking & Security</h1>
          <p className="text-muted-foreground">Monitor employee login activity and security events</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportData} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspicious Logins</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suspiciousLogins.filter(l => l.is_suspicious).length}</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Locations</CardTitle>
            <MapPin className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suspiciousLogins.filter(l => l.is_new_location).length}</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Logins</CardTitle>
            <Shield className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suspiciousLogins.filter(l => !l.success).length}</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(suspiciousLogins.filter(l => l.success).map(l => l.email)).size}
            </div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="suspicious">Suspicious Activity</TabsTrigger>
          <TabsTrigger value="notifications">Security Alerts</TabsTrigger>
          <TabsTrigger value="locations">Login Locations</TabsTrigger>
        </TabsList>

        <TabsContent value="suspicious" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Suspicious Login Activity</CardTitle>
              <CardDescription>
                Login attempts flagged for security review
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Device</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Flags</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {suspiciousLogins.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-mono text-sm">
                          {format(new Date(record.login_time), 'MMM dd, HH:mm')}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{record.user_name || record.email.split('@')[0]}</div>
                            <div className="text-sm text-muted-foreground">{record.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{record.role || 'Unknown'}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Globe className="h-4 w-4 mr-1" />
                            {getLocationString(record)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Smartphone className="h-4 w-4 mr-1" />
                            <div>
                              <div className="text-sm">{record.device_type || 'Unknown'}</div>
                              <div className="text-xs text-muted-foreground">{record.browser}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {record.ip_address}
                        </TableCell>
                        <TableCell>
                          <Badge variant={record.success ? "secondary" : "destructive"}>
                            {record.success ? 'Success' : 'Failed'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {record.is_suspicious && (
                              <Badge variant="destructive" className="text-xs">
                                Suspicious
                              </Badge>
                            )}
                            {record.is_new_location && (
                              <Badge variant="secondary" className="text-xs">
                                New Location
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {suspiciousLogins.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No suspicious login activity detected</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Security Notifications</CardTitle>
                  <CardDescription>Real-time alerts for security events</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    <Input
                      placeholder="Search notifications..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64"
                    />
                  </div>
                  <Select value={severityFilter} onValueChange={setSeverityFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredNotifications.map((notification) => (
                  <div key={notification.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={`${getSeverityColor(notification.severity)} text-white`}>
                            {notification.severity.toUpperCase()}
                          </Badge>
                          <Badge variant="outline">
                            {notification.notification_type.replace('_', ' ').toUpperCase()}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(notification.created_at), 'MMM dd, yyyy HH:mm')}
                          </span>
                        </div>
                        <p className="text-sm">{notification.message}</p>
                        {notification.login_tracking && (
                          <div className="text-xs text-muted-foreground mt-2">
                            IP: {notification.login_tracking.ip_address} • 
                            Location: {notification.login_tracking.city || 'Unknown'}, {notification.login_tracking.country || 'Unknown'}
                          </div>
                        )}
                      </div>
                      <AlertTriangle className="h-5 w-5 text-orange-500 mt-1" />
                    </div>
                  </div>
                ))}
              </div>

              {filteredNotifications.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No security notifications found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="locations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Login Locations</CardTitle>
              <CardDescription>Geographic distribution of login attempts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Location visualization coming soon</p>
                <p className="text-xs">Will show login attempts on a world map</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
