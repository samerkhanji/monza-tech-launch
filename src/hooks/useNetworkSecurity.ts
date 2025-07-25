import { useState, useEffect, useCallback } from 'react';
import NetworkSecurityService from '@/services/networkSecurityService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface UseNetworkSecurityReturn {
  // Current network info
  currentNetwork: { ip: string; range: string } | null;
  isNetworkAuthorized: boolean;
  authorizationStatus: {
    authorized: boolean;
    network?: any;
    message: string;
  } | null;

  // Network management
  authorizedNetworks: any[];
  registerCurrentNetwork: (name: string, description?: string, features?: string[]) => Promise<{ success: boolean; message: string }>;
  updateNetworkPermissions: (networkId: string, updates: any) => Promise<{ success: boolean; message: string }>;
  removeNetworkAuthorization: (networkId: string) => Promise<{ success: boolean; message: string }>;

  // Access logs
  accessLogs: any[];
  getAccessLogs: (networkId?: string) => Promise<void>;

  // Loading states
  isLoading: boolean;
  isChecking: boolean;
  isRegistering: boolean;

  // Actions
  checkAuthorization: (feature?: string) => Promise<void>;
  refreshNetworks: () => Promise<void>;
}

export const useNetworkSecurity = (): UseNetworkSecurityReturn => {
  const { user } = useAuth();
  const [currentNetwork, setCurrentNetwork] = useState<{ ip: string; range: string } | null>(null);
  const [isNetworkAuthorized, setIsNetworkAuthorized] = useState(false);
  const [authorizationStatus, setAuthorizationStatus] = useState<any>(null);
  const [authorizedNetworks, setAuthorizedNetworks] = useState<any[]>([]);
  const [accessLogs, setAccessLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const networkService = NetworkSecurityService.getInstance();

  // Initialize network security
  useEffect(() => {
    const initializeNetworkSecurity = async () => {
      setIsLoading(true);
      try {
        // Get current network info
        const networkInfo = networkService.getCurrentNetworkInfo();
        setCurrentNetwork(networkInfo);

        // Load authorized networks
        const networks = await networkService.getAuthorizedNetworks();
        setAuthorizedNetworks(networks);

        // Check current network authorization
        await checkAuthorization();
      } catch (error) {
        console.error('Failed to initialize network security:', error);
        toast({
          title: "Network Security Error",
          description: "Failed to initialize network security",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    initializeNetworkSecurity();
  }, []);

  // Check network authorization
  const checkAuthorization = useCallback(async (feature: string = '*') => {
    setIsChecking(true);
    try {
      const status = await networkService.isNetworkAuthorized(feature);
      setAuthorizationStatus(status);
      setIsNetworkAuthorized(status.authorized);

      if (!status.authorized) {
        toast({
          title: "⚠️ Network Not Authorized",
          description: status.message,
          variant: "destructive",
        });
      } else {
        console.log('Network authorized:', status.message);
      }
    } catch (error) {
      console.error('Failed to check network authorization:', error);
      setAuthorizationStatus({
        authorized: false,
        message: 'Failed to check network authorization',
      });
      setIsNetworkAuthorized(false);
    } finally {
      setIsChecking(false);
    }
  }, [networkService]);

  // Register current network
  const registerCurrentNetwork = useCallback(async (
    name: string,
    description: string = '',
    features: string[] = ['*']
  ) => {
    setIsRegistering(true);
    try {
      const result = await networkService.registerCurrentNetwork(name, description, features);
      
      if (result.success) {
        toast({
          title: "✅ Network Registered",
          description: result.message,
          variant: "default",
        });

        // Refresh networks list
        const networks = await networkService.getAuthorizedNetworks();
        setAuthorizedNetworks(networks);

        // Re-check authorization
        await checkAuthorization();
      } else {
        toast({
          title: "❌ Registration Failed",
          description: result.message,
          variant: "destructive",
        });
      }

      return result;
    } catch (error) {
      console.error('Failed to register network:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: "❌ Registration Error",
        description: `Failed to register network: ${errorMessage}`,
        variant: "destructive",
      });
      return { success: false, message: errorMessage };
    } finally {
      setIsRegistering(false);
    }
  }, [networkService, checkAuthorization]);

  // Update network permissions
  const updateNetworkPermissions = useCallback(async (
    networkId: string,
    updates: any
  ) => {
    try {
      const result = await networkService.updateNetworkPermissions(networkId, updates);
      
      if (result.success) {
        toast({
          title: "✅ Permissions Updated",
          description: result.message,
          variant: "default",
        });

        // Refresh networks list
        const networks = await networkService.getAuthorizedNetworks();
        setAuthorizedNetworks(networks);
      } else {
        toast({
          title: "❌ Update Failed",
          description: result.message,
          variant: "destructive",
        });
      }

      return result;
    } catch (error) {
      console.error('Failed to update network permissions:', error);
      return { success: false, message: 'Failed to update permissions' };
    }
  }, [networkService]);

  // Remove network authorization
  const removeNetworkAuthorization = useCallback(async (networkId: string) => {
    try {
      const result = await networkService.removeNetworkAuthorization(networkId);
      
      if (result.success) {
        toast({
          title: "✅ Network Removed",
          description: result.message,
          variant: "default",
        });

        // Refresh networks list
        const networks = await networkService.getAuthorizedNetworks();
        setAuthorizedNetworks(networks);
      } else {
        toast({
          title: "❌ Removal Failed",
          description: result.message,
          variant: "destructive",
        });
      }

      return result;
    } catch (error) {
      console.error('Failed to remove network authorization:', error);
      return { success: false, message: 'Failed to remove authorization' };
    }
  }, [networkService]);

  // Get access logs
  const getAccessLogs = useCallback(async (networkId?: string) => {
    try {
      const logs = await networkService.getNetworkAccessLogs(networkId);
      setAccessLogs(logs);
    } catch (error) {
      console.error('Failed to get access logs:', error);
      toast({
        title: "❌ Logs Error",
        description: "Failed to retrieve access logs",
        variant: "destructive",
      });
    }
  }, [networkService]);

  // Refresh networks
  const refreshNetworks = useCallback(async () => {
    try {
      const networks = await networkService.getAuthorizedNetworks();
      setAuthorizedNetworks(networks);
    } catch (error) {
      console.error('Failed to refresh networks:', error);
    }
  }, [networkService]);

  return {
    // Current network info
    currentNetwork,
    isNetworkAuthorized,
    authorizationStatus,

    // Network management
    authorizedNetworks,
    registerCurrentNetwork,
    updateNetworkPermissions,
    removeNetworkAuthorization,

    // Access logs
    accessLogs,
    getAccessLogs,

    // Loading states
    isLoading,
    isChecking,
    isRegistering,

    // Actions
    checkAuthorization,
    refreshNetworks,
  };
};

// Helper hook for network authorization check
export const useNetworkAuthorization = (feature: string = '*') => {
  const { isNetworkAuthorized, authorizationStatus, checkAuthorization } = useNetworkSecurity();

  useEffect(() => {
    checkAuthorization(feature);
  }, [feature, checkAuthorization]);

  return {
    isAuthorized: isNetworkAuthorized,
    status: authorizationStatus,
    checkAuth: () => checkAuthorization(feature),
  };
}; 