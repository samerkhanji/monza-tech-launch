import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, Upload, FileText, Loader2, Receipt, X, Scan, RotateCcw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { receiptProcessingService, ReceiptData } from '@/services/receiptProcessingService';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ReceiptUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onReceiptProcessed: (data: ReceiptData, category: 'voyah' | 'normal_engine') => void;
}

const ReceiptUploadDialog: React.FC<ReceiptUploadDialogProps> = ({
  isOpen,
  onClose,
  onReceiptProcessed
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<ReceiptData | null>(null);
  const [detectedCategory, setDetectedCategory] = useState<'voyah' | 'normal_engine' | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [mode, setMode] = useState<'select' | 'camera' | 'upload'>('select');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isMountedRef = useRef(true);

  // Clean up camera when dialog closes
  useEffect(() => {
    isMountedRef.current = true;
    
    // Only stop camera when dialog actually closes, not when camera becomes active
    if (!isOpen) {
      console.log('🚪 Dialog closed, stopping camera...');
      stopCamera();
    }
    
    return () => {
      console.log('🧹 Component cleanup, unmounting...');
      isMountedRef.current = false;
      stopCamera();
    };
  }, [isOpen]); // Remove isCameraActive from dependencies to prevent unnecessary re-runs

  const startCamera = useCallback(async () => {
    try {
      setIsCameraLoading(true);
      setMode('camera');
      console.log('🎥 Starting receipt camera...');
      
      // Small delay to ensure DOM has updated
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check if navigator.mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this browser');
      }

      // Check if running in secure context (HTTPS or localhost)
      const isSecure = window.location.protocol === 'https:' || 
                      window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1';
      
      if (!isSecure) {
        throw new Error('Camera requires HTTPS or localhost. Current protocol: ' + window.location.protocol);
      }

      // Try multiple constraint configurations for better compatibility
      const constraintOptions = [
        // Try environment camera first (back camera on mobile)
        {
          video: { 
            facingMode: 'environment',
            width: { ideal: 1920, max: 4032 },
            height: { ideal: 1080, max: 3024 }
          }
        },
        // Fallback with lower resolution
        {
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 }
          }
        },
        // Try user camera (front camera)
        {
          video: { 
            facingMode: 'user',
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 }
          }
        },
        // Basic constraints without facingMode
        {
          video: { 
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 }
          }
        },
        // Minimal fallback
        {
          video: true
        }
      ];

      let stream: MediaStream | null = null;
      let usedConstraints: any = null;
      
      for (let i = 0; i < constraintOptions.length; i++) {
        const constraints = constraintOptions[i];
        try {
          console.log(`Trying camera constraint set ${i + 1}/${constraintOptions.length}:`, constraints);
          
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          usedConstraints = constraints;
          console.log('Camera stream obtained with constraints:', constraints);
          break;
        } catch (err) {
          console.warn(`Constraint set ${i + 1} failed:`, err instanceof Error ? err.name : 'Unknown', err instanceof Error ? err.message : String(err));
          
          // If this is a permission error, no point trying other constraints
          if (err instanceof DOMException && err.name === 'NotAllowedError') {
            throw err;
          }
          continue;
        }
      }

      if (!stream) {
        throw new Error('Failed to get camera stream with any constraints. Please check camera permissions and try again.');
      }
      
      console.log('🎥 Camera setup completed with constraints:', usedConstraints);
      
      // Store stream reference for cleanup
      streamRef.current = stream;
      
      // Check if component is still mounted and video element exists
      if (!isMountedRef.current || !videoRef.current) {
        console.error('Video element ref is null or component unmounted - cannot assign stream');
        
        // Stop the stream since we can't use it
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        
        setIsCameraLoading(false);
        toast({
          title: 'Camera Error',
          description: 'Video element not found. Please try again.',
          variant: 'destructive',
        });
        return;
      }
      
      console.log('📺 Setting up video element...');
      
      // Set up video element with direct assignment
      const videoElement = videoRef.current;
      
      // Clear any existing stream first
      videoElement.srcObject = null;
      
      // Wait a moment then assign the new stream
      setTimeout(() => {
        console.log('Assigning stream to video element...');
        videoElement.srcObject = stream;
        videoElement.muted = true;
        videoElement.playsInline = true;
        videoElement.autoplay = true;
        
        // Force properties
        videoElement.style.display = 'block';
        videoElement.style.width = '100%';
        videoElement.style.height = '100%';
        
        const onLoadedMetadata = () => {
          console.log('📺 Video metadata loaded');
          videoElement.play().then(() => {
            console.log('Video playing successfully - setting camera active');
            setIsCameraActive(true);
            setIsCameraLoading(false);
            console.log('Camera state after successful start:', {
              isCameraActive: true,
              isCameraLoading: false,
              mode: 'camera',
              streamActive: streamRef.current?.active,
              videoSrcObject: !!videoElement.srcObject
            });
          }).catch((playError) => {
            console.error('Video play error:', playError);
            setIsCameraActive(true);
            setIsCameraLoading(false);
          });
        };
        
        const onError = (error: Event) => {
          console.error('Video element error:', error);
          setIsCameraLoading(false);
          toast({
            title: 'Video Error',
            description: 'Video element error occurred. Please try again.',
            variant: 'destructive',
          });
        };
        
        videoElement.addEventListener('loadedmetadata', onLoadedMetadata, { once: true });
        videoElement.addEventListener('error', onError, { once: true });
      }, 100);
      
    } catch (error) {
      setIsCameraLoading(false);
      console.error('Camera error:', error);
      
      let errorMessage = 'Could not access camera. ';
      let errorTitle = 'Camera Error';
      
      if (error instanceof DOMException) {
        switch (error.name) {
          case 'NotAllowedError':
            errorTitle = 'Camera Permission Denied';
            errorMessage = 'Please allow camera access in your browser settings and refresh the page.';
            break;
          case 'NotFoundError':
            errorTitle = 'No Camera Found';
            errorMessage = 'No camera devices were found on this device.';
            break;
          case 'NotSupportedError':
            errorTitle = 'Camera Not Supported';
            errorMessage = 'Camera is not supported in this browser or device.';
            break;
          case 'NotReadableError':
            errorTitle = 'Camera Not Available';
            errorMessage = 'Camera is already in use by another application or there was a hardware error.';
            break;
          case 'SecurityError':
            errorTitle = 'Security Error';
            errorMessage = 'Camera access blocked due to security restrictions.';
            break;
          default:
            errorMessage = `Camera error: ${error.name}. Please check camera permissions and ensure you are using HTTPS.`;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: 'destructive',
      });
    }
  }, []);

  const stopCamera = useCallback(() => {
    console.log('🛑 Stopping camera - current state:', {
      hasStream: !!streamRef.current,
      hasVideo: !!videoRef.current,
      isCameraActive,
      mode
    });
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        console.log('🔌 Stopping track:', track.kind, track.label);
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsCameraLoading(false);
    setCapturedImage(null);
    setMode('select');
    console.log('Camera stopped, reset to select mode');
  }, [isCameraActive, mode]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) {
      toast({
        title: "Camera not ready",
        description: "Please ensure the camera is active before capturing.",
        variant: "destructive"
      });
      return;
    }

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(imageDataUrl);
    stopCamera();

    toast({
      title: "Photo captured",
      description: "Receipt photo captured! Processing with OCR...",
    });

    // Automatically process the captured image
    processReceipt(imageDataUrl);
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    setMode('upload');
    setIsProcessing(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageDataUrl = e.target?.result as string;
        await processReceipt(imageDataUrl);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error reading file:', error);
      toast({
        title: "Error",
        description: "Failed to read the image file",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  const processReceipt = async (imageDataUrl: string) => {
    try {
      const data = await receiptProcessingService.processReceiptImage(imageDataUrl);
      setExtractedData(data);
      
      // Auto-detect category based on part names and supplier
      const category = detectCategory(data);
      setDetectedCategory(category);
      
      toast({
        title: "Receipt processed successfully",
        description: `Found ${data.items.length} items. Category: ${category === 'voyah' ? 'Voyah/MHero' : 'ICEV'}`,
      });
    } catch (error) {
      console.error('Error processing receipt:', error);
      toast({
        title: "Processing failed",
        description: error instanceof Error ? error.message : "Failed to process receipt",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const detectCategory = (data: ReceiptData): 'voyah' | 'normal_engine' => {
    const voyahKeywords = ['voyah', 'mhero', 'electric', 'ev', 'battery', 'hybrid', 'lantu'];
    const text = `${data.supplier || ''} ${data.items.map(item => `${item.partName} ${item.partNumber}`).join(' ')}`.toLowerCase();
    
    const hasVoyahKeywords = voyahKeywords.some(keyword => text.includes(keyword));
    return hasVoyahKeywords ? 'voyah' : 'normal_engine';
  };

  const handleConfirmUpload = () => {
    if (extractedData && detectedCategory) {
      onReceiptProcessed(extractedData, detectedCategory);
      onClose();
      resetDialog();
    }
  };

  const resetDialog = () => {
    setExtractedData(null);
    setDetectedCategory(null);
    setIsProcessing(false);
    setCapturedImage(null);
    setMode('select');
    stopCamera();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    onClose();
    resetDialog();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Upload Receipt for Parts
          </DialogTitle>
          <DialogDescription>
            Upload a receipt image and MonzaBot will extract the parts information automatically
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {mode === 'select' && !extractedData && !isProcessing && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="h-32 flex flex-col items-center justify-center gap-3 border-2 border-dashed hover:border-solid"
              >
                <Upload className="h-8 w-8" />
                <div className="text-center">
                  <p className="font-medium">Upload Image</p>
                  <p className="text-sm text-muted-foreground">From your device</p>
                </div>
              </Button>

              <Button
                onClick={startCamera}
                variant="outline"
                className="h-32 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-monza-yellow hover:border-solid hover:bg-monza-yellow/5"
              >
                <Camera className="h-8 w-8 text-monza-yellow" />
                <div className="text-center">
                  <p className="font-medium">Take Photo</p>
                  <p className="text-sm text-muted-foreground">Using camera</p>
                </div>
              </Button>
            </div>
          )}

          {mode === 'camera' && (
            <div className="space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden mx-auto max-w-lg">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  controls={false}
                  className="w-full h-full min-h-[400px] max-h-[600px] object-cover cursor-pointer block"
                  style={{ 
                    display: 'block',
                    backgroundColor: '#000',
                    minHeight: '400px',
                    maxHeight: '600px'
                  }}
                />
                
                {/* Camera loading overlay */}
                {isCameraLoading && (
                  <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center z-20">
                    <div className="text-center text-white">
                      <div className="animate-spin h-8 w-8 border-4 border-monza-yellow border-t-transparent rounded-full mx-auto mb-4"></div>
                      <p className="text-sm font-medium">Starting camera...</p>
                      <p className="text-xs opacity-80 mt-1">Please allow camera access when prompted</p>
                    </div>
                  </div>
                )}
                
                {/* Camera active indicator */}
                {isCameraActive && !isCameraLoading && (
                  <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded z-10">
                    📹 Camera Active
                  </div>
                )}
                
                {/* Receipt scanning guide overlay */}
                {isCameraActive && !isCameraLoading && (
                  <div className="absolute inset-4 border-2 border-monza-yellow border-dashed rounded-lg flex items-center justify-center pointer-events-none">
                    <div className="bg-black/70 text-white px-4 py-2 rounded-lg text-center">
                      <div className="text-sm font-medium">DOCUMENT Position receipt here</div>
                      <div className="text-xs mt-1 opacity-80">Ensure all text is visible and clear</div>
                    </div>
                  </div>
                )}
                
                {/* Corner guides */}
                {isCameraActive && !isCameraLoading && (
                  <>
                    <div className="absolute top-8 left-8 w-6 h-6 border-l-2 border-t-2 border-monza-yellow"></div>
                    <div className="absolute top-8 right-8 w-6 h-6 border-r-2 border-t-2 border-monza-yellow"></div>
                    <div className="absolute bottom-8 left-8 w-6 h-6 border-l-2 border-b-2 border-monza-yellow"></div>
                    <div className="absolute bottom-8 right-8 w-6 h-6 border-r-2 border-b-2 border-monza-yellow"></div>
                  </>
                )}
              </div>
              
              {/* Camera controls */}
              {isCameraActive && !isCameraLoading && (
                <div className="flex gap-2 justify-center flex-wrap">
                  <Button 
                    onClick={capturePhoto} 
                    className="flex items-center gap-2 bg-monza-yellow hover:bg-monza-yellow/90 text-monza-black font-semibold"
                  >
                    <Scan className="h-4 w-4" />
                    Capture & Process Receipt
                  </Button>
                  <Button 
                    onClick={stopCamera} 
                    variant="outline" 
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              )}
              
              <canvas ref={canvasRef} className="hidden" />
            </div>
          )}

          {isProcessing && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mb-4" />
              <p className="text-lg font-medium">Processing receipt...</p>
              <p className="text-sm text-muted-foreground">MonzaBot is extracting parts information</p>
            </div>
          )}

          {capturedImage && !extractedData && !isProcessing && (
            <div className="text-center space-y-4">
              <div className="relative inline-block">
                <img src={capturedImage} alt="Captured receipt" className="max-w-full max-h-64 object-contain rounded-lg border" />
              </div>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => processReceipt(capturedImage)} className="flex items-center gap-2">
                  <Scan className="h-4 w-4" />
                  Process Receipt
                </Button>
                <Button onClick={() => { setCapturedImage(null); startCamera(); }} variant="outline" className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Retake Photo
                </Button>
              </div>
            </div>
          )}

          {extractedData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Extracted Information</span>
                  <Badge variant={detectedCategory === 'voyah' ? 'default' : 'secondary'}>
                    {detectedCategory === 'voyah' ? 'Voyah/MHero Parts' : 'ICEV Parts'}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Review the extracted information before adding to ordered parts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <Label className="font-medium">Supplier</Label>
                    <p>{extractedData.supplier || 'Not detected'}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Order Reference</Label>
                    <p>{extractedData.orderReference || 'Not detected'}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Order Date</Label>
                    <p>{extractedData.orderDate || 'Not detected'}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Total Amount</Label>
                    <p>{extractedData.totalAmount ? `$${extractedData.totalAmount}` : 'Not detected'}</p>
                  </div>
                </div>

                <div>
                  <Label className="font-medium mb-2 block">Parts ({extractedData.items.length})</Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {extractedData.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <div>
                          <p className="font-medium">{item.partName}</p>
                          <p className="text-sm text-gray-600">#{item.partNumber}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">Qty: {item.quantity}</p>
                          {item.price && <p className="text-sm text-gray-600">${item.price}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {(extractedData.shippingCompany || extractedData.trackingCode) && (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {extractedData.shippingCompany && (
                      <div>
                        <Label className="font-medium">Shipping Company</Label>
                        <p>{extractedData.shippingCompany}</p>
                      </div>
                    )}
                    {extractedData.trackingCode && (
                      <div>
                        <Label className="font-medium">Tracking Code</Label>
                        <p>{extractedData.trackingCode}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            {extractedData && (
              <Button onClick={handleConfirmUpload} className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Add to Ordered Parts
              </Button>
            )}
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </DialogContent>
    </Dialog>
  );
};

export default ReceiptUploadDialog;
