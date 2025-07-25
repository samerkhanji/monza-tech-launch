import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  MessageCircle, 
  Users, 
  Plus, 
  Send, 
  MoreVertical, 
  Search, 
  Phone, 
  Video, 
  Image, 
  File, 
  Smile,
  Check,
  CheckCheck,
  Clock,
  UserPlus,
  UserMinus,
  Settings,
  Bell,
  Crown
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { messagingService, Chat, Message, GroupInviteRequest } from '@/services/messagingService';
import { isOwner } from '@/config/networkConfig';

interface MessagingCenterProps {
  // Component props interface
}

const MessagingCenter: React.FC<MessagingCenterProps> = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [showGroupRequestDialog, setShowGroupRequestDialog] = useState(false);
  const [showGroupRequestsDialog, setShowGroupRequestsDialog] = useState(false);
  const [pendingGroupRequests, setPendingGroupRequests] = useState<GroupInviteRequest[]>([]);
  const [groupRequestForm, setGroupRequestForm] = useState({
    groupName: '',
    groupDescription: '',
    participants: [] as string[]
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isUserOwner = user ? isOwner(user.role) : false;

  // Initialize messaging service with current user
  useEffect(() => {
    if (user) {
      messagingService.setCurrentUser(user);
      loadChats();
      if (isUserOwner) {
        loadPendingGroupRequests();
      }
    }
  }, [user, isUserOwner]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadChats = async () => {
    try {
      setIsLoading(true);
      const userChats = await messagingService.getUserChats();
      setChats(userChats);
    } catch (error) {
      console.error('Error loading chats:', error);
      toast({
        title: "Error",
        description: "Failed to load chats",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadPendingGroupRequests = async () => {
    try {
      const requests = await messagingService.getPendingGroupRequests();
      setPendingGroupRequests(requests);
    } catch (error) {
      console.error('Error loading group requests:', error);
    }
  };

  const loadChatMessages = async (chatId: string) => {
    try {
      const chatMessages = await messagingService.getChatMessages(chatId);
      setMessages(chatMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    }
  };

  const handleChatSelect = async (chat: Chat) => {
    setSelectedChat(chat);
    await loadChatMessages(chat.id);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    try {
      const message = await messagingService.sendMessage(selectedChat.id, newMessage.trim());
      setMessages(prev => [...prev, message]);
      setNewMessage('');
      
      // Update chat's last message
      setChats(prev => prev.map(chat => 
        chat.id === selectedChat.id 
          ? { ...chat, lastMessage: message, updatedAt: new Date().toISOString() }
          : chat
      ));
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const handleCreateDirectChat = async (participantId: string, participantName: string, participantRole: string, participantEmail: string) => {
    try {
      const newChat = await messagingService.createDirectChat(participantId, participantName, participantRole, participantEmail);
      setChats(prev => [newChat, ...prev]);
      setShowNewChatDialog(false);
      toast({
        title: "Chat Created",
        description: `Direct chat created with ${participantName}`,
      });
    } catch (error) {
      console.error('Error creating chat:', error);
      toast({
        title: "Error",
        description: "Failed to create chat",
        variant: "destructive",
      });
    }
  };

  const handleCreateGroupRequest = async () => {
    if (!groupRequestForm.groupName.trim() || groupRequestForm.participants.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please provide group name and select participants",
        variant: "destructive",
      });
      return;
    }

    try {
      const request = await messagingService.createGroupInviteRequest(
        groupRequestForm.groupName,
        groupRequestForm.groupDescription,
        groupRequestForm.participants
      );
      
      setShowGroupRequestDialog(false);
      setGroupRequestForm({ groupName: '', groupDescription: '', participants: [] });
      
      toast({
        title: "Group Request Sent",
        description: "Your group creation request has been sent to owners for approval",
      });
    } catch (error) {
      console.error('Error creating group request:', error);
      toast({
        title: "Error",
        description: "Failed to create group request",
        variant: "destructive",
      });
    }
  };

  const handleApproveGroupRequest = async (requestId: string) => {
    try {
      const groupChat = await messagingService.approveGroupRequest(requestId, user?.id || '');
      if (groupChat) {
        setChats(prev => [groupChat, ...prev]);
        setPendingGroupRequests(prev => prev.filter(req => req.id !== requestId));
        toast({
          title: "Group Approved",
          description: `Group "${groupChat.name}" has been created`,
        });
      }
    } catch (error) {
      console.error('Error approving group request:', error);
      toast({
        title: "Error",
        description: "Failed to approve group request",
        variant: "destructive",
      });
    }
  };

  const handleDenyGroupRequest = async (requestId: string, reason: string) => {
    try {
      const success = await messagingService.denyGroupRequest(requestId, user?.id || '', reason);
      if (success) {
        setPendingGroupRequests(prev => prev.filter(req => req.id !== requestId));
        toast({
          title: "Group Request Denied",
          description: "Group request has been denied",
        });
      }
    } catch (error) {
      console.error('Error denying group request:', error);
      toast({
        title: "Error",
        description: "Failed to deny group request",
        variant: "destructive",
      });
    }
  };

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.lastMessage?.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const getMessageStatus = (message: Message) => {
    if (message.readBy.length > 1) {
      return <CheckCheck className="w-4 h-4 text-blue-500" />;
    } else if (message.senderId === user?.id) {
      return <Check className="w-4 h-4 text-gray-400" />;
    }
    return null;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Chat List Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold">Messaging Center</h1>
            <div className="flex gap-2">
              {isUserOwner && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowGroupRequestsDialog(true)}
                  className="relative"
                >
                  <Bell className="w-4 h-4" />
                  {pendingGroupRequests.length > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs">
                      {pendingGroupRequests.length}
                    </Badge>
                  )}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNewChatDialog(true)}
              >
                <Plus className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowGroupRequestDialog(true)}
              >
                <Users className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Chat List */}
        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">Loading chats...</div>
          ) : filteredChats.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No chats found</div>
          ) : (
            filteredChats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => handleChatSelect(chat)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedChat?.id === chat.id ? 'bg-blue-50 border-blue-200' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {chat.type === 'group' ? (
                        <Users className="w-5 h-5" />
                      ) : (
                        chat.name.charAt(0).toUpperCase()
                      )}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900 truncate">{chat.name}</h3>
                      {chat.lastMessage && (
                        <span className="text-xs text-gray-500">
                          {formatTime(chat.lastMessage.timestamp)}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm text-gray-600 truncate">
                        {chat.lastMessage?.content || 'No messages yet'}
                      </p>
                      {chat.unreadCount > 0 && (
                        <Badge className="ml-2 bg-blue-500 text-white text-xs">
                          {chat.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {selectedChat.type === 'group' ? (
                        <Users className="w-5 h-5" />
                      ) : (
                        selectedChat.name.charAt(0).toUpperCase()
                      )}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <h2 className="font-semibold text-gray-900">{selectedChat.name}</h2>
                    <p className="text-sm text-gray-500">
                      {selectedChat.type === 'group' 
                        ? `${selectedChat.participants.length} members`
                        : selectedChat.participants.find(p => p.userId !== user?.id)?.userRole || 'User'
                      }
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Video className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.senderId === user?.id
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs opacity-75">
                          {message.senderName}
                        </span>
                        {message.senderRole === 'owner' && (
                          <Crown className="w-3 h-3 text-yellow-400" />
                        )}
                      </div>
                      
                      <p className="text-sm">{message.content}</p>
                      
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs opacity-75">
                          {formatTime(message.timestamp)}
                        </span>
                        {getMessageStatus(message)}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <Smile className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Image className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <File className="w-4 h-4" />
                </Button>
                
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1"
                />
                
                <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome to Messaging Center</h3>
              <p className="text-gray-500">Select a chat to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* New Chat Dialog */}
      <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start New Chat</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="User ID" />
            <Input placeholder="User Name" />
            <Input placeholder="User Email" />
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="User Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employee">Employee</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="owner">Owner</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => handleCreateDirectChat('user1', 'John Doe', 'employee', 'john@example.com')}>
              Create Chat
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Group Request Dialog */}
      <Dialog open={showGroupRequestDialog} onOpenChange={setShowGroupRequestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Group Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Group Name"
              value={groupRequestForm.groupName}
              onChange={(e) => setGroupRequestForm(prev => ({ ...prev, groupName: e.target.value }))}
            />
            <Textarea
              placeholder="Group Description"
              value={groupRequestForm.groupDescription}
              onChange={(e) => setGroupRequestForm(prev => ({ ...prev, groupDescription: e.target.value }))}
            />
            <Input placeholder="Participant IDs (comma-separated)" />
            <Button onClick={handleCreateGroupRequest}>
              Send Group Request
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Group Requests Dialog (Owners Only) */}
      {isUserOwner && (
        <Dialog open={showGroupRequestsDialog} onOpenChange={setShowGroupRequestsDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Pending Group Requests</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-96">
              {pendingGroupRequests.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No pending group requests</p>
              ) : (
                <div className="space-y-4">
                  {pendingGroupRequests.map((request) => (
                    <Card key={request.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{request.groupName}</h4>
                          <Badge variant="secondary">Pending</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{request.groupDescription}</p>
                        <p className="text-xs text-gray-500 mb-3">
                          Requested by: {request.requestedBy} • {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApproveGroupRequest(request.id)}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDenyGroupRequest(request.id, 'Denied by owner')}
                          >
                            Deny
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default MessagingCenter; 