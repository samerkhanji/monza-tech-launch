
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Truck, Package, Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

declare global {
  interface Window {
    YQV5?: {
      trackSingle: (options: {
        YQ_ContainerId: string;
        YQ_Height?: number;
        YQ_Fc?: string;
        YQ_Lang?: string;
        YQ_Num: string;
      }) => void;
    };
  }
}

const ShippingETAPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [trackingNumber, setTrackingNumber] = useState('');
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  // Handle URL parameters for auto-tracking
  useEffect(() => {
    const trackParam = searchParams.get('track');
    if (trackParam) {
      setTrackingNumber(trackParam);
      // Auto-track after script loads
      if (isScriptLoaded && window.YQV5) {
        setTimeout(() => {
          handleTrack();
        }, 500);
      }
    }
  }, [searchParams, isScriptLoaded]);

  useEffect(() => {
    // Add CSS to block only ads, not tracking content
    const adBlockStyle = document.createElement('style');
    adBlockStyle.innerHTML = `
      /* Block only advertisement frames and banners */
      iframe[src*="googlesyndication"], 
      iframe[src*="doubleclick"],
      iframe[src*="adsystem"], 
      iframe[src*="googleadservices"],
      iframe[src*="ads."],
      div[id*="google_ads"], 
      .adsbygoogle, 
      .ad-container, 
      .advertisement, 
      .ad-banner,
      [class*="ad-block"],
      [id*="ad-block"],
      /* Block floating ad overlays */
      div[style*="position: fixed"][style*="z-index: 999"]:not(#YQContainer),
      div[style*="position: absolute"][style*="top: 0"]:not(#YQContainer *),
      /* Block common ad networks */
      iframe[src*="amazon-adsystem"],
      iframe[src*="media.net"],
      iframe[src*="outbrain"],
      iframe[src*="taboola"] {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        height: 0 !important;
        width: 0 !important;
        overflow: hidden !important;
      }
      
      /* Ensure tracking container remains visible and functional */
      #YQContainer {
        background: transparent !important;
        position: relative !important;
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
      }
      
      /* Allow legitimate tracking content */
      #YQContainer iframe:not([src*="ads"]):not([src*="googlesyndication"]),
      #YQContainer div:not([class*="ad"]):not([id*="ad"]) {
        display: block !important;
        visibility: visible !important;
      }
    `;
    document.head.appendChild(adBlockStyle);

    // Load the 17track script
    const script = document.createElement('script');
    script.src = '//www.17track.net/externalcall.js';
    script.type = 'text/javascript';
    script.async = true;
    script.onload = () => {
      setIsScriptLoaded(true);
      console.log('17track script loaded successfully');
      
      // Clean up ads after script loads while preserving tracking content
      setTimeout(() => {
        const container = document.getElementById('YQContainer');
        if (container) {
          // Only remove elements that are clearly ads
          const adElements = container.querySelectorAll('iframe[src*="ads"], iframe[src*="googlesyndication"], [class*="advertisement"], [id*="google_ads"]');
          adElements.forEach(el => el.remove());
          console.log('Removed ad elements from tracking container');
        }
      }, 2000);
    };
    script.onerror = () => {
      console.error('Failed to load 17track script');
      toast({
        title: "Error",
        description: "Failed to load tracking service. Please try again later.",
        variant: "destructive",
      });
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup
      const existingScript = document.querySelector('script[src="//www.17track.net/externalcall.js"]');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
      if (document.head.contains(adBlockStyle)) {
        document.head.removeChild(adBlockStyle);
      }
    };
  }, []);

  const handleTrack = useCallback(async () => {
    if (!trackingNumber.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a tracking number.",
        variant: "destructive",
      });
      return;
    }

    if (!isScriptLoaded || !window.YQV5) {
      toast({
        title: "Service Unavailable",
        description: "Tracking service is still loading. Please try again in a moment.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Initiating tracking for:', trackingNumber);
      
      window.YQV5.trackSingle({
        YQ_ContainerId: "YQContainer",
        YQ_Height: 560,
        YQ_Fc: "0",
        YQ_Lang: "en",
        YQ_Num: trackingNumber.trim()
      });

      toast({
        title: "Tracking Initiated",
        description: `Tracking package: ${trackingNumber}`,
      });

      // Additional ad cleanup after tracking loads
      setTimeout(() => {
        const container = document.getElementById('YQContainer');
        if (container) {
          const adElements = container.querySelectorAll('iframe[src*="ads"], iframe[src*="googlesyndication"], [class*="advertisement"]');
          adElements.forEach(el => el.remove());
        }
      }, 3000);
    } catch (error) {
      console.error('Tracking error:', error);
      toast({
        title: "Tracking Error",
        description: "Failed to initiate tracking. Please try again.",
        variant: "destructive",
      });
    }
  }, [trackingNumber, isScriptLoaded]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTrack();
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Truck className="h-6 w-6" />
            Shipping ETA & Tracking
          </h1>
          <p className="text-muted-foreground mt-1">
            Track shipments and monitor delivery estimates for incoming parts
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tracking Input Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Track Shipment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tracking-number">Tracking Number</Label>
              <Input
                id="tracking-number"
                type="text"
                placeholder="Enter tracking number..."
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                onKeyPress={handleKeyPress}
                maxLength={50}
                className="w-full"
              />
            </div>
            <Button 
              onClick={handleTrack} 
              className="w-full"
              disabled={!isScriptLoaded}
            >
              <Package className="mr-2 h-4 w-4" />
              {isScriptLoaded ? 'TRACK SHIPMENT' : 'Loading...'}
            </Button>
            {!isScriptLoaded && (
              <p className="text-sm text-muted-foreground text-center">
                Loading tracking service...
              </p>
            )}
          </CardContent>
        </Card>

        {/* Quick Info Section */}
        <Card>
          <CardHeader>
            <CardTitle>Shipping Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-md">
              <h3 className="font-medium mb-2">Supported Carriers</h3>
              <p className="text-sm">
                This tracking system supports most major carriers including DHL, FedEx, UPS, 
                USPS, China Post, and many others worldwide.
              </p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-md">
              <h3 className="font-medium mb-2">Auto-Detection</h3>
              <p className="text-sm">
                The system automatically detects the carrier based on your tracking number format.
              </p>
            </div>
            <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-md">
              <h3 className="font-medium mb-2">Real-Time Updates</h3>
              <p className="text-sm">
                Track your shipments in real-time and get detailed delivery information including estimated arrival times.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tracking Results Container - Ad-free tracking display */}
      <Card>
        <CardHeader>
          <CardTitle>Tracking Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            id="YQContainer" 
            className="min-h-[560px] w-full border rounded-md p-4 bg-gray-50"
          >
            <p className="text-center text-muted-foreground">
              Enter a tracking number above and click "TRACK SHIPMENT" to see detailed tracking information here.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ShippingETAPage;
