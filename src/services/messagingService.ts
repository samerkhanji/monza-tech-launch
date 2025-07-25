import { supabase } from '@/integrations/supabase/client';

// Types for the messaging system
export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  content: string;
  messageType: 'text' | 'request' | 'group_invite' | 'system' | 'file' | 'image';
  timestamp: string;
  readBy: string[];
  isEdited?: boolean;
  editedAt?: string;
  replyTo?: string;
  attachments?: MessageAttachment[];
  metadata?: Record<string, any>;
}

export interface MessageAttachment {
  id: string;
  name: string;
  type: 'image' | 'document' | 'video' | 'audio';
  url: string;
  size: number;
  uploadedAt: string;
}

export interface Chat {
  id: string;
  name: string;
  type: 'direct' | 'group' | 'request';
  participants: ChatParticipant[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  groupSettings?: GroupSettings;
  requestSettings?: RequestSettings;
}

export interface ChatParticipant {
  userId: string;
  userName: string;
  userRole: string;
  userEmail: string;
  joinedAt: string;
  isAdmin?: boolean;
  isOwner?: boolean;
  canAddMembers?: boolean;
  canRemoveMembers?: boolean;
  canSendMessages?: boolean;
  lastSeen?: string;
  isOnline?: boolean;
}

export interface GroupSettings {
  groupType: 'public' | 'private' | 'restricted';
  description?: string;
  avatar?: string;
  maxParticipants?: number;
  allowMemberInvites: boolean;
  requireAdminApproval: boolean;
  pinnedMessages: string[];
  rules?: string[];
}

export interface RequestSettings {
  requestType: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'approved' | 'denied' | 'in_progress' | 'completed';
  assignedTo?: string[];
  dueDate?: string;
  category: string;
  tags: string[];
}

export interface GroupInviteRequest {
  id: string;
  groupName: string;
  groupDescription?: string;
  requestedBy: string;
  requestedByRole: string;
  participants: string[];
  status: 'pending' | 'approved' | 'denied';
  approvedBy?: string;
  approvedAt?: string;
  deniedBy?: string;
  deniedAt?: string;
  reason?: string;
  createdAt: string;
}

// LocalStorage fallback for missing tables
const getLocalStorageData = (key: string): any[] => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Error reading localStorage for ${key}:`, error);
    return [];
  }
};

const setLocalStorageData = (key: string, data: any[]): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error writing localStorage for ${key}:`, error);
  }
};

class MessagingService {
  private static instance: MessagingService;
  private currentUser: any = null;

  private constructor() {}

  static getInstance(): MessagingService {
    if (!this.instance) {
      this.instance = new MessagingService();
    }
    return this.instance;
  }

  setCurrentUser(user: any) {
    this.currentUser = user;
  }

  // Create a new direct chat
  async createDirectChat(participantId: string, participantName: string, participantRole: string, participantEmail: string): Promise<Chat> {
    const chatId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const chat: Chat = {
      id: chatId,
      name: `Chat with ${participantName}`,
      type: 'direct',
      participants: [
        {
          userId: this.currentUser.id,
          userName: this.currentUser.name,
          userRole: this.currentUser.role,
          userEmail: this.currentUser.email,
          joinedAt: new Date().toISOString(),
          isOnline: true
        },
        {
          userId: participantId,
          userName: participantName,
          userRole: participantRole,
          userEmail: participantEmail,
          joinedAt: new Date().toISOString(),
          isOnline: false
        }
      ],
      unreadCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true
    };

    // Try Supabase first
    try {
      await supabase.from('audit_logs').insert({
        table_name: 'audit_logs',
        record_id: chatId,
        action: 'INSERT',
        new_data: chat as any,
        user_id: this.currentUser.id,
        user_email: this.currentUser.email,
        user_role: this.currentUser.role,
        ip_address: '127.0.0.1',
        user_agent: 'MonzaTech-Messaging',
        timestamp: new Date().toISOString()
      });
    } catch (supabaseError) {
      console.warn('Supabase insert failed, using localStorage fallback:', supabaseError);
    }

    // Always store in localStorage as backup
    const existingChats = getLocalStorageData('chats');
    existingChats.push(chat);
    setLocalStorageData('chats', existingChats);

    return chat;
  }

  // Create a group invite request
  async createGroupInviteRequest(
    groupName: string,
    groupDescription: string,
    participants: string[],
    groupType: 'public' | 'private' | 'restricted' = 'private'
  ): Promise<GroupInviteRequest> {
    const requestId = `group_request_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const groupRequest: GroupInviteRequest = {
      id: requestId,
      groupName,
      groupDescription,
      requestedBy: this.currentUser.id,
      requestedByRole: this.currentUser.role,
      participants,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    // Try Supabase first
    try {
      await supabase.from('audit_logs').insert({
        table_name: 'audit_logs',
        record_id: requestId,
        action: 'INSERT',
        new_data: groupRequest as any,
        user_id: this.currentUser.id,
        user_email: this.currentUser.email,
        user_role: this.currentUser.role,
        ip_address: '127.0.0.1',
        user_agent: 'MonzaTech-Messaging',
        timestamp: new Date().toISOString()
      });
    } catch (supabaseError) {
      console.warn('Supabase insert failed, using localStorage fallback:', supabaseError);
    }

    // Always store in localStorage as backup
    const existingRequests = getLocalStorageData('group_invite_requests');
    existingRequests.push(groupRequest);
    setLocalStorageData('group_invite_requests', existingRequests);

    // Send notification to owners
    await this.notifyOwnersOfGroupRequest(groupRequest);

    return groupRequest;
  }

  // Approve group creation request (owners only)
  async approveGroupRequest(requestId: string, approvedBy: string): Promise<Chat | null> {
    try {
      // Try Supabase first
      try {
        await supabase.from('audit_logs').update({
          new_data: { status: 'approved', approvedBy, approvedAt: new Date().toISOString() } as any
        }).eq('table_name', 'group_invite_requests').eq('record_id', requestId);
      } catch (supabaseError) {
        console.warn('Supabase update failed, using localStorage fallback:', supabaseError);
      }

      // Update in localStorage
      const existingRequests = getLocalStorageData('group_invite_requests');
      const requestIndex = existingRequests.findIndex((r: any) => r.id === requestId);
      
      if (requestIndex === -1) {
        throw new Error('Group request not found');
      }

      const request = existingRequests[requestIndex];
      request.status = 'approved';
      request.approvedBy = approvedBy;
      request.approvedAt = new Date().toISOString();
      
      setLocalStorageData('group_invite_requests', existingRequests);

      // Create the actual group chat
      const groupChat = await this.createGroupChat(request);
      
      // Notify participants
      await this.notifyGroupParticipants(request, groupChat);

      return groupChat;
    } catch (error) {
      console.error('Error approving group request:', error);
      return null;
    }
  }

  // Deny group creation request (owners only)
  async denyGroupRequest(requestId: string, deniedBy: string, reason: string): Promise<boolean> {
    try {
      // Try Supabase first
      try {
        await supabase.from('audit_logs').update({
          new_data: { status: 'denied', deniedBy, deniedAt: new Date().toISOString(), reason } as any
        }).eq('table_name', 'group_invite_requests').eq('record_id', requestId);
      } catch (supabaseError) {
        console.warn('Supabase update failed, using localStorage fallback:', supabaseError);
      }

      // Update in localStorage
      const existingRequests = getLocalStorageData('group_invite_requests');
      const requestIndex = existingRequests.findIndex((r: any) => r.id === requestId);
      
      if (requestIndex === -1) {
        throw new Error('Group request not found');
      }

      const request = existingRequests[requestIndex];
      request.status = 'denied';
      request.deniedBy = deniedBy;
      request.deniedAt = new Date().toISOString();
      request.reason = reason;
      
      setLocalStorageData('group_invite_requests', existingRequests);

      // Notify the requester
      await this.notifyGroupRequestDenied(request);

      return true;
    } catch (error) {
      console.error('Error denying group request:', error);
      return false;
    }
  }

  // Create the actual group chat after approval
  private async createGroupChat(request: GroupInviteRequest): Promise<Chat> {
    const chatId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const groupSettings: GroupSettings = {
      groupType: 'private',
      description: request.groupDescription,
      allowMemberInvites: true,
      requireAdminApproval: true,
      pinnedMessages: []
    };

    const chat: Chat = {
      id: chatId,
      name: request.groupName,
      type: 'group',
      participants: request.participants.map(participantId => ({
        userId: participantId,
        userName: 'User', // This would be fetched from user data
        userRole: 'employee',
        userEmail: 'user@example.com',
        joinedAt: new Date().toISOString(),
        isAdmin: participantId === request.requestedBy,
        canAddMembers: participantId === request.requestedBy,
        canRemoveMembers: participantId === request.requestedBy,
        canSendMessages: true
      })),
      unreadCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
      groupSettings
    };

    // Try Supabase first
    try {
      await supabase.from('audit_logs').insert({
        table_name: 'audit_logs',
        record_id: chatId,
        action: 'INSERT',
        new_data: chat as any,
        user_id: this.currentUser.id,
        user_email: this.currentUser.email,
        user_role: this.currentUser.role,
        ip_address: '127.0.0.1',
        user_agent: 'MonzaTech-Messaging',
        timestamp: new Date().toISOString()
      });
    } catch (supabaseError) {
      console.warn('Supabase insert failed, using localStorage fallback:', supabaseError);
    }

    // Always store in localStorage as backup
    const existingChats = getLocalStorageData('chats');
    existingChats.push(chat);
    setLocalStorageData('chats', existingChats);

    return chat;
  }

  // Send a message
  async sendMessage(chatId: string, content: string, messageType: Message['messageType'] = 'text', replyTo?: string): Promise<Message> {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const message: Message = {
      id: messageId,
      chatId,
      senderId: this.currentUser.id,
      senderName: this.currentUser.name,
      senderRole: this.currentUser.role,
      content,
      messageType,
      timestamp: new Date().toISOString(),
      readBy: [this.currentUser.id],
      replyTo
    };

    // Try Supabase first
    try {
      await supabase.from('audit_logs').insert({
        table_name: 'audit_logs',
        record_id: messageId,
        action: 'INSERT',
        new_data: message as any,
        user_id: this.currentUser.id,
        user_email: this.currentUser.email,
        user_role: this.currentUser.role,
        ip_address: '127.0.0.1',
        user_agent: 'MonzaTech-Messaging',
        timestamp: new Date().toISOString()
      });
    } catch (supabaseError) {
      console.warn('Supabase insert failed, using localStorage fallback:', supabaseError);
    }

    // Always store in localStorage as backup
    const existingMessages = getLocalStorageData('messages');
    existingMessages.push(message);
    setLocalStorageData('messages', existingMessages);

    // Update chat's last message and unread count
    await this.updateChatLastMessage(chatId, message);

    return message;
  }

  // Get messages for a chat
  async getChatMessages(chatId: string, limit: number = 50, offset: number = 0): Promise<Message[]> {
    try {
      // Try Supabase first
      try {
        const { data, error } = await supabase
          .from('audit_logs')
          .select('*')
          .eq('table_name', 'audit_logs')
          .eq('new_data->chatId', chatId)
          .order('timestamp', { ascending: false })
          .range(offset, offset + limit - 1);

        if (!error && data) {
          return data
            .map(item => item.new_data as unknown as Message)
            .filter(Boolean)
            .reverse(); // Show oldest first
        }
      } catch (supabaseError) {
        console.warn('Supabase query failed, using localStorage fallback:', supabaseError);
      }

      // Fallback to localStorage
      const allMessages = getLocalStorageData('messages');
      return allMessages
        .filter((msg: any) => msg.chatId === chatId)
        .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .slice(offset, offset + limit);
    } catch (error) {
      console.error('Error getting chat messages:', error);
      return [];
    }
  }

  // Get user's chats
  async getUserChats(): Promise<Chat[]> {
    try {
      // Try Supabase first
      try {
        const { data, error } = await supabase
          .from('audit_logs')
          .select('*')
          .eq('table_name', 'audit_logs');

        if (!error && data) {
          return data
            .map(item => item.new_data as unknown as Chat)
            .filter((chat: any) => chat.participants.some((p: any) => p.userId === this.currentUser.id))
            .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        }
      } catch (supabaseError) {
        console.warn('Supabase query failed, using localStorage fallback:', supabaseError);
      }

      // Fallback to localStorage
      const allChats = getLocalStorageData('chats');
      return allChats
        .filter((chat: any) => chat.participants.some((p: any) => p.userId === this.currentUser.id))
        .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    } catch (error) {
      console.error('Error getting user chats:', error);
      return [];
    }
  }

  // Get pending group requests (for owners)
  async getPendingGroupRequests(): Promise<GroupInviteRequest[]> {
    try {
      // Try Supabase first
      try {
        const { data, error } = await supabase
          .from('audit_logs')
          .select('*')
          .eq('table_name', 'audit_logs');

        if (!error && data) {
          return data
            .map(item => item.new_data as unknown as GroupInviteRequest)
            .filter((req: any) => req.status === 'pending')
            .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
      } catch (supabaseError) {
        console.warn('Supabase query failed, using localStorage fallback:', supabaseError);
      }

      // Fallback to localStorage
      const allRequests = getLocalStorageData('group_invite_requests');
      return allRequests
        .filter((req: any) => req.status === 'pending')
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Error getting pending group requests:', error);
      return [];
    }
  }

  // Mark message as read
  async markMessageAsRead(messageId: string): Promise<void> {
    try {
      const allMessages = getLocalStorageData('messages');
      const messageIndex = allMessages.findIndex((msg: any) => msg.id === messageId);
      
      if (messageIndex !== -1) {
        const message = allMessages[messageIndex];
        if (!message.readBy.includes(this.currentUser.id)) {
          message.readBy.push(this.currentUser.id);
          setLocalStorageData('messages', allMessages);
        }
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }

  // Update chat's last message
  private async updateChatLastMessage(chatId: string, message: Message): Promise<void> {
    try {
      const allChats = getLocalStorageData('chats');
      const chatIndex = allChats.findIndex((chat: any) => chat.id === chatId);
      
      if (chatIndex !== -1) {
        const chat = allChats[chatIndex];
        chat.lastMessage = message;
        chat.updatedAt = new Date().toISOString();
        
        // Update unread count for other participants
        chat.participants.forEach((participant: any) => {
          if (participant.userId !== this.currentUser.id) {
            chat.unreadCount = (chat.unreadCount || 0) + 1;
          }
        });
        
        setLocalStorageData('chats', allChats);
      }
    } catch (error) {
      console.error('Error updating chat last message:', error);
    }
  }

  // Notify owners of group request
  private async notifyOwnersOfGroupRequest(request: GroupInviteRequest): Promise<void> {
    // This would integrate with your existing notification system
    console.log(`Group request notification sent to owners: ${request.groupName}`);
  }

  // Notify group participants
  private async notifyGroupParticipants(request: GroupInviteRequest, chat: Chat): Promise<void> {
    // This would integrate with your existing notification system
    console.log(`Group created notification sent to participants: ${chat.name}`);
  }

  // Notify group request denied
  private async notifyGroupRequestDenied(request: GroupInviteRequest): Promise<void> {
    // This would integrate with your existing notification system
    console.log(`Group request denied notification sent to: ${request.requestedBy}`);
  }

  // Add member to group (owners/admins only)
  async addMemberToGroup(chatId: string, userId: string, userName: string, userRole: string, userEmail: string): Promise<boolean> {
    try {
      const allChats = getLocalStorageData('chats');
      const chatIndex = allChats.findIndex((chat: any) => chat.id === chatId);
      
      if (chatIndex === -1) {
        throw new Error('Chat not found');
      }

      const chat = allChats[chatIndex];
      
      // Check if user has permission to add members
      const currentParticipant = chat.participants.find((p: any) => p.userId === this.currentUser.id);
      if (!currentParticipant?.canAddMembers && this.currentUser.role !== 'owner') {
        throw new Error('You do not have permission to add members to this group');
      }

      // Check if user is already in the group
      if (chat.participants.some((p: any) => p.userId === userId)) {
        throw new Error('User is already a member of this group');
      }

      // Add new participant
      chat.participants.push({
        userId,
        userName,
        userRole,
        userEmail,
        joinedAt: new Date().toISOString(),
        canAddMembers: false,
        canRemoveMembers: false,
        canSendMessages: true
      });

      chat.updatedAt = new Date().toISOString();
      setLocalStorageData('chats', allChats);

      return true;
    } catch (error) {
      console.error('Error adding member to group:', error);
      return false;
    }
  }

  // Remove member from group (owners/admins only)
  async removeMemberFromGroup(chatId: string, userId: string): Promise<boolean> {
    try {
      const allChats = getLocalStorageData('chats');
      const chatIndex = allChats.findIndex((chat: any) => chat.id === chatId);
      
      if (chatIndex === -1) {
        throw new Error('Chat not found');
      }

      const chat = allChats[chatIndex];
      
      // Check if user has permission to remove members
      const currentParticipant = chat.participants.find((p: any) => p.userId === this.currentUser.id);
      if (!currentParticipant?.canRemoveMembers && this.currentUser.role !== 'owner') {
        throw new Error('You do not have permission to remove members from this group');
      }

      // Remove participant
      chat.participants = chat.participants.filter((p: any) => p.userId !== userId);
      chat.updatedAt = new Date().toISOString();
      setLocalStorageData('chats', allChats);

      return true;
    } catch (error) {
      console.error('Error removing member from group:', error);
      return false;
    }
  }
}

export const messagingService = MessagingService.getInstance(); 