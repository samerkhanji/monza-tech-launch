import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Crown, 
  Users, 
  MapPin, 
  Clock, 
  Globe, 
  Shield,
  AlertTriangle,
  Calendar,
  Monitor,
  Smartphone,
  RefreshCw,
  Download,
  Eye,
  TrendingUp,
  Activity
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface OwnerActivitySummary {
  total_logins: number;
  unique_owners: number;
  unique_locations: number;
  unique_ips: number;
  international_logins: number;
  weekend_logins: number;
  after_hours_logins: number;
  failed_attempts: number;
}

interface UserActivity {
  id: number;
  email: string;
  user_name?: string;
  role: string;
  login_time: string;
  ip_address: string;
  country?: string;
  region?: string;
  city?: string;
  device_type?: string;
  browser?: string;
  os?: string;
  login_status: string;
  location_category: string;
  time_category: string;
  success: boolean;
}

export default function DeveloperOverview() {
  const { user } = useAuth();
  const [ownerSummary, setOwnerSummary] = useState<OwnerActivitySummary | null>(null);
  const [allActivity, setAllActivity] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(7); // days
  const [activeTab, setActiveTab] = useState('overview');

  // Only allow main OWNER/developer to access this
  const canViewDeveloperData = user?.role?.toUpperCase() === 'OWNER';

  useEffect(() => {
    if (canViewDeveloperData) {
      loadDeveloperData();
    }
  }, [canViewDeveloperData, timeRange]);

  const loadDeveloperData = async () => {
    setLoading(true);
    try {
      // Load OWNER activity summary
      const { data: summaryData, error: summaryError } = await supabase
        .rpc('get_owner_activity_summary', { p_days: timeRange });

      if (summaryError) throw summaryError;
      setOwnerSummary(summaryData[0] || null);

      // Load all user activity
      const { data: activityData, error: activityError } = await supabase
        .from('all_user_activity')
        .select('*')
        .gte('login_time', new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000).toISOString())
        .order('login_time', { ascending: false })
        .limit(500);

      if (activityError) throw activityError;
      setAllActivity(activityData || []);

    } catch (error) {
      console.error('Error loading developer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportActivityData = () => {
    const csv = generateActivityCSV(allActivity);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `monza-user-activity-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const generateActivityCSV = (data: UserActivity[]) => {
    const headers = [
      'Date/Time', 'User', 'Role', 'Email', 'Location', 'Country', 
      'IP Address', 'Device', 'Browser', 'Status', 'Category', 'Time Category'
    ];
    
    const rows = data.map(record => [
      format(new Date(record.login_time), 'yyyy-MM-dd HH:mm:ss'),
      record.user_name || record.email.split('@')[0],
      record.role,
      record.email,
      `${record.city || 'Unknown'}, ${record.region || ''}`.replace(', ', ', ').trim(),
      record.country || 'Unknown',
      record.ip_address,
      record.device_type || 'Unknown',
      record.browser || 'Unknown',
      record.login_status,
      record.location_category,
      record.time_category
    ]);
    
    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TRACKED_UNRESTRICTED': return 'bg-blue-500 text-white';
      case 'SUSPICIOUS': return 'bg-red-500 text-white';
      case 'NEW_LOCATION': return 'bg-yellow-500 text-white';
      case 'FAILED_LOGIN': return 'bg-orange-500 text-white';
      default: return 'bg-green-500 text-white';
    }
  };

  const getLocationString = (record: UserActivity) => {
    const parts = [record.city, record.region, record.country].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Unknown Location';
  };

  if (!canViewDeveloperData) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Access Denied: This is a developer-only overview dashboard.
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
          <span className="ml-2">Loading developer overview...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Crown className="h-8 w-8 text-yellow-500" />
            Developer Overview
          </h1>
          <p className="text-muted-foreground">Complete system activity and OWNER tracking</p>
        </div>
        <div className="flex gap-2">
          <select 
            id="timeRangeFilter"
            name="timeRangeFilter"
            value={timeRange} 
            onChange={(e) => setTimeRange(Number(e.target.value))}
            className="px-3 py-2 border rounded-md"
          >
            <option value={1}>Last 24 hours</option>
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <Button onClick={loadDeveloperData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportActivityData} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* OWNER Activity Summary */}
      {ownerSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">OWNER Logins</CardTitle>
              <Crown className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ownerSummary.total_logins}</div>
              <p className="text-xs text-muted-foreground">
                {ownerSummary.unique_owners} unique OWNER{ownerSummary.unique_owners !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Locations</CardTitle>
              <MapPin className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ownerSummary.unique_locations}</div>
              <p className="text-xs text-muted-foreground">
                {ownerSummary.international_logins} international
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">After Hours</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ownerSummary.after_hours_logins}</div>
              <p className="text-xs text-muted-foreground">
                {ownerSummary.weekend_logins} weekend logins
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed Attempts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ownerSummary.failed_attempts}</div>
              <p className="text-xs text-muted-foreground">
                {ownerSummary.unique_ips} unique IPs
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">All Activity</TabsTrigger>
          <TabsTrigger value="owners">OWNER Tracking</TabsTrigger>
          <TabsTrigger value="security">Security Events</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Complete User Activity Log</CardTitle>
              <CardDescription>
                All login activity across the system (last {timeRange} days)
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
                      <TableHead>Category</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allActivity.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-mono text-sm">
                          {format(new Date(record.login_time), 'MMM dd, HH:mm')}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium flex items-center gap-1">
                              {record.role === 'OWNER' && <Crown className="h-3 w-3 text-yellow-500" />}
                              {record.user_name || record.email.split('@')[0]}
                            </div>
                            <div className="text-sm text-muted-foreground">{record.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={record.role === 'OWNER' ? 'default' : 'outline'}>
                            {record.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Globe className="h-4 w-4 mr-1" />
                            <div>
                              <div className="text-sm">{getLocationString(record)}</div>
                              <div className="text-xs text-muted-foreground">{record.location_category}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {record.device_type === 'mobile' ? 
                              <Smartphone className="h-4 w-4 mr-1" /> : 
                              <Monitor className="h-4 w-4 mr-1" />
                            }
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
                          <Badge className={getStatusColor(record.login_status)}>
                            {record.login_status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{record.time_category}</div>
                            <div className="text-xs text-muted-foreground">{record.location_category}</div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {allActivity.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No user activity found for the selected time range</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="owners" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-500" />
                OWNER Activity Tracking
              </CardTitle>
              <CardDescription>
                Unrestricted access monitoring for all OWNER users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <Eye className="h-4 w-4" />
                  <AlertDescription>
                    <strong>OWNER Policy:</strong> OWNERs can login from anywhere without restrictions, 
                    but all activity is tracked for security oversight.
                  </AlertDescription>
                </Alert>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>OWNER</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Device</TableHead>
                        <TableHead>IP Address</TableHead>
                        <TableHead>Access Pattern</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allActivity
                        .filter(record => record.role === 'OWNER')
                        .map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="font-mono text-sm">
                            {format(new Date(record.login_time), 'MMM dd, HH:mm')}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Crown className="h-4 w-4 text-yellow-500" />
                              <div>
                                <div className="font-medium">{record.user_name || record.email.split('@')[0]}</div>
                                <div className="text-sm text-muted-foreground">{record.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="text-sm">{getLocationString(record)}</div>
                              <div className="text-xs text-muted-foreground">{record.location_category}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              {record.device_type === 'mobile' ? 
                                <Smartphone className="h-4 w-4 mr-1" /> : 
                                <Monitor className="h-4 w-4 mr-1" />
                              }
                              <div>
                                <div className="text-sm">{record.device_type}</div>
                                <div className="text-xs text-muted-foreground">{record.browser}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {record.ip_address}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <Badge variant="secondary">{record.time_category}</Badge>
                              {record.location_category === 'International' && (
                                <Badge variant="outline" className="ml-1">International</Badge>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {allActivity.filter(r => r.role === 'OWNER').length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Crown className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No OWNER activity found for the selected time range</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Events</CardTitle>
              <CardDescription>
                Failed logins, suspicious activity, and security alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Security events monitoring interface</p>
                <p className="text-xs">Will show failed logins, suspicious patterns, and alerts</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Usage Analytics</CardTitle>
              <CardDescription>
                System usage patterns and trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Analytics dashboard coming soon</p>
                <p className="text-xs">Will show usage trends, popular locations, device analytics</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
