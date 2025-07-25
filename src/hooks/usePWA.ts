import { useState, useEffect } from 'react';
import PWAService from '@/services/pwaService';
import { toast } from '@/hooks/use-toast';

interface PWAState {
  isOnline: boolean;
  canInstall: boolean;
  isInstalled: boolean;
  isUpdateAvailable: boolean;
  storageUsage: {
    used: number;
    available: number;
    usage: number;
  } | null;
}

export const usePWA = () => {
  const [pwaState, setPwaState] = useState<PWAState>({
    isOnline: navigator.onLine,
    canInstall: false,
    isInstalled: false,
    isUpdateAvailable: false,
    storageUsage: null,
  });

  const pwaService = PWAService.getInstance();

  useEffect(() => {
    // Initialize PWA state
    const updatePWAState = async () => {
      const storageUsage = await pwaService.getStorageUsage();
      
      setPwaState(prev => ({
        ...prev,
        canInstall: pwaService.canInstall(),
        isInstalled: pwaService.isAppInstalled(),
        isOnline: pwaService.isOnline(),
        storageUsage,
      }));
    };

    updatePWAState();

    // Listen for online/offline events
    const handleOnline = () => {
      setPwaState(prev => ({ ...prev, isOnline: true }));
      toast({
        title: "🌐 Connection Restored",
        description: "You're back online! Data will sync automatically.",
      });
    };

    const handleOffline = () => {
      setPwaState(prev => ({ ...prev, isOnline: false }));
      toast({
        title: "📡 You're Offline",
        description: "Don't worry! Your changes will sync when you're back online.",
        variant: "destructive",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for app installed
    const handleAppInstalled = () => {
      setPwaState(prev => ({ ...prev, isInstalled: true, canInstall: false }));
      toast({
        title: "🎉 App Installed!",
        description: "Monza S.A.L. has been installed on your device.",
      });
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = () => {
      setPwaState(prev => ({ ...prev, canInstall: true }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Setup update available callback
    pwaService.onUpdateAvailable(() => {
      setPwaState(prev => ({ ...prev, isUpdateAvailable: true }));
      toast({
        title: "🔄 Update Available",
        description: "A new version of Monza S.A.L. is ready to install.",
      });
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [pwaService]);

  // Install PWA
  const installPWA = async (): Promise<boolean> => {
    try {
      const success = await pwaService.showInstallPrompt();
      
      if (success) {
        setPwaState(prev => ({ ...prev, canInstall: false }));
        toast({
          title: "📱 Installing App...",
          description: "Monza S.A.L. is being installed on your device.",
        });
      }
      
      return success;
    } catch (error) {
      console.error('Failed to install PWA:', error);
      toast({
        title: "❌ Installation Failed",
        description: "Failed to install the app. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Update PWA
  const handleUpdate = async (): Promise<void> => {
    try {
      await pwaService.skipWaiting();
      setPwaState(prev => ({ ...prev, isUpdateAvailable: false }));
      
      toast({
        title: "🔄 Updating...",
        description: "The app will reload with the latest version.",
      });
    } catch (error) {
      console.error('Failed to update PWA:', error);
      toast({
        title: "❌ Update Failed",
        description: "Failed to update the app. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Add data to background sync
  const addToBackgroundSync = async (tag: string, data: any): Promise<void> => {
    try {
      await pwaService.addToBackgroundSync(tag, data);
    } catch (error) {
      console.error('Failed to add to background sync:', error);
    }
  };

  // Request persistent storage
  const requestPersistentStorage = async (): Promise<boolean> => {
    try {
      const granted = await pwaService.requestPersistentStorage();
      
      if (granted) {
        toast({
          title: "💾 Storage Secured",
          description: "Your data will be stored persistently.",
        });
      } else {
        toast({
          title: "⚠️ Storage Limited",
          description: "Data may be cleared by the browser when storage is low.",
          variant: "destructive",
        });
      }
      
      return granted;
    } catch (error) {
      console.error('Failed to request persistent storage:', error);
      return false;
    }
  };

  // Clear app data
  const clearAppData = async (): Promise<void> => {
    try {
      await pwaService.clearAppData();
      
      toast({
        title: "🧹 Data Cleared",
        description: "All app data has been cleared. The page will reload.",
      });
      
      // Reload after clearing data
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Failed to clear app data:', error);
      toast({
        title: "❌ Clear Failed",
        description: "Failed to clear app data. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Get storage usage percentage
  const getStorageUsagePercentage = (): number => {
    return pwaState.storageUsage?.usage || 0;
  };

  // Format storage size
  const formatStorageSize = (bytes: number): string => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
  };

  // Get formatted storage info
  const getStorageInfo = () => {
    if (!pwaState.storageUsage) return null;
    
    return {
      used: formatStorageSize(pwaState.storageUsage.used),
      available: formatStorageSize(pwaState.storageUsage.available),
      percentage: Math.round(pwaState.storageUsage.usage),
    };
  };

  return {
    // State
    isOnline: pwaState.isOnline,
    canInstall: pwaState.canInstall,
    isInstalled: pwaState.isInstalled,
    isUpdateAvailable: pwaState.isUpdateAvailable,
    storageUsage: pwaState.storageUsage,
    
    // Actions
    installPWA,
    handleUpdate,
    addToBackgroundSync,
    requestPersistentStorage,
    clearAppData,
    
    // Utilities
    getStorageUsagePercentage,
    getStorageInfo,
  };
}; 