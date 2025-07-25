import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QrCode, Camera, Car, MapPin, User, FileText, CheckCircle, X, ArrowLeft, Battery, Fuel, Calendar, DollarSign, Settings, Wrench } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useCameraPermission } from '@/utils/cameraPermissionManager';
import { supabase } from '@/integrations/supabase/client';
import { extractTextFromImage } from '@/utils/ocrUtils';

interface CarData {
  id: string;
  vin_number: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  category: 'EV' | 'REV' | 'ICEV';
  status: 'in_stock' | 'reserved' | 'sold';
  current_location: string;
  selling_price: number;
  battery_percentage?: number;
  range_km?: number;
  arrival_date: string;
  customs: 'not_paid' | 'paid' | 'pending' | 'exempted';
  pdi_completed: boolean;
  pdi_technician?: string;
  pdi_date?: string;
  notes?: string;
  test_drive_status?: boolean;
  created_at: string;
  updated_at: string;
}

interface VinScannerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onVinScanned: (vinData: string) => void;
  targetLocation?: 'Inventory' | 'Showroom Floor 1' | 'Showroom Floor 2' | 'Garage' | 'External';
  onCarMoved?: (carId: string, fromLocation: string, toLocation: string) => void;
  onCarAdded?: (carId: string) => void;
  onTestDrive?: (car: CarData, isClientTestDrive: boolean) => void;
  onPdiAction?: (car: CarData) => void;
}

const VinScannerDialog: React.FC<VinScannerDialogProps> = ({
  isOpen,
  onClose,
  onVinScanned,
  targetLocation = 'Inventory',
  onCarMoved,
  onCarAdded,
  onTestDrive,
  onPdiAction,
}) => {
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [foundCarData, setFoundCarData] = useState<CarData | null>(null);
  const [showCarDetails, setShowCarDetails] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const { 
    granted, 
    denied, 
    stream, 
    requestCamera, 
    stopCamera, 
    isSupported,
    hasActiveStream 
  } = useCameraPermission();

  // VIN validation regex
  const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/;

  // Auto-start camera when dialog opens if permission is already granted
  useEffect(() => {
    if (isOpen && granted && !hasActiveStream && !showCarDetails) {
      handleStartCamera();
    } else if (isOpen && !granted && !denied && !showCarDetails) {
      // If permission status is unknown, try to start camera
      handleStartCamera();
    } else if (!isOpen) {
      stopCamera();
      setCapturedPhoto(null);
      setIsProcessing(false);
      setFoundCarData(null);
      setShowCarDetails(false);
    }
  }, [isOpen, granted, denied, hasActiveStream, showCarDetails]);

  // Update video element when stream changes
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(console.error);
    }
  }, [stream]);

  const handleStartCamera = async () => {
    if (!isSupported) {
      toast({
        title: "Camera Not Supported",
        description: "Camera access is not supported on this device or browser.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsStartingCamera(true);
      await requestCamera({ 
        video: { 
          facingMode: 'environment' // Try to use back camera first
        } 
      });
      
      toast({
        title: "Camera Active",
        description: "Position the VIN clearly in the camera view.",
      });
    } catch (err) {
      console.error("Camera access error:", err);
      
      let errorMessage = "Could not access the camera.";
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          errorMessage = "Camera permission denied. Please allow camera access and try again.";
        } else if (err.name === 'NotFoundError') {
          errorMessage = "No camera found on this device.";
        } else if (err.name === 'NotSupportedError') {
          errorMessage = "Camera not supported on this browser.";
        } else {
          errorMessage = err.message;
        }
      }
      
      toast({
        title: "Camera Access Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsStartingCamera(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      toast({
        title: "Camera not ready",
        description: "Please ensure the camera is active before capturing.",
        variant: "destructive",
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
        variant: "destructive",
      });
      return;
    }
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const photoDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedPhoto(photoDataUrl);
    
    toast({
      title: "Photo captured",
      description: "Photo captured! Click 'Extract VIN' to read the VIN using OCR.",
    });
  };

  const extractVinFromText = (text: string): string | null => {
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
      
      await handleVinScanned(vin);
      
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

  const handleVinScanned = async (scannedVin: string) => {
    // Validate the scanned VIN
    if (!vinRegex.test(scannedVin)) {
      toast({
        title: "Invalid VIN Format",
        description: "The scanned text does not appear to be a valid VIN.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get comprehensive car data
      const { data: carData } = await supabase
        .from('cars')
        .select(`
          *,
          pdi_inspections(*),
          test_drives(*)
        `)
        .eq('vin_number', scannedVin)
        .single();

      if (carData) {
        // Car exists - show comprehensive information
        const enhancedCarData: CarData = {
          id: carData.id,
          vin_number: carData.vin_number,
          brand: carData.brand || 'Unknown',
          model: carData.model || 'Unknown Model',
          year: carData.year || new Date().getFullYear(),
          color: carData.color || 'Unknown',
          category: carData.category || 'EV',
          status: carData.status || 'in_stock',
          current_location: carData.current_location || 'Unknown',
          selling_price: carData.selling_price || 0,
          battery_percentage: carData.battery_percentage || 100,
          range_km: carData.range_km || 0,
          arrival_date: carData.arrival_date || carData.created_at,
          customs: carData.customs || 'not_paid',
          pdi_completed: carData.pdi_inspections?.some(pdi => pdi.status === 'completed') || false,
          pdi_technician: carData.pdi_inspections?.find(pdi => pdi.status === 'completed')?.technician_name || undefined,
          pdi_date: carData.pdi_inspections?.find(pdi => pdi.status === 'completed')?.completion_date || undefined,
          notes: carData.notes || undefined,
          test_drive_status: carData.test_drives?.some(td => td.is_active === true) || false,
          created_at: carData.created_at,
          updated_at: carData.updated_at
        };

        setFoundCarData(enhancedCarData);
        setShowCarDetails(true);
        stopCamera(); // Stop camera when showing details
        
        toast({
          title: "Car Found!",
          description: `${enhancedCarData.brand} ${enhancedCarData.model} information loaded.`,
        });

        onVinScanned(scannedVin);

      } else {
        // Car doesn't exist - create new car
        const newCarData = {
          vin_number: scannedVin,
          model: `Unknown Model (${scannedVin.slice(-4)})`,
          brand: 'Unknown',
          year: new Date().getFullYear(),
          color: 'To be determined',
          category: 'EV' as "EV" | "REV" | "ICEV",
          status: 'in_stock' as "in_stock" | "reserved" | "sold",
          current_location: targetLocation,
          selling_price: 0,
          arrival_date: new Date().toISOString(),
          showroom_entry_date: targetLocation.includes('Showroom') ? new Date().toISOString() : null,
          garage_entry_date: targetLocation === 'Garage' ? new Date().toISOString() : null,
          customs: 'not_paid' as "not_paid" | "paid" | "pending" | "exempted",
          notes: `Added via VIN scanner to ${targetLocation}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { data: newCar, error: insertError } = await supabase
          .from('cars')
          .insert(newCarData)
          .select()
          .single();

        if (insertError) throw insertError;

        // Show the new car data
        const enhancedNewCarData: CarData = {
          ...newCarData,
          id: newCar.id,
          battery_percentage: 100,
          range_km: 0,
          pdi_completed: false,
          test_drive_status: false
        };

        setFoundCarData(enhancedNewCarData);
        setShowCarDetails(true);
        stopCamera();

        toast({
          title: "New Car Added",
          description: `Vehicle with VIN ${scannedVin} added to ${targetLocation}.`,
        });

        onVinScanned(scannedVin);
        onCarAdded?.(newCar.id);
      }

    } catch (error: any) {
      console.error('Database error:', error);
      toast({
        title: "Database Error",
        description: error.message || "Failed to process VIN in database",
        variant: "destructive",
      });
    }
  };

  const handleScannerCapture = () => {
    // This function is triggered by the "Capture & Scan VIN" button.
    if (capturedPhoto) {
      processImage(capturedPhoto);
    } else {
      // Capture photo first
      capturePhoto();
    }
  };

  const handleClose = () => {
    stopCamera();
    setCapturedPhoto(null);
    setIsProcessing(false);
    setFoundCarData(null);
    setShowCarDetails(false);
    onClose();
  };

  const handleBackToScanner = () => {
    setShowCarDetails(false);
    setFoundCarData(null);
    setCapturedPhoto(null);
    // Restart camera
    if (granted) {
      handleStartCamera();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'sold':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'reserved':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'EV':
        return 'category-ev'; // Electric Vehicle
      case 'REV':
        return 'category-rev'; // Range Extended Vehicle
      case 'ICEV':
        return 'category-icev'; // Internal Combustion Engine Vehicle
      default:
        return 'bg-gray-400 text-white';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getCameraStatusMessage = () => {
    if (isStartingCamera) return "Starting camera...";
    if (isProcessing) return "Processing image...";
    if (denied) return "Camera permission denied";
    if (!isSupported) return "Camera not supported";
    if (hasActiveStream) return "Camera active";
    if (granted) return "Camera ready";
    return "Camera access required";
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={showCarDetails ? "max-w-4xl w-[95vw] max-h-[95vh] overflow-y-auto" : "max-w-2xl w-[95vw] max-h-[95vh] overflow-y-auto"}>
        <DialogHeader className="sticky top-0 bg-white z-10 border-b pb-4">
          <DialogTitle className="flex items-center gap-2">
            {showCarDetails ? (
              <>
                <Car className="h-5 w-5" />
                Vehicle Information & Actions
              </>
            ) : (
              <>
                <Camera className="h-5 w-5" />
                Scan VIN - Add to {targetLocation}
              </>
            )}
          </DialogTitle>
          {!showCarDetails && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              Target Location: <span className="font-medium text-blue-600">{targetLocation}</span>
            </div>
          )}
        </DialogHeader>
        
        <div className="px-1">{/* Content will go here */}
          {showCarDetails ? (
            foundCarData && (
              <div className="space-y-6">
                {/* Header with car overview */}
                <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{foundCarData.brand} {foundCarData.model}</h3>
                      <p className="text-gray-600 font-mono text-sm">{foundCarData.vin_number}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getCategoryColor(foundCarData.category)}>
                        {foundCarData.category}
                      </Badge>
                      <Badge className={getStatusColor(foundCarData.status)}>
                        {foundCarData.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Year:</span>
                      <p className="font-medium">{foundCarData.year}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Color:</span>
                      <p className="font-medium">{foundCarData.color}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Location:</span>
                      <p className="font-medium text-blue-600">{foundCarData.current_location}</p>
                    </div>
                  </div>
                </div>

                {/* Key metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-gray-700">Price</span>
                    </div>
                    <p className="text-lg font-bold text-green-600">{formatCurrency(foundCarData.selling_price)}</p>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Battery className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">Battery</span>
                    </div>
                    <p className="text-lg font-bold text-blue-600">{foundCarData.battery_percentage || 0}%</p>
                    <p className="text-xs text-gray-500">Range: {foundCarData.range_km || 0} km</p>
                  </div>
                </div>

                {/* Status indicators */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium text-gray-700">PDI Status</span>
                    </div>
                    <Badge className={foundCarData.pdi_completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                      {foundCarData.pdi_completed ? (
                        <><span className="mr-1 text-lg">☺</span> Complete</>
                      ) : (
                        <><span className="mr-1 text-lg">☹</span> Pending</>
                      )}
                    </Badge>
                    {foundCarData.pdi_technician && (
                      <p className="text-xs text-gray-500 mt-1">By: {foundCarData.pdi_technician}</p>
                    )}
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Car className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium text-gray-700">Test Drive</span>
                    </div>
                    <Badge className={foundCarData.test_drive_status ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}>
                      {foundCarData.test_drive_status ? 'Active' : 'Available'}
                    </Badge>
                  </div>
                </div>

                {/* Customs status */}
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Settings className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Customs & Documentation</span>
                  </div>
                  <Badge variant={foundCarData.customs === 'paid' ? 'default' : 'destructive'}>
                    {foundCarData.customs === 'paid' ? (
                      <><CheckCircle className="mr-1 h-4 w-4" /> Paid</>
                    ) : (
                      <><X className="mr-1 h-4 w-4" /> {foundCarData.customs.replace('_', ' ')}</>
                    )}
                  </Badge>
                </div>

                {/* Important dates */}
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Important Dates</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Arrival:</span>
                      <p className="font-medium">{formatDate(foundCarData.arrival_date)}</p>
                    </div>
                    {foundCarData.pdi_date && (
                      <div>
                        <span className="text-gray-500">PDI Completed:</span>
                        <p className="font-medium">{formatDate(foundCarData.pdi_date)}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {foundCarData.notes && (
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Notes</h4>
                    <p className="text-sm text-gray-600">{foundCarData.notes}</p>
                  </div>
                )}

                {/* Action buttons - Note: Test Drive and PDI actions are now available directly on the main inventory table via clickable badges */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-700 text-center">
                    <strong>Actions Available:</strong> Test Drive and PDI management can be accessed directly from the main inventory table via clickable badges.
                  </p>
                </div>

                {/* Navigation buttons */}
                <div className="flex justify-between pt-4 border-t">
                  <Button variant="outline" onClick={handleBackToScanner} className="flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Scan Another VIN
                  </Button>
                  <Button variant="outline" onClick={handleClose}>
                    Close
                  </Button>
                </div>
              </div>
            )
          ) : (
            <div className="space-y-4">
            {/* Camera Scanner */}
            <div className="space-y-4">
              <div className="relative">
                {capturedPhoto ? (
                  <img 
                    src={capturedPhoto} 
                    alt="Captured VIN" 
                    className="w-full h-64 rounded-md object-contain border-2 border-blue-200"
                  />
                ) : (
                  <>
                    <video 
                      ref={videoRef} 
                      className="w-full h-64 rounded-md bg-gray-100 object-cover border-2 border-blue-200" 
                      autoPlay 
                      playsInline
                      muted
                    />
                    <canvas ref={canvasRef} className="hidden" />
                  </>
                )}
                
                {!hasActiveStream && !capturedPhoto && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-md">
                    <div className="text-center">
                      <Camera className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">{getCameraStatusMessage()}</p>
                    </div>
                  </div>
                )}
                
                {/* Live indicator */}
                {hasActiveStream && !capturedPhoto && (
                  <div className="absolute top-3 left-3">
                    <div className="flex items-center gap-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      LIVE
                    </div>
                  </div>
                )}
                
                {/* Overlay guide */}
                {!capturedPhoto && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="border-2 border-blue-500 border-dashed rounded-lg p-6 bg-blue-500/10">
                      <p className="text-blue-600 text-base font-medium bg-white/90 px-3 py-2 rounded shadow-sm">
                        Position VIN number here
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="text-center space-y-2">
                {!capturedPhoto ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Position the VIN clearly in the camera view, then capture
                    </p>
                    {hasActiveStream && (
                      <Button onClick={capturePhoto} className="w-full">
                        <Camera className="mr-2 h-4 w-4" />
                        Capture Photo
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Photo captured! Click below to extract VIN or retake
                    </p>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setCapturedPhoto(null)}
                        className="flex-1"
                      >
                        Retake Photo
                      </Button>
                      <Button 
                        onClick={handleScannerCapture} 
                        disabled={isProcessing}
                        className="flex-1"
                      >
                        {isProcessing ? (
                          <>
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <QrCode className="mr-2 h-4 w-4" />
                            Extract VIN
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h4 className="font-medium text-blue-800 text-sm mb-2">Tips for Best Results</h4>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Ensure good lighting on the VIN plate</li>
                <li>• Hold the camera steady and focus clearly</li>
                <li>• Position the entire VIN number within the frame</li>
                <li>• VIN is usually on dashboard, door frame, or engine block</li>
              </ul>
            </div>

                        {/* Location Info */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Car className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-800 text-sm">
                    Target Location: <span className="font-bold">{targetLocation}</span>
                  </span>
                </div>
                <p className="text-xs text-green-700 mt-1">
                  • Found cars will show comprehensive information and action options
                  • New cars will be added directly to {targetLocation}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VinScannerDialog;
