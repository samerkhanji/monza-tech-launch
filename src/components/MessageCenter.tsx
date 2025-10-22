import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { logSupabaseError } from '@/utils/errorLogger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { 
  MessageSquare, 
  Plus, 
  AlertCircle, 
  Clock, 
  User, 
  Filter,
  Send,
  Paperclip,
  Hash,
  Bell,
  Users,

  CheckCircle,
  Settings,
  Search,
  MoreVertical
} from 'lucide-react';
import '@/styles/notification-centers-fix.css';

// Import services
import { requestMessagingService, RequestWithMessages, CreateRequestData } from '@/services/requestMessagingService';
import { messagingService, Chat, Message as ChatMessage } from '@/services/messagingService';

// Import components from RequestCenter
import RequestForm from '@/pages/RequestCenter/components/RequestForm';
import RequestList from '@/pages/RequestCenter/components/RequestList';
import MessageThread from '@/pages/RequestCenter/components/MessageThread';

import NotificationCenter from '@/pages/RequestCenter/components/NotificationCenter';
import { useRequestData } from '@/pages/RequestCenter/hooks/useRequestData';

interface Message {
  id: string;
  channel_id: string;
  author_id: string;
  body: string;
  thread_root?: string;
  mentions: string[];
  attachments: any[];
  created_at: string;
  author_email?: string;
  channel_name?: string;
  reply_count?: number;
}

interface Request {
  id: string;
  title: string;
  description?: string;
  category?: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  status: 'open' | 'in_progress' | 'blocked' | 'done' | 'cancelled';
  created_by: string;
  assignee_id?: string;
  recipients: string[];
  sla_due_at?: string;
  sla_breached?: boolean;
  created_at: string;
  updated_at: string;
}

interface Channel {
  id: string;
  name: string;
  type: string;
  description?: string;
}

const authorizedUsers = [
  { id: '1', name: 'Houssam', role: 'Owner' },
  { id: '2', name: 'Samer', role: 'Owner' },
  { id: '3', name: 'Kareem', role: 'Owner' },
  { id: '4', name: 'Mark', role: 'Garage Manager' },
  { id: '5', name: 'Lara', role: 'Assistant' },
  { id: '6', name: 'Samaya', role: 'Assistant' },
  { id: '7', name: 'Khalil', role: 'Hybrid' },
  { id: '8', name: 'Tamara', role: 'Hybrid' },
  { id: '9', name: 'Elie', role: 'Hybrid' },
];

const PRIORITY_COLORS = {
  urgent: 'bg-red-100 text-red-800 border-red-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-gray-100 text-gray-800 border-gray-200'
};

const PRIORITY_LABELS = {
  urgent: 'Urgent',
  high: 'High', 
  medium: 'Medium',
  low: 'Low'
};

const MessageCenter = React.memo(() => {
  // Add error boundary state
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Error boundary effect
  useEffect(() => {
    const handleError = (error: any) => {
      console.error('MessageCenter error:', error);
      setHasError(true);
      setErrorMessage(error.message || 'An unexpected error occurred');
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  // If there's an error, show error state
  if (hasError) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Something went wrong</h2>
          <p className="text-red-700 mb-4">{errorMessage}</p>
          <button 
            onClick={() => {
              setHasError(false);
              setErrorMessage('');
              window.location.reload();
            }}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('messages');
  const [channels, setChannels] = useState<Channel[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string>('');
  const [newMessage, setNewMessage] = useState('');
  const [showCreateRequest, setShowCreateRequest] = useState(false);
  const [showStartNewChat, setShowStartNewChat] = useState(false);

  const [selectedUsersForChat, setSelectedUsersForChat] = useState<string[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<RequestWithMessages | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // Load users from Supabase
  const loadUsers = useCallback(async () => {
    if (usersLoading) return; // Prevent multiple concurrent loads
    
    try {
      setUsersLoading(true);
      
      // Try to load from user_profiles table if it exists
      const { data: userProfiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, full_name, email, avatar_url')
        .neq('id', user?.id); // Exclude current user

      if (!profilesError && userProfiles && userProfiles.length > 0) {
        const formattedUsers = userProfiles.map(profile => ({
          id: profile.id,
          name: profile.full_name || profile.email?.split('@')[0] || 'Unknown User',
          email: profile.email,
          role: 'User',
          avatar_url: profile.avatar_url
        }));
        setAvailableUsers(formattedUsers);
        console.log('Loaded users from user_profiles:', formattedUsers);
        return;
      }

      // Fallback to auth.users if user_profiles doesn't exist or is empty
      console.log('Falling back to mock users');
      
      // For now, we'll use the authorizedUsers as fallback since we can't directly query auth.users
      // In a real implementation, you'd have a backend endpoint or service function
      const fallbackUsers = authorizedUsers.filter(u => u.id !== (user?.id || '1'));
      setAvailableUsers(fallbackUsers);
      
    } catch (error) {
      logSupabaseError('load users', error, 'using authorized users');
      // Use authorizedUsers as ultimate fallback
      const fallbackUsers = authorizedUsers.filter(u => u.id !== (user?.id || '1'));
      setAvailableUsers(fallbackUsers);
    } finally {
      setUsersLoading(false);
    }
  }, [user?.id]);

  // Use RequestCenter hooks for advanced request management
  const {
    requests,
    isLoading: requestsLoading,
    filters,
    setFilters,
    createRequest,
    updateRequest,
    deleteRequest,
    refreshRequests
  } = useRequestData();

  const [newRequest, setNewRequest] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium' as 'urgent' | 'high' | 'medium' | 'low',
    assignee_id: '',
    recipients: []
  });

  // Define all functions before useEffect to prevent hoisting issues
  const loadNotifications = useCallback(async () => {
    try {
      const notifs = await requestMessagingService.getNotifications();
      setNotifications(notifs);
      setUnreadCount(notifs.length);
    } catch (error) {
      console.error('Error loading notifications:', error);
      console.log('💡 To fix this: Configure Supabase in .env.local and ensure request_notifications table exists');
      setNotifications([]);
      setUnreadCount(0);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    
    const initializeComponent = async () => {
      if (user && mounted) {
        try {
          requestMessagingService.setCurrentUser(user);
          
          // Load data with error handling - call functions directly without array
          const channelsPromise = (async () => {
            try {
              const { data, error } = await supabase.from('channels').select('*');
              if (error) {
                console.warn('Could not load channels from Supabase, using fallback');
                console.log('💡 To fix this: Configure Supabase in .env.local file');
                const fallbackChannels = [
                  { id: '1', name: 'General Discussion', type: 'team' },
                  { id: '2', name: 'Technical Support', type: 'team' },
                  { id: '3', name: 'Sales Updates', type: 'team' },
                  { id: '4', name: 'Garage Operations', type: 'team' },
                  { id: '5', name: 'Management', type: 'team' }
                ];
                setChannels(fallbackChannels);
                setSelectedChannel('1');
              } else {
                setChannels(data || []);
                if (data && data.length > 0) setSelectedChannel(data[0].id);
              }
            } catch (err) {
              console.error('Error loading channels:', err);
            } finally {
              setLoading(false);
            }
          })();

          const messagesPromise = (async () => {
            try {
              const { data, error } = await supabase.from('messages').select('*');
              if (error) {
                console.warn('Could not load messages from Supabase, using fallback');
                console.log('💡 To fix this: Configure Supabase in .env.local file');
                setMessages([]);
              } else {
                setMessages(data || []);
              }
            } catch (err) {
              console.error('Error loading messages:', err);
            }
          })();

          const notificationsPromise = loadNotifications();

          const usersPromise = (async () => {
            if (usersLoading) return; // Prevent multiple concurrent loads
            
            try {
              setUsersLoading(true);
              
              // Try to load from user_profiles table if it exists
              const { data: userProfiles, error: profilesError } = await supabase
                .from('user_profiles')
                .select('id, full_name, email, avatar_url')
                .neq('id', user?.id); // Exclude current user

              if (!profilesError && userProfiles && userProfiles.length > 0) {
                const formattedUsers = userProfiles.map(profile => ({
                  id: profile.id,
                  name: profile.full_name || profile.email?.split('@')[0] || 'Unknown User',
                  email: profile.email,
                  role: 'User',
                  avatar_url: profile.avatar_url
                }));
                setAvailableUsers(formattedUsers);
                console.log('Loaded users from user_profiles:', formattedUsers);
                return;
              }

              // Fallback to auth.users if user_profiles doesn't exist or is empty
              console.log('Falling back to mock users');
              
              // For now, we'll use the authorizedUsers as fallback since we can't directly query auth.users
              // In a real implementation, you'd have a backend endpoint or service function
              const fallbackUsers = authorizedUsers.filter(u => u.id !== (user?.id || '1'));
              setAvailableUsers(fallbackUsers);
              
            } catch (error) {
              console.error('Error loading users:', error);
              // Use authorizedUsers as ultimate fallback
              const fallbackUsers = authorizedUsers.filter(u => u.id !== (user?.id || '1'));
              setAvailableUsers(fallbackUsers);
            } finally {
              setUsersLoading(false);
            }
          })();

          await Promise.allSettled([channelsPromise, messagesPromise, notificationsPromise, usersPromise]);
          
          // Setup realtime subscriptions with cleanup
          if (mounted) {
            const cleanup = setupRealtimeSubscriptions();
            return cleanup;
          }
        } catch (error) {
          console.error('Error initializing MessageCenter:', error);
          setLoading(false);
        }
      }
    };

    const cleanup = initializeComponent();
    
    return () => {
      mounted = false;
      if (cleanup && typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, [user]);

  const loadChannels = async () => {
    try {
      const { data, error } = await supabase.from('channels').select('*');
      if (error) {
        console.warn('Could not load channels from Supabase, using fallback');
        console.log('💡 To fix this: Configure Supabase in .env.local file');
        const fallbackChannels = [
          { id: '1', name: 'General Discussion', type: 'team' },
          { id: '2', name: 'Technical Support', type: 'team' },
          { id: '3', name: 'Sales Updates', type: 'team' },
          { id: '4', name: 'Garage Operations', type: 'team' },
          { id: '5', name: 'Management', type: 'team' }
        ];
        setChannels(fallbackChannels);
        setSelectedChannel('1');
      } else {
        setChannels(data || []);
        if (data && data.length > 0) setSelectedChannel(data[0].id);
      }
    } catch (err) {
      logSupabaseError('load channels', err, 'using fallback');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase.from('messages').select('*');
      if (error) {
        console.warn('Could not load messages from Supabase, using fallback');
        console.log('💡 To fix this: Configure Supabase in .env.local file');
        setMessages([]);
      } else {
        setMessages(data || []);
      }
    } catch (err) {
      logSupabaseError('load messages', err, 'using fallback');
    }
  };



  const setupRealtimeSubscriptions = () => {
    let notificationChannel: any;
    let requestChannel: any;

    try {
      // Subscribe to new notifications
      notificationChannel = requestMessagingService.subscribeToNotifications((payload) => {
        if (payload.new && payload.new.user_id === user?.id) {
          loadNotifications();
          toast({
            title: "New notification",
            description: "You have a new request notification",
          });
        }
      });

      // Subscribe to request updates
      requestChannel = requestMessagingService.subscribeToRequests((payload) => {
        refreshRequests();
      });
    } catch (error) {
      console.error('Error setting up realtime subscriptions:', error);
    }

    // Return cleanup function
    return () => {
      try {
        if (notificationChannel) notificationChannel.unsubscribe();
        if (requestChannel) requestChannel.unsubscribe();
      } catch (error) {
        console.error('Error cleaning up subscriptions:', error);
      }
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChannel) return;

    const messageData = {
      channel_id: selectedChannel,
      author_id: user?.id || '1',
      body: newMessage,
      mentions: [],
      attachments: []
    };

    try {
      const { error } = await supabase
        .from('messages')
        .insert(messageData);

      if (error) {
        console.warn('Failed to send message to DB, saving locally:', error);
        // Fallback to local storage
        const localMessages = JSON.parse(localStorage.getItem('messages') || '[]');
        const newMsg = {
          ...messageData,
          id: Date.now().toString(),
          created_at: new Date().toISOString()
        };
        localMessages.push(newMsg);
        localStorage.setItem('messages', JSON.stringify(localMessages));
        setMessages(localMessages);
      } else {
        loadMessages();
      }

      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const createRequestHandler = async (data: CreateRequestData) => {
    try {
      await createRequest(data);
      setShowCreateRequest(false);
      toast({
        title: "Request created",
        description: "Your request has been submitted successfully",
      });
    } catch (error) {
      console.error('Error creating request:', error);
      toast({
        title: "Error",
        description: "Failed to create request",
        variant: "destructive",
      });
    }
  };

  const startNewChat = async () => {
    if (selectedUsersForChat.length === 0) return;

    const selectedUsers = availableUsers.filter(u => selectedUsersForChat.includes(u.id));
    if (selectedUsers.length === 0) return;

    const currentUserId = user?.id || '1';
    const currentUserName = user?.email?.split('@')[0] || 'You';
    
    // Create channel name based on number of users
    let channelName: string;
    let channelId: string;
    
    if (selectedUsers.length === 1) {
      // Direct message
      const selectedUser = selectedUsers[0];
      channelName = `${currentUserName} & ${selectedUser.name}`;
      channelId = `dm_${currentUserId}_${selectedUser.id}`;
    } else {
      // Group chat
      const userNames = selectedUsers.map(u => u.name.split(' ')[0]).join(', ');
      channelName = `${currentUserName}, ${userNames}`;
      channelId = `group_${currentUserId}_${Date.now()}`;
    }

    // Check if channel already exists
    const existingChannel = channels.find(c => c.id === channelId);
    if (existingChannel) {
      setSelectedChannel(channelId);
      setShowStartNewChat(false);
      setSelectedUsersForChat([]);
      return;
    }

    const newChannel = {
      id: channelId,
      name: channelName,
      type: selectedUsers.length === 1 ? 'direct' : 'group',
      description: selectedUsers.length === 1 
        ? `Direct message with ${selectedUsers[0].name}`
        : `Group chat with ${selectedUsers.length} participants`
    };

    try {
      const { error } = await supabase
        .from('channels')
        .insert(newChannel);

      if (error) {
        console.warn('Failed to create channel in DB, saving locally:', error);
        // Fallback to localStorage
        const localChannels = JSON.parse(localStorage.getItem('channels') || '[]');
        localChannels.push(newChannel);
        localStorage.setItem('channels', JSON.stringify(localChannels));
      }

      // Add to current channels list
      setChannels(prev => [...prev, newChannel]);
      setSelectedChannel(channelId);
      setShowStartNewChat(false);
      setSelectedUsersForChat([]);
      
      toast({
        title: "Chat Created",
        description: selectedUsers.length === 1 
          ? `Direct chat with ${selectedUsers[0].name} created`
          : `Group chat with ${selectedUsers.length} participants created`
      });
    } catch (err) {
      console.error('Error creating chat channel:', err);
      toast({
        title: "Error",
        description: "Failed to create chat. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Add timeout for loading state to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('MessageCenter loading timeout, forcing component to render');
        setLoading(false);
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, [loading]);

  if (loading || requestsLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="text-center text-gray-500 mt-4">Loading Message Center...</div>
          <div className="text-xs text-gray-400 mt-2">If this takes too long, try refreshing the page</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Message & Request Center</h1>
        <div className="flex gap-2">
          {/* Notifications - Removed duplicate bell */}
          {/* <NotificationCenter 
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkAsRead={loadNotifications}
          /> */}

          {/* Start New Chat */}
          <Dialog open={showStartNewChat} onOpenChange={setShowStartNewChat}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <MessageSquare className="w-4 h-4 mr-2" />
                Start New Chat
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md overflow-visible" aria-describedby="start-chat-description">
              <DialogHeader>
                <DialogTitle>Start New Chat</DialogTitle>
                <p id="start-chat-description" className="text-sm text-gray-600">
                  Select a user to start a new conversation with
                </p>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="user-select">Select Users to Chat With</Label>
                  <div className="text-xs text-gray-500 mb-2">
                    {usersLoading ? 'Loading...' : `${availableUsers.length} users available`}
                  </div>
                  <div className="space-y-2">
                    {availableUsers.map(chatUser => (
                      <label key={chatUser.id} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedUsersForChat.includes(chatUser.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsersForChat(prev => [...prev, chatUser.id]);
                            } else {
                              setSelectedUsersForChat(prev => prev.filter(id => id !== chatUser.id));
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">{chatUser.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <Button 
                  onClick={startNewChat}
                  disabled={selectedUsersForChat.length === 0}
                  className="w-full"
                >
                  Start Chat
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Create Request */}
          <RequestForm
            open={showCreateRequest}
            onOpenChange={setShowCreateRequest}
            onSubmit={createRequestHandler}
          />

          <Button onClick={() => setShowCreateRequest(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Request
          </Button>


        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="messages">
            <MessageSquare className="w-4 h-4 mr-2" />
            Messages
          </TabsTrigger>
          <TabsTrigger value="requests">
            <Hash className="w-4 h-4 mr-2" />
            Requests
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2 text-xs">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Communication</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Channel Selection */}
                <div className="flex gap-2 flex-wrap">
                  {channels.map(channel => (
                    <button
                      key={channel.id}
                      onClick={() => setSelectedChannel(channel.id)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        selectedChannel === channel.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      # {channel.name}
                    </button>
                  ))}
                </div>
                
                {/* Messages Area */}
                <ScrollArea className="border rounded-lg p-4 h-64">
                  {messages.filter(m => m.channel_id === selectedChannel).length > 0 ? (
                    <div className="space-y-3">
                      {messages
                        .filter(m => m.channel_id === selectedChannel)
                        .map(message => (
                          <div key={message.id} className="border-b pb-2 last:border-b-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs">
                                  {message.author_id.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="text-sm font-medium">
                                {authorizedUsers.find(u => u.id === message.author_id)?.name || message.author_id}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(message.created_at).toLocaleTimeString()}
                              </div>
                            </div>
                            <div className="text-sm ml-8">{message.body}</div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      No messages in this channel yet
                    </div>
                  )}
                </ScrollArea>

                {/* Message Input */}
                <div className="flex gap-2">
                  <Input
                    id="message-input"
                    name="message-input"
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    className="flex-1"
                  />
                  <Button onClick={sendMessage} size="sm">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <div className="flex gap-4">
            {/* Request List */}
            <div className="flex-1">
              <RequestList
                requests={requests}
                onSelectRequest={setSelectedRequest}
                filters={filters}
                onFiltersChange={setFilters}
                isLoading={requestsLoading}
              />
            </div>

            {/* Message Thread (if request selected) */}
            {selectedRequest && (
              <div className="w-96">
                <MessageThread
                  request={selectedRequest}
                  onClose={() => setSelectedRequest(null)}
                />
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
});

export default MessageCenter;
