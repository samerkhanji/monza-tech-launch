import { useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { activityTrackingService } from '@/services/activityTrackingService';

export const useActivityTracking = () => {
  const { user } = useAuth();
  const location = useLocation();

  // Track page views
  useEffect(() => {
    if (user && location.pathname !== '/login') {
      activityTrackingService.logPageView(
        user.id,
        user.name,
        user.role,
        location.pathname
      );
    }
  }, [user, location.pathname]);

  // Track login
  const trackLogin = useCallback((userId: string, userName: string, userRole: string) => {
    activityTrackingService.logLogin(userId, userName, userRole);
  }, []);

  // Track logout
  const trackLogout = useCallback((userId: string, userName: string, userRole: string) => {
    activityTrackingService.logLogout(userId, userName, userRole);
  }, []);

  // Track custom action
  const trackAction = useCallback((description: string) => {
    if (user) {
      activityTrackingService.logAction(user.id, user.name, user.role, description);
    }
  }, [user]);

  const memoizedReturn = useMemo(() => ({
    trackLogin,
    trackLogout,
    trackAction
  }), [trackLogin, trackLogout, trackAction]);

  return memoizedReturn;
};
