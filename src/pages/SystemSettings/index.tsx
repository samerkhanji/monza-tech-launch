import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Settings, 
  Shield, 
  Database, 
  Bell, 
  Users, 
  Lock, 
  Globe, 
  Monitor,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Wifi
} from 'lucide-react';
import { NetworkAccessManager } from '@/components/NetworkAccessManager';
import OwnerTrustedDevicesManager from '@/components/OwnerTrustedDevicesManager';
import { safeParseInt } from '@/utils/errorHandling';

interface SystemSettings {
  general: {
    companyName: string;
    timezone: string;
    language: string;
    dateFormat: string;
    currency: string;
  };
  security: {
    sessionTimeout: number;
    passwordMinLength: number;
    requireTwoFactor: boolean;
    auditLogRetention: number;
    ipWhitelisting: boolean;
  };
  notifications: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    systemAlerts: boolean;
    maintenanceAlerts: boolean;
  };
  backup: {
    autoBackup: boolean;
    backupFrequency: string;
    backupRetention: number;
    cloudBackup: boolean;
  };
  performance: {
    cacheEnabled: boolean;
    compressionEnabled: boolean;
    maxConcurrentUsers: number;
    maintenanceMode: boolean;
  };
}

const SystemSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<SystemSettings>({
    general: {
      companyName: 'Monza S.A.L.',
      timezone: 'Asia/Beirut',
      language: 'en',
      dateFormat: 'DD/MM/YYYY',
      currency: 'USD'
    },
    security: {
      sessionTimeout: 480, // 8 hours in minutes
      passwordMinLength: 8,
      requireTwoFactor: false,
      auditLogRetention: 365, // days
      ipWhitelisting: false
    },
    notifications: {
      emailNotifications: true,
      pushNotifications: true,
      systemAlerts: true,
      maintenanceAlerts: true
    },
    backup: {
      autoBackup: true,
      backupFrequency: 'daily',
      backupRetention: 30, // days
      cloudBackup: true
    },
    performance: {
      cacheEnabled: true,
      compressionEnabled: true,
      maxConcurrentUsers: 50,
      maintenanceMode: false
    }
  });

  const [lastBackup, setLastBackup] = useState<Date>(new Date());
  const [systemStatus, setSystemStatus] = useState({
    database: 'healthy',
    cache: 'healthy', 
    storage: 'healthy',
    api: 'healthy'
  });

  // Restrict access to owners only (case-insensitive check)
  const isOwner = user?.role?.toUpperCase() === 'OWNER';
  if (!user || !isOwner) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-600 mb-2">Access Restricted</h2>
          <p className="text-gray-500">System settings are only available to system owners.</p>
          <p className="text-sm text-gray-400 mt-2">
            Current user: {user?.name || 'Unknown'} ({user?.role || 'No role'})
          </p>
        </div>
      </div>
    );
  }

  const updateSettings = (category: keyof SystemSettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const handleSaveSettings = () => {
    // Save settings to localStorage or API
    localStorage.setItem('systemSettings', JSON.stringify(settings));
    toast({
      title: 'Settings Saved',
      description: 'System settings have been updated successfully.',
    });
  };

  const handleTestBackup = () => {
    toast({
      title: 'Backup Started',
      description: 'Manual backup has been initiated.',
    });
    setLastBackup(new Date());
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
            <p className="text-muted-foreground">
              Configure system-wide settings and preferences
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleTestBackup}>
            <Database className="mr-2 h-4 w-4" />
            Test Backup
          </Button>
          <Button onClick={handleSaveSettings}>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* System Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(systemStatus).map(([service, status]) => (
              <div key={service} className="flex items-center gap-2 p-3 border rounded-lg">
                {getStatusIcon(status)}
                <div>
                  <div className="font-medium capitalize">{service}</div>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getStatusColor(status)}`}
                  >
                    {status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6 h-auto p-1">
          <TabsTrigger value="general" className="text-xs px-2 py-2">General</TabsTrigger>
          <TabsTrigger value="security" className="text-xs px-2 py-2">Security</TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs px-2 py-2">Notifications</TabsTrigger>
          <TabsTrigger value="backup" className="text-xs px-2 py-2">Backup</TabsTrigger>
          <TabsTrigger value="performance" className="text-xs px-2 py-2">Performance</TabsTrigger>
          <TabsTrigger value="network-access" className="text-xs px-1 py-2">Network Access</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={settings.general.companyName}
                    onChange={(e) => updateSettings('general', 'companyName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <select
                    id="timezone"
                    className="w-full border rounded px-3 py-2"
                    value={settings.general.timezone}
                    onChange={(e) => updateSettings('general', 'timezone', e.target.value)}
                  >
                    <option value="Asia/Beirut">Asia/Beirut (UTC+2)</option>
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="Europe/London">GMT</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <select
                    id="dateFormat"
                    className="w-full border rounded px-3 py-2"
                    value={settings.general.dateFormat}
                    onChange={(e) => updateSettings('general', 'dateFormat', e.target.value)}
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Default Currency</Label>
                  <select
                    id="currency"
                    className="w-full border rounded px-3 py-2"
                    value={settings.general.currency}
                    onChange={(e) => updateSettings('general', 'currency', e.target.value)}
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="LBP">LBP (ل.ل)</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    min="5"
                    max="60"
                    value={settings.security.sessionTimeout}
                    onChange={(e) => updateSettings('security', 'sessionTimeout', safeParseInt(e.target.value, 30))}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
                  <Input
                    id="passwordMinLength"
                    type="number"
                    min="6"
                    max="20"
                    value={settings.security.passwordMinLength}
                    onChange={(e) => updateSettings('security', 'passwordMinLength', safeParseInt(e.target.value, 8))}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="auditLogRetention">Audit Log Retention (days)</Label>
                  <Input
                    id="auditLogRetention"
                    type="number"
                    min="7"
                    max="365"
                    value={settings.security.auditLogRetention}
                    onChange={(e) => updateSettings('security', 'auditLogRetention', safeParseInt(e.target.value, 30))}
                    className="w-full"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="requireTwoFactor">Require Two-Factor Authentication</Label>
                  <Switch
                    id="requireTwoFactor"
                    checked={settings.security.requireTwoFactor}
                    onCheckedChange={(checked) => updateSettings('security', 'requireTwoFactor', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="ipWhitelisting">Enable IP Whitelisting</Label>
                  <Switch
                    id="ipWhitelisting"
                    checked={settings.security.ipWhitelisting}
                    onCheckedChange={(checked) => updateSettings('security', 'ipWhitelisting', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="emailNotifications">Email Notifications</Label>
                  <Switch
                    id="emailNotifications"
                    checked={settings.notifications.emailNotifications}
                    onCheckedChange={(checked) => updateSettings('notifications', 'emailNotifications', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="pushNotifications">Push Notifications</Label>
                  <Switch
                    id="pushNotifications"
                    checked={settings.notifications.pushNotifications}
                    onCheckedChange={(checked) => updateSettings('notifications', 'pushNotifications', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="systemAlerts">System Alerts</Label>
                  <Switch
                    id="systemAlerts"
                    checked={settings.notifications.systemAlerts}
                    onCheckedChange={(checked) => updateSettings('notifications', 'systemAlerts', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="maintenanceAlerts">Maintenance Alerts</Label>
                  <Switch
                    id="maintenanceAlerts"
                    checked={settings.notifications.maintenanceAlerts}
                    onCheckedChange={(checked) => updateSettings('notifications', 'maintenanceAlerts', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Backup Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="backupFrequency">Backup Frequency</Label>
                  <select
                    id="backupFrequency"
                    className="w-full border rounded px-3 py-2"
                    value={settings.backup.backupFrequency}
                    onChange={(e) => updateSettings('backup', 'backupFrequency', e.target.value)}
                  >
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="backupRetention">Backup Retention (days)</Label>
                  <Input
                    id="backupRetention"
                    type="number"
                    min="1"
                    max="365"
                    value={settings.backup.backupRetention}
                    onChange={(e) => updateSettings('backup', 'backupRetention', safeParseInt(e.target.value, 30))}
                    className="w-full"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="autoBackup">Enable Automatic Backup</Label>
                  <Switch
                    id="autoBackup"
                    checked={settings.backup.autoBackup}
                    onCheckedChange={(checked) => updateSettings('backup', 'autoBackup', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="cloudBackup">Cloud Backup</Label>
                  <Switch
                    id="cloudBackup"
                    checked={settings.backup.cloudBackup}
                    onCheckedChange={(checked) => updateSettings('backup', 'cloudBackup', checked)}
                  />
                </div>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Last backup: {lastBackup.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Performance Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxConcurrentUsers">Max Concurrent Users</Label>
                  <Input
                    id="maxConcurrentUsers"
                    type="number"
                    min="1"
                    max="100"
                    value={settings.performance.maxConcurrentUsers}
                    onChange={(e) => updateSettings('performance', 'maxConcurrentUsers', safeParseInt(e.target.value, 10))}
                    className="w-full"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="cacheEnabled">Enable Caching</Label>
                  <Switch
                    id="cacheEnabled"
                    checked={settings.performance.cacheEnabled}
                    onCheckedChange={(checked) => updateSettings('performance', 'cacheEnabled', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="compressionEnabled">Enable Compression</Label>
                  <Switch
                    id="compressionEnabled"
                    checked={settings.performance.compressionEnabled}
                    onCheckedChange={(checked) => updateSettings('performance', 'compressionEnabled', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                  <Switch
                    id="maintenanceMode"
                    checked={settings.performance.maintenanceMode}
                    onCheckedChange={(checked) => updateSettings('performance', 'maintenanceMode', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="network-access" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5" />
                Network Access
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <NetworkAccessManager />
              <OwnerTrustedDevicesManager />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SystemSettingsPage; 