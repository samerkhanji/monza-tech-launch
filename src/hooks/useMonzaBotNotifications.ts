import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MonzaBotNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  timestamp: string;
  related_entity_type?: string;
  related_entity_id?: string;
}

export const useMonzaBotNotifications = () => {
  const [notifications, setNotifications] = useState<MonzaBotNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Completely disabled to prevent 401 errors and console spam
  console.log('🔇 MonzaBot notifications disabled - no authentication available');

  const loadNotifications = async () => {
    // No-op to prevent API calls
    console.log('📵 Notifications API calls disabled');
  };

  const markAllAsRead = async () => {
    // No-op to prevent API calls
    setNotifications([]);
    setUnreadCount(0);
  };

  const markAsRead = async (notificationId: string) => {
    // No-op to prevent API calls
    setNotifications([]);
    setUnreadCount(0);
  };

  // No useEffect to prevent polling
  // useEffect disabled to prevent repeated API calls

  return {
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    markAllAsRead,
    markAsRead,
    refreshNotifications: loadNotifications
  };
};
