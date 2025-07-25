export interface AccessRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  userRole: string;
  ipAddress: string;
  networkRange: string;
  requestTime: string;
  status: 'pending' | 'approved' | 'denied';
  approvedBy?: string;
  approvedAt?: string;
  reason?: string;
  deviceInfo: {
    userAgent: string;
    platform: string;
    location?: string;
  };
}

export interface AccessNotification {
  id: string;
  type: 'employee_external_access' | 'suspicious_activity' | 'new_device';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  read: boolean;
  actionRequired: boolean;
  accessRequestId?: string;
  metadata: Record<string, any>;
}

class AccessNotificationService {
  private static instance: AccessNotificationService;

  private constructor() {}

  static getInstance(): AccessNotificationService {
    if (!this.instance) {
      this.instance = new AccessNotificationService();
    }
    return this.instance;
  }

  // Create access request when employee tries to access from external network
  async createAccessRequest(
    userId: string,
    userEmail: string,
    userName: string,
    userRole: string,
    ipAddress: string,
    networkRange: string
  ): Promise<AccessRequest | null> {
    try {
      const deviceInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        location: await this.getLocationFromIP(ipAddress),
      };

      const accessRequest: AccessRequest = {
        id: this.generateId(),
        userId,
        userEmail,
        userName,
        userRole,
        ipAddress,
        networkRange,
        requestTime: new Date().toISOString(),
        status: 'pending',
        deviceInfo,
      };

      // Store in localStorage
      this.saveAccessRequest(accessRequest);

      // Create notification for owners
      await this.createOwnerNotification(accessRequest);

      return accessRequest;
    } catch (error) {
      console.error('Error creating access request:', error);
      return null;
    }
  }

  // Create notification for owners
  async createOwnerNotification(accessRequest: AccessRequest): Promise<void> {
    try {
      const notification: AccessNotification = {
        id: this.generateId(),
        type: 'employee_external_access',
        title: 'Employee External Access Request',
        message: `${accessRequest.userName} (${accessRequest.userEmail}) is attempting to access Monza Tech Software from external network ${accessRequest.networkRange} (${accessRequest.ipAddress})`,
        priority: 'high',
        createdAt: new Date().toISOString(),
        read: false,
        actionRequired: true,
        accessRequestId: accessRequest.id,
        metadata: {
          userId: accessRequest.userId,
          userRole: accessRequest.userRole,
          ipAddress: accessRequest.ipAddress,
          networkRange: accessRequest.networkRange,
          deviceInfo: accessRequest.deviceInfo,
        },
      };

      // Store in localStorage
      this.saveNotification(notification);

      // Show browser notification if supported
      this.showBrowserNotification(notification);
    } catch (error) {
      console.error('Error creating owner notification:', error);
    }
  }

  // Get location from IP address
  private async getLocationFromIP(ip: string): Promise<string | null> {
    try {
      const response = await fetch(`https://ipapi.co/${ip}/json/`);
      const data = await response.json();
      
      if (data.city && data.country) {
        return `${data.city}, ${data.country}`;
      }
      return null;
    } catch (error) {
      console.error('Failed to get location from IP:', error);
      return null;
    }
  }

  // Approve access request
  async approveAccessRequest(
    requestId: string,
    approvedBy: string,
    reason?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const requests = this.getAccessRequests();
      const requestIndex = requests.findIndex(r => r.id === requestId);
      
      if (requestIndex === -1) {
        return { success: false, message: 'Access request not found' };
      }

      requests[requestIndex].status = 'approved';
      requests[requestIndex].approvedBy = approvedBy;
      requests[requestIndex].approvedAt = new Date().toISOString();
      requests[requestIndex].reason = reason || 'Approved by owner';

      // Update localStorage
      localStorage.setItem('monza_access_requests', JSON.stringify(requests));

      // Mark notification as read
      this.markNotificationAsRead(requestId);

      return { success: true, message: 'Access request approved' };
    } catch (error) {
      console.error('Error approving access request:', error);
      return { success: false, message: 'Error approving request' };
    }
  }

  // Deny access request
  async denyAccessRequest(
    requestId: string,
    deniedBy: string,
    reason: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const requests = this.getAccessRequests();
      const requestIndex = requests.findIndex(r => r.id === requestId);
      
      if (requestIndex === -1) {
        return { success: false, message: 'Access request not found' };
      }

      requests[requestIndex].status = 'denied';
      requests[requestIndex].approvedBy = deniedBy;
      requests[requestIndex].approvedAt = new Date().toISOString();
      requests[requestIndex].reason = reason || 'Denied by owner';

      // Update localStorage
      localStorage.setItem('monza_access_requests', JSON.stringify(requests));

      // Mark notification as read
      this.markNotificationAsRead(requestId);

      return { success: true, message: 'Access request denied' };
    } catch (error) {
      console.error('Error denying access request:', error);
      return { success: false, message: 'Error denying request' };
    }
  }

  // Mark notification as read
  private markNotificationAsRead(requestId: string): void {
    try {
      const notifications = this.getNotifications();
      const notificationIndex = notifications.findIndex(n => n.accessRequestId === requestId);
      
      if (notificationIndex !== -1) {
        notifications[notificationIndex].read = true;
        localStorage.setItem('monza_access_notifications', JSON.stringify(notifications));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  // Get pending access requests
  async getPendingAccessRequests(): Promise<AccessRequest[]> {
    try {
      const requests = this.getAccessRequests();
      return requests.filter(r => r.status === 'pending');
    } catch (error) {
      console.error('Error getting pending access requests:', error);
      return [];
    }
  }

  // Get owner notifications
  async getOwnerNotifications(): Promise<AccessNotification[]> {
    try {
      return this.getNotifications();
    } catch (error) {
      console.error('Error getting owner notifications:', error);
      return [];
    }
  }

  // Mark notification as read
  async markNotificationAsReadById(notificationId: string): Promise<void> {
    try {
      const notifications = this.getNotifications();
      const notificationIndex = notifications.findIndex(n => n.id === notificationId);
      
      if (notificationIndex !== -1) {
        notifications[notificationIndex].read = true;
        localStorage.setItem('monza_access_notifications', JSON.stringify(notifications));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  // Check if user has pending access request
  async hasPendingAccessRequest(userId: string): Promise<boolean> {
    try {
      const requests = this.getAccessRequests();
      return requests.some(r => r.userId === userId && r.status === 'pending');
    } catch (error) {
      console.error('Error checking pending access request:', error);
      return false;
    }
  }

  // Helper methods for localStorage
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private saveAccessRequest(request: AccessRequest): void {
    const requests = this.getAccessRequests();
    requests.push(request);
    localStorage.setItem('monza_access_requests', JSON.stringify(requests));
  }

  private saveNotification(notification: AccessNotification): void {
    const notifications = this.getNotifications();
    notifications.push(notification);
    localStorage.setItem('monza_access_notifications', JSON.stringify(notifications));
  }

  private getAccessRequests(): AccessRequest[] {
    try {
      const stored = localStorage.getItem('monza_access_requests');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting access requests from localStorage:', error);
      return [];
    }
  }

  private getNotifications(): AccessNotification[] {
    try {
      const stored = localStorage.getItem('monza_access_notifications');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting notifications from localStorage:', error);
      return [];
    }
  }

  // Show browser notification
  private showBrowserNotification(notification: AccessNotification): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id,
      });
    }
  }

  // Request notification permission
  async requestNotificationPermission(): Promise<boolean> {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }
}

export default AccessNotificationService; 