import React, { useEffect, useState, createContext, useContext } from 'react';
import { AlertTriangle, Shield, Lock } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert-fixed';
import securityConfig from '@/utils/securityConfig';

interface SecurityContextType {
  isSecure: boolean;
  deviceFingerprint: string;
  lastSecurityCheck: number;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const useSecurityContext = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurityContext must be used within SecurityProvider');
  }
  return context;
};

interface SecurityProviderProps {
  children: React.ReactNode;
}

export default function SecurityProvider({ children }: SecurityProviderProps) {
  const [securityStatus, setSecurityStatus] = useState<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }>({
    isValid: true,
    errors: [],
    warnings: []
  });

  const [deviceFingerprint] = useState(() => 
    securityConfig.generateDeviceFingerprint()
  );

  useEffect(() => {
    const performSecurityChecks = () => {
      const errors: string[] = [];
      const warnings: string[] = [];

      // 1. Domain validation
      if (!securityConfig.validateDomain()) {
        errors.push('Unauthorized domain access detected');
      }

      // 2. HTTPS enforcement
      if (!securityConfig.isSecureConnection()) {
        warnings.push('Insecure connection - HTTPS recommended');
      }

      // 3. App integrity check
      if (!securityConfig.validateAppIntegrity()) {
        errors.push('Application integrity check failed');
      }

      // 4. Session validation
      if (!securityConfig.isSessionValid()) {
        warnings.push('Session may have expired');
      }

      // 5. Browser security features
      if (!window.crypto || !window.crypto.subtle) {
        warnings.push('Browser lacks modern security features');
      }

      setSecurityStatus({
        isValid: errors.length === 0,
        errors,
        warnings
      });

      // Update last activity
      securityConfig.updateLastActivity();
    };

    // Initial security check
    performSecurityChecks();

    // Setup security policies
    securityConfig.setupCSP();
    securityConfig.enforceHTTPS();

    // Periodic security checks
    const securityInterval = setInterval(performSecurityChecks, 5 * 60 * 1000); // Every 5 minutes

    // Activity monitoring
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    const updateActivity = () => securityConfig.updateLastActivity();
    
    activityEvents.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    return () => {
      clearInterval(securityInterval);
      activityEvents.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
    };
  }, []);

  // Block access if critical security checks fail
  if (!securityStatus.isValid) {
    return (
      <div className="min-h-screen bg-red-50 dark:bg-red-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <AlertTitle className="text-red-800 dark:text-red-200">
              Security Alert
            </AlertTitle>
            <AlertDescription className="text-red-700 dark:text-red-300 mt-2">
              <div className="space-y-2">
                <p>Access denied due to security violations:</p>
                <ul className="list-disc pl-5 space-y-1">
                  {securityStatus.errors.map((error, index) => (
                    <li key={index} className="text-sm">{error}</li>
                  ))}
                </ul>
                <p className="text-sm pt-2">
                  Contact: samer@monzasal.com for authorized access.
                </p>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <SecurityContext.Provider value={{
      isSecure: securityStatus.isValid,
      deviceFingerprint,
      lastSecurityCheck: Date.now()
    }}>
      {/* Security warnings (non-blocking) */}
      {securityStatus.warnings.length > 0 && (
        <div className="fixed top-4 right-4 z-50 max-w-sm">
          <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
            <Shield className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <AlertTitle className="text-yellow-800 dark:text-yellow-200 text-sm">
              Security Notice
            </AlertTitle>
            <AlertDescription className="text-yellow-700 dark:text-yellow-300 text-xs">
              {securityStatus.warnings[0]}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Security indicator */}
      <div className="fixed bottom-4 left-4 z-40">
        <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
          <Lock className="h-3 w-3 text-green-600 dark:text-green-400" />
          <span>Secured</span>
        </div>
      </div>

      {children}
    </SecurityContext.Provider>
  );
}
