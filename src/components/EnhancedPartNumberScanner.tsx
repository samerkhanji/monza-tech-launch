import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, Scan, Package, AlertTriangle, CheckCircle, X, Search, Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useCameraPermission } from '@/utils/cameraPermissionManager';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Import barcode scanning library
declare global {
  interface Window {
    BarcodeDetector?: any;
  }
}

interface PartInfo {
  id: string;
  part_number: string;
  part_name: string;
  quantity: number;
  cost_per_unit: number | null;
  supplier: string | null;
  location: string;
  car_model: string;
  shelf: string;
  row_position: string;
  column_position: string;
  room: string | null;
  floor: string | null;
  arrival_date: string | null;
  batch_number: string | null;
  expiry_date: string | null;
  last_updated: string | null;
  created_at: string | null;
}

interface PartUsage {
  partId: string;
  partNumber: string;
  partName: string;
  quantity: number;
  costPerUnit?: number | null;
  totalCost?: number;
}

interface EnhancedPartNumberScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onPartScanned: (partUsage: PartUsage) => void;
  assignmentId?: string;
  carVin?: string;
  carModel?: string;
  clientName?: string;
}

const EnhancedPartNumberScanner: React.FC<EnhancedPartNumberScannerProps> = ({
  isOpen,
  onClose,
  onPartScanned,
  assignmentId,
  carVin,
  carModel,
  clientName
}) => {
  const [activeTab, setActiveTab] = useState<'scanner' | 'search' | 'manual'>('scanner');
  const [scannedCode, setScannedCode] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [manualPartNumber, setManualPartNumber] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isScanning, setIsScanning] = useState(false);
  const [partInfo, setPartInfo] = useState<PartInfo | null>(null);
  const [searchResults, setSearchResults] = useState<PartInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [barcodeDetector, setBarcodeDetector] = useState<any>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { user } = useAuth();

  // Camera permission manager
  const { 
    granted, 
    denied, 
    stream, 
    requestCamera, 
    stopCamera, 
    isSupported: cameraSupported,
    hasActiveStream 
  } = useCameraPermission();

  // Initialize barcode detector
  useEffect(() => {
    if (window.BarcodeDetector) {
      setBarcodeDetector(new window.BarcodeDetector());
    }
  }, []);

  // Auto-start camera when scanner tab is active
  useEffect(() => {
    if (isOpen && activeTab === 'scanner' && granted && !hasActiveStream) {
      handleStartCamera();
    } else if (!isOpen || activeTab !== 'scanner') {
      stopCamera();
    }
  }, [isOpen, activeTab, granted, hasActiveStream]);

  // Update video element when stream changes
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(console.error);
    }
  }, [stream]);

  const handleStartCamera = async () => {
    if (!cameraSupported) {
      toast({
        title: "Camera Not Supported",
        description: "Camera access is not supported on this device or browser.",
        variant: "destructive",
      });
      return;
    }

    try {
      await requestCamera({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1080, min: 480 }
        } 
      });
      
      setIsScanning(true);
      startBarcodeDetection();
      
      toast({
        title: "Camera Ready",
        description: "Position the barcode or part number clearly in the camera view.",
      });
    } catch (err) {
      console.error("Camera access error:", err);
      toast({
        title: "Camera Access Error",
        description: "Could not access the camera. Please try manual entry instead.",
        variant: "destructive",
      });
    }
  };

  const startBarcodeDetection = () => {
    if (!videoRef.current || !barcodeDetector) return;

    const detectBarcodes = async () => {
      if (!videoRef.current || !isScanning) return;

      try {
        const barcodes = await barcodeDetector.detect(videoRef.current);
        if (barcodes.length > 0) {
          const barcode = barcodes[0];
          setScannedCode(barcode.rawValue);
          setIsScanning(false);
          stopCamera();
          await lookupPart(barcode.rawValue);
          
          toast({
            title: "Barcode Detected!",
            description: `Scanned: ${barcode.rawValue}`,
          });
        }
      } catch (error) {
        // Silently continue - this is expected for frames without barcodes
      }

      if (isScanning) {
        requestAnimationFrame(detectBarcodes);
      }
    };

    detectBarcodes();
  };

  const lookupPart = async (partNumber: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .or(`part_number.ilike.%${partNumber}%,id.eq.${partNumber}`)
        .limit(1);

      if (error) {
        console.error('Error looking up part:', error);
        toast({
          title: "Lookup Error",
          description: "Failed to lookup part information.",
          variant: "destructive"
        });
        return;
      }

      if (data && data.length > 0) {
        setPartInfo(data[0]);
        toast({
          title: "Part Found!",
          description: `${data[0].part_name} - ${data[0].quantity} in stock`,
        });
      } else {
        toast({
          title: "Part Not Found",
          description: `No part found with number: ${partNumber}`,
          variant: "destructive"
        });
        setPartInfo(null);
      }
    } catch (error) {
      console.error('Error looking up part:', error);
      toast({
        title: "Lookup Error",
        description: "Failed to lookup part information.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const searchParts = async (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .or(`part_number.ilike.%${term}%,part_name.ilike.%${term}%,car_model.ilike.%${term}%`)
        .limit(10);

      if (error) {
        console.error('Error searching parts:', error);
        toast({
          title: "Search Error",
          description: "Failed to search parts.",
          variant: "destructive"
        });
        return;
      }

      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching parts:', error);
      toast({
        title: "Search Error",
        description: "Failed to search parts.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualLookup = () => {
    if (manualPartNumber.trim()) {
      lookupPart(manualPartNumber.trim());
      setScannedCode(manualPartNumber.trim());
    }
  };

  const handleAddPart = async () => {
    if (!partInfo) {
      toast({
        title: "No Part Selected",
        description: "Please scan or select a part first.",
        variant: "destructive"
      });
      return;
    }

    if (quantity > partInfo.quantity) {
      toast({
        title: "Insufficient Stock",
        description: `Only ${partInfo.quantity} units available in inventory.`,
        variant: "destructive"
      });
      return;
    }

    const partUsage: PartUsage = {
      partId: partInfo.id,
      partNumber: partInfo.part_number,
      partName: partInfo.part_name,
      quantity,
      costPerUnit: partInfo.cost_per_unit,
      totalCost: (partInfo.cost_per_unit || 0) * quantity
    };

    try {
      // Track parts usage in Supabase
      const { error: usageError } = await supabase
        .from('parts_usage_tracking')
        .insert({
          part_number: partInfo.part_number,
          part_name: partInfo.part_name,
          quantity,
          car_vin: carVin || '',
          car_model: carModel || '',
          client_name: clientName || '',
          technician: user?.name || 'Unknown',
          cost_per_unit: partInfo.cost_per_unit,
          total_cost: (partInfo.cost_per_unit || 0) * quantity,
          repair_id: assignmentId,
          usage_date: new Date().toISOString(),
          location_used: 'Garage'
        });

      if (usageError) {
        console.error('Error tracking parts usage:', usageError);
        toast({
          title: "Tracking Error",
          description: "Failed to track parts usage.",
          variant: "destructive"
        });
        return;
      }

      // Update inventory quantity
      const { error: updateError } = await supabase
        .from('inventory_items')
        .update({ 
          quantity: partInfo.quantity - quantity,
          last_updated: new Date().toISOString()
        })
        .eq('id', partInfo.id);

      if (updateError) {
        console.error('Error updating inventory:', updateError);
        toast({
          title: "Update Error",
          description: "Failed to update inventory quantity.",
          variant: "destructive"
        });
        return;
      }

      // Notify parent component
      onPartScanned(partUsage);

      // Reset form
      setPartInfo(null);
      setScannedCode('');
      setQuantity(1);
      setSearchTerm('');
      setManualPartNumber('');
      setSearchResults([]);

      toast({
        title: "Part Added Successfully!",
        description: `${quantity}x ${partInfo.part_name} added to assignment.`,
      });

      onClose();
    } catch (error) {
      console.error('Error adding part:', error);
      toast({
        title: "Error",
        description: "Failed to add part to assignment.",
        variant: "destructive"
      });
    }
  };

  const handleClose = () => {
    stopCamera();
    setIsScanning(false);
    setPartInfo(null);
    setScannedCode('');
    setQuantity(1);
    setSearchTerm('');
    setManualPartNumber('');
    setSearchResults([]);
    onClose();
  };

  const getStockStatusColor = (quantity: number) => {
    if (quantity === 0) return 'bg-red-100 text-red-800';
    if (quantity <= 5) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5" />
            Part Scanner & Assignment
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="scanner" disabled={!cameraSupported}>
              <Camera className="h-4 w-4 mr-2" />
              Scanner {!cameraSupported && "(N/A)"}
            </TabsTrigger>
            <TabsTrigger value="search">
              <Search className="h-4 w-4 mr-2" />
              Search
            </TabsTrigger>
            <TabsTrigger value="manual">
              <Plus className="h-4 w-4 mr-2" />
              Manual
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scanner" className="space-y-4">
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="font-medium mb-2">Barcode Scanner</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Position the barcode or part number clearly in the camera view
                </p>
              </div>

              {!cameraSupported && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                  <div className="text-yellow-700 font-medium mb-2">Camera Not Available</div>
                  <p className="text-sm text-yellow-600 mb-3">
                    Camera access is not supported on this device or browser.
                  </p>
                  <p className="text-xs text-yellow-500">
                    Please use the Search or Manual tabs instead.
                  </p>
                </div>
              )}

              {cameraSupported && !hasActiveStream && (
                <Button onClick={handleStartCamera} className="w-full">
                  <Camera className="mr-2 h-4 w-4" />
                  Start Camera Scanner
                </Button>
              )}

              {cameraSupported && hasActiveStream && (
                <div className="space-y-4">
                  <div className="relative w-full bg-gray-100 rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      autoPlay
                      playsInline
                      muted
                    />
                    
                    {/* Scanner overlay */}
                    <div className="absolute inset-0 pointer-events-none">
                      {/* Corner guides */}
                      <div className="absolute top-4 left-4 w-8 h-8 border-l-3 border-t-3 border-blue-400"></div>
                      <div className="absolute top-4 right-4 w-8 h-8 border-r-3 border-t-3 border-blue-400"></div>
                      <div className="absolute bottom-4 left-4 w-8 h-8 border-l-3 border-b-3 border-blue-400"></div>
                      <div className="absolute bottom-4 right-4 w-8 h-8 border-r-3 border-b-3 border-blue-400"></div>
                      
                      {/* Center scanning area */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="border-2 border-dashed border-blue-400 rounded-lg px-6 py-4 bg-blue-500 bg-opacity-10">
                          <div className="text-blue-600 text-sm font-medium text-center">
                            Position Barcode Here
                          </div>
                          <div className="text-blue-500 text-xs text-center mt-1">
                            {isScanning ? 'Scanning...' : 'Ready to scan'}
                          </div>
                        </div>
                      </div>
                      
                      {/* Live indicator */}
                      <div className="absolute top-3 left-3">
                        <div className="flex items-center gap-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                          LIVE
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button onClick={stopCamera} variant="outline" className="flex-1">
                      <X className="mr-2 h-4 w-4" />
                      Stop Scanner
                    </Button>
                  </div>
                </div>
              )}

              {scannedCode && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Scanned Code</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-mono text-lg">{scannedCode}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="search" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="search">Search Parts</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="search"
                    placeholder="Search by part number, name, or car model..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchParts(searchTerm)}
                  />
                  <Button onClick={() => searchParts(searchTerm)} disabled={isLoading}>
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {searchResults.map((part) => (
                    <Card 
                      key={part.id} 
                      className={`cursor-pointer transition-colors ${
                        partInfo?.id === part.id ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setPartInfo(part)}
                    >
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{part.part_name}</p>
                            <p className="text-sm text-muted-foreground">{part.part_number}</p>
                            <p className="text-xs text-muted-foreground">{part.car_model}</p>
                          </div>
                          <div className="text-right">
                            <Badge className={getStockStatusColor(part.quantity)}>
                              {part.quantity} in stock
                            </Badge>
                            {part.cost_per_unit && (
                              <p className="text-sm text-muted-foreground mt-1">
                                ${part.cost_per_unit.toFixed(2)}/unit
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="manual-part">Part Number</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="manual-part"
                    placeholder="Enter part number manually..."
                    value={manualPartNumber}
                    onChange={(e) => setManualPartNumber(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleManualLookup()}
                  />
                  <Button onClick={handleManualLookup} disabled={isLoading}>
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Part Information Display */}
        {partInfo && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Part Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Part Name</Label>
                  <p className="text-sm">{partInfo.part_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Part Number</Label>
                  <p className="text-sm font-mono">{partInfo.part_number}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Car Model</Label>
                  <p className="text-sm">{partInfo.car_model}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Location</Label>
                  <p className="text-sm">{partInfo.location}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Available Stock</Label>
                  <Badge className={getStockStatusColor(partInfo.quantity)}>
                    {partInfo.quantity} units
                  </Badge>
                </div>
                {partInfo.cost_per_unit && (
                  <div>
                    <Label className="text-sm font-medium">Cost per Unit</Label>
                    <p className="text-sm">${partInfo.cost_per_unit.toFixed(2)}</p>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="quantity">Quantity to Use</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max={partInfo.quantity}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="mt-1"
                />
                {partInfo.cost_per_unit && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Total Cost: ${((partInfo.cost_per_unit || 0) * quantity).toFixed(2)}
                  </p>
                )}
              </div>

              {partInfo.quantity === 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium text-sm">Out of Stock</span>
                  </div>
                  <p className="text-sm text-red-600 mt-1">
                    This part is currently out of stock. Please order more or use an alternative.
                  </p>
                </div>
              )}

              {partInfo.quantity <= 5 && partInfo.quantity > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-yellow-700">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium text-sm">Low Stock Warning</span>
                  </div>
                  <p className="text-sm text-yellow-600 mt-1">
                    Only {partInfo.quantity} units remaining. Consider reordering soon.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleAddPart} 
            disabled={!partInfo || partInfo.quantity === 0 || isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Add Part to Assignment
          </Button>
        </DialogFooter>

        <canvas ref={canvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedPartNumberScanner;
