import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Bell, CheckCircle, XCircle, Clock, User, MapPin, Monitor, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { isOwner } from '@/config/networkConfig';
import AccessNotificationService, { AccessRequest, AccessNotification } from '@/services/accessNotificationService';

interface OwnerNotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OwnerNotificationPanel: React.FC<OwnerNotificationPanelProps> = ({
  isOpen,
  onClose
}) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AccessNotification[]>([]);
  const [pendingRequests, setPendingRequests] = useState<AccessRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null);
  const [approvalReason, setApprovalReason] = useState('');
  const [denialReason, setDenialReason] = useState('');

  const notificationService = AccessNotificationService.getInstance();

  // Check if current user is owner
  const isUserOwner = user ? isOwner(user.role) : false;

  useEffect(() => {
    if (isOpen && isUserOwner) {
      loadNotifications();
    }
  }, [isOpen, isUserOwner]);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const [notifs, requests] = await Promise.all([
        notificationService.getOwnerNotifications(),
        notificationService.getPendingAccessRequests()
      ]);
      
      setNotifications(notifs);
      setPendingRequests(requests);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      toast({
        title: "Error",
        description: "Failed to load notifications",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveRequest = async (request: AccessRequest) => {
    if (!user) return;

    try {
      const result = await notificationService.approveAccessRequest(
        request.id,
        user.email,
        approvalReason || 'Approved by owner'
      );

      if (result.success) {
        toast({
          title: "✅ Request Approved",
          description: `Access granted to ${request.userName}`,
          variant: "default",
        });
        setApprovalReason('');
        setSelectedRequest(null);
        loadNotifications();
      } else {
        toast({
          title: "❌ Approval Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error approving request:', error);
      toast({
        title: "Error",
        description: "Failed to approve request",
        variant: "destructive",
      });
    }
  };

  const handleDenyRequest = async (request: AccessRequest) => {
    if (!user || !denialReason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for denial",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await notificationService.denyAccessRequest(
        request.id,
        user.email,
        denialReason
      );

      if (result.success) {
        toast({
          title: "❌ Request Denied",
          description: `Access denied to ${request.userName}`,
          variant: "default",
        });
        setDenialReason('');
        setSelectedRequest(null);
        loadNotifications();
      } else {
        toast({
          title: "❌ Denial Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error denying request:', error);
      toast({
        title: "Error",
        description: "Failed to deny request",
        variant: "destructive",
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'approved': return 'bg-green-100 text-green-800 border-green-300';
      case 'denied': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (!isUserOwner) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Access Request Notifications
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Pending Requests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Pending Access Requests ({pendingRequests.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-muted-foreground mt-2">Loading requests...</p>
                </div>
              ) : pendingRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No pending access requests</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingRequests.map((request) => (
                    <Card key={request.id} className="border-l-4 border-l-orange-500">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <User className="h-4 w-4" />
                              <span className="font-medium">{request.userName}</span>
                              <Badge variant="outline">{request.userRole}</Badge>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                              <div>
                                <p><strong>Email:</strong> {request.userEmail}</p>
                                <p><strong>IP Address:</strong> {request.ipAddress}</p>
                                <p><strong>Network:</strong> {request.networkRange}</p>
                              </div>
                              <div>
                                <p><strong>Requested:</strong> {new Date(request.requestTime).toLocaleString()}</p>
                                <p><strong>Device:</strong> {request.deviceInfo.platform}</p>
                                {request.deviceInfo.location && (
                                  <p><strong>Location:</strong> {request.deviceInfo.location}</p>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-2 ml-4">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  size="sm" 
                                  onClick={() => setSelectedRequest(request)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Approve Access Request</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <p>Are you sure you want to approve access for <strong>{request.userName}</strong>?</p>
                                  <div>
                                    <label className="text-sm font-medium">Reason (optional):</label>
                                    <Textarea
                                      value={approvalReason}
                                      onChange={(e) => setApprovalReason(e.target.value)}
                                      placeholder="Enter approval reason..."
                                      className="mt-1"
                                    />
                                  </div>
                                  <div className="flex gap-2 justify-end">
                                    <Button variant="outline" onClick={() => setSelectedRequest(null)}>
                                      Cancel
                                    </Button>
                                    <Button 
                                      onClick={() => handleApproveRequest(request)}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      Approve Access
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                            
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => setSelectedRequest(request)}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Deny
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Deny Access Request</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <p>Are you sure you want to deny access for <strong>{request.userName}</strong>?</p>
                                  <div>
                                    <label className="text-sm font-medium">Reason (required):</label>
                                    <Textarea
                                      value={denialReason}
                                      onChange={(e) => setDenialReason(e.target.value)}
                                      placeholder="Enter denial reason..."
                                      className="mt-1"
                                      required
                                    />
                                  </div>
                                  <div className="flex gap-2 justify-end">
                                    <Button variant="outline" onClick={() => setSelectedRequest(null)}>
                                      Cancel
                                    </Button>
                                    <Button 
                                      onClick={() => handleDenyRequest(request)}
                                      variant="destructive"
                                      disabled={!denialReason.trim()}
                                    >
                                      Deny Access
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Recent Notifications ({notifications.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No notifications</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.slice(0, 10).map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`p-3 rounded-lg border ${notification.read ? 'bg-gray-50' : 'bg-blue-50'}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{notification.title}</span>
                            <Badge className={getPriorityColor(notification.priority)}>
                              {notification.priority}
                            </Badge>
                            {!notification.read && (
                              <Badge className="bg-blue-100 text-blue-800">New</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{notification.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OwnerNotificationPanel; 