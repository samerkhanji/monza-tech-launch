import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Smartphone, Wifi, WifiOff } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export const PWAInstallButton: React.FC = () => {
  const {
    canInstall,
    isInstalled,
    isOnline,
    isUpdateAvailable,
    installPWA,
    handleUpdate,
    getStorageInfo,
  } = usePWA();

  const storageInfo = getStorageInfo();

  // Don't show anything if already installed and no update available
  if (isInstalled && !isUpdateAvailable) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs text-gray-500">
                {isOnline ? (
                  <Wifi className="h-3 w-3 text-green-500" />
                ) : (
                  <WifiOff className="h-3 w-3 text-red-500" />
                )}
                <Smartphone className="h-3 w-3" />
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-xs">
              <div className="flex items-center gap-2">
        <Smartphone className="w-4 h-4" />
        PWA Installed
      </div>
              <div>🌐 {isOnline ? 'Online' : 'Offline'}</div>
              {storageInfo && (
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Storage: {storageInfo.used} / {storageInfo.available} ({storageInfo.percentage}%)
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Show update button if update available
  if (isUpdateAvailable) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={handleUpdate}
              className="flex items-center gap-2 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Update App</span>
              <Badge variant="destructive" className="h-2 w-2 p-0 rounded-full animate-pulse" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-xs">
              🔄 New version available!<br />
              Click to update and restart
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Show install button if can install
  if (canInstall) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={installPWA}
              className="flex items-center gap-2 bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Install App</span>
              <Smartphone className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-xs">
              Install Monza S.A.L. as an app<br />
              • Work offline<br />
              • Faster loading<br />
              • Native app experience
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Show connection status if online but not installable
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            {isOnline ? (
              <Wifi className="h-3 w-3 text-green-500" />
            ) : (
              <WifiOff className="h-3 w-3 text-red-500" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs">
            🌐 {isOnline ? 'Online' : 'Offline Mode'}
            {storageInfo && (
              <div className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Storage: {storageInfo.percentage}% used
        </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}; 