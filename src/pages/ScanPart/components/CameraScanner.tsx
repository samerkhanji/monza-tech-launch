
import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { QrCode, Camera, CameraIcon, ScanLine, RotateCcw, CheckCircle } from 'lucide-react';
import { extractPartNumberFromImage } from '@/utils/partNumberOcrUtils';

interface CameraScannerProps {
  scanning: boolean;
  onStartScanner: () => void;
  onStopScanner: () => void;
  toast: any;
}

const CameraScanner: React.FC<CameraScannerProps> = ({
  scanning,
  onStartScanner,
  onStopScanner,
  toast
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [extractedPartNumber, setExtractedPartNumber] = useState('');
  const [cameraActive, setCameraActive] = useState(false);

  const startScanner = async () => {
    if (!videoRef.current) return;
    
    try {
      console.log('Starting part scanner camera...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setCameraActive(true);
      onStartScanner();
      
      toast({
        title: "Camera started",
        description: "Position the part number clearly in the frame and capture",
      });
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Camera error",
        description: "Could not access the camera. Please check permissions.",
        variant: "destructive"
      });
    }
  };

  const stopScanner = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setCapturedPhoto(null);
    setExtractedPartNumber('');
    onStopScanner();
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const photoDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedPhoto(photoDataUrl);
    
    // Stop camera after capture
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    
    toast({
      title: "Photo captured",
      description: "Processing with OCR to extract part number...",
    });

    // Automatically process with OCR
    processWithOCR(photoDataUrl);
  };

  const processWithOCR = async (imageDataUrl: string) => {
    setProcessing(true);
    
    try {
      const extractedText = await extractPartNumberFromImage(imageDataUrl);
      
      if (extractedText && extractedText.trim()) {
        setExtractedPartNumber(extractedText);
        
        // Dispatch the scanned part number to the parent component
        const event = new CustomEvent('partNumberScanned', { 
          detail: { partNumber: extractedText } 
        });
        window.dispatchEvent(event);
        
        toast({
          title: "Part number detected",
          description: `Successfully extracted: ${extractedText}`,
        });
      } else {
        toast({
          title: "No part number detected",
          description: "Please try capturing again with better lighting and focus.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Part number OCR error:', error);
      toast({
        title: "OCR processing failed",
        description: "Failed to read part number. Please try again or enter manually.",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const confirmPartNumber = () => {
    if (extractedPartNumber.trim()) {
      // Dispatch custom event with scanned part number
      const event = new CustomEvent('partNumberConfirmed', { 
        detail: { partNumber: extractedPartNumber } 
      });
      window.dispatchEvent(event);
      
      toast({
        title: "Part number confirmed",
        description: `Part number ${extractedPartNumber} registered as arrived`,
      });
      
      // Reset for next scan
      retakePhoto();
    }
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
    setExtractedPartNumber('');
    startScanner();
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  return (
    <div className="bg-white rounded-lg border shadow-sm p-4 md:p-6">
      <div className="text-center mb-4 md:mb-6">
        <ScanLine className="mx-auto h-8 w-8 md:h-12 md:w-12 text-primary mb-2" />
        <h2 className="text-lg md:text-xl font-semibold">Part Number Scanner</h2>
        <p className="text-xs md:text-sm text-muted-foreground">
          Scan part numbers to register their arrival in inventory
        </p>
      </div>
      
      <div className="flex flex-col items-center">
        <div className="w-full aspect-video bg-slate-100 rounded-md overflow-hidden mb-4 relative">
          {cameraActive && !capturedPhoto ? (
            <>
              <video 
                ref={videoRef} 
                className="w-full h-full object-cover"
                playsInline
                muted
              />
              {/* Part number scanning overlay */}
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
                    Position part number clearly in the target area
                  </p>
                </div>
              </div>
            </>
          ) : capturedPhoto ? (
            <div className="relative w-full h-full">
              <img 
                src={capturedPhoto} 
                alt="Captured Part" 
                className="w-full h-full object-cover"
              />
              {processing && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="bg-white rounded-lg p-4 flex items-center gap-3">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                    <span className="text-sm font-medium">Processing with OCR...</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Camera className="h-8 w-8 md:h-12 md:w-12 opacity-30 mb-2" />
              <p className="text-sm">Click "Start Camera" to begin scanning</p>
              <p className="text-xs mt-1">Position part number clearly for best results</p>
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Part Number Results */}
        {extractedPartNumber && (
          <div className="w-full mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">Part Number Detected</span>
            </div>
            <div className="bg-white rounded px-3 py-2 border">
              <span className="font-mono font-semibold text-lg">{extractedPartNumber}</span>
            </div>
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row gap-2 w-full">
          {!cameraActive && !capturedPhoto && (
            <Button 
              onClick={startScanner}
              className="flex-1 text-sm md:text-base"
              disabled={processing}
            >
              <Camera className="mr-2 h-4 w-4" />
              Start Camera
            </Button>
          )}
          
          {cameraActive && !capturedPhoto && (
            <>
              <Button 
                onClick={stopScanner}
                variant="outline"
                className="flex-1 text-sm md:text-base"
                disabled={processing}
              >
                Cancel
              </Button>
              
              <Button 
                onClick={capturePhoto}
                className="flex-1 text-sm md:text-base"
                disabled={processing}
              >
                <CameraIcon className="mr-2 h-4 w-4" />
                Capture Photo
              </Button>
            </>
          )}

          {capturedPhoto && !extractedPartNumber && !processing && (
            <Button 
              onClick={retakePhoto}
              variant="outline"
              className="flex-1 text-sm md:text-base"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Retake Photo
            </Button>
          )}

          {extractedPartNumber && (
            <>
              <Button 
                onClick={retakePhoto}
                variant="outline"
                className="flex-1 text-sm md:text-base"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Retake Photo
              </Button>
              
              <Button 
                onClick={confirmPartNumber}
                className="flex-1 text-sm md:text-base"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Register Arrival
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CameraScanner;
