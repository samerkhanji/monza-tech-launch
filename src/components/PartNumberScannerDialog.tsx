
import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, Loader2, ScanLine, RotateCcw, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { extractPartNumberFromImage } from '@/utils/partNumberOcrUtils';
import { workflowTrackingService } from '@/services/workflowTrackingService';
import { useAuth } from '@/contexts/AuthContext';

interface PartNumberScannerDialogProps {
  onPartNumberScanned: (partNumber: string) => void;
  children?: React.ReactNode;
}

const PartNumberScannerDialog: React.FC<PartNumberScannerDialogProps> = ({ 
  onPartNumberScanned, 
  children 
}) => {
  const [open, setOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [manualPartNumber, setManualPartNumber] = useState('');
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const startCamera = async () => {
    try {
      console.log('Starting part number scanner camera...');
      setCameraError(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded');
          if (videoRef.current) {
            videoRef.current.play().then(() => {
              console.log('Video playing');
              setScanning(true);
              setCapturedImage(null);
              setExtractedText('');
              setShowManualEntry(false);
              
              toast({
                title: "Camera ready",
                description: "Position the part number clearly in the target area and capture",
              });
            }).catch(err => {
              console.error('Error playing video:', err);
              setCameraError('Failed to play video stream');
            });
          }
        };
        
        videoRef.current.onerror = (err) => {
          console.error('Video element error:', err);
          setCameraError('Video element error');
        };
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setCameraError(error instanceof Error ? error.message : 'Unknown camera error');
      toast({
        title: "Camera error",
        description: "Could not access camera. Please check permissions.",
        variant: "destructive"
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setScanning(false);
    setCameraError(null);
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current || !streamRef.current) return;
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) return;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedImage(imageDataUrl);
      stopCamera();
      
      toast({
        title: "Image captured",
        description: "Image captured successfully. Click 'Process with OCR' to extract part number.",
      });
    } catch (error) {
      console.error('Image capture error:', error);
      toast({
        title: "Capture failed",
        description: "Failed to capture image. Please try again.",
        variant: "destructive"
      });
    }
  };

  const processWithOCR = async () => {
    if (!capturedImage) return;
    
    setProcessing(true);
    
    try {
      const extractedPartNumber = await extractPartNumberFromImage(capturedImage);
      
      if (extractedPartNumber && extractedPartNumber.trim()) {
        setExtractedText(extractedPartNumber);
        
        // Track the part scan
        await workflowTrackingService.trackPartScan({
          partNumber: extractedPartNumber,
          scanMethod: 'camera',
          scannedBy: user?.name || 'Unknown User',
          photoUrl: capturedImage,
          ocrConfidence: 0.8
        });

        // Track the photo
        await workflowTrackingService.trackPhoto(
          capturedImage,
          'part_scan',
          extractedPartNumber,
          user?.name || 'Unknown User',
          extractedPartNumber,
          { ocrProcessed: true }
        );

        toast({
          title: "Part number detected",
          description: `Extracted: ${extractedPartNumber}`,
        });
      } else {
        setExtractedText('');
        setShowManualEntry(true);
        toast({
          title: "No part number detected",
          description: "Please enter the part number manually or try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('OCR processing error:', error);
      setExtractedText('');
      setShowManualEntry(true);
      toast({
        title: "OCR failed",
        description: "Failed to process image. Please enter part number manually.",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const confirmPartNumber = async () => {
    const partNumberToUse = extractedText || manualPartNumber;
    
    if (partNumberToUse.trim()) {
      // If manually entered, track it
      if (manualPartNumber && !extractedText) {
        await workflowTrackingService.trackPartScan({
          partNumber: partNumberToUse.trim(),
          scanMethod: 'manual',
          scannedBy: user?.name || 'Unknown User'
        });
      }

      onPartNumberScanned(partNumberToUse.trim());
      setOpen(false);
      resetDialog();
      
      toast({
        title: "Part number confirmed",
        description: `Part number ${partNumberToUse} has been added`,
      });
    } else {
      toast({
        title: "No part number",
        description: "Please enter a part number or scan again.",
        variant: "destructive"
      });
    }
  };

  const resetDialog = () => {
    stopCamera();
    setCapturedImage(null);
    setExtractedText('');
    setManualPartNumber('');
    setShowManualEntry(false);
    setProcessing(false);
    setCameraError(null);
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setExtractedText('');
    setShowManualEntry(false);
    startCamera();
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      resetDialog();
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <ScanLine className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanLine className="h-5 w-5" />
            Scan Part Number
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Camera Error Display */}
          {cameraError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">Camera Error: {cameraError}</p>
            </div>
          )}

          {/* Camera/Preview Area */}
          <div className="w-full aspect-video bg-slate-100 rounded-md overflow-hidden relative">
            {scanning && !capturedImage ? (
              <>
                <video 
                  ref={videoRef} 
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                  autoPlay
                />
                {/* Scanning overlay with target area */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-0 bg-black bg-opacity-40"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                      <div className="w-64 h-16 border-2 border-white border-dashed bg-transparent rounded-lg"></div>
                      <div className="absolute -top-2 -left-2 w-6 h-6 border-l-4 border-t-4 border-green-400 rounded-tl-lg"></div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 border-r-4 border-t-4 border-green-400 rounded-tr-lg"></div>
                      <div className="absolute -bottom-2 -left-2 w-6 h-6 border-l-4 border-b-4 border-green-400 rounded-bl-lg"></div>
                      <div className="absolute -bottom-2 -right-2 w-6 h-6 border-r-4 border-b-4 border-green-400 rounded-br-lg"></div>
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-0 right-0 text-center">
                    <p className="text-white text-sm font-medium bg-black bg-opacity-60 rounded-full px-4 py-2 mx-4">
                      Position part number in the target area
                    </p>
                  </div>
                  {/* Live indicator */}
                  <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    LIVE
                  </div>
                </div>
              </>
            ) : capturedImage ? (
              <div className="relative w-full h-full">
                <img 
                  src={capturedImage} 
                  alt="Captured part" 
                  className="w-full h-full object-cover rounded-md"
                />
                {processing && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white rounded-lg p-4 flex items-center gap-3">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="text-sm font-medium">Processing with OCR...</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Camera className="h-16 w-16 mb-2 opacity-30" />
                <p className="text-sm">Click "Start Camera" to begin scanning</p>
                <p className="text-xs mt-1">Position part number clearly for best results</p>
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* OCR Results */}
          {extractedText && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">Part Number Detected</span>
              </div>
              <div className="bg-white rounded px-3 py-2 border">
                <span className="font-mono font-semibold text-lg">{extractedText}</span>
              </div>
            </div>
          )}

          {/* Manual Entry */}
          {showManualEntry && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <X className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-700">Manual Entry Required</span>
              </div>
              <div className="space-y-2">
                <Label htmlFor="manualPartNumber" className="text-sm">Enter Part Number:</Label>
                <Input
                  id="manualPartNumber"
                  value={manualPartNumber}
                  onChange={(e) => setManualPartNumber(e.target.value)}
                  placeholder="Enter part number manually..."
                  className="font-mono"
                />
              </div>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex gap-2">
            {!scanning && !capturedImage && (
              <Button 
                onClick={startCamera}
                className="flex-1"
                disabled={processing}
              >
                <Camera className="mr-2 h-4 w-4" />
                Start Camera
              </Button>
            )}
            
            {scanning && !capturedImage && (
              <>
                <Button 
                  onClick={stopCamera}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                
                <Button 
                  onClick={captureImage}
                  className="flex-1"
                  disabled={!streamRef.current}
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Capture Image
                </Button>
              </>
            )}
            
            {capturedImage && !extractedText && !showManualEntry && (
              <>
                <Button 
                  onClick={retakePhoto}
                  variant="outline"
                  className="flex-1"
                  disabled={processing}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Retake
                </Button>
                
                <Button 
                  onClick={processWithOCR}
                  disabled={processing}
                  className="flex-1"
                >
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <ScanLine className="mr-2 h-4 w-4" />
                      Process with OCR
                    </>
                  )}
                </Button>
              </>
            )}
            
            {(extractedText || (showManualEntry && manualPartNumber)) && (
              <>
                <Button 
                  onClick={retakePhoto}
                  variant="outline"
                  className="flex-1"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Retake Photo
                </Button>
                
                <Button 
                  onClick={confirmPartNumber}
                  className="flex-1"
                >
                  <Check className="mr-2 h-4 w-4" />
                  Use Part Number
                </Button>
              </>
            )}
          </div>
          
          <div className="text-xs text-muted-foreground text-center space-y-1">
            <p>• Position the part number clearly within the target area</p>
            <p>• Ensure good lighting and focus for best OCR results</p>
            <p>• You can manually enter the part number if OCR fails</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PartNumberScannerDialog;
