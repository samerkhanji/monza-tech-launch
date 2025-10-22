import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Search, 
  Download, 
  Check, 
  Eye,
  Car,
  Package,
  Wrench,
  Users,
  DollarSign,
  Settings,
  Truck,
  Calendar,
  FileText,
  Zap,
  MapPin
} from 'lucide-react';
import { ComprehensiveNotificationService } from '@/services/comprehensiveNotificationService';
import { AutomatedNotificationService } from '@/services/automatedNotificationService';
import { toast } from '@/hooks/use-toast';
import '@/styles/notification-centers-fix.css';

interface AutomatedNotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

const AutomatedNotificationCenter: React.FC<AutomatedNotificationCenterProps> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
      // Refresh notifications every 30 seconds
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const loadNotifications = () => {
    try {
      const allNotifications = ComprehensiveNotificationService.getAllNotifications();
      setNotifications(allNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const handleMarkAsRead = (id: string) => {
    ComprehensiveNotificationService.markAsRead(id);
    loadNotifications();
    toast({
      title: "Notification Marked as Read",
      description: "The notification has been marked as read.",
    });
  };

  const handleMarkAllAsRead = () => {
    ComprehensiveNotificationService.markAllAsRead();
    loadNotifications();
    toast({
      title: "All Notifications Marked as Read",
      description: "All notifications have been marked as read.",
    });
  };

  const handleAcknowledge = (id: string) => {
    ComprehensiveNotificationService.acknowledgeNotification(id, 'Current User');
    loadNotifications();
    toast({
      title: "Notification Acknowledged",
      description: "The notification has been acknowledged.",
    });
  };

  const handleResolve = (id: string) => {
    ComprehensiveNotificationService.resolveNotification(id, 'Current User', ['Automatically resolved']);
    loadNotifications();
    toast({
      title: "Notification Resolved",
      description: "The notification has been resolved.",
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'garage': return <Wrench className="w-4 h-4" />;
      case 'cars': return <Car className="w-4 h-4" />;
      case 'inventory': return <Package className="w-4 h-4" />;
      case 'financial': return <DollarSign className="w-4 h-4" />;
      case 'system': return <Settings className="w-4 h-4" />;
      case 'schedule': return <Clock className="w-4 h-4" />;
      case 'shipment': return <Truck className="w-4 h-4" />;
      case 'customer': return <Users className="w-4 h-4" />;
      case 'workflow': return <Zap className="w-4 h-4" />;
      case 'efficiency': return <CheckCircle className="w-4 h-4" />;
      case 'error': return <AlertTriangle className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-red-100 text-red-800';
      case 'acknowledged': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'escalated': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredNotifications = notifications.filter(n => {
    const matchesSearch = 
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTab = activeTab === 'all' || 
      (activeTab === 'unread' && !n.read) ||
      (activeTab === 'critical' && n.severity === 'critical') ||
      (activeTab === 'garage' && n.category === 'garage') ||
      (activeTab === 'inventory' && n.category === 'inventory') ||
      (activeTab === 'cars' && n.category === 'cars');

    const matchesSeverity = filterSeverity === 'all' || n.severity === filterSeverity;
    const matchesCategory = filterCategory === 'all' || n.category === filterCategory;

    return matchesSearch && matchesTab && matchesSeverity && matchesCategory;
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const criticalCount = notifications.filter(n => n.severity === 'critical').length;
  const garageCount = notifications.filter(n => n.category === 'garage').length;
  const inventoryCount = notifications.filter(n => n.category === 'inventory').length;
  const carsCount = notifications.filter(n => n.category === 'cars').length;

  const exportNotifications = () => {
    const data = filteredNotifications.map(n => ({
      title: n.title,
      description: n.description,
      category: n.category,
      severity: n.severity,
      location: n.location,
      timestamp: n.timestamp,
      status: n.status,
      read: n.read
    }));

    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).map(v => `"${v}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notifications-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Notifications Exported",
      description: "Notification data has been exported to CSV.",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden automated-notification-dialog notification-dialog-final-fix" style={{backgroundColor: '#ffffff', zIndex: 99999}}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Automated Notification Center
            <Badge variant="secondary" className="ml-2">
              {unreadCount} unread
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col h-full">
          {/* Search and Filters */}
          <div className="notification-filters">
            <div className="notification-search">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="notification-actions">
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Categories</option>
                <option value="garage">Garage</option>
                <option value="cars">Cars</option>
                <option value="inventory">Inventory</option>
                <option value="financial">Financial</option>
                <option value="system">System</option>
              </select>
              <Button onClick={handleMarkAllAsRead} variant="outline" size="sm" className="notification-mark-all-read">
                <Check className="w-4 h-4 mr-2" />
                Mark All Read
              </Button>
              <Button onClick={exportNotifications} variant="outline" size="sm" className="notification-button">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="all" className="flex items-center gap-2">
                All
                <Badge variant="secondary" className="text-xs">
                  {notifications.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="unread" className="flex items-center gap-2">
                Unread
                <Badge variant="secondary" className="text-xs">
                  {unreadCount}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="critical" className="flex items-center gap-2">
                Critical
                <Badge variant="destructive" className="text-xs">
                  {criticalCount}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="garage" className="flex items-center gap-2">
                <Wrench className="w-3 h-3" />
                Garage
                <Badge variant="secondary" className="text-xs">
                  {garageCount}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="inventory" className="flex items-center gap-2">
                <Package className="w-3 h-3" />
                Inventory
                <Badge variant="secondary" className="text-xs">
                  {inventoryCount}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="cars" className="flex items-center gap-2">
                <Car className="w-3 h-3" />
                Cars
                <Badge variant="secondary" className="text-xs">
                  {carsCount}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="flex-1 overflow-y-auto">
              <div className="space-y-4">
                {filteredNotifications.length === 0 ? (
                  <Card>
                    <CardContent className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No notifications found</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  filteredNotifications.map((notification) => (
                    <Card key={notification.id} className={`${!notification.read ? 'border-l-4 border-l-blue-500' : ''}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            {getCategoryIcon(notification.category)}
                            <div className="flex-1">
                              <CardTitle className="text-lg flex items-center gap-2">
                                {notification.title}
                                {!notification.read && (
                                  <Badge variant="default" className="text-xs">
                                    New
                                  </Badge>
                                )}
                              </CardTitle>
                              <p className="text-gray-600 mt-1">{notification.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getSeverityColor(notification.severity)}>
                              {notification.severity}
                            </Badge>
                            <Badge className={getStatusColor(notification.status)}>
                              {notification.status}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {new Date(notification.timestamp).toLocaleString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {notification.location}
                            </div>
                            {notification.estimatedImpact && (
                              <div className="flex items-center gap-1">
                                <DollarSign className="w-4 h-4" />
                                ${notification.estimatedImpact.financial}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {!notification.read && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleMarkAsRead(notification.id)}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                Mark Read
                              </Button>
                            )}
                            {notification.status === 'active' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAcknowledge(notification.id)}
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Acknowledge
                              </Button>
                            )}
                            {notification.status !== 'resolved' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleResolve(notification.id)}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Resolve
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AutomatedNotificationCenter; 