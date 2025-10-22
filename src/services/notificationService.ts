import { supabase } from '@/integrations/supabase/client';

export type NotificationType = 'message' | 'request' | 'car_activity';

export interface NotificationPayload {
  vin?: string;
  request_id?: string;
  message_id?: string;
  route?: string;
  [key: string]: any;
}

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  payload?: NotificationPayload;
}

/**
 * Notification Service
 * 
 * This service provides methods to create notifications programmatically
 * from various parts of the application.
 */
export class NotificationService {
  /**
   * Create a new notification
   */
  static async createNotification(params: CreateNotificationParams) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: params.userId,
          type: params.type,
          title: params.title,
          body: params.body,
          payload: params.payload || {}
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating notification:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to create notification:', error);
      throw error;
    }
  }

  /**
   * Create a message notification
   */
  static async notifyMessage(userId: string, title: string, body?: string, payload?: NotificationPayload) {
    return this.createNotification({
      userId,
      type: 'message',
      title,
      body,
      payload
    });
  }

  /**
   * Create a request notification
   */
  static async notifyRequest(userId: string, title: string, body?: string, payload?: NotificationPayload) {
    return this.createNotification({
      userId,
      type: 'request',
      title,
      body,
      payload
    });
  }

  /**
   * Create a car activity notification
   */
  static async notifyCarActivity(userId: string, title: string, body?: string, payload?: NotificationPayload) {
    return this.createNotification({
      userId,
      type: 'car_activity',
      title,
      body,
      payload
    });
  }

  /**
   * Create notifications for multiple users
   */
  static async notifyMultipleUsers(userIds: string[], params: Omit<CreateNotificationParams, 'userId'>) {
    try {
      const notifications = userIds.map(userId => ({
        user_id: userId,
        type: params.type,
        title: params.title,
        body: params.body,
        payload: params.payload || {}
      }));

      const { data, error } = await supabase
        .from('notifications')
        .insert(notifications)
        .select();

      if (error) {
        console.error('Error creating multiple notifications:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to create multiple notifications:', error);
      throw error;
    }
  }

  /**
   * Get unread count for a specific user and type
   */
  static async getUnreadCount(userId: string, type?: NotificationType) {
    try {
      let query = supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (type) {
        query = query.eq('type', type);
      }

      const { count, error } = await query;

      if (error) {
        console.error('Error getting unread count:', error);
        throw error;
      }

      return count || 0;
    } catch (error) {
      console.error('Failed to get unread count:', error);
      return 0;
    }
  }

  /**
   * Mark notifications as read
   */
  static async markAsRead(userId: string, type?: NotificationType) {
    try {
      let query = supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId);

      if (type) {
        query = query.eq('type', type);
      }

      const { error } = await query;

      if (error) {
        console.error('Error marking notifications as read:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
      return false;
    }
  }
}

// Convenience functions for common notification patterns
export const notifyService = {
  // Message notifications
  newMessage: (userId: string, senderName: string, messagePreview: string) =>
    NotificationService.notifyMessage(
      userId,
      'New message',
      `${senderName}: ${messagePreview}`,
      { route: '/messages' }
    ),

  // Request notifications
  newRequest: (userId: string, requestTitle: string, status: string) =>
    NotificationService.notifyRequest(
      userId,
      'New request',
      `${requestTitle} - Status: ${status}`,
      { route: '/requests' }
    ),

  requestUpdated: (userId: string, requestTitle: string, newStatus: string) =>
    NotificationService.notifyRequest(
      userId,
      'Request updated',
      `${requestTitle} - Status: ${newStatus}`,
      { route: '/requests' }
    ),

  // Car activity notifications
  testDriveStarted: (userIds: string[], vin: string) =>
    NotificationService.notifyMultipleUsers(
      userIds,
      {
        type: 'car_activity',
        title: 'Test Drive Started',
        body: `Test drive started for VIN: ${vin}`,
        payload: { vin, route: '/garage/test-drives' }
      }
    ),

  testDriveEnded: (userIds: string[], vin: string) =>
    NotificationService.notifyMultipleUsers(
      userIds,
      {
        type: 'car_activity',
        title: 'Test Drive Ended',
        body: `Test drive ended for VIN: ${vin}`,
        payload: { vin, route: '/garage/test-drives' }
      }
    ),

  carMoved: (userIds: string[], vin: string, newLocation: string) =>
    NotificationService.notifyMultipleUsers(
      userIds,
      {
        type: 'car_activity',
        title: 'Car Moved',
        body: `Car ${vin} moved to ${newLocation}`,
        payload: { vin, route: `/car-inventory?vin=${vin}` }
      }
    ),

  garageWorkStarted: (userIds: string[], vin: string, workType: string) =>
    NotificationService.notifyMultipleUsers(
      userIds,
      {
        type: 'car_activity',
        title: 'Garage Work Started',
        body: `${workType} started for VIN: ${vin}`,
        payload: { vin, route: '/garage/schedule' }
      }
    ),

  garageWorkCompleted: (userIds: string[], vin: string, workType: string) =>
    NotificationService.notifyMultipleUsers(
      userIds,
      {
        type: 'car_activity',
        title: 'Garage Work Completed',
        body: `${workType} completed for VIN: ${vin}`,
        payload: { vin, route: '/garage/schedule' }
      }
    )
};

export default NotificationService;
