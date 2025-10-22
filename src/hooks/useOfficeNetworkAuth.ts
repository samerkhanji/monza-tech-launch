import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { 
  isInDefaultOfficeNetwork, 
  getCurrentNetworkInfo,
  getNetworkConfigForIP,
  DEFAULT_OFFICE_NETWORK,
  isOwner,
  shouldAllowAccess
} from '@/config/networkConfig';
import AccessNotificationService from '@/services/accessNotificationService';
import DeviceTrustService from '@/services/deviceTrustService';

interface UseOfficeNetworkAuthReturn {
  isAuthorized: boolean;
  isLoading: boolean;
  networkInfo: { ip: string; range: string } | null;
  networkConfig: typeof DEFAULT_OFFICE_NETWORK | null;
  checkAuthorization: () => Promise<void>;
  authorizeNetwork: () => void;
  accessStatus: {
    allowed: boolean;
    reason: string;
    requiresNotification: boolean;
    notificationMessage: string;
  } | null;
  pendingRequest: boolean;
}

export const useOfficeNetworkAuth = (): UseOfficeNetworkAuthReturn => {
  const { user } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [networkInfo, setNetworkInfo] = useState<{ ip: string; range: string } | null>(null);
  const [networkConfig, setNetworkConfig] = useState<typeof DEFAULT_OFFICE_NETWORK | null>(null);
  const [accessStatus, setAccessStatus] = useState<{
    allowed: boolean;
    reason: string;
    requiresNotification: boolean;
    notificationMessage: string;
  } | null>(null);
  const [pendingRequest, setPendingRequest] = useState(false);

  const notificationService = AccessNotificationService.getInstance();
  const deviceTrust = DeviceTrustService.getInstance();

  const checkAuthorization = useCallback(async () => {
    setIsLoading(true);
    try {
      // Check if already authorized in localStorage
      const storedAuth = localStorage.getItem('monza_office_network_authorized');
      const storedIP = localStorage.getItem('monza_office_network_ip');
      
      if (storedAuth === 'true' && storedIP) {
        setIsAuthorized(true);
        setNetworkConfig(DEFAULT_OFFICE_NETWORK);
        setNetworkInfo({ ip: storedIP, range: storedIP.replace(/\d+$/, '0/24') });
        setAccessStatus({
          allowed: true,
          reason: 'Previously authorized network',
          requiresNotification: false,
          notificationMessage: '',
        });
        return;
      }

      // Get current network info
      const info = await getCurrentNetworkInfo();
      setNetworkInfo(info);

      if (info && user) {
        // If owner has trusted this device, allow immediately
        if (user.role?.toUpperCase() === 'OWNER' && deviceTrust.isTrustedOwnerDevice(user.id)) {
          setIsAuthorized(true);
          setAccessStatus({
            allowed: true,
            reason: 'Trusted owner device',
            requiresNotification: false,
            notificationMessage: '',
          });
          setNetworkConfig(DEFAULT_OFFICE_NETWORK);
          return;
        }
        // Check if this is the default office network
        const isOfficeNetwork = isInDefaultOfficeNetwork(info.ip);
        const config = getNetworkConfigForIP(info.ip);
        
        setNetworkConfig(config);

        // Check access based on user role and network
        const accessCheck = shouldAllowAccess(user.role, info.ip, isOfficeNetwork);
        setAccessStatus(accessCheck);

        if (accessCheck.allowed) {
          setIsAuthorized(true);
          
          if (isOfficeNetwork) {
            console.log('✅ Employee access granted from office network:', info.ip);
            toast({
              title: "✅ Office Network Access",
              description: "Welcome to Monza Tech Software - Full access granted",
              variant: "default",
            });
          } else if (isOwner(user.role)) {
            console.log('✅ Owner access granted from external network:', info.ip);
            toast({
              title: "✅ Owner Access Granted",
              description: "Owner access from external network - Full access granted",
              variant: "default",
            });
          }
        } else {
          setIsAuthorized(false);
          
          if (accessCheck.requiresNotification) {
            console.log('⚠️ Employee attempting external access - notification sent');
            
            // Check if user already has a pending request
            const hasPending = await notificationService.hasPendingAccessRequest(user.id);
            setPendingRequest(hasPending);
            
            if (!hasPending) {
              // Create access request and notification
              await notificationService.createAccessRequest(
                user.id,
                user.email,
                user.name || user.email,
                user.role,
                info.ip,
                info.range
              );
              setPendingRequest(true);
            }
            
            toast({
              title: "⚠️ Access Request Sent",
              description: "Your access request has been sent to the owner for approval",
              variant: "destructive",
            });
          } else {
            toast({
              title: "❌ Access Denied",
              description: accessCheck.reason,
              variant: "destructive",
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to check network authorization:', error);
      setIsAuthorized(false);
      setAccessStatus({
        allowed: false,
        reason: 'Failed to check network authorization',
        requiresNotification: false,
        notificationMessage: '',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, notificationService]);

  const authorizeNetwork = useCallback(() => {
    if (networkInfo) {
      // Store in localStorage that this network should be authorized
      localStorage.setItem('monza_office_network_authorized', 'true');
      localStorage.setItem('monza_office_network_ip', networkInfo.ip);
      localStorage.setItem('monza_office_network_range', networkInfo.range);
      
      setIsAuthorized(true);
      setNetworkConfig(DEFAULT_OFFICE_NETWORK);
      setAccessStatus({
        allowed: true,
        reason: 'Manually authorized network',
        requiresNotification: false,
        notificationMessage: '',
      });
      
      toast({
        title: "✅ Network Authorized",
        description: "This network is now authorized for Monza Tech Software",
        variant: "default",
      });
    }
  }, [networkInfo]);

  useEffect(() => {
    checkAuthorization();
  }, [checkAuthorization]);

  return {
    isAuthorized,
    isLoading,
    networkInfo,
    networkConfig,
    checkAuthorization,
    authorizeNetwork,
    accessStatus,
    pendingRequest,
  };
}; 