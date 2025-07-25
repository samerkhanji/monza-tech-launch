import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, QrCode, Search, MapPin, Package, Wrench, Car, Camera, Zap, Gauge, Palette } from 'lucide-react';
import { useScanVIN } from './hooks/useScanVIN';
import CameraScanner from './components/CameraScanner';
import { vinDecoderService, VINDecodedData } from '@/services/vinDecoderService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ScanVINPage: React.FC = () => {
  const navigate = useNavigate();
  const { state, updateState, processVIN, handleDestinationSelect, toast } = useScanVIN();
  const [scanning, setScanning] = useState(false);
  const [vinDetails, setVinDetails] = useState<VINDecodedData | null>(null);
  const [isDecodingVIN, setIsDecodingVIN] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state.manualVIN.trim().length < 5) {
      toast({
        title: "Invalid VIN",
        description: "Please enter a valid VIN number.",
        variant: "destructive"
      });
      return;
    }
    
    await processVINAndDecode(state.manualVIN.trim());
  };

  const processVINAndDecode = async (vin: string) => {
    setIsDecodingVIN(true);
    
    try {
      // First decode the VIN to get detailed information
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
          title: "VIN Decoded",
          description: "Basic VIN information processed",
        });
      }

      // Process VIN through existing system
      processVIN(vin);
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

  // Listen for VIN scanned from camera
  useEffect(() => {
    const handleVinScanned = (event: CustomEvent) => {
      const scannedVIN = event.detail;
      updateState({ manualVIN: scannedVIN });
      processVINAndDecode(scannedVIN);
    };

    const handleCodeScanned = (event: CustomEvent) => {
      const scannedCode = event.detail;
      updateState({ manualVIN: scannedCode });
      
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

  const destinations = [
    {
      id: 'inventory',
      name: 'Car Inventory',
      description: 'Add to main inventory system',
      icon: Package,
      color: 'bg-blue-500'
    },
    {
      id: 'showroom',
      name: 'Showroom Display',
      description: 'Move to showroom for display',
      icon: Car,
      color: 'bg-green-500'
    },
    {
      id: 'garage',
      name: 'Garage/Repairs',
      description: 'Send to garage for maintenance',
      icon: Wrench,
      color: 'bg-orange-500'
    }
  ];

  const getStatusBadge = (status: string) => {
    const statusColors = {
      'in_stock': 'bg-green-100 text-green-800',
      'sold': 'bg-red-100 text-red-800',
      'reserved': 'bg-yellow-100 text-yellow-800'
    };
    return statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'EV': return <Zap className="h-4 w-4 text-green-600" />;
      case 'REV': return <Gauge className="h-4 w-4 text-blue-600" />;
      case 'ICEV': return <Car className="h-4 w-4 text-gray-600" />;
      default: return <Car className="h-4 w-4" />;
    }
  };
  
  return (
    <div className="container mx-auto py-4 md:py-6 px-4 max-w-6xl">
      <div className="flex items-center mb-6">
        <Button 
          variant="outline" 
          size="sm" 
          className="mr-4"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Scan VIN</h1>
          <p className="text-muted-foreground mt-1">
            Scan vehicle identification numbers to route vehicles to different locations
          </p>
        </div>
      </div>

      <Tabs defaultValue="manual" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manual">Manual Entry</TabsTrigger>
          <TabsTrigger value="camera">OCR Camera</TabsTrigger>
        </TabsList>

        <TabsContent value="manual">
          {/* VIN Input Section */}
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
                    value={state.manualVIN}
                    onChange={(e) => updateState({ manualVIN: e.target.value.toUpperCase() })}
                    placeholder="e.g., 1HGCM82633A123456"
                    className="w-full h-12 text-base"
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
                  {isDecodingVIN ? 'Processing VIN...' : 'Find Vehicle'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="camera">
          {/* Camera Scanner Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-blue-600" />
                OCR Camera Scanner
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CameraScanner
                scanning={scanning}
                onStartScanner={() => setScanning(true)}
                onStopScanner={() => setScanning(false)}
                toast={toast}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detailed VIN Information Display */}
      {vinDetails && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5 text-blue-600" />
              Detailed Vehicle Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Basic Information</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="font-medium text-gray-600">VIN:</span>
                    <p className="font-mono text-sm">{vinDetails.vin}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Make:</span>
                    <p className="font-semibold">{vinDetails.make}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Model:</span>
                    <p className="font-semibold">{vinDetails.model}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Year:</span>
                    <p>{vinDetails.year}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Body Style:</span>
                    <p>{vinDetails.bodyStyle}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Category:</span>
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(vinDetails.category)}
                      <Badge variant="outline">{vinDetails.category}</Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Technical Specifications */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Technical Specifications</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="font-medium text-gray-600">Engine Type:</span>
                    <p>{vinDetails.engineType}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Fuel Type:</span>
                    <p>{vinDetails.fuelType}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Transmission:</span>
                    <p>{vinDetails.transmission}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Drive Type:</span>
                    <p>{vinDetails.driveType}</p>
                  </div>
                  {vinDetails.specifications?.horsePower && (
                    <div>
                      <span className="font-medium text-gray-600">Power:</span>
                      <p>{vinDetails.specifications.horsePower} HP</p>
                    </div>
                  )}
                  {vinDetails.specifications?.range && (
                    <div>
                      <span className="font-medium text-gray-600">Range:</span>
                      <p>{vinDetails.specifications.range} km</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Pricing Information */}
              {vinDetails.estimatedPrice && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Pricing Information</h3>
                  <div>
                    <span className="font-medium text-gray-600">Estimated Price:</span>
                    <p className="font-bold text-lg text-green-600">${vinDetails.estimatedPrice.toLocaleString()}</p>
                  </div>
                </div>
              )}

              {/* Features */}
              {vinDetails.features && vinDetails.features.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Features</h3>
                  <div className="flex flex-wrap gap-2">
                    {vinDetails.features.map((feature, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Available Colors */}
              {vinDetails.colors && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Available Colors</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium text-gray-600">Exterior:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {vinDetails.colors.exterior?.map((color, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            <Palette className="h-3 w-3 mr-1" />
                            {color}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vehicle Information Display */}
      {state.foundCar && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5 text-blue-600" />
              Current Vehicle Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <span className="font-medium text-gray-600">VIN:</span>
                  <p className="font-mono text-sm">{state.foundCar.vinNumber}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Model:</span>
                  <p className="font-semibold">{state.foundCar.model}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Year:</span>
                  <p>{state.foundCar.year}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Color:</span>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full border border-gray-300"
                      style={{ backgroundColor: state.foundCar.color?.toLowerCase() }}
                    />
                    <p>{state.foundCar.color}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <span className="font-medium text-gray-600">Category:</span>
                  <Badge variant="outline" className="ml-2">{state.foundCar.category}</Badge>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Status:</span>
                  <Badge className={`ml-2 ${getStatusBadge(state.foundCar.status)}`}>
                    {state.foundCar.status === 'in_stock' ? 'Available' : state.foundCar.status.toUpperCase()}
                  </Badge>
                </div>
                {state.foundCar.batteryPercentage && (
                  <div>
                    <span className="font-medium text-gray-600">Battery:</span>
                    <p>{state.foundCar.batteryPercentage}%</p>
                  </div>
                )}
                {state.foundCar.currentFloor && (
                  <div>
                    <span className="font-medium text-gray-600">Current Location:</span>
                    <Badge variant="secondary" className="ml-2">{state.foundCar.currentFloor}</Badge>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Destination Selection */}
      {state.foundCar && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-green-600" />
              Choose Destination
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3">
              {destinations.map((destination) => {
                const Icon = destination.icon;
                return (
                  <Button
                    key={destination.id}
                    variant="outline"
                    className="h-auto p-4 justify-start hover:bg-gray-50 border-2 hover:border-monza-yellow"
                    onClick={() => handleDestinationSelect(destination.name)}
                  >
                    <div className={`w-10 h-10 rounded-full ${destination.color} flex items-center justify-center mr-4`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">{destination.name}</div>
                      <div className="text-sm text-muted-foreground">{destination.description}</div>
                    </div>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ScanVINPage;
