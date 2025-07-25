import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { QrCode, Camera, FileText, AlertCircle, X } from 'lucide-react';
import QrScanner from 'qr-scanner';
import { extractTextFromImage } from '@/utils/ocrUtils';

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
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [qrScanner, setQrScanner] = useState<QrScanner | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isCameraLoading, setIsCameraLoading] = useState(false);

  const checkCameraPermission = async () => {
    try {
      const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
      setHasPermission(result.state === 'granted');
      
      result.addEventListener('change', () => {
        setHasPermission(result.state === 'granted');
      });
    } catch (error) {
      console.log('Permission API not supported, will request on camera access');
      setHasPermission(null);
    }
  };

  useEffect(() => {
    checkCameraPermission();
  }, []);

  const startScanner = async () => {
    console.log('Starting camera scanner...');
    setIsCameraLoading(true);
    setCameraError(null);
    
    // Wait a bit for the video element to be rendered
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (!videoRef.current) {
      console.error('Video element not found after waiting');
      setCameraError('Camera interface not ready. Please try again.');
      setIsCameraLoading(false);
      toast({
        title: "Camera error",
        description: "Camera interface not ready. Please try again.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Check if camera is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported on this device or browser');
      }

      console.log('Requesting camera access with constraints...');
      
      // Start with environment camera constraints
      let constraints: MediaStreamConstraints = {
        video: { 
          facingMode: 'environment'
        }
      };

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log('Camera access granted with environment camera');
      } catch (envError) {
        console.log('Environment camera failed, trying any camera:', envError);
        // Fallback to any available camera with proper type
        constraints = { 
          video: {
            facingMode: 'user'
          }
        };
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          console.log('Camera access granted with front camera');
        } catch (userError) {
          console.log('Front camera failed, trying basic constraints:', userError);
          // Final fallback to basic video
          constraints = { 
            video: true
          };
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          console.log('Camera access granted with basic constraints');
        }
      }
      
      if (!stream) {
        throw new Error('Failed to get camera stream');
      }

      // Set up video element
      const video = videoRef.current;
      if (!video) {
        throw new Error('Video element became unavailable');
      }
      
      video.srcObject = stream;
      
      // Wait for video to be ready
      await new Promise((resolve, reject) => {
        video.onloadedmetadata = () => {
          console.log('Video metadata loaded');
          resolve(true);
        };
        video.onerror = (error) => {
          console.error('Video error:', error);
          reject(new Error('Failed to load video'));
        };
        
        // Timeout after 10 seconds
        setTimeout(() => {
          reject(new Error('Video loading timeout'));
        }, 10000);
      });
      
      // Play the video
      try {
        await video.play();
        console.log('Video playing successfully');
      } catch (playError) {
        console.error('Error playing video:', playError);
        throw new Error('Failed to start video playback');
      }
      
      // Update states
      onStartScanner();
      setHasPermission(true);
      setIsCameraLoading(false);
      
      // Initialize QR Scanner
      try {
        const scanner = new QrScanner(
          video,
          (result) => {
            console.log('QR Scanner result:', result.data);
            handleScanResult(result.data);
          },
          {
            highlightScanRegion: true,
            highlightCodeOutline: true,
            preferredCamera: 'environment',
            maxScansPerSecond: 2,
          }
        );
        
        setQrScanner(scanner);
        await scanner.start();
        setIsScanning(true);
        console.log('QR Scanner initialized successfully');
      } catch (qrError) {
        console.log('QR Scanner failed to initialize, but camera is working:', qrError);
        // Camera works but QR scanner failed - that's okay, we can still capture photos
      }
      
      toast({
        title: "Camera activated",
        description: "Point your camera at a VIN number or capture a photo for OCR text extraction.",
      });
      
    } catch (error: any) {
      console.error('Error accessing camera:', error);
      setIsCameraLoading(false);
      
      let errorMessage = "Could not access the camera.";
      
      if (error.name === 'NotAllowedError') {
        errorMessage = "Camera permission denied. Please allow camera access and try again.";
        setHasPermission(false);
      } else if (error.name === 'NotFoundError') {
        errorMessage = "No camera found on this device.";
      } else if (error.name === 'NotSupportedError') {
        errorMessage = "Camera not supported on this browser.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setCameraError(errorMessage);
      toast({
        title: "Camera error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const handleScanResult = (data: string) => {
    console.log('Scanned data:', data);
    
    // Check if the scanned data looks like a VIN (17 characters, alphanumeric)
    const vinPattern = /^[A-HJ-NPR-Z0-9]{17}$/i;
    const isVIN = vinPattern.test(data);
    
    if (isVIN) {
      toast({
        title: "VIN Detected!",
        description: `Scanned VIN: ${data}`,
      });
      
      // Trigger VIN processing
      window.dispatchEvent(new CustomEvent('vinScanned', { detail: data }));
    } else {
      toast({
        title: "Code Detected",
        description: `Scanned: ${data}`,
      });
      
      // Trigger general scan processing
      window.dispatchEvent(new CustomEvent('codeScanned', { detail: data }));
    }
    
    // Save scan result
    const timestamp = new Date().toISOString();
    const savedScans = JSON.parse(localStorage.getItem('scanResults') || '[]');
    savedScans.push({
      id: Date.now().toString(),
      data,
      timestamp,
      type: isVIN ? 'vin' : 'general'
    });
    localStorage.setItem('scanResults', JSON.stringify(savedScans));
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
    setCapturedPhoto(photoDataUrl);
    
    // Save to localStorage for later use
    const timestamp = new Date().toISOString();
    const savedPhotos = JSON.parse(localStorage.getItem('vinPhotos') || '[]');
    savedPhotos.push({
      id: Date.now().toString(),
      photo: photoDataUrl,
      timestamp,
      type: 'vin'
    });
    localStorage.setItem('vinPhotos', JSON.stringify(savedPhotos));
    
    toast({
      title: "Photo captured",
      description: "VIN photo captured! Click 'Extract VIN' to read the text using OCR, or 'Clear Photo' to retake.",
    });
  };

  const clearCapturedPhoto = () => {
    setCapturedPhoto(null);
    toast({
      title: "Photo cleared",
      description: "Photo cleared. You can now capture a new photo.",
    });
  };

  const extractVINFromPhoto = async () => {
    if (!capturedPhoto) {
      toast({
        title: "No photo",
        description: "Please capture a photo first.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessingOCR(true);
    
    try {
      toast({
        title: "Processing...",
        description: "Extracting text from image using OCR. This may take a few seconds.",
      });

      const extractedText = await extractTextFromImage(capturedPhoto);
      
      if (extractedText && extractedText.length >= 5) {
        // Check if it looks like a VIN
        const vinPattern = /[A-HJ-NPR-Z0-9]{17}/g;
        const vinMatches = extractedText.match(vinPattern);
        
        if (vinMatches && vinMatches.length > 0) {
          const extractedVIN = vinMatches[0];
          toast({
            title: "VIN Extracted Successfully!",
            description: `Found VIN: ${extractedVIN}`,
          });
          
          // Trigger VIN processing
          window.dispatchEvent(new CustomEvent('vinScanned', { detail: extractedVIN }));
        } else {
          // Check for partial VIN or other text
          const cleanedText = extractedText.replace(/\s+/g, '').toUpperCase();
          toast({
            title: "Text Extracted",
            description: `Extracted: ${cleanedText}. Please verify if this is correct.`,
          });
          
          // Still trigger the event in case it's a partial VIN
          window.dispatchEvent(new CustomEvent('codeScanned', { detail: cleanedText }));
        }
        
        // Save extraction result
        const timestamp = new Date().toISOString();
        const savedScans = JSON.parse(localStorage.getItem('ocrResults') || '[]');
        savedScans.push({
          id: Date.now().toString(),
          extractedText,
          timestamp,
          photo: capturedPhoto,
          type: vinMatches ? 'vin' : 'text'
        });
        localStorage.setItem('ocrResults', JSON.stringify(savedScans));
        
      } else {
        toast({
          title: "No text found",
          description: "Could not extract readable text from the image. Try capturing a clearer, well-lit photo with the VIN clearly visible.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('OCR extraction error:', error);
      toast({
        title: "OCR Error",
        description: error.message || "Failed to extract text from image. Please try again or enter VIN manually.",
        variant: "destructive"
      });
    } finally {
      setIsProcessingOCR(false);
    }
  };
  
  const stopScanner = () => {
    console.log('Stopping camera scanner...');
    
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      
      tracks.forEach(track => {
        console.log('Stopping track:', track.kind);
        track.stop();
      });
      videoRef.current.srcObject = null;
      onStopScanner();
      setCapturedPhoto(null);
    }
    
    if (qrScanner) {
      qrScanner.stop();
      qrScanner.destroy();
      setQrScanner(null);
      setIsScanning(false);
    }
    
    setCameraError(null);
    setIsCameraLoading(false);
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  return (
    <div className="bg-white rounded-lg border shadow-sm p-4 md:p-6">
      <div className="text-center mb-4 md:mb-6">
        <QrCode className="mx-auto h-8 w-8 md:h-12 md:w-12 text-primary mb-2" />
        <h2 className="text-lg md:text-xl font-semibold">Camera Scanner</h2>
        <p className="text-xs md:text-sm text-muted-foreground">
          Use your device camera to scan VIN numbers or capture photos for OCR text extraction
        </p>
      </div>
      
      {cameraError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-red-700">
            <p className="font-medium">Camera Error</p>
            <p>{cameraError}</p>
            {hasPermission === false && (
              <p className="mt-1 text-xs">Please check your browser settings and allow camera access for this site.</p>
            )}
          </div>
        </div>
      )}
      
      <div className="flex flex-col items-center">
        <div className="w-full aspect-video bg-slate-100 rounded-md overflow-hidden mb-4 relative">
          <video 
            ref={videoRef} 
            className="w-full h-full object-cover"
            playsInline
            muted
            autoPlay
            style={{ display: 'block' }}
          />
          {!scanning && (
            <div className="flex items-center justify-center h-full flex-col gap-2">
              <Camera className="h-8 w-8 md:h-12 md:w-12 text-muted-foreground opacity-30" />
              <p className="text-xs text-muted-foreground text-center px-4">
                {isCameraLoading 
                  ? "Starting camera..." 
                  : hasPermission === false 
                    ? "Camera permission required" 
                    : "Click 'Start Camera' to begin scanning"}
              </p>
            </div>
          )}
          {scanning && isScanning && (
            <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs">
              Scanning...
            </div>
          )}
          {capturedPhoto && (
            <div className="absolute top-2 right-2 w-16 h-16 md:w-20 md:h-20 border-2 border-white rounded-md overflow-hidden">
              <img 
                src={capturedPhoto} 
                alt="Captured VIN" 
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full">
          <Button 
            onClick={scanning ? stopScanner : startScanner}
            variant={scanning ? "destructive" : "default"}
            className="flex-1 text-sm md:text-base"
            disabled={isProcessingOCR || isCameraLoading}
          >
            {isCameraLoading ? "Starting Camera..." : scanning ? "Stop Camera" : "Start Camera"}
          </Button>
          
          {scanning && (
            <Button 
              onClick={capturePhoto}
              variant="secondary"
              className="flex-1 text-sm md:text-base"
              disabled={isProcessingOCR}
            >
              <Camera className="mr-2 h-4 w-4" />
              Capture Photo
            </Button>
          )}
        </div>
        
        {capturedPhoto && (
          <div className="w-full flex flex-col sm:flex-row gap-2 mt-2">
            <Button 
              onClick={extractVINFromPhoto}
              disabled={isProcessingOCR}
              className="flex-1 text-sm md:text-base bg-blue-600 hover:bg-blue-700"
            >
              <FileText className="mr-2 h-4 w-4" />
              {isProcessingOCR ? "Extracting VIN..." : "Extract VIN with OCR"}
            </Button>
            <Button 
              onClick={clearCapturedPhoto}
              disabled={isProcessingOCR}
              variant="outline"
              className="flex-1 text-sm md:text-base"
            >
              <X className="mr-2 h-4 w-4" />
              Clear Photo
            </Button>
          </div>
        )}
        
        {scanning && (
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Position a VIN clearly in the camera view for automatic scanning, or capture a photo for OCR text extraction
          </p>
        )}
      </div>
    </div>
  );
};

export default CameraScanner;
