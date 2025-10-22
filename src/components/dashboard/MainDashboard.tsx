// =============================================
// MAIN DASHBOARD COMPONENT
// =============================================
// Integrates all location views and schedule

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Car, Calendar, Wrench, MessageSquare, DollarSign, Users, BarChart3, Settings } from 'lucide-react';
import { LocationView } from '@/components/views/LocationView';
import { ScheduleView } from '@/components/views/ScheduleView';
import { getCarsCountByLocation, loadAuditLog, type Car } from '@/lib/supabase-patterns';
import { getCurrentUserProfileWithEmail, getUserStats, type ProfileWithEmail } from '@/lib/profiles-patterns';
import { ProfileSettings } from '@/components/forms/ProfileSettings';
import { toast } from 'sonner';

interface DashboardStats {
  totalCars: number;
  floor1: number;
  floor2: number;
  garage: number;
  inventory: number;
  ordered: number;
  recentActivity: any[];
}

interface UserStats {
  total: number;
  owners: number;
  garage_managers: number;
  sales: number;
  assistants: number;
  technicians: number;
}

export function MainDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCars: 0,
    floor1: 0,
    floor2: 0,
    garage: 0,
    inventory: 0,
    ordered: 0,
    recentActivity: [],
  });
  const [userStats, setUserStats] = useState<UserStats>({
    total: 0,
    owners: 0,
    garage_managers: 0,
    sales: 0,
    assistants: 0,
    technicians: 0,
  });
  const [currentUser, setCurrentUser] = useState<ProfileWithEmail | null>(null);
  const [profileSettingsOpen, setProfileSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load dashboard stats
  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    setLoading(true);
    try {
      const [locationCounts, recentActivity, userData, userStatsData] = await Promise.all([
        getCarsCountByLocation(),
        loadAuditLog(undefined, undefined, 10), // Last 10 activities
        getCurrentUserProfileWithEmail(),
        getUserStats()
      ]);

      const totalCars = Object.values(locationCounts).reduce((sum, count) => sum + count, 0);
      
      setStats({
        totalCars,
        floor1: locationCounts['FLOOR_1'] || 0,
        floor2: locationCounts['FLOOR_2'] || 0,
        garage: locationCounts['GARAGE'] || 0,
        inventory: locationCounts['INVENTORY'] || 0,
        ordered: locationCounts['ORDERED'] || 0,
        recentActivity: recentActivity || [],
      });
      
      setCurrentUser(userData);
      setUserStats(userStatsData);
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      toast.error('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'INSERT': return '➕';
      case 'UPDATE': return '✏️';
      case 'DELETE': return '🗑️';
      default: return '📝';
    }
  };

  const getActivityColor = (action: string) => {
    switch (action) {
      case 'INSERT': return 'text-green-600';
      case 'UPDATE': return 'text-blue-600';
      case 'DELETE': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Monza TECH Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {currentUser?.full_name || currentUser?.email || 'User'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => setProfileSettingsOpen(true)} variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Profile
          </Button>
          <Button onClick={loadDashboardStats} variant="outline">
            Refresh
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Car className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Cars</p>
                <p className="text-2xl font-bold">{stats.totalCars}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Showroom</p>
                <p className="text-2xl font-bold">{stats.floor1 + stats.floor2}</p>
                <p className="text-xs text-muted-foreground">Floor 1: {stats.floor1}, Floor 2: {stats.floor2}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Wrench className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Garage</p>
                <p className="text-2xl font-bold">{stats.garage}</p>
                <p className="text-xs text-muted-foreground">Under maintenance</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Inventory</p>
                <p className="text-2xl font-bold">{stats.inventory}</p>
                <p className="text-xs text-muted-foreground">Available stock</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="floor1" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="floor1" className="flex items-center">
            <Car className="h-4 w-4 mr-2" />
            Floor 1
          </TabsTrigger>
          <TabsTrigger value="floor2" className="flex items-center">
            <Car className="h-4 w-4 mr-2" />
            Floor 2
          </TabsTrigger>
          <TabsTrigger value="garage" className="flex items-center">
            <Wrench className="h-4 w-4 mr-2" />
            Garage
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center">
            <BarChart3 className="h-4 w-4 mr-2" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="ordered" className="flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            Ordered
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            Schedule
          </TabsTrigger>
        </TabsList>

        <TabsContent value="floor1">
          <LocationView
            location="FLOOR_1"
            title="Floor 1 Showroom"
            description="Main showroom floor - premium vehicles on display"
          />
        </TabsContent>

        <TabsContent value="floor2">
          <LocationView
            location="FLOOR_2"
            title="Floor 2 Showroom"
            description="Secondary showroom floor - additional vehicle displays"
          />
        </TabsContent>

        <TabsContent value="garage">
          <LocationView
            location="GARAGE"
            title="Service Garage"
            description="Vehicles under maintenance, repair, or preparation"
          />
        </TabsContent>

        <TabsContent value="inventory">
          <LocationView
            location="INVENTORY"
            title="Inventory Storage"
            description="General storage for available vehicles"
          />
        </TabsContent>

        <TabsContent value="ordered">
          <LocationView
            location="ORDERED"
            title="Ordered Vehicles"
            description="Vehicles on order or in transit"
          />
        </TabsContent>

        <TabsContent value="schedule">
          <ScheduleView />
        </TabsContent>
      </Tabs>

      {/* Recent Activity Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* This space can be used for additional content like charts, reports, etc. */}
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="h-5 w-5 mr-2" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent activity</p>
              ) : (
                stats.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <span className="text-lg">{getActivityIcon(activity.action)}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${getActivityColor(activity.action)}`}>
                        {activity.action} {activity.table_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profile Settings Dialog */}
      <ProfileSettings
        open={profileSettingsOpen}
        onOpenChange={setProfileSettingsOpen}
        onSuccess={(profile) => {
          setCurrentUser(profile);
          setProfileSettingsOpen(false);
        }}
      />
    </div>
  );
}
