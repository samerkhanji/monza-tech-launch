import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, QrCode, Upload, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useCameraCapture } from '@/hooks/useCameraCapture';
import { useCameraPermission } from '@/utils/cameraPermissionManager';

interface VINScannerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onVINScanned: (vin: string) => void;
}

const VINScannerDialog: React.FC<VINScannerDialogProps> = ({
  isOpen,
  onClose,
  onVINScanned
}) => {
  const [manualVIN, setManualVIN] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [debugMode, setDebugMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use centralized camera permission manager instead of local camera capture
  const { 
    granted, 
    denied, 
    stream, 
    requestCamera, 
    stopCamera, 
    isSupported,
    hasActiveStream 
  } = useCameraPermission();

  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Auto-start camera when dialog opens if permission is already granted
  React.useEffect(() => {
    if (isOpen && granted && !hasActiveStream) {
      handleStartCamera();
    } else if (!isOpen) {
      stopCamera();
    }
  }, [isOpen, granted, hasActiveStream]);

  // Update video element when stream changes
  React.useEffect(() => {
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
          facingMode: 'environment'
        } 
      });
      
      toast({
        title: "Camera Ready",
        description: "Position the VIN clearly in the camera view and capture a photo.",
      });
    } catch (err) {
      console.error("Camera access error:", err);
      
      let errorMessage = "Could not access the camera.";
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          errorMessage = "Camera permission was denied. Please allow camera access in your browser settings.";
        } else if (err.name === 'NotFoundError') {
          errorMessage = "No camera found on this device.";
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
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert to data URL
    const photoDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setPreviewImage(photoDataUrl);
    setShowPreview(true);
    
    toast({
      title: "Photo captured",
      description: "Review the photo and confirm to process the VIN.",
    });
  };

  const handleCameraCapture = () => {
    capturePhoto();
  };

  const extractVINFromText = (text: string): string | null => {
    // Enhanced VIN extraction patterns
    const vinPatterns = [
      // Standard 17-character VIN pattern
      /\b[A-HJ-NPR-Z0-9]{17}\b/gi,
      
      // VIN with separators
      /\b[A-HJ-NPR-Z0-9]{3}[-\s.]?[A-HJ-NPR-Z0-9]{2}[-\s.]?[A-HJ-NPR-Z0-9]{2}[-\s.]?[A-HJ-NPR-Z0-9]{2}[-\s.]?[A-HJ-NPR-Z0-9]{6}\b/gi,
      
      // VIN with prefixes
      /(?:VIN|V\.I\.N|VEHICLE\s+ID|CHASSIS)[:#\s]*([A-HJ-NPR-Z0-9]{17})/gi,
    ];

    for (const pattern of vinPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        for (const match of matches) {
          // Clean the VIN
          const cleanVIN = match.replace(/[^A-HJ-NPR-Z0-9]/gi, '').toUpperCase();
          
          // Validate VIN length and characters
          if (cleanVIN.length === 17 && /^[A-HJ-NPR-Z0-9]{17}$/i.test(cleanVIN)) {
            return cleanVIN;
          }
        }
      }
    }
    
    return null;
  };

  const processImage = async (imageDataUrl: string) => {
    try {
      setIsProcessing(true);
      
      // For demo purposes, simulate OCR processing
      // In production, you would integrate with an OCR service like:
      // - Google Vision API
      // - AWS Textract
      // - Azure Computer Vision
      // - Tesseract.js
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate OCR text extraction
      const simulatedOCRText = `
        VEHICLE IDENTIFICATION NUMBER
        VIN: 1HGBH41JXMN109186
        MAKE: BMW
        MODEL: iX M60
        YEAR: 2024
      `;
      
      const extractedVIN = extractVINFromText(simulatedOCRText);
      
      if (extractedVIN) {
        onVINScanned(extractedVIN);
        handleClose();
        toast({
          title: "VIN Detected",
          description: `Successfully scanned VIN: ${extractedVIN}`,
        });
      } else {
        toast({
          title: "No VIN Found",
          description: "Could not detect a valid VIN in the image. Please try again or enter manually.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error processing image:', error);
      toast({
        title: "Processing Error",
        description: "Failed to process the image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmPhoto = async () => {
    if (previewImage) {
      setShowPreview(false);
      await processImage(previewImage);
    }
  };

  const handleRetakePhoto = () => {
    setShowPreview(false);
    setPreviewImage(null);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageDataUrl = e.target?.result as string;
        await processImage(imageDataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleManualSubmit = () => {
    if (manualVIN.trim().length !== 17) {
      toast({
        title: "Invalid VIN",
        description: "VIN must be exactly 17 characters long.",
        variant: "destructive"
      });
      return;
    }

    const cleanVIN = manualVIN.trim().toUpperCase();
    // More permissive validation for mock data - allow all alphanumeric characters
    if (!/^[A-Z0-9]{17}$/i.test(cleanVIN)) {
      toast({
        title: "Invalid VIN",
        description: "VIN must contain only letters and numbers.",
        variant: "destructive"
      });
      return;
    }

    onVINScanned(cleanVIN);
    handleClose();
  };

  const handleClose = () => {
    stopCamera();
    setManualVIN('');
    setIsProcessing(false);
    setShowPreview(false);
    setPreviewImage(null);
    setIsStartingCamera(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Scan VIN Code
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDebugMode(!debugMode)}
              className="text-xs"
            >
              Debug {debugMode ? 'Off' : 'On'}
            </Button>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue={isSupported ? "camera" : "upload"} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="camera" disabled={!isSupported}>
              Camera {!isSupported && "(Not Available)"}
            </TabsTrigger>
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="manual">Manual</TabsTrigger>
          </TabsList>

          <TabsContent value="camera" className="space-y-4">
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="font-medium mb-2">Camera Scanner</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Position the VIN code within the camera frame
                </p>
              </div>

              {!isSupported && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                  <div className="text-yellow-700 font-medium mb-2">Camera Not Available</div>
                  <p className="text-sm text-yellow-600 mb-3">
                    Camera access is not supported on this device or browser.
                  </p>
                  <p className="text-xs text-yellow-500">
                    Please use the Upload or Manual entry options instead.
                  </p>
                </div>
              )}

              {isSupported && !hasActiveStream && !isStartingCamera && (
                <Button
                  onClick={handleStartCamera}
                  className="w-full"
                  variant="outline"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Start Camera
                </Button>
              )}

              {isSupported && isStartingCamera && (
                <div className="text-center py-8">
                  <div className="inline-flex items-center gap-2 text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm font-medium">Starting camera...</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Please allow camera access when prompted
                  </p>
                </div>
              )}

              {isSupported && hasActiveStream && !showPreview && (
                <div className="space-y-4">
                  {/* Camera status indicator */}
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2 text-green-700">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium">Camera Active</span>
                    </div>
                    <div className="text-xs text-green-600">
                      Position VIN code in the frame
                    </div>
                  </div>

                  <div className="relative w-full bg-gray-100 rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      autoPlay
                      playsInline
                      muted
                      onLoadedMetadata={(e) => {
                        const video = e.target as HTMLVideoElement;
                        console.log('Video metadata loaded in component:', {
                          width: video.videoWidth,
                          height: video.videoHeight,
                          duration: video.duration
                        });
                      }}
                      onError={(e) => {
                        console.error('Video element error:', e);
                      }}
                      onCanPlay={() => {
                        console.log('Video can play event fired');
                      }}
                      onPlaying={() => {
                        console.log('Video playing event fired');
                      }}
                    />
                    {/* Camera preview overlay */}
                    <div className="absolute inset-0 pointer-events-none">
                      {/* Corner guides */}
                      <div className="absolute top-4 left-4 w-6 h-6 border-l-2 border-t-2 border-yellow-400"></div>
                      <div className="absolute top-4 right-4 w-6 h-6 border-r-2 border-t-2 border-yellow-400"></div>
                      <div className="absolute bottom-4 left-4 w-6 h-6 border-l-2 border-b-2 border-yellow-400"></div>
                      <div className="absolute bottom-4 right-4 w-6 h-6 border-r-2 border-b-2 border-yellow-400"></div>
                      
                      {/* Center guide */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="border-2 border-dashed border-yellow-400 rounded-lg px-4 py-2 bg-black bg-opacity-50">
                          <div className="text-yellow-400 text-sm font-medium text-center">
                            Position VIN Code Here
                          </div>
                          <div className="text-yellow-200 text-xs text-center mt-1">
                            Ensure good lighting and focus
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleCameraCapture} 
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      disabled={isProcessing}
                    >
                      <Camera className="mr-2 h-4 w-4" />
                      Capture Photo
                    </Button>
                    <Button onClick={stopCamera} variant="outline">
                      <X className="mr-2 h-4 w-4" />
                      Stop Camera
                    </Button>
                  </div>
                </div>
              )}

              {isSupported && showPreview && previewImage && (
                <div className="space-y-4">
                  <div className="text-center">
                    <h4 className="font-medium mb-2">Photo Preview</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Review the captured photo before processing
                    </p>
                  </div>
                  
                  <div className="relative w-full bg-gray-100 rounded-lg overflow-hidden border-2 border-green-200" style={{ aspectRatio: '16/9' }}>
                    <img
                      src={previewImage}
                      alt="Captured VIN Preview"
                      className="w-full h-full object-cover"
                      onLoad={() => {
                        console.log('Preview image loaded successfully');
                      }}
                      onError={(e) => {
                        console.error('Preview image failed to load:', e);
                      }}
                    />
                    {/* Preview overlay */}
                    <div className="absolute inset-0 pointer-events-none">
                      {/* Success indicator */}
                      <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                        Photo Captured
                      </div>
                      
                      {/* Quality indicators */}
                      <div className="absolute top-4 right-4 space-y-1">
                        <div className="bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                          Ready for Processing
                        </div>
                      </div>
                      
                      {/* Center confirmation */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="border-2 border-dashed border-green-400 rounded-lg px-4 py-2 bg-green-500 bg-opacity-20">
                          <div className="text-green-600 text-sm font-medium text-center">
                            ✓ Photo Ready
                          </div>
                          <div className="text-green-700 text-xs text-center mt-1">
                            Click "Process" to scan VIN
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleConfirmPhoto} 
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      disabled={isProcessing}
                    >
                      <QrCode className="mr-2 h-4 w-4" />
                      {isProcessing ? 'Processing VIN...' : 'Process & Scan VIN'}
                    </Button>
                    <Button 
                      onClick={handleRetakePhoto} 
                      variant="outline"
                      className="border-orange-200 text-orange-700 hover:bg-orange-50"
                    >
                      <Camera className="mr-2 h-4 w-4" />
                      Retake Photo
                    </Button>
                  </div>
                </div>
              )}

              {isSupported && !hasActiveStream && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-red-700 mb-2">
                    <X className="h-4 w-4" />
                    <span className="font-medium">Camera Error</span>
                  </div>
                  <p className="text-sm text-red-600 mb-3">Camera access error</p>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleStartCamera}
                      size="sm"
                      variant="outline"
                      className="border-red-200 text-red-700 hover:bg-red-50"
                      disabled={isStartingCamera}
                    >
                      <Camera className="mr-2 h-3 w-3" />
                      Try Again
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="font-medium mb-2">Upload Image</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload a photo containing the VIN code
                </p>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 mb-2">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-500">
                  PNG, JPG, GIF up to 10MB
                </p>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="mt-2"
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : 'Choose File'}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="font-medium mb-2">Manual Entry</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Enter the 17-character VIN manually
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="manual-vin">VIN Number</Label>
                <Input
                  id="manual-vin"
                  value={manualVIN}
                  onChange={(e) => setManualVIN(e.target.value.toUpperCase())}
                  placeholder="Enter 17-character VIN"
                  maxLength={17}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  {manualVIN.length}/17 characters
                </p>
              </div>

              <Button
                onClick={handleManualSubmit}
                className="w-full"
                disabled={manualVIN.length !== 17}
              >
                Add Car to Garage
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {debugMode && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg border text-xs">
            <div className="font-medium mb-2">Debug Information:</div>
            <div className="space-y-1 text-gray-600">
              <div>Camera Supported: {isSupported ? 'Yes' : 'No'}</div>
              <div>Camera Active: {hasActiveStream ? 'Yes' : 'No'}</div>
              <div>Starting Camera: {isStartingCamera ? 'Yes' : 'No'}</div>
              <div>Show Preview: {showPreview ? 'Yes' : 'No'}</div>
              <div>Processing: {isProcessing ? 'Yes' : 'No'}</div>
              <div>User Agent: {navigator.userAgent.substring(0, 50)}...</div>
              <div>Protocol: {window.location.protocol}</div>
            </div>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  );
};

export default VINScannerDialog; 