
import { supabase } from '@/integrations/supabase/client';

export interface ActivityLog {
  user_id: string;
  user_name: string;
  user_role: string;
  activity_type: 'login' | 'logout' | 'page_view' | 'action';
  page_url?: string;
  description?: string;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
}

export const activityTrackingService = {
  // Log user activity
  async logActivity(activity: ActivityLog): Promise<void> {
    const userAgent = navigator.userAgent;
    const sessionId = sessionStorage.getItem('session_id') || crypto.randomUUID();
    
    // Store session ID if not exists
    if (!sessionStorage.getItem('session_id')) {
      sessionStorage.setItem('session_id', sessionId);
    }

    // Get user's IP (simplified approach)
    let ipAddress = '';
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      ipAddress = data.ip;
    } catch (error) {
      console.log('Could not fetch IP address:', error);
    }

    const logEntry = {
      user_id: activity.user_id,
      user_name: activity.user_name,
      user_role: activity.user_role,
      activity_type: activity.activity_type,
      page_url: activity.page_url || window.location.pathname,
      description: activity.description,
      ip_address: ipAddress,
      user_agent: userAgent,
      session_id: sessionId
    };

    const { error } = await supabase
      .from('user_activity_logs')
      .insert(logEntry);

    if (error) {
      console.error('Error logging activity:', error);
    }
  },

  // Log login activity
  async logLogin(userId: string, userName: string, userRole: string): Promise<void> {
    await this.logActivity({
      user_id: userId,
      user_name: userName,
      user_role: userRole,
      activity_type: 'login',
      description: 'User logged in'
    });
  },

  // Log logout activity
  async logLogout(userId: string, userName: string, userRole: string): Promise<void> {
    await this.logActivity({
      user_id: userId,
      user_name: userName,
      user_role: userRole,
      activity_type: 'logout',
      description: 'User logged out'
    });
  },

  // Log page view
  async logPageView(userId: string, userName: string, userRole: string, pageUrl: string): Promise<void> {
    await this.logActivity({
      user_id: userId,
      user_name: userName,
      user_role: userRole,
      activity_type: 'page_view',
      page_url: pageUrl,
      description: `Viewed page: ${pageUrl}`
    });
  },

  // Log general action
  async logAction(userId: string, userName: string, userRole: string, description: string): Promise<void> {
    await this.logActivity({
      user_id: userId,
      user_name: userName,
      user_role: userRole,
      activity_type: 'action',
      description: description
    });
  }
};
