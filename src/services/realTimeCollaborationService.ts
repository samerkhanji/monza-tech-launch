import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface CollaborationUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: 'online' | 'offline' | 'away';
  currentPage?: string;
  lastSeen: string;
}

interface LiveUpdate {
  id: string;
  type: 'car_update' | 'schedule_change' | 'repair_status' | 'inventory_change' | 'user_activity';
  data: any;
  userId: string;
  userName: string;
  timestamp: string;
  tableName?: string;
  recordId?: string;
}

interface ConflictResolution {
  recordId: string;
  tableName: string;
  conflicts: Array<{
    field: string;
    localValue: any;
    remoteValue: any;
    timestamp: string;
    userId: string;
  }>;
}

type SubscriptionCallback = (update: LiveUpdate) => void;
type ConflictCallback = (conflict: ConflictResolution) => void;
type UserPresenceCallback = (users: CollaborationUser[]) => void;

class RealTimeCollaborationService {
  private static instance: RealTimeCollaborationService;
  private channels: Map<string, RealtimeChannel> = new Map();
  private subscriptions: Map<string, SubscriptionCallback[]> = new Map();
  private conflictCallbacks: ConflictCallback[] = [];
  private userPresenceCallbacks: UserPresenceCallback[] = [];
  private currentUser: CollaborationUser | null = null;
  private connectedUsers: Map<string, CollaborationUser> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): RealTimeCollaborationService {
    if (!this.instance) {
      this.instance = new RealTimeCollaborationService();
    }
    return this.instance;
  }

  // Initialize real-time collaboration
  async initialize(user: { id: string; name: string; email: string; avatar?: string }): Promise<void> {
    try {
      this.currentUser = {
        ...user,
        status: 'online',
        lastSeen: new Date().toISOString(),
      };

      // Setup user presence tracking
      await this.setupUserPresence();

      // Setup table subscriptions
      await this.setupTableSubscriptions();

      // Start heartbeat for presence
      this.startHeartbeat();

      console.log('🔄 Real-time collaboration initialized');
    } catch (error) {
      console.error('❌ Failed to initialize real-time collaboration:', error);
    }
  }

  // Setup user presence tracking
  private async setupUserPresence(): Promise<void> {
    const presenceChannel = supabase.channel('user_presence', {
      config: {
        presence: {
          key: this.currentUser?.id,
        },
      },
    });

    // Track user presence
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = presenceChannel.presenceState();
        this.updateConnectedUsers(presenceState);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('👋 User joined:', key, newPresences);
        this.updateConnectedUsers(presenceChannel.presenceState());
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('👋 User left:', key, leftPresences);
        this.updateConnectedUsers(presenceChannel.presenceState());
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && this.currentUser) {
          await presenceChannel.track({
            user_id: this.currentUser.id,
            name: this.currentUser.name,
            email: this.currentUser.email,
            avatar: this.currentUser.avatar,
            status: this.currentUser.status,
            current_page: window.location.pathname,
            last_seen: new Date().toISOString(),
          });
        }
      });

    this.channels.set('presence', presenceChannel);
  }

  // Setup table subscriptions for real-time updates
  private async setupTableSubscriptions(): Promise<void> {
    const tables = ['cars', 'garage_schedule', 'repair_history', 'inventory'];

    for (const table of tables) {
      const channel = supabase
        .channel(`${table}_changes`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: table,
          },
          (payload) => {
            this.handleTableChange(table, payload);
          }
        )
        .subscribe();

      this.channels.set(table, channel);
    }
  }

  // Handle table changes
  private handleTableChange(tableName: string, payload: any): void {
    const update: LiveUpdate = {
      id: `${tableName}_${Date.now()}`,
      type: this.getUpdateType(tableName, payload.eventType),
      data: payload.new || payload.old,
      userId: payload.new?.updated_by || 'system',
      userName: 'System User',
      timestamp: new Date().toISOString(),
      tableName,
      recordId: payload.new?.id || payload.old?.id,
    };

    // Skip updates from current user to avoid echo
    if (update.userId === this.currentUser?.id) {
      return;
    }

    // Emit to subscribers
    this.emitUpdate(update);

    // Check for conflicts
    this.checkForConflicts(tableName, payload);
  }

  // Get update type based on table and event
  private getUpdateType(tableName: string, eventType: string): LiveUpdate['type'] {
    switch (tableName) {
      case 'cars':
        return 'car_update';
      case 'garage_schedule':
        return 'schedule_change';
      case 'repair_history':
        return 'repair_status';
      case 'inventory':
        return 'inventory_change';
      default:
        return 'user_activity';
    }
  }

  // Update connected users list
  private updateConnectedUsers(presenceState: any): void {
    this.connectedUsers.clear();

    Object.values(presenceState).forEach((presences: any) => {
      presences.forEach((presence: any) => {
        const user: CollaborationUser = {
          id: presence.user_id,
          name: presence.name,
          email: presence.email,
          avatar: presence.avatar,
          status: presence.status || 'online',
          currentPage: presence.current_page,
          lastSeen: presence.last_seen,
        };
        this.connectedUsers.set(user.id, user);
      });
    });

    // Notify callbacks
    this.userPresenceCallbacks.forEach(callback => {
      callback(Array.from(this.connectedUsers.values()));
    });
  }

  // Start heartbeat to maintain presence
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(async () => {
      const presenceChannel = this.channels.get('presence');
      if (presenceChannel && this.currentUser) {
        await presenceChannel.track({
          ...this.currentUser,
          current_page: window.location.pathname,
          last_seen: new Date().toISOString(),
        });
      }
    }, 30000); // Update every 30 seconds
  }

  // Emit update to subscribers
  private emitUpdate(update: LiveUpdate): void {
    const callbacks = this.subscriptions.get(update.type) || [];
    callbacks.forEach(callback => callback(update));

    // Also emit to general subscribers
    const generalCallbacks = this.subscriptions.get('all') || [];
    generalCallbacks.forEach(callback => callback(update));
  }

  // Check for data conflicts
  private checkForConflicts(tableName: string, payload: any): void {
    // This is a simplified conflict detection
    // In a real implementation, you'd compare timestamps and field versions
    if (payload.eventType === 'UPDATE') {
      const localData = this.getLocalData(tableName, payload.new.id);
      
      if (localData && localData.updated_at !== payload.new.updated_at) {
        const conflicts: ConflictResolution = {
          recordId: payload.new.id,
          tableName,
          conflicts: Object.keys(payload.new)
            .filter(key => localData[key] !== payload.new[key])
            .map(field => ({
              field,
              localValue: localData[field],
              remoteValue: payload.new[field],
              timestamp: payload.new.updated_at,
              userId: payload.new.updated_by || 'unknown',
            })),
        };

        if (conflicts.conflicts.length > 0) {
          this.conflictCallbacks.forEach(callback => callback(conflicts));
        }
      }
    }
  }

  // Get local data for conflict comparison
  private getLocalData(tableName: string, recordId: string): any {
    // This would fetch from your local state/store
    // Implementation depends on your state management
    try {
      const key = `${tableName}_${recordId}`;
      const localData = localStorage.getItem(key);
      return localData ? JSON.parse(localData) : null;
    } catch (error) {
      return null;
    }
  }

  // Public API methods

  // Subscribe to real-time updates
  subscribe(type: LiveUpdate['type'] | 'all', callback: SubscriptionCallback): () => void {
    if (!this.subscriptions.has(type)) {
      this.subscriptions.set(type, []);
    }
    
    this.subscriptions.get(type)!.push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.subscriptions.get(type);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  // Subscribe to conflict notifications
  onConflict(callback: ConflictCallback): () => void {
    this.conflictCallbacks.push(callback);
    
    return () => {
      const index = this.conflictCallbacks.indexOf(callback);
      if (index > -1) {
        this.conflictCallbacks.splice(index, 1);
      }
    };
  }

  // Subscribe to user presence updates
  onUserPresence(callback: UserPresenceCallback): () => void {
    this.userPresenceCallbacks.push(callback);
    
    // Send current users immediately
    callback(Array.from(this.connectedUsers.values()));
    
    return () => {
      const index = this.userPresenceCallbacks.indexOf(callback);
      if (index > -1) {
        this.userPresenceCallbacks.splice(index, 1);
      }
    };
  }

  // Broadcast a custom update
  async broadcast(type: LiveUpdate['type'], data: any): Promise<void> {
    const channel = this.channels.get('broadcast') || supabase.channel('custom_broadcast');
    
    if (!this.channels.has('broadcast')) {
      channel.subscribe();
      this.channels.set('broadcast', channel);
    }

    await channel.send({
      type: 'broadcast',
      event: type,
      payload: {
        ...data,
        userId: this.currentUser?.id,
        userName: this.currentUser?.name,
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Update current page for presence
  updateCurrentPage(page: string): void {
    if (this.currentUser) {
      this.currentUser.currentPage = page;
    }
  }

  // Update user status
  async updateStatus(status: CollaborationUser['status']): Promise<void> {
    if (this.currentUser) {
      this.currentUser.status = status;
      
      const presenceChannel = this.channels.get('presence');
      if (presenceChannel) {
        await presenceChannel.track({
          ...this.currentUser,
          last_seen: new Date().toISOString(),
        });
      }
    }
  }

  // Get connected users
  getConnectedUsers(): CollaborationUser[] {
    return Array.from(this.connectedUsers.values());
  }

  // Get users on specific page
  getUsersOnPage(page: string): CollaborationUser[] {
    return Array.from(this.connectedUsers.values())
      .filter(user => user.currentPage === page);
  }

  // Cleanup and disconnect
  async disconnect(): Promise<void> {
    try {
      // Update status to offline
      await this.updateStatus('offline');

      // Clear heartbeat
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
      }

      // Unsubscribe from all channels
      for (const channel of this.channels.values()) {
        await channel.unsubscribe();
      }

      this.channels.clear();
      this.subscriptions.clear();
      this.conflictCallbacks = [];
      this.userPresenceCallbacks = [];
      this.connectedUsers.clear();

      console.log('🔄 Real-time collaboration disconnected');
    } catch (error) {
      console.error('❌ Error disconnecting real-time collaboration:', error);
    }
  }
}

export default RealTimeCollaborationService; 