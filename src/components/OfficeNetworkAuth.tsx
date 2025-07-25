import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, Wifi, Building, Users } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { 
  DEFAULT_OFFICE_NETWORK, 
  isInDefaultOfficeNetwork, 
  getCurrentNetworkInfo,
  getNetworkConfigForIP 
} from '@/config/networkConfig';

interface OfficeNetworkAuthProps {
  onAuthorized?: () => void;
  onUnauthorized?: () => void;
}

export const OfficeNetworkAuth: React.FC<OfficeNetworkAuthProps> = ({
  onAuthorized,
  onUnauthorized
}) => {
  const [networkInfo, setNetworkInfo] = useState<{ ip: string; range: string } | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [networkConfig, setNetworkConfig] = useState<typeof DEFAULT_OFFICE_NETWORK | null>(null);

  useEffect(() => {
    checkNetworkAuthorization();
  }, []);

  const checkNetworkAuthorization = async () => {
    setIsLoading(true);
    try {
      const info = await getCurrentNetworkInfo();
      setNetworkInfo(info);

      if (info) {
        // Check if this is the default office network
        const isOfficeNetwork = isInDefaultOfficeNetwork(info.ip);
        const config = getNetworkConfigForIP(info.ip);
        
        setNetworkConfig(config);
        setIsAuthorized(isOfficeNetwork);

        if (isOfficeNetwork) {
          console.log('✅ Office network detected and authorized:', info.ip);
          toast({
            title: "✅ Office Network Authorized",
            description: "Welcome to Monza Tech Software - Full access granted",
            variant: "default",
          });
          onAuthorized?.();
        } else {
          console.log('⚠️ Non-office network detected:', info.ip);
          toast({
            title: "⚠️ Network Not Authorized",
            description: "This network is not authorized for Monza Tech Software",
            variant: "destructive",
          });
          onUnauthorized?.();
        }
      }
    } catch (error) {
      console.error('Failed to check network authorization:', error);
      setIsAuthorized(false);
      onUnauthorized?.();
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthorizeOfficeNetwork = () => {
    if (networkInfo) {
      // Store in localStorage that this network should be authorized
      localStorage.setItem('monza_office_network_authorized', 'true');
      localStorage.setItem('monza_office_network_ip', networkInfo.ip);
      localStorage.setItem('monza_office_network_range', networkInfo.range);
      
      setIsAuthorized(true);
      setNetworkConfig(DEFAULT_OFFICE_NETWORK);
      
      toast({
        title: "✅ Office Network Authorized",
        description: "This network is now authorized for all Monza Tech employees",
        variant: "default",
      });
      
      onAuthorized?.();
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Checking network authorization...</p>
        </CardContent>
      </Card>
    );
  }

  if (isAuthorized && networkConfig) {
    return (
      <Card className="w-full max-w-md mx-auto border-green-200 bg-green-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-green-800">
            <CheckCircle className="h-5 w-5" />
            Office Network Authorized
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-green-600" />
            <span className="font-medium">{networkConfig.networkName}</span>
          </div>
          
          <div className="text-sm text-green-700">
            <p><strong>Network Range:</strong> {networkConfig.networkRange}</p>
            <p><strong>Current IP:</strong> {networkInfo?.ip}</p>
            <p><strong>Access Level:</strong> Full Access</p>
          </div>

          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-700">
              All employees on this network have full access
            </span>
          </div>

          <Badge className="bg-green-100 text-green-800 border-green-300">
            <Wifi className="h-3 w-3 mr-1" />
            Auto-Authorized
          </Badge>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto border-orange-200 bg-orange-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <AlertTriangle className="h-5 w-5" />
          Network Not Authorized
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-orange-700">
          <p><strong>Current IP:</strong> {networkInfo?.ip}</p>
          <p><strong>Network Range:</strong> {networkInfo?.range}</p>
          <p><strong>Reason:</strong> This network is not in the authorized office network list</p>
        </div>

        <div className="bg-orange-100 p-3 rounded-md">
          <p className="text-sm text-orange-800">
            <strong>Office Network:</strong> {DEFAULT_OFFICE_NETWORK.networkRange}
          </p>
          <p className="text-xs text-orange-700 mt-1">
            Only networks in the 178.135.15.x range are automatically authorized
          </p>
        </div>

        <div className="space-y-2">
          <Button 
            onClick={handleAuthorizeOfficeNetwork}
            className="w-full bg-orange-600 hover:bg-orange-700"
          >
            <Building className="h-4 w-4 mr-2" />
            Authorize This Network as Office
          </Button>
          
          <Button 
            variant="outline" 
            onClick={checkNetworkAuthorization}
            className="w-full"
          >
            <Wifi className="h-4 w-4 mr-2" />
            Recheck Network
          </Button>
        </div>

        <div className="text-xs text-orange-600">
          <p><strong>Note:</strong> This will authorize all devices on this network</p>
          <p>Only authorize networks you control and trust</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default OfficeNetworkAuth; 