import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QrCode, Search, Camera, Zap, Gauge, Palette, Car, Clock, Shield } from 'lucide-react';
import CameraScanner from './CameraScanner';
import { vinDecoderService, VINDecodedData } from '@/services/vinDecoderService';

interface EnhancedVINScannerProps {
  manualVIN: string;
  onVINChange: (vin: string) => void;
  onVINSubmit: (vin: string) => void;
  toast: any;
}

const EnhancedVINScanner: React.FC<EnhancedVINScannerProps> = ({
  manualVIN,
  onVINChange,
  onVINSubmit,
  toast
}) => {
  const [scanning, setScanning] = useState(false);
  const [vinDetails, setVinDetails] = useState<VINDecodedData | null>(null);
  const [isDecodingVIN, setIsDecodingVIN] = useState(false);

  const processVINAndDecode = async (vin: string) => {
    setIsDecodingVIN(true);
    
    try {
      // Decode the VIN to get detailed information
      const decodedVIN = await vinDecoderService.decodeVIN(vin);
      
      if (decodedVIN) {
        setVinDetails(decodedVIN);
        toast({
          title: "VIN Decoded Successfully!",
          description: `${decodedVIN.year} ${decodedVIN.make} ${decodedVIN.model} detected`,
        });
      } else {
        setVinDetails(null);
        toast({
          title: "VIN Processed",
          description: "Basic VIN information processed",
        });
      }

      // Submit to parent component
      onVINSubmit(vin);
    } catch (error) {
      console.error('Error processing VIN:', error);
      toast({
        title: "Processing Error",
        description: "An error occurred while processing the VIN.",
        variant: "destructive"
      });
    } finally {
      setIsDecodingVIN(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (manualVIN.trim().length < 5) {
      toast({
        title: "Invalid VIN",
        description: "Please enter a valid VIN number.",
        variant: "destructive"
      });
      return;
    }
    
    await processVINAndDecode(manualVIN.trim());
  };

  // Listen for VIN scanned from camera
  useEffect(() => {
    const handleVinScanned = (event: CustomEvent) => {
      const scannedVIN = event.detail;
      onVINChange(scannedVIN);
      processVINAndDecode(scannedVIN);
    };

    const handleCodeScanned = (event: CustomEvent) => {
      const scannedCode = event.detail;
      onVINChange(scannedCode);
      
      // Check if it looks like a VIN and auto-process
      if (scannedCode.length === 17) {
        processVINAndDecode(scannedCode);
      }
    };

    window.addEventListener('vinScanned', handleVinScanned as EventListener);
    window.addEventListener('codeScanned', handleCodeScanned as EventListener);

    return () => {
      window.removeEventListener('vinScanned', handleVinScanned as EventListener);
      window.removeEventListener('codeScanned', handleCodeScanned as EventListener);
    };
  }, []);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'EV': return <Zap className="h-4 w-4 text-green-600" />;
      case 'REV': return <Gauge className="h-4 w-4 text-blue-600" />;
      case 'ICEV': return <Car className="h-4 w-4 text-gray-600" />;
      default: return <Car className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manual">Manual Entry</TabsTrigger>
          <TabsTrigger value="camera">OCR Camera</TabsTrigger>
        </TabsList>

        <TabsContent value="manual">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-monza-yellow" />
                Enter Vehicle VIN
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="vin" className="text-sm font-medium">
                    VIN Number
                  </Label>
                  <Input 
                    id="vin"
                    type="text"
                    value={manualVIN}
                    onChange={(e) => onVINChange(e.target.value.toUpperCase())}
                    placeholder="e.g., LVGBB22E5NG123456"
                    className="w-full h-12 text-base font-mono"
                    maxLength={17}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the full 17-character Vehicle Identification Number
                  </p>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-monza-yellow text-monza-black hover:bg-monza-yellow/90"
                  disabled={isDecodingVIN}
                >
                  <Search className="mr-2 h-4 w-4" />
                  {isDecodingVIN ? 'Decoding VIN...' : 'Decode & Find Vehicle'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="camera">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-blue-600" />
                OCR Camera Scanner
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <Camera className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-900">How to use OCR VIN Scanner:</p>
                      <ul className="mt-1 text-xs text-blue-800 space-y-1">
                        <li>• Point camera at VIN plate on dashboard or door frame</li>
                        <li>• Ensure good lighting and clear view of VIN number</li>
                        <li>• Capture photo and let OCR extract the VIN automatically</li>
                        <li>• Verify the detected VIN before processing</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <CameraScanner
                  scanning={scanning}
                  onStartScanner={() => setScanning(true)}
                  onStopScanner={() => setScanning(false)}
                  toast={toast}
                />
                
                {manualVIN && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <QrCode className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-900">Detected VIN:</span>
                      <span className="font-mono text-sm text-green-800">{manualVIN}</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detailed VIN Information Display */}
      {vinDetails && (
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5 text-blue-600" />
              Detailed Vehicle Information
              <Badge className="bg-blue-100 text-blue-800">
                VIN Decoded
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2 flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">VIN</span>
                    <p className="font-mono text-sm font-medium">{vinDetails.vin}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Make</span>
                    <p className="font-semibold text-lg">{vinDetails.make}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Model</span>
                    <p className="font-semibold text-lg">{vinDetails.model}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Year</span>
                    <p className="font-medium">{vinDetails.year}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Body Style</span>
                    <p className="font-medium">{vinDetails.bodyStyle}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Category</span>
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(vinDetails.category)}
                      <Badge variant="outline" className="font-medium">
                        {vinDetails.category}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Technical Specifications */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2 flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Technical Specifications
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Engine Type</span>
                    <p className="font-medium">{vinDetails.engineType}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Fuel Type</span>
                    <p className="font-medium">{vinDetails.fuelType}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Transmission</span>
                    <p className="font-medium">{vinDetails.transmission}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Drive Type</span>
                    <p className="font-medium">{vinDetails.driveType}</p>
                  </div>
                  
                  {vinDetails.specifications?.horsePower && (
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Power</span>
                      <p className="font-bold text-lg text-blue-600">{vinDetails.specifications.horsePower} HP</p>
                    </div>
                  )}
                  
                  {vinDetails.specifications?.range && (
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Range</span>
                      <p className="font-bold text-lg text-green-600">{vinDetails.specifications.range} km</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Performance & Pricing */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2 flex items-center gap-2">
                  <Gauge className="h-4 w-4" />
                  Performance & Pricing
                </h3>
                <div className="space-y-3">
                  {vinDetails.specifications?.acceleration && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">0-100 km/h</span>
                      <span className="font-bold text-blue-600">{vinDetails.specifications.acceleration}</span>
                    </div>
                  )}
                  
                  {vinDetails.specifications?.topSpeed && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">Top Speed</span>
                      <span className="font-bold">{vinDetails.specifications.topSpeed} km/h</span>
                    </div>
                  )}
                  
                  {vinDetails.estimatedPrice && (
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                      <span className="text-sm font-medium text-green-800">Estimated Price</span>
                      <span className="font-bold text-xl text-green-600">${vinDetails.estimatedPrice.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Features */}
              {vinDetails.features && vinDetails.features.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Key Features
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {vinDetails.features.map((feature, index) => (
                      <Badge key={index} variant="secondary" className="text-xs px-2 py-1">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Available Colors */}
              {vinDetails.colors && vinDetails.colors.exterior && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2 flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Available Colors
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Exterior Options:</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {vinDetails.colors.exterior.map((color, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            <div 
                              className="w-3 h-3 rounded-full mr-2 border border-gray-300"
                              style={{ backgroundColor: color.toLowerCase().replace(' ', '') }}
                            />
                            {color}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Manufacturer Information */}
            <div className="mt-6 pt-4 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Manufacturer:</span>
                  <span className="ml-2">{vinDetails.manufacturer}</span>
                </div>
                <div>
                  <span className="font-medium">Country of Origin:</span>
                  <span className="ml-2">{vinDetails.country}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedVINScanner; 