import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Camera, 
  QrCode, 
  Upload, 
  X, 
  Check, 
  AlertCircle, 
  Loader2,
  Car,
  MapPin,
  FileText,
  Eye
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useCameraPermission } from '@/utils/cameraPermissionManager';
import { extractTextFromImage } from '@/utils/ocrUtils';
import { supabase } from '@/integrations/supabase/client';
import { useLocation } from 'react-router-dom';

interface VinResult {
  vin: string;
  confidence: number;
  extractedText: string;
  carData?: {
    brand: string;
    model: string;
    year: number;
    category: 'EV' | 'REV' | 'ICEV' | 'Other';
    estimatedPrice?: number;
  };
}

interface LocationTarget {
  table: string;
  location: string;
  currentFloor: string;
  inShowroom?: boolean;
  showroomEntryDate?: string;
}

interface UniversalVinScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onVinScanned: (vinData: VinResult, targetLocation: LocationTarget) => void;
  onCarAdded?: (carId: string) => void;
}

const UniversalVinScanner: React.FC<UniversalVinScannerProps> = ({
  isOpen,
  onClose,
  onVinScanned,
  onCarAdded
}) => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'camera' | 'manual'>('camera');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [vinResult, setVinResult] = useState<VinResult | null>(null);
  const [manualVin, setManualVin] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { 
    granted, 
    denied, 
    stream, 
    requestCamera, 
    stopCamera, 
    isSupported,
    hasActiveStream 
  } = useCameraPermission();

  // Get current location target
  const currentTarget = getLocationTarget(location.pathname);

  // Auto-start camera when dialog opens
  useEffect(() => {
    if (isOpen && activeTab === 'camera' && granted && !hasActiveStream) {
      handleStartCamera();
    } else if (!isOpen) {
      stopCamera();
      resetState();
    }
  }, [isOpen, activeTab, granted, hasActiveStream]);

  // Update video element when stream changes
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(console.error);
    }
  }, [stream]);

  function getLocationTarget(currentPath: string): LocationTarget {
    const locationMap: Record<string, LocationTarget> = {
      '/inventory': {
        table: 'cars',
        location: 'Inventory',
        currentFloor: 'Inventory',
        inShowroom: false
      },
      '/showroom-floor-1': {
        table: 'cars',
        location: 'Showroom Floor 1',
        currentFloor: 'Showroom Floor 1',
        inShowroom: true,
        showroomEntryDate: new Date().toISOString()
      },
      '/showroom-floor-2': {
        table: 'cars',
        location: 'Showroom Floor 2',
        currentFloor: 'Showroom Floor 2',
        inShowroom: true,
        showroomEntryDate: new Date().toISOString()
      },
      '/garage-inventory': {
        table: 'cars',
        location: 'Garage',
        currentFloor: 'Garage',
        inShowroom: false
      }
    };
    
    return locationMap[currentPath] || {
      table: 'cars',
      location: 'Inventory',
      currentFloor: 'Inventory',
      inShowroom: false
    };
  }

  function extractVinFromText(text: string): string | null {
    const VIN_PATTERNS = [
      /\b[A-HJ-NPR-Z0-9]{17}\b/gi,
      /(?:VIN|V\.I\.N|VEHICLE\s+ID|CHASSIS)[:#\s]*([A-HJ-NPR-Z0-9]{17})/gi,
    ];

    for (const pattern of VIN_PATTERNS) {
      const matches = text.match(pattern);
      if (matches) {
        for (const match of matches) {
          const cleanVin = match.replace(/[^A-HJ-NPR-Z0-9]/gi, '').toUpperCase();
          if (cleanVin.length === 17 && /^[A-HJ-NPR-Z0-9]{17}$/i.test(cleanVin)) {
            return cleanVin;
          }
        }
      }
    }
    return null;
  }

  function analyzeVin(vin: string): any {
    const VIN_BRAND_MAPPING: Record<string, { brand: string; category: 'EV' | 'REV' | 'ICEV' | 'Other' }> = {
      'JN': { brand: 'Nissan', category: 'EV' },
      'LFV': { brand: 'BMW', category: 'EV' },
      'WBA': { brand: 'BMW', category: 'EV' },
      '5YJ': { brand: 'Tesla', category: 'EV' },
      'LGX': { brand: 'Voyah', category: 'EV' },
      'WP0': { brand: 'Porsche', category: 'EV' },
    };

    const wmi = vin.substring(0, 3);
    let brand = 'Unknown';
    let category: 'EV' | 'REV' | 'ICEV' | 'Other' = 'Other';
    
    for (const [pattern, info] of Object.entries(VIN_BRAND_MAPPING)) {
      if (wmi.startsWith(pattern)) {
        brand = info.brand;
        category = info.category;
        break;
      }
    }
    
    const yearCode = vin.charAt(9);
    let year = new Date().getFullYear();
    
    const yearMap: Record<string, number> = {
      'L': 2020, 'M': 2021, 'N': 2022, 'P': 2023, 'R': 2024, 'S': 2025
    };
    
    if (yearMap[yearCode]) {
      year = yearMap[yearCode];
    }
    
    let estimatedPrice = 50000;
    if (brand === 'Tesla') estimatedPrice = 85000;
    else if (brand === 'BMW') estimatedPrice = 75000;
    else if (brand === 'Voyah') estimatedPrice = 65000;
    else if (brand === 'Porsche') estimatedPrice = 120000;
    
    return {
      brand,
      model: `${brand} Model`,
      year,
      category,
      estimatedPrice
    };
  }

  const resetState = () => {
    setCapturedPhoto(null);
    setVinResult(null);
    setManualVin('');
    setShowPreview(false);
    setIsProcessing(false);
    setIsAdding(false);
  };

  const handleStartCamera = async () => {
    try {
      await requestCamera();
    } catch (error) {
      console.error('Camera error:', error);
      toast({
        title: "Camera Error",
        description: "Failed to access camera. Please check permissions.",
        variant: "destructive"
      });
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      toast({
        title: "Camera not ready",
        description: "Please ensure the camera is active before capturing.",
        variant: "destructive"
      });
      return;
    }
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) {
      toast({
        title: "Canvas error",
        description: "Unable to capture photo. Please try again.",
        variant: "destructive"
      });
      return;
    }
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const photoDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedPhoto(photoDataUrl);
    setShowPreview(true);
    
    toast({
      title: "Photo captured",
      description: "Photo captured! Click 'Extract VIN' to read the VIN using OCR.",
    });
  };

  const processImage = async (imageDataUrl: string) => {
    try {
      setIsProcessing(true);
      
      toast({
        title: "Processing Image",
        description: "Extracting VIN number using OCR...",
      });

      const extractedText = await extractTextFromImage(imageDataUrl);
      
      if (!extractedText || extractedText.length < 10) {
        throw new Error('No readable text found in image');
      }
      
      const vin = extractVinFromText(extractedText);
      
      if (!vin) {
        throw new Error('No valid VIN found in image');
      }
      
      const carData = analyzeVin(vin);
      
      const result: VinResult = {
        vin,
        confidence: 0.9,
        extractedText,
        carData
      };
      
      setVinResult(result);
      setShowPreview(false);
      
      toast({
        title: "VIN Detected!",
        description: `Successfully extracted VIN: ${result.vin}`,
      });
      
    } catch (error: any) {
      console.error('VIN OCR error:', error);
      toast({
        title: 'VIN Extraction Failed',
        description: error.message || 'Failed to extract VIN from image',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file",
          description: "Please select an image file.",
          variant: "destructive"
        });
        return;
      }
      
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageDataUrl = e.target?.result as string;
        await processImage(imageDataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleManualSubmit = () => {
    const cleanVin = manualVin.trim().toUpperCase();
    
    if (cleanVin.length !== 17 || !/^[A-HJ-NPR-Z0-9]{17}$/i.test(cleanVin)) {
      toast({
        title: "Invalid VIN",
        description: "VIN must be exactly 17 characters and contain only valid characters (no I, O, Q).",
        variant: "destructive"
      });
      return;
    }

    const carData = analyzeVin(cleanVin);
    const result: VinResult = {
      vin: cleanVin,
      confidence: 1.0,
      extractedText: cleanVin,
      carData
    };
    
    setVinResult(result);
    
    toast({
      title: "VIN Processed",
      description: `VIN ${cleanVin} has been analyzed and is ready to add.`,
    });
  };

  const handleAddCar = async () => {
    if (!vinResult) return;
    
    try {
      setIsAdding(true);
      
      if (!vinResult.carData) {
        throw new Error('No car data available from VIN analysis');
      }
      
      // Handle "Other" category by defaulting to "EV"
      const category = vinResult.carData.category === 'Other' ? 'EV' : vinResult.carData.category;
      
      const carData = {
        vin_number: vinResult.vin,
        brand: vinResult.carData.brand,
        model: vinResult.carData.model,
        year: vinResult.carData.year,
        color: 'To be determined',
        category: category as "EV" | "REV" | "ICEV",
        battery_percentage: category === 'EV' ? 100 : null,
        status: 'in_stock' as "in_stock" | "reserved" | "sold",
        arrival_date: new Date().toISOString(),
        current_location: currentTarget.currentFloor as "Showroom Floor 1" | "Showroom Floor 2" | "Garage" | "Inventory" | "External",
        showroom_entry_date: currentTarget.showroomEntryDate,
        notes: `Added via VIN scan: ${vinResult.vin}`,
        selling_price: vinResult.carData.estimatedPrice || 0,
        customs: 'not_paid' as "not_paid" | "paid" | "pending" | "exempted",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data: existingCars } = await supabase
        .from('cars')
        .select('id, vin_number, current_location')
        .eq('vin_number', vinResult.vin);
      
      if (existingCars && existingCars.length > 0) {
        const existingCar = existingCars[0];
        const { error: updateError } = await supabase
          .from('cars')
          .update({
            current_location: currentTarget.currentFloor as "Showroom Floor 1" | "Showroom Floor 2" | "Garage" | "Inventory" | "External",
            showroom_entry_date: currentTarget.showroomEntryDate,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingCar.id);
        
        if (updateError) throw updateError;
        
        toast({
          title: "Car Moved",
          description: `Car moved from ${existingCar.current_location} to ${currentTarget.location}.`,
        });
        
        onVinScanned(vinResult, currentTarget);
        onCarAdded?.(existingCar.id);
        handleClose();
      } else {
        const { data, error } = await supabase
          .from('cars')
          .insert(carData)
          .select()
          .single();
        
        if (error) throw error;
        
        toast({
          title: "Car Added Successfully",
          description: `${vinResult.carData?.brand} ${vinResult.carData?.model} has been added to ${currentTarget.location}.`,
        });
        
        onVinScanned(vinResult, currentTarget);
        onCarAdded?.(data.id);
        handleClose();
      }
      
    } catch (error: any) {
      console.error('Error adding car:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add car to inventory",
        variant: "destructive"
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleClose = () => {
    stopCamera();
    resetState();
    onClose();
  };

  const handleRetakePhoto = () => {
    setShowPreview(false);
    setCapturedPhoto(null);
  };

  const getCameraStatusMessage = () => {
    if (isProcessing) return "Processing image...";
    if (denied) return "Camera permission denied";
    if (!isSupported) return "Camera not supported";
    if (hasActiveStream) return "Camera active";
    if (granted) return "Camera ready";
    return "Camera access required";
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Universal VIN Scanner
          </DialogTitle>
          <DialogDescription>
            Scan or enter a VIN to automatically add the vehicle to {currentTarget.location}
          </DialogDescription>
        </DialogHeader>

        {vinResult ? (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  VIN Successfully Detected
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">VIN Number</Label>
                    <Badge variant="outline" className="w-full justify-center text-lg font-mono">
                      {vinResult.vin}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Confidence</Label>
                    <Badge variant="secondary" className="w-full justify-center">
                      {(vinResult.confidence * 100).toFixed(0)}%
                    </Badge>
                  </div>
                </div>
                
                {vinResult.carData && (
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <Label className="text-sm font-medium">Brand</Label>
                      <p className="font-semibold">{vinResult.carData.brand}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Model</Label>
                      <p className="font-semibold">{vinResult.carData.model}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Year</Label>
                      <p className="font-semibold">{vinResult.carData.year}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Category</Label>
                      <Badge variant="outline">{vinResult.carData.category}</Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Estimated Price</Label>
                      <p className="font-semibold">${vinResult.carData.estimatedPrice?.toLocaleString()}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Target Location</Label>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <p className="font-semibold">{currentTarget.location}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setVinResult(null)}>
                Scan Another
              </Button>
              <Button 
                onClick={handleAddCar}
                disabled={isAdding}
                className="bg-green-600 hover:bg-green-700"
              >
                {isAdding ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding Car...
                  </>
                ) : (
                  <>
                    <Car className="mr-2 h-4 w-4" />
                    Add to {currentTarget.location}
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'camera' | 'manual')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="camera" className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Camera Scanner
              </TabsTrigger>
              <TabsTrigger value="manual" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Manual Entry
              </TabsTrigger>
            </TabsList>

            <TabsContent value="camera" className="space-y-4">
              {showPreview && capturedPhoto ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Captured Photo</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="relative">
                      <img 
                        src={capturedPhoto} 
                        alt="Captured VIN" 
                        className="w-full h-64 object-contain border rounded-md"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={handleRetakePhoto}
                        className="flex-1"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Retake
                      </Button>
                      <Button 
                        onClick={() => processImage(capturedPhoto)}
                        disabled={isProcessing}
                        className="flex-1"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Eye className="mr-2 h-4 w-4" />
                            Extract VIN
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Camera View</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="relative w-full aspect-video bg-slate-100 rounded-md overflow-hidden">
                      <video 
                        ref={videoRef} 
                        className="w-full h-full object-cover"
                        playsInline
                        muted
                        autoPlay
                        style={{ display: 'block' }}
                      />
                      {!hasActiveStream && (
                        <div className="absolute inset-0 flex items-center justify-center flex-col gap-2">
                          <Camera className="h-12 w-12 text-muted-foreground opacity-30" />
                          <p className="text-sm text-muted-foreground text-center px-4">
                            {getCameraStatusMessage()}
                          </p>
                        </div>
                      )}
                      <canvas ref={canvasRef} className="hidden" />
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <Button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('Camera button clicked:', hasActiveStream);
                          hasActiveStream ? stopCamera() : handleStartCamera();
                        }}
                        variant={hasActiveStream ? "destructive" : "default"}
                        disabled={isProcessing}
                      >
                        {hasActiveStream ? "Stop Camera" : "Start Camera"}
                      </Button>
                      
                      <Button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('Capture button clicked');
                          capturePhoto();
                        }}
                        disabled={!hasActiveStream || isProcessing}
                        variant="secondary"
                      >
                        <Camera className="mr-2 h-4 w-4" />
                        Capture
                      </Button>
                      
                      <Button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('Upload button clicked');
                          fileInputRef.current?.click();
                        }}
                        variant="outline"
                        disabled={isProcessing}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Upload
                      </Button>
                    </div>
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    
                    {hasActiveStream && (
                      <div className="text-xs text-muted-foreground text-center p-2 bg-blue-50 rounded">
                        📸 Position the VIN number clearly in the camera view and capture when ready
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="manual" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Manual VIN Entry</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="manual-vin">VIN Number (17 characters)</Label>
                    <Input
                      id="manual-vin"
                      value={manualVin}
                      onChange={(e) => setManualVin(e.target.value.toUpperCase())}
                      placeholder="Enter 17-character VIN"
                      maxLength={17}
                      className="font-mono"
                    />
                    <div className="text-xs text-muted-foreground">
                      VIN must be exactly 17 characters (excludes I, O, Q)
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleManualSubmit}
                    disabled={manualVin.length !== 17}
                    className="w-full"
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Process VIN
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              Target: {currentTarget.location}
            </div>
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UniversalVinScanner; 