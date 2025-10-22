import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Link, 
  Database, 
  Activity, 
  CheckCircle, 
  XCircle, 
  Clock, 
  RefreshCw,
  ArrowRight,
  Settings,
  BarChart3,
  Car,
  Package,
  Wrench,
  Users,
  Truck
} from 'lucide-react';
import { useTabDataLinking } from '@/hooks/useTabDataLinking';
import { TabDataLinkingStatus } from '@/components/TabDataLinkingStatus';

const DataLinkingSummaryPage: React.FC = () => {
  const { 
    tabLinks, 
    syncStatus, 
    getLinkedTabs, 
    getTabSyncStatus,
    syncDataBetweenTabs,
    autoSyncTabData,
    loadSyncStatus
  } = useTabDataLinking();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTab, setSelectedTab] = useState<string>('');

  const tabCategories = {
    'car-inventory': { name: 'Car Inventory', icon: Car, color: 'bg-blue-50 border-blue-200' },
    'showroom-floor-1': { name: 'Showroom Floor 1', icon: Car, color: 'bg-green-50 border-green-200' },
    'showroom-floor-2': { name: 'Showroom Floor 2', icon: Car, color: 'bg-green-50 border-green-200' },
    'inventory-garage': { name: 'Garage Inventory', icon: Wrench, color: 'bg-orange-50 border-orange-200' },
    'garage-schedule': { name: 'Garage Schedule', icon: Clock, color: 'bg-purple-50 border-purple-200' },
    'repair-history': { name: 'Repair History', icon: Wrench, color: 'bg-red-50 border-red-200' },
    'scan-vin': { name: 'VIN Scanner', icon: Car, color: 'bg-indigo-50 border-indigo-200' },
    'test-drive-logs': { name: 'Test Drive Logs', icon: Users, color: 'bg-pink-50 border-pink-200' },
    'test-drive-scanner': { name: 'Test Drive Scanner', icon: Users, color: 'bg-pink-50 border-pink-200' },
    'scan-part': { name: 'Part Scanner', icon: Package, color: 'bg-yellow-50 border-yellow-200' },
    'part-management': { name: 'Parts Management', icon: Package, color: 'bg-yellow-50 border-yellow-200' },
    'inventory-history': { name: 'Inventory History', icon: Database, color: 'bg-gray-50 border-gray-200' },
    'ordered-cars': { name: 'Ordered Cars', icon: Truck, color: 'bg-cyan-50 border-cyan-200' },
    'ordered-parts': { name: 'Ordered Parts', icon: Package, color: 'bg-cyan-50 border-cyan-200' },
    'shipping-eta': { name: 'Shipping ETA', icon: Truck, color: 'bg-cyan-50 border-cyan-200' }
  };

  const getStatusColor = (status: 'success' | 'error' | 'pending') => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800 border-green-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: 'success' | 'error' | 'pending') => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4" />;
      case 'error': return <XCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const handleSyncAll = async () => {
    const syncPromises = tabLinks.map(link => 
      syncDataBetweenTabs(link.sourceTab, link.targetTab, link.dataType, {})
    );
    
    await Promise.all(syncPromises);
    loadSyncStatus();
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Link className="h-8 w-8 text-blue-600" />
            Data Linking Summary
          </h1>
          <p className="text-gray-600 mt-2">
            Monitor and manage data synchronization across all application tabs
          </p>
        </div>
        <Button onClick={handleSyncAll} className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Sync All Tabs
        </Button>
      </div>

      {/* Overview Status */}
      <TabDataLinkingStatus showDetails={true} />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tabs">Tab Details</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Tab Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(tabCategories).map(([tabKey, config]) => {
              const IconComponent = config.icon;
              const linkedTabs = getLinkedTabs(tabKey);
              const tabStatus = getTabSyncStatus(tabKey);
              
              return (
                <Card 
                  key={tabKey} 
                  className={`${config.color} cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1`}
                  onClick={() => setSelectedTab(tabKey)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <IconComponent className="h-4 w-4" />
                      {config.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span>Linked Tabs:</span>
                        <Badge variant="outline">{linkedTabs.length}</Badge>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>Sync Status:</span>
                        <div className="flex gap-1">
                          <Badge variant="outline" className="bg-green-100 text-green-800">
                            {tabStatus.successful}
                          </Badge>
                          <Badge variant="outline" className="bg-red-100 text-red-800">
                            {tabStatus.failed}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="tabs" className="space-y-6">
          {selectedTab && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {tabCategories[selectedTab as keyof typeof tabCategories]?.icon({ className: "h-5 w-5" })}
                    {tabCategories[selectedTab as keyof typeof tabCategories]?.name} - Data Links
                  </CardTitle>
                  <CardDescription>
                    Shows all data connections for this tab
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {getLinkedTabs(selectedTab).map((link, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(link.syncStatus)}
                          <div>
                            <div className="font-medium">
                              {link.sourceTab === selectedTab ? link.targetTab : link.sourceTab}
                            </div>
                            <div className="text-sm text-gray-500">
                              {link.dataType} • {link.syncDirection}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={getStatusColor(link.syncStatus)}>
                            {link.syncStatus}
                          </Badge>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => syncDataBetweenTabs(link.sourceTab, link.targetTab, link.dataType, {})}
                          >
                            <RefreshCw className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          {!selectedTab && (
            <div className="text-center py-8 text-gray-500">
              Select a tab from the overview to see detailed information
            </div>
          )}
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Sync Activity
              </CardTitle>
              <CardDescription>
                Latest data synchronization activities across all tabs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {syncStatus.recentActivity.map((link, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(link.syncStatus)}
                      <div>
                        <div className="font-medium">
                          {link.sourceTab} → {link.targetTab}
                        </div>
                        <div className="text-sm text-gray-500">
                          {link.dataType} • {new Date(link.lastSync).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className={getStatusColor(link.syncStatus)}>
                      {link.syncStatus}
                    </Badge>
                  </div>
                ))}
                
                {syncStatus.recentActivity.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No recent sync activity
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Data Linking Settings
              </CardTitle>
              <CardDescription>
                Configure data synchronization preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Auto-sync on data changes</div>
                    <div className="text-sm text-gray-500">Automatically sync data when changes are detected</div>
                  </div>
                  <Badge variant="outline" className="bg-green-100 text-green-800">
                    Enabled
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Sync interval</div>
                    <div className="text-sm text-gray-500">How often to check for data changes</div>
                  </div>
                  <Badge variant="outline">5 seconds</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Error notifications</div>
                    <div className="text-sm text-gray-500">Show notifications for sync errors</div>
                  </div>
                  <Badge variant="outline" className="bg-green-100 text-green-800">
                    Enabled
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DataLinkingSummaryPage; 