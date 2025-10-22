import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Send, 
  User, 
  Clock, 
  AtSign,
  MoreVertical,
  Edit,
  Trash2,
  Users
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RequestWithMessages } from '@/services/requestMessagingService';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface MessageThreadProps {
  request: RequestWithMessages;
  onSendMessage: (requestId: string, messageText: string, mentions?: string[]) => Promise<void>;
  onRequestUpdate: (id: string, updates: Partial<RequestWithMessages>) => Promise<void>;
}

const MessageThread: React.FC<MessageThreadProps> = ({
  request,
  onSendMessage,
  onRequestUpdate
}) => {
  const { user } = useAuth();
  const [messageText, setMessageText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [request.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;

    setIsLoading(true);
    try {
      const mentions = extractMentions(messageText);
      
      // For broadcast messages, add a special flag
      if (request.category === 'broadcast') {
        // Add broadcast message to localStorage
        const broadcastMessage = {
          id: `msg-${Date.now()}`,
          message_text: messageText,
          created_by: user?.id || '',
          created_by_user: {
            id: user?.id || '',
            full_name: user?.full_name || user?.email || 'Unknown User',
            email: user?.email || '',
            avatar_url: user?.avatar_url || '',
          },
          created_at: new Date().toISOString(),
          is_broadcast: true,
          mentions
        };

        // Update the broadcast request in localStorage
        const existingBroadcasts = JSON.parse(localStorage.getItem('broadcastRequests') || '[]');
        const updatedBroadcasts = existingBroadcasts.map((broadcast: any) => {
          if (broadcast.id === request.id) {
            return {
              ...broadcast,
              messages: [...(broadcast.messages || []), broadcastMessage],
              updated_at: new Date().toISOString()
            };
          }
          return broadcast;
        });
        localStorage.setItem('broadcastRequests', JSON.stringify(updatedBroadcasts));
      }
      
      await onSendMessage(request.id, messageText, mentions);
      setMessageText('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const extractMentions = (text: string): string[] => {
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[1]);
    }
    return mentions;
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessageText(value);
    
    // Check for @ symbol to show mention suggestions
    const cursorPos = e.target.selectionStart;
    const beforeCursor = value.slice(0, cursorPos);
    const atIndex = beforeCursor.lastIndexOf('@');
    
    if (atIndex !== -1 && atIndex < cursorPos) {
      const query = beforeCursor.slice(atIndex + 1);
      setMentionQuery(query);
      setShowMentionSuggestions(true);
      setCursorPosition(cursorPos);
    } else {
      setShowMentionSuggestions(false);
    }
  };

  const insertMention = (username: string) => {
    const beforeMention = messageText.slice(0, cursorPosition - mentionQuery.length - 1);
    const afterMention = messageText.slice(cursorPosition);
    const newText = beforeMention + '@' + username + ' ' + afterMention;
    setMessageText(newText);
    setShowMentionSuggestions(false);
    
    // Focus back to textarea
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
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

  const handleStatusChange = async (newStatus: string) => {
    try {
      await onRequestUpdate(request.id, { status: newStatus });
    } catch (error) {
      console.error('Error updating request status:', error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (confirm('Are you sure you want to delete this message?')) {
      // This would need to be implemented in the service
      console.log('Delete message:', messageId);
    }
  };

  return (
    <div className="space-y-4">
      {/* Request Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold">{request.title}</h2>
                <Badge className={getPriorityColor(request.priority)}>
                  {request.priority}
                </Badge>
                <Badge className={getStatusColor(request.status)}>
                  {request.status}
                </Badge>
              </div>
              
              {request.description && (
                <p className="text-muted-foreground">{request.description}</p>
              )}
              
              {/* Broadcast Indicator */}
              {request.category === 'broadcast' && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">
                    📢 Broadcast Chat - All Users Included
                  </span>
                  <Badge variant="outline" className="text-xs text-blue-700 border-blue-300">
                    Everyone can participate
                  </Badge>
                </div>
              )}
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>Created by {request.created_by_user?.full_name}</span>
                </div>
                
                {request.assigned_to_user && (
                  <div className="flex items-center gap-1">
                    <Avatar className="h-4 w-4">
                      <AvatarFallback className="text-xs">
                        {request.assigned_to_user.full_name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span>Assigned to {request.assigned_to_user.full_name}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Select
                value={request.status}
                onValueChange={handleStatusChange}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                  <SelectItem value="pending_review">Pending Review</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Messages */}
      <Card>
        <CardHeader>
          <CardTitle>Messages ({request.messages?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {request.messages && request.messages.length > 0 ? (
                request.messages.map((message) => (
                  <div key={message.id} className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {message.sender?.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {message.sender?.full_name || 'Unknown User'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                        </span>
                        
                        {/* Broadcast Message Indicator */}
                        {message.is_broadcast && (
                          <Badge variant="outline" className="text-xs text-blue-700 border-blue-300">
                            📢 Broadcast
                          </Badge>
                        )}
                        
                        {message.sender_id === user?.id && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <MoreVertical className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleDeleteMessage(message.id)}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                      
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-sm whitespace-pre-wrap">{message.message_text}</p>
                        
                        {message.mentions && message.mentions.length > 0 && (
                          <div className="flex items-center gap-1 mt-2">
                            <AtSign className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              Mentioned {message.mentions.length} user(s)
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Message Input */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={messageText}
                onChange={handleTextareaChange}
                onKeyPress={handleKeyPress}
                placeholder={request.category === 'broadcast' 
                  ? "Type your message for all users... Use @ to mention someone" 
                  : "Type your message... Use @ to mention someone"
                }
                className="min-h-[100px] resize-none"
              />
              
              {/* Mention Suggestions */}
              {showMentionSuggestions && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border rounded-lg shadow-lg z-10">
                  <div className="p-2">
                    <div className="text-xs text-muted-foreground mb-2">
                      Suggestions for "{mentionQuery}"
                    </div>
                    <div className="space-y-1">
                      {/* This would be populated with actual user suggestions */}
                      <div 
                        className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer"
                        onClick={() => insertMention('lara')}
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">L</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">Lara</span>
                      </div>
                      <div 
                        className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer"
                        onClick={() => insertMention('mark')}
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">M</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">Mark</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-between items-center">
              <div className="text-xs text-muted-foreground">
                Press Enter to send, Shift+Enter for new line
              </div>
              
              <Button 
                onClick={handleSendMessage} 
                disabled={isLoading || !messageText.trim()}
              >
                <Send className="h-4 w-4 mr-2" />
                {isLoading ? 'Sending...' : 'Send Message'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MessageThread; 