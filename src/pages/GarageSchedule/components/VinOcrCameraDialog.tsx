import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, X, RotateCcw, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { useCameraPermission } from '@/utils/cameraPermissionManager';
import { extractVinFromImage } from '@/utils/ocrUtils';
import { toast } from '@/hooks/use-toast';

interface VinOcrCameraDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onVinDetected: (vin: string) => void;
}

const VinOcrCameraDialog: React.FC<VinOcrCameraDialogProps> = ({
  isOpen,
  onClose,
  onVinDetected
}) => {
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [extractedVin, setExtractedVin] = useState<string | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Use centralized camera permission manager
  const { 
    granted, 
    denied, 
    stream, 
    requestCamera, 
    stopCamera, 
    isSupported,
    hasActiveStream 
  } = useCameraPermission();

  // Auto-start camera when dialog opens if permission is already granted
  useEffect(() => {
    if (isOpen && granted && !hasActiveStream && !capturedImage) {
      handleStartCamera();
    } else if (!isOpen) {
      stopCamera();
      setCapturedImage(null);
      setExtractedVin(null);
      setOcrError(null);
    }
  }, [isOpen, granted, hasActiveStream, capturedImage]);

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
          facingMode: 'environment',
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1080, min: 480 }
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
    setCapturedImage(photoDataUrl);
    
    toast({
      title: "Photo captured",
      description: "Review the photo and confirm to process the VIN.",
    });
  };

  const handleCaptureAndProcess = async () => {
    try {
      // Capture image first
      capturePhoto();
      
      if (!capturedImage) {
        toast({
          title: 'Capture Failed',
          description: 'Could not capture image. Please try again.',
          variant: 'destructive'
        });
        return;
      }

      // Process with OCR
      setIsProcessingOCR(true);
      setOcrError(null);
      
      toast({
        title: 'Processing Image',
        description: 'Extracting VIN number using OCR...',
      });

      const extractedText = await extractVinFromImage(capturedImage);
      
      if (extractedText && extractedText.length >= 10) {
        // Validate VIN format (17 characters, alphanumeric, no I, O, Q)
        const cleanVin = extractedText.replace(/[^A-HJ-NPR-Z0-9]/gi, '').toUpperCase().substring(0, 17);
        
        if (cleanVin.length >= 10) { // Minimum viable VIN length
          setExtractedVin(cleanVin);
          toast({
            title: 'VIN Detected!',
            description: `Successfully extracted VIN: ${cleanVin}`,
          });
        } else {
          throw new Error('Could not detect a valid VIN number in the image');
        }
      } else {
        throw new Error('No VIN number detected in the image');
      }
    } catch (error: any) {
      console.error('VIN OCR error:', error);
      const errorMessage = error.message || 'Failed to extract VIN from image';
      setOcrError(errorMessage);
      toast({
        title: 'VIN Extraction Failed',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsProcessingOCR(false);
    }
  };

  const handleUseVin = () => {
    if (extractedVin) {
      onVinDetected(extractedVin);
      handleClose();
    }
  };

  const handleRetake = () => {
    setExtractedVin(null);
    setOcrError(null);
    setCapturedImage(null);
  };

  const handleClose = () => {
    stopCamera();
    setExtractedVin(null);
    setOcrError(null);
    setCapturedImage(null);
    onClose();
  };

  const isVinValid = extractedVin && extractedVin.length >= 10;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Scan VIN with Camera
          </DialogTitle>
          <DialogDescription>
            Use your camera to capture and automatically read the VIN number from the vehicle
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Camera View */}
          {!capturedImage && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Camera Scanner</CardTitle>
                <CardDescription>
                  Position the VIN number clearly in the camera view
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isSupported && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                    <div className="text-yellow-700 font-medium mb-2">Camera Not Available</div>
                    <p className="text-sm text-yellow-600 mb-3">
                      Camera access is not supported on this device or browser.
                    </p>
                    <p className="text-xs text-yellow-500">
                      Please use manual entry instead.
                    </p>
                  </div>
                )}

                {isSupported && !hasActiveStream && !isStartingCamera && (
                  <div className="text-center py-8">
                    <Camera className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-4">Camera is ready to start</p>
                    <Button onClick={handleStartCamera}>
                      <Camera className="mr-2 h-4 w-4" />
                      Start Camera
                    </Button>
                  </div>
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

                {isSupported && hasActiveStream && (
                  <div className="space-y-4">
                    <div className="relative">
                      <video
                        ref={videoRef}
                        className="w-full h-80 bg-gray-100 rounded-lg object-cover border-2 border-blue-200"
                        playsInline
                        muted
                        autoPlay
                      />
                      <canvas
                        ref={canvasRef}
                        className="hidden"
                      />
                      
                      {/* Enhanced overlay guide */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="border-2 border-blue-500 border-dashed rounded-lg p-6 bg-blue-500/10">
                          <p className="text-blue-600 text-base font-medium bg-white/90 px-3 py-2 rounded shadow-sm">
                            Position VIN number here
                          </p>
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

                    <div className="flex gap-2 justify-center">
                      <Button
                        onClick={capturePhoto}
                        disabled={isProcessingOCR}
                        className="bg-blue-600 hover:bg-blue-700"
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

                {isSupported && denied && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-red-700 mb-2">
                      <X className="h-4 w-4" />
                      <span className="font-medium">Camera Permission Denied</span>
                    </div>
                    <p className="text-sm text-red-600 mb-3">
                      Camera access was denied. Please allow camera access in your browser settings and try again.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleStartCamera}
                        size="sm"
                        variant="outline"
                        className="border-red-200 text-red-700 hover:bg-red-50"
                      >
                        <Camera className="mr-2 h-3 w-3" />
                        Try Again
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Photo Review */}
          {capturedImage && !extractedVin && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Review Captured Photo</CardTitle>
                <CardDescription>
                  Review the captured image and process it to extract the VIN
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <img 
                    src={capturedImage} 
                    alt="Captured VIN" 
                    className="w-full h-80 object-cover rounded-lg border-2 border-gray-200"
                  />
                </div>

                <div className="flex gap-2 justify-center">
                  <Button
                    onClick={handleCaptureAndProcess}
                    disabled={isProcessingOCR}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isProcessingOCR ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing VIN...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Process & Extract VIN
                      </>
                    )}
                  </Button>
                  <Button 
                    onClick={handleRetake} 
                    variant="outline"
                    className="border-orange-200 text-orange-700 hover:bg-orange-50"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Retake Photo
                  </Button>
                </div>

                {ocrError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-red-700 mb-1">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-medium text-sm">OCR Processing Failed</span>
                    </div>
                    <p className="text-sm text-red-600">{ocrError}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* VIN Result */}
          {extractedVin && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  VIN Successfully Extracted
                </CardTitle>
                <CardDescription>
                  The VIN number has been successfully detected from the image
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-center">
                    <p className="text-sm text-green-600 mb-2">Extracted VIN Number:</p>
                    <p className="text-2xl font-mono font-bold text-green-800 tracking-wider">
                      {extractedVin}
                    </p>
                    <p className="text-xs text-green-600 mt-2">
                      {isVinValid ? '✓ Valid VIN format' : '⚠ VIN may be incomplete'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 justify-center">
                  <Button
                    onClick={handleUseVin}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Use This VIN
                  </Button>
                  <Button 
                    onClick={handleRetake} 
                    variant="outline"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Scan Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VinOcrCameraDialog; 