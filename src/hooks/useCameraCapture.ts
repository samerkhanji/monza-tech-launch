
import { useState, useRef, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

export const useCameraCapture = () => {
  const [cameraOpen, setCameraOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraSupported, setCameraSupported] = useState(true);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check camera support on mount
  useEffect(() => {
    const checkCameraSupport = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setCameraSupported(false);
          return;
        }
        
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasCamera = devices.some(device => device.kind === 'videoinput');
        setCameraSupported(hasCamera);
      } catch (error) {
        console.error('Camera support check failed:', error);
        setCameraSupported(false);
      }
    };

    checkCameraSupport();
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && cameraOpen && !capturedImage) {
        console.log('Tab hidden with camera open and no photo taken, stopping camera');
        stopCamera();
        toast({
          title: "Camera stopped",
          description: "Camera was turned off when you left the tab",
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraOpen, capturedImage]);

  const startCamera = async () => {
    try {
      console.log('🎥 Starting camera...');
      setCameraError(null);
      
      if (!cameraSupported) {
        setCameraError('Camera not supported on this device');
        return;
      }

      // Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      let constraints: MediaStreamConstraints = {
        video: { 
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1080, min: 480 },
          facingMode: 'environment',
          frameRate: { ideal: 30, min: 15 }
        }
      };

      let stream: MediaStream;
      
      try {
        console.log('📱 Trying with full constraints...');
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (error) {
        console.log('⚠️ Full constraints failed, trying with basic constraints...');
        // Fallback to basic constraints
        constraints = {
          video: { 
            facingMode: 'environment'
          }
        };
        
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (fallbackError) {
          console.log('⚠️ Environment camera failed, trying any camera...');
          // Final fallback - any camera
          constraints = { video: true };
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        }
      }

      console.log('📱 Final constraints used:', constraints);
      
      console.log('✅ Got camera stream:', {
        id: stream.id,
        active: stream.active,
        tracks: stream.getTracks().length,
        videoTracks: stream.getVideoTracks().length
      });
      streamRef.current = stream;
      
      // Wait for video element to be available (it might not exist yet)
      let videoElement = videoRef.current;
      if (!videoElement) {
        console.log('📺 Video element not ready, waiting...');
        // Wait up to 5 seconds for video element to be available
        for (let i = 0; i < 50; i++) {
          await new Promise(resolve => setTimeout(resolve, 100));
          videoElement = videoRef.current;
          if (videoElement) break;
        }
      }

      if (videoElement) {
        videoElement.srcObject = stream;
        console.log('📺 Set video srcObject, waiting for video to be ready...');
        
        // Wait for video to be ready with timeout
        await new Promise((resolve, reject) => {
          if (!videoRef.current) {
            reject(new Error('Video element not available'));
            return;
          }

          const video = videoRef.current;
          let timeoutId: NodeJS.Timeout;
          
          const cleanup = () => {
            if (timeoutId) clearTimeout(timeoutId);
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('error', onError);
            video.removeEventListener('canplay', onCanPlay);
          };
          
          const onLoadedMetadata = () => {
            console.log('Video metadata loaded, dimensions:', video.videoWidth, 'x', video.videoHeight);
          };

          const onCanPlay = () => {
            console.log('✅ Video can play');
            video.play().then(() => {
              console.log('🎬 Video playing successfully');
              setCameraOpen(true);
              toast({
                title: "Camera started",
                description: "Camera is ready for capturing",
              });
              cleanup();
              resolve(true);
            }).catch(err => {
              console.error('❌ Error playing video:', err);
              cleanup();
              reject(err);
            });
          };

          const onError = (err: any) => {
            console.error('Video element error:', err);
            cleanup();
            reject(err);
          };

          // Set timeout for camera initialization
          timeoutId = setTimeout(() => {
            console.error('⏰ Camera initialization timeout');
            cleanup();
            reject(new Error('Camera initialization timeout'));
          }, 10000);

          video.addEventListener('loadedmetadata', onLoadedMetadata, { once: true });
          video.addEventListener('canplay', onCanPlay, { once: true });
          video.addEventListener('error', onError, { once: true });
        });
      } else {
        // Video element still not available after waiting
        console.error('❌ Video element not available after waiting');
        throw new Error('Video element not found in DOM. The camera container may not be rendered yet.');
      }
    } catch (error) {
      console.error('❌ Error starting camera:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown camera error';
      
      // Provide helpful error messages
      if (errorMessage.includes('Permission denied') || errorMessage.includes('NotAllowedError')) {
        setCameraError('Camera permission denied. Please allow camera access and try again.');
      } else if (errorMessage.includes('NotFoundError') || errorMessage.includes('DevicesNotFoundError')) {
        setCameraError('No camera found on this device.');
      } else if (errorMessage.includes('NotReadableError') || errorMessage.includes('TrackStartError')) {
        setCameraError('Camera is busy or not accessible. Please close other applications using the camera.');
      } else {
        setCameraError(errorMessage);
      }
      
      toast({
        title: "Camera Error",
        description: `Failed to start camera: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  const capturePhoto = async (): Promise<string | null> => {
    if (videoRef.current && canvasRef.current && streamRef.current) {
      try {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        
        if (!context) {
          throw new Error('Canvas context not available');
        }

        // Ensure video is playing and has dimensions
        if (video.videoWidth === 0 || video.videoHeight === 0) {
          // Wait a bit and try again
          await new Promise(resolve => setTimeout(resolve, 100));
          if (video.videoWidth === 0 || video.videoHeight === 0) {
            throw new Error('Video not ready for capture - no dimensions available');
          }
        }
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(imageDataUrl);
        
        toast({
          title: "Photo captured",
          description: "Photo captured successfully",
        });
        
        return imageDataUrl;
      } catch (error) {
        console.error('Capture error:', error);
        toast({
          title: "Capture Failed",
          description: "Failed to capture image. Please try again.",
          variant: "destructive",
        });
        return null;
      }
    }
    return null;
  };

  const captureImage = async (): Promise<string | null> => {
    try {
      setIsCapturing(true);
      const result = await capturePhoto();
      return result;
    } catch (error) {
      console.error('Error capturing image:', error);
      toast({
        title: "Capture Failed",
        description: "Failed to capture image. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsCapturing(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>): Promise<string | null> => {
    return new Promise((resolve) => {
      const file = event.target.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file",
          description: "Please select an image file",
          variant: "destructive"
        });
        resolve(null);
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageDataUrl = e.target?.result as string;
        setCapturedImage(imageDataUrl);
        
        toast({
          title: "Image uploaded",
          description: "Image uploaded successfully",
        });
        
        resolve(imageDataUrl);
      };
      reader.onerror = () => {
        toast({
          title: "Upload failed",
          description: "Failed to upload image",
          variant: "destructive"
        });
        resolve(null);
      };
      reader.readAsDataURL(file);
    });
  };

  const stopCamera = () => {
    console.log('🛑 Stopping camera...');
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        console.log('🔇 Stopping track:', track.kind);
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraOpen(false);
    setCapturedImage(null);
    setCameraError(null);
    setIsCapturing(false);
  };

  return {
    cameraOpen,
    capturedImage,
    setCapturedImage,
    cameraError,
    isCapturing,
    cameraSupported,
    isStartingCamera,
    videoRef,
    canvasRef,
    streamRef,
    fileInputRef,
    startCamera,
    capturePhoto,
    captureImage,
    handleFileUpload,
    stopCamera
  };
};
