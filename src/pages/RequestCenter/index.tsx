
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  MessageCircle, 
  Plus, 
  Filter, 
  Search, 
  Bell,
  Send,
  Users,
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  Settings,
  MoreVertical
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { requestMessagingService, RequestWithMessages, CreateRequestData } from '@/services/requestMessagingService';
import RequestForm from './components/RequestForm';
import RequestList from './components/RequestList';
import MessageThread from './components/MessageThread';
import BroadcastDialog from './components/BroadcastDialog';
import NotificationCenter from './components/NotificationCenter';
import { useRequestData } from './hooks/useRequestData';

const RequestCenter: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('requests');
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [showBroadcastDialog, setShowBroadcastDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RequestWithMessages | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const {
    requests,
    isLoading,
    filters,
    setFilters,
    createRequest,
    updateRequest,
    deleteRequest,
    refreshRequests
  } = useRequestData();

  useEffect(() => {
    if (user) {
      requestMessagingService.setCurrentUser(user);
      loadNotifications();
      setupRealtimeSubscriptions();
    }
  }, [user]);

  // Handle navigation state from BroadcastDialog
  useEffect(() => {
    if (location.state) {
      const { openTab, selectedRequest: navRequest, isBroadcast } = location.state;
      
      if (openTab === 'messages' && navRequest) {
        setActiveTab('messages');
        setSelectedRequest(navRequest);
        
        if (isBroadcast) {
          toast({
            title: "Broadcast Chat Opened",
            description: "You can now discuss the broadcast with all users",
          });
        }
        
        // Clear the navigation state
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state]);

  const loadNotifications = async () => {
    try {
      const notifs = await requestMessagingService.getNotifications();
      setNotifications(notifs);
      setUnreadCount(notifs.length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const setupRealtimeSubscriptions = () => {
    // Subscribe to new notifications
    requestMessagingService.subscribeToNotifications((payload) => {
      if (payload.new && payload.new.user_id === user?.id) {
        loadNotifications();
        toast({
          title: "New notification",
          description: "You have a new request notification",
        });
      }
    });

    // Subscribe to request updates
    requestMessagingService.subscribeToRequests((payload) => {
      refreshRequests();
    });
  };

  const handleCreateRequest = async (data: CreateRequestData) => {
    try {
      await createRequest(data);
      setShowRequestForm(false);
      toast({
        title: "Request created",
        description: "Your request has been created successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create request",
        variant: "destructive",
      });
    }
  };

  const handleRequestSelect = (request: RequestWithMessages) => {
    setSelectedRequest(request);
    setActiveTab('messages');
  };

  const handleSendMessage = async (requestId: string, messageText: string, mentions?: string[]) => {
    try {
      await requestMessagingService.createMessage({
        request_id: requestId,
        message_text: messageText,
        mentions
      });
      
      // Refresh the selected request to show new message
      if (selectedRequest?.id === requestId) {
        const updatedRequest = await requestMessagingService.getRequestById(requestId);
        if (updatedRequest) {
          setSelectedRequest(updatedRequest);
        }
      }
      
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const handleMarkNotificationAsRead = async (notificationId: string) => {
    try {
      await requestMessagingService.markNotificationAsRead(notificationId);
      loadNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-orange-100 text-orange-800';
      case 'done': return 'bg-green-100 text-green-800';
      case 'pending_review': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Request & Messaging Center</h1>
          <p className="text-muted-foreground">
            Manage requests, communicate with team members, and stay updated
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Notification Bell */}
          <NotificationCenter 
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkAsRead={handleMarkNotificationAsRead}
          />
          
          {/* Broadcast Button */}
          {user?.role?.toUpperCase() === 'OWNER' && (
            <Button
              onClick={() => setShowBroadcastDialog(true)}
              variant="outline"
              size="sm"
            >
              <Users className="h-4 w-4 mr-2" />
              Broadcast
            </Button>
          )}
          
          {/* New Request Button */}
          <Button onClick={() => setShowRequestForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Requests
            {requests.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {requests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Messages
            {selectedRequest && (
              <Badge variant="secondary" className="ml-1">
                {selectedRequest.messages?.length || 0}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="inbox" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            My Inbox
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-4">
          <RequestList
            requests={requests}
            isLoading={isLoading}
            filters={filters}
            onFiltersChange={setFilters}
            onRequestSelect={handleRequestSelect}
            onRequestUpdate={updateRequest}
            onRequestDelete={deleteRequest}
            getPriorityColor={getPriorityColor}
            getStatusColor={getStatusColor}
          />
        </TabsContent>

        <TabsContent value="messages" className="space-y-4">
          {selectedRequest ? (
            <MessageThread
              request={selectedRequest}
              onSendMessage={handleSendMessage}
              onRequestUpdate={updateRequest}
            />
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Request Selected</h3>
                  <p className="text-muted-foreground">
                    Select a request from the Requests tab to view its messages
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="inbox" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                My Inbox
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Assigned to me */}
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    Assigned to Me
                  </h4>
                  <div className="space-y-2">
                    {requests
                      .filter(r => r.assigned_to === user?.id)
                      .map(request => (
                        <div
                          key={request.id}
                          className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                          onClick={() => handleRequestSelect(request)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="font-medium">{request.title}</h5>
                              <p className="text-sm text-muted-foreground">
                                Created by {request.created_by_user?.full_name}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Badge className={getPriorityColor(request.priority)}>
                                {request.priority}
                              </Badge>
                              <Badge className={getStatusColor(request.status)}>
                                {request.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    {requests.filter(r => r.assigned_to === user?.id).length === 0 && (
                      <p className="text-muted-foreground text-sm">No requests assigned to you</p>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Created by me */}
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-green-600" />
                    Created by Me
                  </h4>
                  <div className="space-y-2">
                    {requests
                      .filter(r => r.created_by === user?.id)
                      .map(request => (
                        <div
                          key={request.id}
                          className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                          onClick={() => handleRequestSelect(request)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="font-medium">{request.title}</h5>
                              <p className="text-sm text-muted-foreground">
                                Assigned to {request.assigned_to_user?.full_name || 'Unassigned'}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Badge className={getPriorityColor(request.priority)}>
                                {request.priority}
                              </Badge>
                              <Badge className={getStatusColor(request.status)}>
                                {request.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    {requests.filter(r => r.created_by === user?.id).length === 0 && (
                      <p className="text-muted-foreground text-sm">No requests created by you</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <RequestForm
        open={showRequestForm}
        onOpenChange={setShowRequestForm}
        onSubmit={handleCreateRequest}
      />

      <BroadcastDialog
        open={showBroadcastDialog}
        onOpenChange={setShowBroadcastDialog}
      />
    </div>
  );
};

export default RequestCenter;
