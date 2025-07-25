
import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  link: string;
  assignedTo: string;
  eventId?: string;
  carCode?: string;
  inputBy?: string;
  inputTime?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  type?: 'info' | 'warning' | 'error' | 'success';
}

interface NotificationContextType {
  notifications: AppNotification[];
  addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  getUnreadCount: (assignedTo?: string) => number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([
    {
      id: '1',
      title: 'New vehicle arrival',
      description: 'A new Voyah Dream has arrived at the dealership',
      timestamp: '2 hours ago',
      read: false,
      link: '/new-car-arrivals',
      assignedTo: 'all',
      eventId: 'VY-2024-001',
      carCode: 'VY-2024-001',
      inputBy: 'John Smith',
      inputTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toLocaleString(),
      priority: 'medium',
      type: 'info'
    },
    {
      id: '2',
      title: 'Repair completed',
      description: 'Voyah #VY-2023-0892 repair has been completed and is ready for pickup',
      timestamp: 'Yesterday',
      read: false,
      link: '/repairs',
      assignedTo: 'all',
      eventId: 'VY-2023-0892',
      carCode: 'VY-2023-0892',
      inputBy: 'Mike Johnson',
      inputTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleString(),
      priority: 'high',
      type: 'success'
    },
    {
      id: '3',
      title: 'MonzaBot form pending review',
      description: 'New car arrival form extracted by MonzaBot requires approval',
      timestamp: '30 minutes ago',
      read: false,
      link: '/new-car-arrivals',
      assignedTo: 'all',
      inputBy: 'MonzaBot AI',
      inputTime: new Date(Date.now() - 30 * 60 * 1000).toLocaleString(),
      priority: 'medium',
      type: 'warning'
    }
  ]);

  const addNotification = (notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: AppNotification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: 'Just now',
      read: false
    };
    
    setNotifications(prev => [newNotification, ...prev]);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const getUnreadCount = (assignedTo?: string) => {
    return notifications.filter(notification => 
      !notification.read && 
      (assignedTo ? notification.assignedTo === assignedTo || notification.assignedTo === 'all' : true)
    ).length;
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      markAsRead,
      markAllAsRead,
      getUnreadCount
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
