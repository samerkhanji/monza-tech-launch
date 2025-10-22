import React, { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert-fixed';
import { Button } from '@/components/ui/button';
import { useNetworkSecurity } from '@/hooks/useNetworkSecurity';
import { Shield, Wifi, AlertTriangle, CheckCircle, XCircle, Settings } from 'lucide-react';
import NetworkRegistrationDialog from './NetworkRegistrationDialog';

const NetworkSecurityBanner: React.FC = () => {
  const { 
    currentNetwork, 
    isNetworkAuthorized, 
    authorizationStatus, 
    isChecking,
    checkAuthorization 
  } = useNetworkSecurity();
  
  const [showRegistrationDialog, setShowRegistrationDialog] = useState(false);

  // Don't show banner if still checking
  if (isChecking) {
    return (
      <Alert className="border-blue-200 bg-blue-50">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
          <AlertTitle>Checking Network Authorization...</AlertTitle>
        </div>
        <AlertDescription>
          Verifying network access permissions for Monza Tech Software.
        </AlertDescription>
      </Alert>
    );
  }

  // Don't show banner if network is authorized
  if (isNetworkAuthorized) {
    return null;
  }

  // Show unauthorized network banner
  return (
    <>
      <Alert className="border-red-200 bg-red-50 mb-4">
        <div className="flex items-start gap-3">
          <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
          <div className="flex-1">
            <AlertTitle className="text-red-900">
              Network Not Authorized
            </AlertTitle>
            <AlertDescription className="text-red-800 mt-2">
              <div className="space-y-2">
                <p>
                  Your current network ({currentNetwork?.range || 'Unknown'}) is not authorized 
                  to access Monza Tech Software.
                </p>
                
                {authorizationStatus?.message && (
                  <p className="text-sm font-medium">
                    Reason: {authorizationStatus.message}
                  </p>
                )}

                <div className="bg-white p-3 rounded border border-red-200">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Current IP:</span>
                      <p className="text-gray-600 font-mono">{currentNetwork?.ip || 'Unknown'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Network Range:</span>
                      <p className="text-gray-600 font-mono">{currentNetwork?.range || 'Unknown'}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => setShowRegistrationDialog(true)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Register This Network
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => checkAuthorization()}
                  >
                    <Wifi className="h-4 w-4 mr-2" />
                    Recheck Authorization
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </div>
        </div>
      </Alert>

      <NetworkRegistrationDialog
        open={showRegistrationDialog}
        onOpenChange={setShowRegistrationDialog}
      />
    </>
  );
};

export default NetworkSecurityBanner; 