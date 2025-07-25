import React, { useState, useEffect } from 'react';
import { BellDot, Eye, Clock, User, Car } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';
import NotificationCenter from '@/components/NotificationCenter';
import AutomatedNotificationCenter from '@/components/AutomatedNotificationCenter';
import { ComprehensiveNotificationService } from '@/services/comprehensiveNotificationService';

interface NotificationBellProps {
  className?: string;
}

const NotificationBell = ({ className }: NotificationBellProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notifications, markAsRead, markAllAsRead, getUnreadCount } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [showAutomatedNotificationCenter, setShowAutomatedNotificationCenter] = useState(false);
  const [comprehensiveUnreadCount, setComprehensiveUnreadCount] = useState(0);

  // Initialize comprehensive notification system
  useEffect(() => {
    try {
      ComprehensiveNotificationService.initializeSampleData();
      updateComprehensiveCount();
    } catch (error) {
      console.error('Error initializing comprehensive notifications:', error);
    }
  }, []);

  const updateComprehensiveCount = () => {
    try {
      const count = ComprehensiveNotificationService.getUnreadCount();
      setComprehensiveUnreadCount(count);
    } catch (error) {
      console.error('Error getting comprehensive count:', error);
      setComprehensiveUnreadCount(0);
    }
  };

  const userNotifications = notifications.filter(notification => 
    notification.assignedTo === user?.name || notification.assignedTo === 'all'
  );

  const legacyUnreadCount = getUnreadCount(user?.name);
  const totalUnreadCount = legacyUnreadCount + comprehensiveUnreadCount;

  const handleBellClick = () => {
    console.log('Bell clicked, current isOpen state:', isOpen);
    setIsOpen(!isOpen);
  };

  const handleOpenNotificationCenter = () => {
    console.log('Opening notification center');
    setIsOpen(false);
    setShowNotificationCenter(true);
  };

  return (
    <>
      {/* Simple dropdown instead of Popover for debugging */}
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "relative p-2 rounded-full text-monza-grey hover:bg-monza-yellow/20 transition-colors",
            className
          )}
          aria-label={`${totalUnreadCount} notifications`}
          onClick={handleBellClick}
        >
          <BellDot className="h-5 w-5" />
          {totalUnreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 flex items-center justify-center p-0 text-xs animate-pulse text-red-500"
            >
              {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
            </Badge>
          )}
        </Button>

        {/* Simple dropdown menu */}
        {isOpen && (
          <div className="absolute right-0 top-12 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader className="pb-3">
                <div className="notification-header">
                  <CardTitle className="text-lg">Quick Notifications</CardTitle>
                  <div className="notification-header-buttons">
                    <Badge variant="secondary" className="notification-badge">{legacyUnreadCount} legacy</Badge>
                    <Badge variant="destructive" className="notification-badge">{comprehensiveUnreadCount} business</Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAutomatedNotificationCenter(true)}
                      className="notification-button"
                    >
                      Automated Center
                    </Button>
                    {totalUnreadCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={markAllAsRead}
                        className="notification-mark-all-read"
                      >
                        Mark all read
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                {/* Show comprehensive notification center button */}
                <div className="p-4 border-b border-gray-100 bg-blue-50">
                  <Button 
                    className="w-full" 
                    onClick={handleOpenNotificationCenter}
                    variant="default"
                  >
                    <BellDot className="h-4 w-4 mr-2" />
                    Open Business Notification Center
                    {comprehensiveUnreadCount > 0 && (
                      <Badge variant="destructive" className="ml-2">
                        {comprehensiveUnreadCount}
                      </Badge>
                    )}
                  </Button>
                </div>

                {userNotifications.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    <BellDot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No legacy notifications</p>
                    <p className="text-xs mt-2">Use the Business Notification Center above for comprehensive tracking</p>
                  </div>
                ) : (
                  <div className="max-h-60 overflow-y-auto">
                    {userNotifications.slice(0, 5).map((notification) => (
                      <div
                        key={notification.id}
                        className={cn(
                          "p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors",
                          !notification.read && "bg-blue-50"
                        )}
                        onClick={() => {
                          console.log('Notification clicked:', notification);
                          markAsRead(notification.id);
                          setIsOpen(false);
                          navigate(notification.link);
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className={cn(
                                "text-sm font-medium",
                                !notification.read && "font-semibold"
                              )}>
                                {notification.title}
                              </h4>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                              )}
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-2">
                              {notification.description}
                            </p>
                            
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {notification.timestamp}
                              </div>
                              {notification.assignedTo !== 'all' && (
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {notification.assignedTo}
                                </div>
                              )}
                              {notification.eventId && (
                                <div className="flex items-center gap-1">
                                  <Car className="h-3 w-3" />
                                  #{notification.eventId}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('View details clicked:', notification);
                              markAsRead(notification.id);
                              setIsOpen(false);
                              navigate(notification.link);
                            }}
                            className="shrink-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {userNotifications.length > 5 && (
                      <div className="p-4 text-center">
                        <Button variant="outline" size="sm" onClick={handleOpenNotificationCenter}>
                          View all {userNotifications.length} notifications
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Click outside to close */}
        {isOpen && (
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => {
              console.log('Clicked outside, closing dropdown');
              setIsOpen(false);
            }}
          />
        )}
      </div>

      <NotificationCenter 
        isOpen={showNotificationCenter} 
        onClose={() => {
          setShowNotificationCenter(false);
          updateComprehensiveCount(); // Update count when closing
        }}
      />
      
      <AutomatedNotificationCenter 
        isOpen={showAutomatedNotificationCenter} 
        onClose={() => {
          setShowAutomatedNotificationCenter(false);
          updateComprehensiveCount(); // Update count when closing
        }}
      />
    </>
  );
};

export default NotificationBell;
