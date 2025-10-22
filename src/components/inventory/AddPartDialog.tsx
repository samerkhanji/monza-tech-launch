import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { InventoryItem, VehicleType } from '@/types/inventory';
import { OrderedPart } from '@/types/index';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Camera, Package, Plus, Search, Scan, X } from 'lucide-react';

interface AddPartDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPart: (part: Omit<InventoryItem, 'id' | 'lastUpdated'>) => void;
  onIncrementPart?: (partNumber: string, quantity: number) => void;
  existingParts?: InventoryItem[];
  floor: 'Floor 1' | 'Floor 2' | 'Garage' | 'Parts Inventory';
}

const AddPartDialog: React.FC<AddPartDialogProps> = ({
  isOpen,
  onClose,
  onAddPart,
  onIncrementPart,
  existingParts = [],
  floor
}) => {
  const [activeTab, setActiveTab] = useState('manual');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [orderedParts, setOrderedParts] = useState<OrderedPart[]>([]);
  const [selectedOrderedPart, setSelectedOrderedPart] = useState<OrderedPart | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isMountedRef = useRef<boolean>(true);

  const [formData, setFormData] = useState({
    carModel: '',
    partName: '',
    partNumber: '',
    quantity: 1,
    shelf: '',
    column: '',
    row: '',
    room: '',
    supplier: 'DF',
    vehicleType: 'EV' as VehicleType,
    category: (floor === 'Garage' || floor === 'Parts Inventory') ? 'part' : 'accessory' as 'part' | 'accessory',
    vin: '',
    pdiStatus: 'pending' as InventoryItem['pdiStatus'],
    pdiNotes: '',
  });

  // Load ordered parts from localStorage
  useEffect(() => {
    const loadOrderedParts = () => {
      const saved = localStorage.getItem('orderedParts');
      if (saved) {
        const parts: OrderedPart[] = JSON.parse(saved);
        // Filter delivered parts that haven't been added to inventory yet
        const deliveredParts = parts.filter(part => 
          part.status === 'delivered' && 
          !existingParts.some(existing => existing.partNumber === part.part_number)
        );
        setOrderedParts(deliveredParts);
      }
    };

    if (isOpen) {
      loadOrderedParts();
    }
  }, [isOpen, existingParts]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if part already exists
    const existingPart = existingParts.find(part => 
      part.partNumber.toLowerCase() === formData.partNumber.toLowerCase()
    );

    if (existingPart && onIncrementPart) {
      onIncrementPart(formData.partNumber, formData.quantity);
      toast({
        title: 'Part Quantity Updated',
        description: `Added ${formData.quantity} units to existing ${existingPart.partName}`,
      });
    } else {
      const newPart: Omit<InventoryItem, 'id' | 'lastUpdated'> = {
        carModel: formData.carModel,
        partName: formData.partName,
        partNumber: formData.partNumber,
        quantity: formData.quantity,
        location: {
          shelf: formData.shelf,
          column: formData.column,
          row: formData.row,
          room: formData.room,
          floor: floor
        },
        supplier: formData.supplier,
        vehicleType: formData.vehicleType,
        category: formData.category,
        vin: formData.vin,
        pdiStatus: formData.pdiStatus,
        pdiNotes: formData.pdiNotes,
      };
      
      onAddPart(newPart);
    }
    
    resetForm();
    onClose();
  };

  const handleOrderedPartSubmit = () => {
    if (!selectedOrderedPart) return;

    // Check if part already exists
    const existingPart = existingParts.find(part => 
      part.partNumber.toLowerCase() === selectedOrderedPart.part_number.toLowerCase()
    );

    if (existingPart && onIncrementPart) {
      onIncrementPart(selectedOrderedPart.part_number, selectedOrderedPart.quantity);
      toast({
        title: 'Part Quantity Updated',
        description: `Added ${selectedOrderedPart.quantity} units to existing ${existingPart.partName}`,
      });
    } else {
      const newPart: Omit<InventoryItem, 'id' | 'lastUpdated'> = {
        carModel: formData.carModel || 'Generic',
        partName: selectedOrderedPart.part_name,
        partNumber: selectedOrderedPart.part_number,
        quantity: selectedOrderedPart.quantity,
        location: {
          shelf: formData.shelf,
          column: formData.column,
          row: formData.row,
          room: formData.room || 'Main Garage',
          floor: floor
        },
        supplier: selectedOrderedPart.supplier,
        vehicleType: formData.vehicleType,
        category: selectedOrderedPart.category === 'ev_erev' ? 'part' : 'part',
        vin: formData.vin,
        pdiStatus: formData.pdiStatus,
        pdiNotes: formData.pdiNotes,
      };
      
      onAddPart(newPart);
    }

    // Remove from ordered parts or mark as received
    const updatedOrderedParts = orderedParts.filter(part => part.id !== selectedOrderedPart.id);
    localStorage.setItem('orderedParts', JSON.stringify([
      ...JSON.parse(localStorage.getItem('orderedParts') || '[]').filter((part: OrderedPart) => part.id !== selectedOrderedPart.id)
    ]));
    setOrderedParts(updatedOrderedParts);
    
    resetForm();
    setSelectedOrderedPart(null);
    onClose();
  };

  const handleOrderNewPart = () => {
    if (!formData.partName || !formData.partNumber || !formData.supplier || !formData.quantity) {
      toast({
        title: "Error",
        description: "Please fill in all required fields (Part Name, Part Number, Supplier, Quantity)",
        variant: "destructive"
      });
      return;
    }

    // Create new order
    const newOrder: OrderedPart = {
      id: Date.now().toString(),
      part_name: formData.partName,
      part_number: formData.partNumber,
      quantity: formData.quantity,
      supplier: formData.supplier,
      order_reference: `ORD-${Date.now().toString().slice(-6)}`,
      order_date: new Date().toISOString(),
      status: 'ordered',
      category: formData.vehicleType === 'EV' || formData.vehicleType === 'REV' ? 'ev_erev' : 'normal_engine',
      notes: formData.pdiNotes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Save to localStorage
    const existingOrders = JSON.parse(localStorage.getItem('orderedParts') || '[]');
    localStorage.setItem('orderedParts', JSON.stringify([...existingOrders, newOrder]));

    toast({
      title: "Order Created",
      description: `Order for ${formData.partName} (${formData.partNumber}) has been created successfully.`,
    });

    resetForm();
    onClose();
  };

  const resetForm = () => {
    setFormData({
      carModel: '',
      partName: '',
      partNumber: '',
      quantity: 1,
      shelf: '',
      column: '',
      row: '',
      room: '',
      supplier: 'DF',
      vehicleType: 'EV',
      category: (floor === 'Garage' || floor === 'Parts Inventory') ? 'part' : 'accessory',
      vin: '',
      pdiStatus: 'pending',
      pdiNotes: '',
    });
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const startCamera = useCallback(async () => {
    try {
      setIsCameraLoading(true);
      console.log('🎥 Attempting to start camera...');
      
      // Small delay to ensure DOM has updated
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Debug: Check video element availability before doing anything
      console.log('Initial video element check:', {
        videoRefExists: !!videoRef.current,
        activeTab: activeTab,
        isCameraLoading: isCameraLoading,
        isCameraActive: isCameraActive,
        dialogOpen: isOpen,
        isMounted: isMountedRef.current
      });
      
      // Ensure user is on the correct tab
      if (activeTab !== 'camera') {
        console.log('Switching to OCR Scanner tab...');
        setActiveTab('camera');
        // Wait for tab switch to complete
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      // Additional delay to ensure video element is rendered when switching tabs
      if (!videoRef.current) {
        console.log('Video element not ready, waiting 500ms...');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check again after waiting
        if (!videoRef.current) {
          console.log('Video element still not ready, waiting additional 500ms...');
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Final check
          if (!videoRef.current) {
            console.error('Video element still not available after delays');
            console.log('DOM state check:', {
              activeTab: activeTab,
              videoElement: document.querySelector('video[ref]'),
              videoElementsInDOM: document.querySelectorAll('video').length,
              tabContent: document.querySelector('[data-state="active"]')?.innerHTML?.includes('video') || false
            });
          }
        }
      }
      
      // Add timeout to prevent hanging
      const timeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Camera initialization timeout')), 10000); // 10 seconds
      });
      
      // Check if running in secure context (HTTPS or localhost)
      const isSecure = window.location.protocol === 'https:' || 
                      window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1';
      
      console.log('🔒 Security context:', {
        protocol: window.location.protocol,
        hostname: window.location.hostname,
        isSecure
      });
      
      if (!isSecure) {
        throw new Error('Camera requires HTTPS or localhost. Current protocol: ' + window.location.protocol);
      }
      
      // Check if navigator.mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this browser');
      }

      // Check available devices first
      let devices: MediaDeviceInfo[] = [];
      try {
        console.log('Enumerating devices...');
        devices = await Promise.race([
          navigator.mediaDevices.enumerateDevices(),
          timeout
        ]) as MediaDeviceInfo[];
        
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        console.log('📹 Available video devices:', videoDevices.length);
        console.log('📹 Device details:', videoDevices.map(d => ({ label: d.label, deviceId: d.deviceId })));
        
        if (videoDevices.length === 0) {
          throw new Error('No camera devices found on this system');
        }
      } catch (enumError) {
        console.warn('Could not enumerate devices:', enumError);
        // Continue anyway, might still work
      }

      // Try multiple constraint configurations for better compatibility
      const constraintOptions = [
        // Try environment camera first (back camera on mobile)
        {
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 }
          }
        },
        // Fallback to any camera with lower resolution
        {
          video: { 
            facingMode: 'environment',
            width: { ideal: 640, max: 1280 },
            height: { ideal: 480, max: 720 }
          }
        },
        // Try user camera (front camera)
        {
          video: { 
            facingMode: 'user',
            width: { ideal: 640, max: 1280 },
            height: { ideal: 480, max: 720 }
          }
        },
        // Basic constraints without facingMode
        {
          video: { 
            width: { ideal: 640, max: 1280 },
            height: { ideal: 480, max: 720 }
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
          console.log(`Trying constraint set ${i + 1}/${constraintOptions.length}:`, constraints);
          
          // Add timeout to getUserMedia call
          stream = await Promise.race([
            navigator.mediaDevices.getUserMedia(constraints),
            timeout
          ]) as MediaStream;
          
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
      console.log('🔗 About to assign stream to video element...');
      console.log('📺 Video element exists:', !!videoRef.current);
      console.log('🎥 Stream exists:', !!stream);
      console.log('📹 Stream active:', stream.active);
      
      // Store stream reference for cleanup
      streamRef.current = stream;
      
      // Check if component is still mounted and video element exists
      if (!isMountedRef.current || !videoRef.current) {
        console.error('Video element ref is null or component unmounted - cannot assign stream');
        console.log('Debug info:', {
          isMounted: isMountedRef.current,
          videoRefExists: !!videoRef.current,
          activeTab: activeTab,
          dialogOpen: isOpen
        });
        
        // Stop the stream since we can't use it
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        
        setIsCameraLoading(false);
        toast({
          title: 'Camera Error',
          description: 'Video element not found. Please ensure you are on the OCR Scanner tab and try again.',
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
        console.log('setTimeout executing - assigning stream to video element...');
        console.log('📺 Video ref still exists:', !!videoRef.current);
        console.log('🎥 Stream still exists:', !!stream);
        console.log('🔗 Assigning stream to video element...');
        console.log('🎥 Stream details:', {
          active: stream.active,
          id: stream.id,
          tracks: stream.getTracks().length,
          videoTracks: stream.getVideoTracks().length
        });
        
        // Assign stream
        console.log('📺 Assigning stream to video.srcObject...');
        videoElement.srcObject = stream;
        console.log('Stream assigned, setting properties...');
        videoElement.muted = true;
        videoElement.playsInline = true;
        videoElement.autoplay = true;
        console.log('⚙️ Basic properties set, now setting styles...');
        
        // Force properties
        videoElement.style.display = 'block';
        videoElement.style.width = '100%';
        videoElement.style.height = '100%';
        videoElement.style.minHeight = '300px';
        videoElement.style.backgroundColor = '#000';
        videoElement.style.objectFit = 'cover';
        console.log('Styles applied to video element');
        
        console.log('📺 Video element properties:', {
          srcObject: !!videoElement.srcObject,
          readyState: videoElement.readyState,
          networkState: videoElement.networkState,
          paused: videoElement.paused,
          muted: videoElement.muted,
          playsInline: videoElement.playsInline,
          autoplay: videoElement.autoplay
        });

        // Add comprehensive event listeners
        const onLoadedMetadata = () => {
          console.log('📺 Video metadata loaded');
          console.log(`📐 Video dimensions: ${videoElement.videoWidth}x${videoElement.videoHeight}`);
          console.log('VIDEO Video ready state:', videoElement.readyState);
          console.log('Video current time:', videoElement.currentTime);
          console.log('🖥️ Video element size:', {
            clientWidth: videoElement.clientWidth,
            clientHeight: videoElement.clientHeight,
            offsetWidth: videoElement.offsetWidth,
            offsetHeight: videoElement.offsetHeight
          });
          
          // Force video to be visible
          videoElement.style.display = 'block';
          videoElement.style.opacity = '1';
          videoElement.style.visibility = 'visible';
          
          // Attempt to play immediately
          console.log('▶️ Attempting to play video...');
          videoElement.play().then(() => {
            console.log('Video playing successfully');
            console.log('🎥 Stream active:', streamRef.current?.active);
            console.log('📹 Video tracks:', streamRef.current?.getVideoTracks().map(t => ({ 
              label: t.label, 
              enabled: t.enabled, 
              readyState: t.readyState 
            })));
            setIsCameraActive(true);
            setIsCameraLoading(false);
          }).catch((playError) => {
            console.error('Video play error:', playError);
            console.log('Trying alternative play approach...');
            
            // Force show video even if play fails
            setIsCameraActive(true);
            setIsCameraLoading(false);
            
            // Try playing again after a delay
            setTimeout(() => {
              if (videoElement && streamRef.current) {
                console.log('Retry play attempt...');
                videoElement.play().then(() => {
                  console.log('Video playing after retry');
                }).catch((retryError) => {
                  console.error('Video play retry failed:', retryError);
                  console.log('📺 Final video state:', {
                    readyState: videoElement.readyState,
                    networkState: videoElement.networkState,
                    paused: videoElement.paused,
                    currentTime: videoElement.currentTime,
                    duration: videoElement.duration,
                    videoWidth: videoElement.videoWidth,
                    videoHeight: videoElement.videoHeight
                  });
                });
              }
            }, 1000);
          });
        };
        
        const onCanPlay = () => {
          console.log('Video can play - forcing play now');
          if (videoElement.paused) {
            videoElement.play().catch(console.error);
          }
        };
        
        const onLoadStart = () => {
          console.log('Video load started');
        };
        
        const onLoadedData = () => {
          console.log('Video data loaded');
          console.log('📺 Video element after data load:', {
            videoWidth: videoElement.videoWidth,
            videoHeight: videoElement.videoHeight,
            duration: videoElement.duration,
            readyState: videoElement.readyState
          });
        };
        
        const onProgress = () => {
          console.log('PROGRESS Video loading progress');
        };
        
        const onPlay = () => {
          console.log('▶️ Video play event fired');
          setIsCameraActive(true);
          setIsCameraLoading(false);
        };
        
        const onPlaying = () => {
          console.log('VIDEO Video playing event fired');
          setIsCameraActive(true);
          setIsCameraLoading(false);
        };
        
        const onError = (error: Event) => {
          console.error('Video element error:', error);
          console.error('Video error details:', {
            error: videoElement.error,
            networkState: videoElement.networkState,
            readyState: videoElement.readyState
          });
          setIsCameraLoading(false);
          toast({
            title: 'Video Error',
            description: 'Video element error occurred. Check console for details.',
            variant: 'destructive',
          });
        };
        
        // Add all event listeners
        videoElement.addEventListener('loadedmetadata', onLoadedMetadata);
        videoElement.addEventListener('canplay', onCanPlay);
        videoElement.addEventListener('loadstart', onLoadStart);
        videoElement.addEventListener('loadeddata', onLoadedData);
        videoElement.addEventListener('progress', onProgress);
        videoElement.addEventListener('play', onPlay);
        videoElement.addEventListener('playing', onPlaying);
        videoElement.addEventListener('error', onError);
      }, 100);
      
      // Fallback timeout for video loading
      setTimeout(() => {
        if (isCameraLoading && !isCameraActive) {
          console.warn('Video loading timeout, forcing activation');
          console.log('Final timeout debug:', {
            hasStream: !!streamRef.current,
            streamActive: streamRef.current?.active,
            videoSrcObject: !!videoRef.current?.srcObject,
            videoReadyState: videoRef.current?.readyState,
            videoPaused: videoRef.current?.paused,
            videoCurrentTime: videoRef.current?.currentTime,
            videoDimensions: `${videoRef.current?.videoWidth}x${videoRef.current?.videoHeight}`,
            elementVisible: videoRef.current?.style.display !== 'none',
            elementOpacity: videoRef.current?.style.opacity
          });
          setIsCameraActive(true);
          setIsCameraLoading(false);
        }
      }, 8000);
      
      // Get track information
      const videoTracks = stream.getVideoTracks();
      if (videoTracks.length > 0) {
        const track = videoTracks[0];
        console.log('📹 Video track details:', {
          label: track.label,
          kind: track.kind,
          enabled: track.enabled,
          muted: track.muted,
          readyState: track.readyState,
          settings: track.getSettings(),
          capabilities: track.getCapabilities ? track.getCapabilities() : 'not supported'
        });
      }
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
          case 'OverconstrainedError':
            errorTitle = 'Camera Configuration Error';
            errorMessage = 'The requested camera settings are not supported by your device.';
            break;
          case 'SecurityError':
            errorTitle = 'Security Error';
            errorMessage = 'Camera access blocked due to security restrictions.';
            break;
          default:
            errorMessage = `Camera error: ${error.name}. Please check camera permissions and ensure you are using HTTPS.`;
        }
      } else if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          errorTitle = 'Camera Timeout';
          errorMessage = 'Camera initialization timed out. Please check your camera permissions and try again.';
        } else {
          errorMessage = error.message;
        }
      } else {
        errorMessage = 'Unknown camera error. Please check camera permissions and ensure you are using HTTPS.';
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: 'destructive',
      });
    }
  }, [isCameraLoading, isCameraActive]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsCameraLoading(false);
  }, []);

  // Clean up camera when dialog closes and set mounted state
  useEffect(() => {
    isMountedRef.current = true;
    
    if (!isOpen && isCameraActive) {
      stopCamera();
    }
    
    return () => {
      isMountedRef.current = false;
    };
  }, [isOpen, isCameraActive, stopCamera]);

  const captureAndScan = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    context.drawImage(videoRef.current, 0, 0);

    // Simple OCR simulation - in real implementation, use OCR library
    const imageData = canvas.toDataURL();
    
    // Simulate OCR processing
    setTimeout(() => {
      // Mock OCR result - in reality, use actual OCR library like Tesseract.js
      const mockPartNumber = `PT-${Date.now().toString().slice(-6)}`;
      
      // Check if part exists
      const existingPart = existingParts.find(part => 
        part.partNumber.toLowerCase() === mockPartNumber.toLowerCase()
      );

      if (existingPart) {
        if (onIncrementPart) {
          onIncrementPart(mockPartNumber, 1);
          toast({
            title: 'Part Found & Updated',
            description: `Added 1 unit to existing ${existingPart.partName}`,
          });
        }
      } else {
        // Pre-fill form with scanned part number
        setFormData(prev => ({
          ...prev,
          partNumber: mockPartNumber
        }));
        setActiveTab('manual');
        toast({
          title: 'Part Number Scanned',
          description: `Please complete the part information for ${mockPartNumber}`,
        });
      }
      
      stopCamera();
    }, 1500);

    toast({
      title: 'Processing...',
      description: 'Scanning part number from image...',
    });
  }, [existingParts, onIncrementPart, stopCamera]);

  const roomsByFloor = {
    'Floor 1': ['Display Storage', 'Customer Area', 'Waiting Room Storage'],
    'Floor 2': ['Premium Display', 'Executive Storage', 'VIP Lounge Storage'],
    'Garage': ['Engine Parts Room', 'Maintenance Bay', 'Accessories Room', 'Tool Storage', 'Waste Management'],
    'Parts Inventory': ['Main Warehouse', 'Parts Storage', 'Inventory Room', 'Stock Area', 'Distribution Center']
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Add Part to {floor} Inventory
          </DialogTitle>
          <DialogDescription>
            Add new parts to the {floor.toLowerCase()} inventory using manual entry, camera scanning, or from delivered orders.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Manual Entry
            </TabsTrigger>
            <TabsTrigger value="camera" className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              OCR Scanner
            </TabsTrigger>
            <TabsTrigger value="ordered" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              From Orders ({orderedParts.length})
            </TabsTrigger>
            <TabsTrigger value="order" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Order New Part
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="carModel">Car Model</Label>
                  <Input
                    id="carModel"
                    value={formData.carModel}
                    onChange={(e) => handleInputChange('carModel', e.target.value)}
                    placeholder="e.g., Tesla Model 3"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="vehicleType">Vehicle Type</Label>
                  <select
                    id="vehicleType"
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.vehicleType}
                    onChange={(e) => handleInputChange('vehicleType', e.target.value)}
                    required
                  >
                    <option value="">Select vehicle type</option>
                    <option value="EV">Electric Vehicle (EV)</option>
                    <option value="REV">Range Extended EV (REV)</option>
                    <option value="ICEV">Internal Combustion (ICEV)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="partName">Part Name</Label>
                  <Input
                    id="partName"
                    value={formData.partName}
                    onChange={(e) => handleInputChange('partName', e.target.value)}
                    placeholder="e.g., Air Filter"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="partNumber">Part Number</Label>
                  <Input
                    id="partNumber"
                    value={formData.partNumber}
                    onChange={(e) => handleInputChange('partNumber', e.target.value)}
                    placeholder="e.g., VF-2024-AF-001"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange('quantity', parseInt(e.target.value))}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="supplier">Supplier</Label>
                  <select
                    id="supplier"
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.supplier}
                    onChange={(e) => handleInputChange('supplier', e.target.value)}
                    required
                  >
                    <option value="">Select supplier</option>
                    <option value="DF">Dong Feng (DF)</option>
                    <option value="AZ">AutoZone (AZ)</option>
                    <option value="BMW">BMW Parts</option>
                    <option value="TESLA">Tesla Parts</option>
                    <option value="BYD">BYD Parts</option>
                    <option value="MERCEDES">Mercedes Parts</option>
                    <option value="GENERIC">Generic Parts</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="room">Room</Label>
                  <select
                    id="room"
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.room}
                    onChange={(e) => handleInputChange('room', e.target.value)}
                  >
                    <option value="">Select room</option>
                    {roomsByFloor[floor].map(room => (
                      <option key={room} value={room}>{room}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="shelf">Shelf</Label>
                  <Input
                    id="shelf"
                    value={formData.shelf}
                    onChange={(e) => handleInputChange('shelf', e.target.value)}
                    placeholder="P1, P2..."
                  />
                </div>
                <div>
                  <Label htmlFor="column">Column</Label>
                  <Input
                    id="column"
                    value={formData.column}
                    onChange={(e) => handleInputChange('column', e.target.value)}
                    placeholder="1, 2, 3..."
                  />
                </div>
                <div>
                  <Label htmlFor="row">Row</Label>
                  <Input
                    id="row"
                    value={formData.row}
                    onChange={(e) => handleInputChange('row', e.target.value)}
                    placeholder="1, 2, 3..."
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit">
                  Add Part
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="camera" className="space-y-4">
            <div className="mt-6">
              {!isCameraActive && !isCameraLoading ? (
                <div className="text-center space-y-4">
                  <div className="bg-gray-50 rounded-lg p-8">
                    <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">OCR Part Number Scanner</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Use your camera to automatically scan and detect part numbers
                    </p>
                    <Button 
                      onClick={startCamera} 
                      className="flex items-center gap-2 bg-monza-yellow hover:bg-monza-yellow/90 text-monza-black font-semibold"
                    >
                      <Camera className="h-4 w-4" />
                      Start Camera
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p><strong>Requirements:</strong> Camera requires HTTPS and permissions</p>
                    <p>MOBILE <strong>Mobile:</strong> Will try to use back camera for scanning</p>
                    <p>🔒 <strong>Privacy:</strong> Camera data stays on your device</p>
                    <p><strong>Tip:</strong> Ensure good lighting for best results</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative bg-black rounded-lg overflow-hidden mx-auto max-w-lg">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      controls={false}
                      className="w-full h-full min-h-[300px] max-h-[500px] object-cover cursor-pointer block"
                      style={{ 
                        display: 'block',
                        backgroundColor: '#000',
                        minHeight: '300px',
                        maxHeight: '500px'
                      }}
                      onClick={() => {
                        // Allow manual play if autoplay fails
                        if (videoRef.current) {
                          console.log('MOBILE Manual play attempt');
                          videoRef.current.play().then(() => {
                            console.log('Manual play successful');
                          }).catch((error) => {
                            console.error('Manual play failed:', error);
                          });
                        }
                      }}
                    />
                    
                    {/* Camera loading overlay */}
                    {isCameraLoading && (
                      <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center z-20">
                        <div className="text-center text-white">
                          <div className="animate-spin h-8 w-8 border-4 border-monza-yellow border-t-transparent rounded-full mx-auto mb-4"></div>
                          <p className="text-sm font-medium">Starting camera...</p>
                          <p className="text-xs opacity-80 mt-1">Please allow camera access when prompted</p>
                          <Button 
                            onClick={stopCamera}
                            variant="outline" 
                            size="sm"
                            className="mt-4 text-xs bg-white/10 border-white/20 text-white hover:bg-white/20"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {/* Debug overlay - shows when video should be active */}
                    {isCameraActive && !isCameraLoading && (
                      <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded z-10">
                        📹 Camera Active
                      </div>
                    )}
                    
                    {/* Scanning guide overlay */}
                    {isCameraActive && !isCameraLoading && (
                      <div className="absolute inset-4 border-2 border-monza-yellow border-dashed rounded-lg flex items-center justify-center pointer-events-none">
                        <div className="bg-black/70 text-white px-4 py-2 rounded-lg text-center">
                          <div className="text-sm font-medium">Position part number here</div>
                          <div className="text-xs mt-1 opacity-80">Keep text clear and centered</div>
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
                  
                  {/* Camera controls - only show when camera is active */}
                  {isCameraActive && !isCameraLoading && (
                    <div className="flex gap-2 justify-center flex-wrap">
                      <Button 
                        onClick={captureAndScan} 
                        className="flex items-center gap-2 bg-monza-yellow hover:bg-monza-yellow/90 text-monza-black font-semibold"
                      >
                        <Scan className="h-4 w-4" />
                        Scan Part Number
                      </Button>
                      <Button 
                        onClick={() => {
                          console.log('Manual video refresh');
                          if (videoRef.current && streamRef.current) {
                            // Force video element refresh
                            const video = videoRef.current;
                            video.srcObject = null;
                            setTimeout(() => {
                              video.srcObject = streamRef.current;
                              video.play().then(() => {
                                console.log('Video refresh successful');
                              }).catch(console.error);
                            }, 100);
                          }
                        }}
                        variant="outline" 
                        size="sm"
                        className="flex items-center gap-1 text-xs"
                      >
                        Refresh Video
                      </Button>
                      <Button 
                        onClick={() => {
                          console.log('🔬 Debug video element state');
                          if (videoRef.current) {
                            const video = videoRef.current;
                            console.log('📺 Current video state:', {
                              srcObject: !!video.srcObject,
                              readyState: video.readyState,
                              networkState: video.networkState,
                              paused: video.paused,
                              currentTime: video.currentTime,
                              duration: video.duration,
                              videoWidth: video.videoWidth,
                              videoHeight: video.videoHeight,
                              clientWidth: video.clientWidth,
                              clientHeight: video.clientHeight,
                              offsetWidth: video.offsetWidth,
                              offsetHeight: video.offsetHeight,
                              style: {
                                display: video.style.display,
                                opacity: video.style.opacity,
                                visibility: video.style.visibility,
                                width: video.style.width,
                                height: video.style.height
                              }
                            });
                            
                            if (streamRef.current) {
                              console.log('🎥 Current stream state:', {
                                active: streamRef.current.active,
                                id: streamRef.current.id,
                                tracks: streamRef.current.getTracks().map(t => ({
                                  kind: t.kind,
                                  label: t.label,
                                  enabled: t.enabled,
                                  readyState: t.readyState
                                }))
                              });
                            }
                            
                            // Force a manual play attempt
                            if (video.paused) {
                              console.log('VIDEO Forcing manual play');
                              video.play().then(() => {
                                console.log('Manual play successful');
                              }).catch((err) => {
                                console.error('Manual play failed:', err);
                              });
                            }
                          }
                        }}
                        variant="outline" 
                        size="sm"
                        className="flex items-center gap-1 text-xs"
                      >
                        🔬 Debug
                      </Button>
                      <Button 
                        onClick={stopCamera} 
                        variant="outline" 
                        className="flex items-center gap-2 border-monza-gray text-monza-gray hover:bg-monza-gray/10"
                      >
                        <X className="h-4 w-4" />
                        Stop Camera
                      </Button>
                    </div>
                  )}
                </div>
              )}
              
              <canvas ref={canvasRef} className="hidden" />
            </div>
          </TabsContent>

          <TabsContent value="ordered" className="space-y-4">
            {orderedParts.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No delivered parts available</p>
                <p className="text-sm text-muted-foreground">Delivered parts from orders will appear here</p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Select Delivered Part to Add to Inventory</Label>
                  <div className="grid gap-2 max-h-64 overflow-y-auto">
                    {orderedParts.map((part) => (
                      <div
                        key={part.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedOrderedPart?.id === part.id
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedOrderedPart(part)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{part.part_name}</p>
                            <p className="text-sm text-muted-foreground">#{part.part_number}</p>
                            <p className="text-sm text-muted-foreground">Qty: {part.quantity} | {part.supplier}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-green-600">
                              {part.category === 'voyah' ? 'Voyah' : 'ICEV'}
                            </p>
                            {part.price && (
                              <p className="text-sm text-muted-foreground">${part.price}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedOrderedPart && (
                  <div className="space-y-4 border-t pt-4">
                    <h4 className="font-medium">Complete Inventory Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="carModel">Car Model</Label>
                        <Input
                          id="carModel"
                          value={formData.carModel}
                          onChange={(e) => handleInputChange('carModel', e.target.value)}
                          placeholder="e.g., Voyah Dream 2024"
                        />
                      </div>
                      <div>
                        <Label htmlFor="room">Storage Room</Label>
                        <select
                          id="room"
                          className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          value={formData.room}
                          onChange={(e) => handleInputChange('room', e.target.value)}
                        >
                          <option value="">Select room</option>
                          {roomsByFloor[floor].map(room => (
                            <option key={room} value={room}>{room}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="shelf">Shelf</Label>
                        <Input
                          id="shelf"
                          value={formData.shelf}
                          onChange={(e) => handleInputChange('shelf', e.target.value)}
                          placeholder="P1, P2..."
                        />
                      </div>
                      <div>
                        <Label htmlFor="column">Column</Label>
                        <Input
                          id="column"
                          value={formData.column}
                          onChange={(e) => handleInputChange('column', e.target.value)}
                          placeholder="1, 2, 3..."
                        />
                      </div>
                      <div>
                        <Label htmlFor="row">Row</Label>
                        <Input
                          id="row"
                          value={formData.row}
                          onChange={(e) => handleInputChange('row', e.target.value)}
                          placeholder="1, 2, 3..."
                        />
                      </div>
                    </div>

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={onClose}>
                        Cancel
                      </Button>
                      <Button onClick={handleOrderedPartSubmit}>
                        Add to Inventory
                      </Button>
                    </DialogFooter>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="order" className="space-y-4">
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">Order New Part</h3>
                <p className="text-sm text-blue-700">
                  Order parts that are not currently in inventory. This will create a new order that can be tracked.
                </p>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                handleOrderNewPart();
              }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="orderPartName">Part Name *</Label>
                    <Input
                      id="orderPartName"
                      value={formData.partName}
                      onChange={(e) => handleInputChange('partName', e.target.value)}
                      placeholder="e.g., Air Filter, Brake Pads"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="orderPartNumber">Part Number *</Label>
                    <Input
                      id="orderPartNumber"
                      value={formData.partNumber}
                      onChange={(e) => handleInputChange('partNumber', e.target.value)}
                      placeholder="e.g., VF-2024-AF-001"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="orderCarModel">Compatible Car Model</Label>
                    <Input
                      id="orderCarModel"
                      value={formData.carModel}
                      onChange={(e) => handleInputChange('carModel', e.target.value)}
                      placeholder="e.g., Tesla Model 3, Voyah Dream"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="orderVehicleType">Vehicle Type</Label>
                    <select
                      id="orderVehicleType"
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={formData.vehicleType}
                      onChange={(e) => handleInputChange('vehicleType', e.target.value)}
                    >
                      <option value="">Select vehicle type</option>
                      <option value="EV">Electric Vehicle (EV)</option>
                      <option value="REV">Range Extended EV (REV)</option>
                      <option value="ICEV">Internal Combustion (ICEV)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="orderQuantity">Quantity *</Label>
                    <Input
                      id="orderQuantity"
                      type="number"
                      min="1"
                      value={formData.quantity}
                      onChange={(e) => handleInputChange('quantity', parseInt(e.target.value))}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="orderSupplier">Supplier *</Label>
                    <select
                      id="orderSupplier"
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={formData.supplier}
                      onChange={(e) => handleInputChange('supplier', e.target.value)}
                      required
                    >
                      <option value="">Select supplier</option>
                      <option value="DF">Dong Feng (DF)</option>
                      <option value="AZ">AutoZone (AZ)</option>
                      <option value="BMW">BMW Parts</option>
                      <option value="TESLA">Tesla Parts</option>
                      <option value="BYD">BYD Parts</option>
                      <option value="MERCEDES">Mercedes Parts</option>
                      <option value="GENERIC">Generic Parts</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="orderCategory">Category</Label>
                    <select
                      id="orderCategory"
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                    >
                      <option value="">Select category</option>
                      <option value="part">Engine Part</option>
                      <option value="accessory">Accessory</option>
                      <option value="tool">Tool</option>
                      <option value="consumable">Consumable</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="orderNotes">Order Notes</Label>
                  <Textarea
                    id="orderNotes"
                    value={formData.pdiNotes}
                    onChange={(e) => handleInputChange('pdiNotes', e.target.value)}
                    placeholder="Additional notes about the order, urgency, special requirements..."
                    rows={3}
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    Create Order
                  </Button>
                </DialogFooter>
              </form>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AddPartDialog;
