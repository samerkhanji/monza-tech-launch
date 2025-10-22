import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Request = Tables<'requests'>;
export type Message = Tables<'messages'>;
export type Broadcast = Tables<'broadcasts'>;
export type RequestNotification = Tables<'request_notifications'>;

export type RequestWithMessages = Request & {
  messages: Message[];
  created_by_user?: {
    full_name: string;
    role: string;
  };
  assigned_to_user?: {
    full_name: string;
    role: string;
  };
};

export type MessageWithSender = Message & {
  sender?: {
    full_name: string;
    role: string;
  };
};

export interface CreateRequestData {
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category?: 'Part Request' | 'Task Help' | 'Client Issue' | 'Other';
  assigned_to?: string;
}

export interface CreateMessageData {
  request_id: string;
  message_text: string;
  mentions?: string[];
}

export interface CreateBroadcastData {
  message_text: string;
  audience: string[]; // roles or user IDs
}

export interface RequestFilters {
  status?: string;
  priority?: string;
  assigned_to?: string;
  created_by?: string;
}

class RequestMessagingService {
  private currentUser: any = null;

  setCurrentUser(user: any) {
    this.currentUser = user;
  }





  // Request operations
  async createRequest(data: CreateRequestData): Promise<Request> {
    const { data: request, error } = await supabase
      .from('requests')
      .insert({
        title: data.title,
        description: data.description ?? null,
        priority: data.priority,
        status: 'open',
        type: data.category ?? null,
        created_by: this.currentUser?.id,
        assigned_to: data.assigned_to ?? null,
      })
      .select()
      .single();

    if (error) throw error;



    return request;
  }

  async getRequests(filters?: RequestFilters): Promise<RequestWithMessages[]> {
    let query = supabase
      .from('requests')
      .select(`
        *,
        messages (*),
        created_by_user:user_profiles!requests_created_by_fkey(full_name, role),
        assigned_to_user:user_profiles!requests_assigned_to_fkey(full_name, role)
      `)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.priority) {
      query = query.eq('priority', filters.priority);
    }
    if (filters?.assigned_to) {
      query = query.eq('assigned_to', filters.assigned_to);
    }
    if (filters?.created_by) {
      query = query.eq('created_by', filters.created_by);
    }

    const { data: requests, error } = await query;

    if (error) throw error;
    return requests || [];
  }

  async getRequestById(id: string): Promise<RequestWithMessages | null> {
    const { data: request, error } = await supabase
      .from('requests')
      .select(`
        *,
        messages (*),
        created_by_user:user_profiles!requests_created_by_fkey(full_name, role),
        assigned_to_user:user_profiles!requests_assigned_to_fkey(full_name, role)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return request;
  }

  async updateRequest(id: string, updates: Partial<TablesUpdate<'requests'>>): Promise<Request> {
    const { data: request, error } = await supabase
      .from('requests')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return request;
  }

  async deleteRequest(id: string): Promise<void> {
    const { error } = await supabase
      .from('requests')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Message operations
  async createMessage(data: CreateMessageData): Promise<Message> {
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        ...data,
        sender_id: this.currentUser?.id
      })
      .select()
      .single();

    if (error) throw error;

    // Notify assigned user for the request (if any)
    try {
      const request = await this.getRequestById(data.request_id);
      if (request && request.assigned_to) {
        await supabase.from('request_notifications').insert({
          user_id: request.assigned_to,
          request_id: request.id,
          notification_type: 'request_message',
          title: `New message on: ${request.title}`,
          message: data.message_text.slice(0, 140),
          read: false,
        });
      }
    } catch (e) {
      console.error('Failed to create message notification', e);
    }

    return message;
  }

  async getMessagesByRequestId(requestId: string): Promise<MessageWithSender[]> {
    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:user_profiles!messages_sender_id_fkey(full_name, role)
      `)
      .eq('request_id', requestId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return messages || [];
  }

  async updateMessage(id: string, updates: Partial<TablesUpdate<'messages'>>): Promise<Message> {
    const { data: message, error } = await supabase
      .from('messages')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return message;
  }

  async deleteMessage(id: string): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Broadcast operations
  async createBroadcast(data: CreateBroadcastData): Promise<Broadcast> {
    const { data: broadcast, error } = await supabase
      .from('broadcasts')
      .insert({
        ...data,
        sender_id: this.currentUser?.id
      })
      .select()
      .single();

    if (error) throw error;
    return broadcast;
  }

  async getBroadcasts(): Promise<Broadcast[]> {
    const { data: broadcasts, error } = await supabase
      .from('broadcasts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return broadcasts || [];
  }

  async deleteBroadcast(id: string): Promise<void> {
    const { error } = await supabase
      .from('broadcasts')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Notification operations
  async getNotifications(): Promise<RequestNotification[]> {
    const { data: notifications, error } = await supabase
      .from('request_notifications')
      .select('*')
      .eq('user_id', this.currentUser?.id)
      .eq('read', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return notifications || [];
  }

  async markNotificationAsRead(id: string): Promise<void> {
    const { error } = await supabase
      .from('request_notifications')
      .update({ read: true })
      .eq('id', id);

    if (error) throw error;
  }

  async markAllNotificationsAsRead(): Promise<void> {
    const { error } = await supabase
      .from('request_notifications')
      .update({ read: true })
      .eq('user_id', this.currentUser?.id)
      .eq('read', false);

    if (error) throw error;
  }

  // User operations
  async getUsers(): Promise<{ id: string; full_name: string; role: string }[]> {
    try {
      const { data: users, error } = await supabase
        .from('user_profiles')
        .select('id, full_name, role')
        .order('full_name');

      if (error) throw error;
      return users || [];
    } catch (error) {
      console.warn('Failed to load users from Supabase, using mock users:', error);
      // Return only authorized users as fallback
      return [
        { id: '1', full_name: 'Houssam', role: 'Owner' },
        { id: '2', full_name: 'Samer', role: 'Owner' },
        { id: '3', full_name: 'Kareem', role: 'Owner' },
        { id: '4', full_name: 'Mark', role: 'Garage Manager' },
        { id: '5', full_name: 'Lara', role: 'Assistant' },
        { id: '6', full_name: 'Samaya', role: 'Assistant' },
        { id: '7', full_name: 'Khalil', role: 'Hybrid' },
        { id: '8', full_name: 'Tamara', role: 'Hybrid' },
        { id: '9', full_name: 'Elie', role: 'Hybrid' },
      ];
    }
  }

  // Utility functions
  async searchUsers(query: string): Promise<{ id: string; full_name: string; role: string }[]> {
    try {
      const { data: users, error } = await supabase
        .from('user_profiles')
        .select('id, full_name, role')
        .ilike('full_name', `%${query}%`)
        .order('full_name');

      if (error) throw error;
      return users || [];
    } catch (error) {
      console.warn('Failed to search users from Supabase, using mock users:', error);
      // Return filtered authorized users as fallback
      const authorizedUsers = [
        { id: '1', full_name: 'Houssam', role: 'Owner' },
        { id: '2', full_name: 'Samer', role: 'Owner' },
        { id: '3', full_name: 'Kareem', role: 'Owner' },
        { id: '4', full_name: 'Mark', role: 'Garage Manager' },
        { id: '5', full_name: 'Lara', role: 'Assistant' },
        { id: '6', full_name: 'Samaya', role: 'Assistant' },
        { id: '7', full_name: 'Khalil', role: 'Hybrid' },
        { id: '8', full_name: 'Tamara', role: 'Hybrid' },
        { id: '9', full_name: 'Elie', role: 'Hybrid' },
      ];
      return authorizedUsers.filter(user => 
        user.full_name.toLowerCase().includes(query.toLowerCase()) ||
        user.role.toLowerCase().includes(query.toLowerCase())
      );
    }
  }

  // Mention parsing
  parseMentions(text: string): string[] {
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[1]);
    }

    return mentions;
  }

  // Real-time subscriptions
  subscribeToRequests(callback: (payload: any) => void) {
    return supabase
      .channel('requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, callback)
      .subscribe();
  }

  subscribeToMessages(callback: (payload: any) => void) {
    return supabase
      .channel('messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, callback)
      .subscribe();
  }

  subscribeToNotifications(callback: (payload: any) => void) {
    return supabase
      .channel('notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'request_notifications' }, callback)
      .subscribe();
  }
}

export const requestMessagingService = new RequestMessagingService(); 