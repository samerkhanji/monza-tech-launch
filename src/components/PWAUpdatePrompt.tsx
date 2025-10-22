import React, { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Wifi, WifiOff } from 'lucide-react';

export default function PWAUpdatePrompt() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  return (
    <>
      {/* Offline Ready Notification */}
      {offlineReady && (
        <Card className="fixed bottom-4 right-4 z-50 w-80 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
              <WifiOff className="h-5 w-5" />
              App Ready for Offline Use
            </CardTitle>
            <CardDescription className="text-green-700 dark:text-green-300">
              Monza TECH is now available offline. You can use the app without an internet connection.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={close}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              Got it
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Update Available Notification */}
      {needRefresh && (
        <Card className="fixed bottom-4 right-4 z-50 w-80 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
              <Download className="h-5 w-5" />
              New Version Available
            </CardTitle>
            <CardDescription className="text-blue-700 dark:text-blue-300">
              A new version of Monza TECH is available. Click to update and get the latest features.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              onClick={() => updateServiceWorker(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Update Now
            </Button>
            <Button 
              onClick={close}
              variant="outline"
              className="w-full border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-900"
            >
              Later
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Connection Status Indicator */}
      <div className="fixed top-4 right-4 z-40">
        {!isOnline && (
          <div className="flex items-center gap-2 rounded-lg bg-yellow-100 px-3 py-2 text-sm text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            <WifiOff className="h-4 w-4" />
            Offline Mode
          </div>
        )}
      </div>
    </>
  );
}
