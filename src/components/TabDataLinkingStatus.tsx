// Tab Data Linking Status Component
// Shows the status of data synchronization between tabs

import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  RefreshCw, 
  Link, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  ArrowRight,
  Database,
  Activity
} from 'lucide-react';
import { useTabDataLinking } from '@/hooks/useTabDataLinking';

interface TabDataLinkingStatusProps {
  className?: string;
  showDetails?: boolean;
  onRefresh?: () => void;
}

export const TabDataLinkingStatus: React.FC<TabDataLinkingStatusProps> = ({
  className = '',
  showDetails = true,
  onRefresh
}) => {
  const { 
    syncStatus, 
    tabLinks, 
    loadSyncStatus, 
    isInitialized 
  } = useTabDataLinking();
  
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadSyncStatus();
    onRefresh?.();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const getSyncPercentage = () => {
    if (syncStatus.totalLinks === 0) return 0;
    return Math.round((syncStatus.successfulSyncs / syncStatus.totalLinks) * 100);
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
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  if (!isInitialized) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Tab Data Linking
          </CardTitle>
          <CardDescription>
            Initializing data synchronization between tabs...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Link className="h-5 w-5" />
              Tab Data Linking
            </CardTitle>
            <CardDescription>
              Data synchronization status across all tabs
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Overall Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Overall Sync Status</span>
            <Badge variant="outline" className={getStatusColor('success')}>
              {getSyncPercentage()}% Complete
            </Badge>
          </div>
          <Progress value={getSyncPercentage()} className="h-2" />
        </div>

        {/* Sync Statistics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {syncStatus.successfulSyncs}
            </div>
            <div className="text-xs text-gray-500">Successful</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {syncStatus.failedSyncs}
            </div>
            <div className="text-xs text-gray-500">Failed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {syncStatus.pendingSyncs}
            </div>
            <div className="text-xs text-gray-500">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {syncStatus.totalLinks}
            </div>
            <div className="text-xs text-gray-500">Total Links</div>
          </div>
        </div>

        {/* Recent Activity */}
        {showDetails && syncStatus.recentActivity.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span className="text-sm font-medium">Recent Activity</span>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {syncStatus.recentActivity.map((link, index) => (
                <div
                  key={`${link.sourceTab}-${link.targetTab}-${link.dataType}-${index}`}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    {getStatusIcon(link.syncStatus)}
                    <div className="text-xs">
                      <div className="font-medium">{link.sourceTab}</div>
                      <div className="text-gray-500">{link.dataType}</div>
                    </div>
                  </div>
                  <ArrowRight className="h-3 w-3 text-gray-400" />
                  <div className="text-xs">
                    <div className="font-medium">{link.targetTab}</div>
                    <div className="text-gray-500">
                      {new Date(link.lastSync).toLocaleTimeString()}
                    </div>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={getStatusColor(link.syncStatus)}
                  >
                    {link.syncStatus}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Messages */}
        {showDetails && syncStatus.recentActivity.some(link => link.syncStatus === 'error') && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-600">Sync Errors</span>
            </div>
            <div className="space-y-1">
              {syncStatus.recentActivity
                .filter(link => link.syncStatus === 'error')
                .slice(0, 3)
                .map((link, index) => (
                  <div key={index} className="text-xs text-red-600 bg-red-50 p-2 rounded">
                    {link.sourceTab} → {link.targetTab}: {link.errorMessage || 'Sync failed'}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1">
            <Link className="h-4 w-4 mr-2" />
            View All Links
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            <Database className="h-4 w-4 mr-2" />
            Sync All
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}; 