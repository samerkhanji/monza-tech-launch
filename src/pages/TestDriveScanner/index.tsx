import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Camera, 
  QrCode, 
  Timer, 
  Car, 
  Play, 
  Square, 
  User, 
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
  StopCircle,
  Zap,
  Users,
  Monitor,
  ArrowLeft,
  FileText
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useCameraPermission } from '@/utils/cameraPermissionManager';
import { extractTextFromImage } from '@/utils/ocrUtils';
import { enhancedRepairHistoryService } from '@/services/enhancedRepairHistoryService';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ActiveTestDrive {
  id: string;
  vin: string;
  carModel: string;
  startTime: Date;
  employeeScanned: string; // Who scanned/took the car
  employeeEmail: string;
  notes?: string;
  // Details filled when ending test drive:
  driverName?: string;
  clientName?: string;
  isClientTestDrive?: boolean;
  testDriveNotes?: string;
}

interface CarData {
  id: string;
  vinNumber: string;
  model: string;
  year: number;
  color: string;
  brand: string;
  batteryPercentage?: number;
}

interface TestDriveEndDetails {
  isClientTestDrive: boolean;
  driverName: string;
  clientName?: string;
  testDriveNotes?: string;
}

const TestDriveScannerPage: React.FC = () => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [activeTestDrives, setActiveTestDrives] = useState<ActiveTestDrive[]>([]);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [endingTestDrive, setEndingTestDrive] = useState<ActiveTestDrive | null>(null);
  const [endDetails, setEndDetails] = useState<TestDriveEndDetails>({
    isClientTestDrive: true,
    driverName: '',
    clientName: '',
    testDriveNotes: ''
  });
  const [manualVin, setManualVin] = useState('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { user } = useAuth();

  const { 
    granted, 
    denied, 
    stream, 
    requestCamera, 
    stopCamera, 
    isSupported,
    hasActiveStream 
  } = useCameraPermission();

  // Load active test drives from localStorage on mount
  useEffect(() => {
    const savedTestDrives = localStorage.getItem('activeTestDrives');
    if (savedTestDrives) {
      const parsed = JSON.parse(savedTestDrives);
      setActiveTestDrives(parsed.map((td: any) => ({
        ...td,
        startTime: new Date(td.startTime)
      })));
    }
  }, []);

  // Save active test drives to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('activeTestDrives', JSON.stringify(activeTestDrives));
  }, [activeTestDrives]);

  // Auto-start camera when component mounts
  useEffect(() => {
    if (granted && !hasActiveStream) {
      handleStartCamera();
    }
  }, [granted, hasActiveStream]);

  // Update video element when stream changes
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(console.error);
    }
  }, [stream]);

  const handleStartCamera = async () => {
    try {
      await requestCamera({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      toast({
        title: "📷 Camera Ready",
        description: "Point camera at VIN for INSTANT test drive start!",
      });
    } catch (err) {
      console.error("Camera access error:", err);
      toast({
        title: "Camera Error",
        description: "Could not access camera. Use manual VIN entry instead.",
        variant: "destructive",
      });
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
      title: "📸 VIN Captured",
      description: "Click 'START INSTANT TEST DRIVE' to begin immediately!",
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

  const startInstantTestDrive = async () => {
    if (!capturedPhoto) {
      toast({
        title: "No VIN captured",
        description: "Please capture a VIN photo first.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // Starting instant test drive

      const extractedText = await extractTextFromImage(capturedPhoto);
      
      if (extractedText && extractedText.length >= 5) {
        const extractedVIN = extractVinFromText(extractedText);
        
        if (extractedVIN) {
          await instantStartTestDrive(extractedVIN);
        } else {
          toast({
            title: "No VIN Found",
            description: "Could not detect a valid VIN. Try manual entry below.",
            variant: "destructive",
          });
        }
      } else {
        toast({
                      title: "No Text Found",
          description: "Could not extract text from image. Ensure VIN is clearly visible.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('OCR extraction error:', error);
      toast({
        title: "OCR Error",
        description: "Failed to process image. Try manual VIN entry instead.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const instantStartTestDrive = async (vin: string) => {
    // Check if car is already on test drive
    const existingTestDrive = activeTestDrives.find(td => td.vin === vin);
    if (existingTestDrive) {
      toast({
                    title: "Car Already on Test Drive",
        description: `This vehicle is currently being test driven by ${existingTestDrive.employeeScanned}`,
        variant: "destructive",
      });
      return;
    }

    // Simulate car lookup (in real app, this would query the database)
    const mockCar: CarData = {
      id: `car-${vin}`,
      vinNumber: vin,
      model: 'Voyah Free',
      year: 2024,
      color: 'Arctic White',
      brand: 'Voyah',
      batteryPercentage: 85
    };

    const currentUser = user || { 
      email: 'Unknown User', 
      user_metadata: { full_name: 'Unknown Employee' } 
    };

    const employeeName = (currentUser as any)?.user_metadata?.full_name || currentUser.email || 'Unknown Employee';
    const employeeEmail = currentUser.email || 'unknown@monzasal.com';

    const newTestDrive: ActiveTestDrive = {
      id: `td-${Date.now()}`,
      vin: vin,
      carModel: `${mockCar.year} ${mockCar.brand} ${mockCar.model}`,
      startTime: new Date(),
      employeeScanned: employeeName,
      employeeEmail: employeeEmail
    };

    setActiveTestDrives(prev => [...prev, newTestDrive]);
    
    // Reset scanner
    setCapturedPhoto(null);
    setManualVin('');
  };

  const processManualVinInstant = async () => {
    if (!manualVin.trim()) {
      toast({
        title: "VIN Required",
        description: "Please enter a VIN number",
        variant: "destructive",
      });
      return;
    }

    const cleanVin = manualVin.trim().toUpperCase();
    if (!/^[A-HJ-NPR-Z0-9]{17}$/i.test(cleanVin)) {
      toast({
        title: "Invalid VIN",
        description: "VIN must be 17 characters long and contain only letters and numbers",
        variant: "destructive",
      });
      return;
    }

    await instantStartTestDrive(cleanVin);
  };

  const openEndTestDriveDialog = (testDrive: ActiveTestDrive) => {
    setEndingTestDrive(testDrive);
    setEndDetails({
      isClientTestDrive: true,
      driverName: testDrive.employeeScanned, // Default to the employee who took it
      clientName: '',
      testDriveNotes: ''
    });
    setShowEndDialog(true);
  };

  const handleEndTestDrive = async () => {
    if (!endingTestDrive) return;

    // Validation
    if (!endDetails.driverName.trim()) {
      toast({
        title: "Driver Name Required",
        description: "Please enter who drove the vehicle",
        variant: "destructive",
      });
      return;
    }

    if (endDetails.isClientTestDrive && !endDetails.clientName?.trim()) {
      toast({
        title: "Client Name Required",
        description: "Please enter the client's name for client test drives",
        variant: "destructive",
      });
      return;
    }

    const endTime = new Date();
    const duration = Math.round((endTime.getTime() - endingTestDrive.startTime.getTime()) / 1000 / 60);
    
    // Remove from active test drives
    setActiveTestDrives(prev => prev.filter(td => td.id !== endingTestDrive.id));
    
    // Close dialog
    setShowEndDialog(false);
    setEndingTestDrive(null);

    // Save to local test drive history with complete details
    const historyEntry = {
      ...endingTestDrive,
      endTime,
      duration,
      driverName: endDetails.driverName,
      clientName: endDetails.clientName,
      isClientTestDrive: endDetails.isClientTestDrive,
      testDriveNotes: endDetails.testDriveNotes,
      completedAt: new Date().toISOString()
    };
    
    const savedHistory = JSON.parse(localStorage.getItem('testDriveHistory') || '[]');
    savedHistory.push(historyEntry);
    localStorage.setItem('testDriveHistory', JSON.stringify(savedHistory));

    // Save to repair history system for comprehensive tracking
    try {
      const testDriveRepairEntry = {
        car_vin: endingTestDrive.vin,
        car_model: endingTestDrive.carModel,
        client_name: endDetails.clientName || endDetails.driverName,
        client_phone: '', 
        client_email: '',
        issue_description: `${endDetails.isClientTestDrive ? 'Client' : 'Employee'} Test Drive - Scanned by: ${endingTestDrive.employeeScanned}. ${endDetails.testDriveNotes || 'Standard test drive evaluation'}`,
        solution_description: `Test drive completed successfully. Duration: ${duration} minutes. Scanned by: ${endingTestDrive.employeeScanned}, Driver: ${endDetails.driverName}${endDetails.clientName ? `, Client: ${endDetails.clientName}` : ''}. ${endDetails.testDriveNotes ? `Notes: ${endDetails.testDriveNotes}` : ''}`,
        repair_steps: [
          'Employee scanned VIN and took vehicle instantly',
          'Test drive commenced immediately with timer tracking',
          'Vehicle performance evaluated during drive',
          'Test drive completed and returned safely',
          'Client/driver details collected and recorded'
        ],
        parts_used: [],
        labor_hours: duration / 60,
        total_cost: 0,
        technician_name: endingTestDrive.employeeScanned,
        repair_date: endingTestDrive.startTime.toISOString().split('T')[0],
        completion_date: endTime.toISOString().split('T')[0],
        photos: [],
        before_photos: [],
        after_photos: [],
        repair_category: 'Test Drive',
        difficulty_level: 'easy' as const,
        quality_rating: 5,
        client_satisfaction: 5,
        warranty_period: 0,
        follow_up_required: endDetails.isClientTestDrive,
        follow_up_notes: endDetails.isClientTestDrive ? 'Follow up with client for sales opportunity' : undefined
      };

      const savedRepairEntry = await enhancedRepairHistoryService.saveRepairHistory(testDriveRepairEntry);
      
      if (savedRepairEntry) {
        console.log('✅ Test drive successfully recorded in repair history:', savedRepairEntry.id);
      }
      
    } catch (error) {
      console.error('❌ Error saving test drive to repair history:', error);
      toast({
                    title: "Partial Save",
        description: "Test drive completed but may not be fully recorded in history",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const formatElapsedTime = (startTime: Date): string => {
    const now = new Date();
    const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
    const hours = Math.floor(elapsed / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    const seconds = elapsed % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const TestDriveTimer: React.FC<{ testDrive: ActiveTestDrive }> = ({ testDrive }) => {
    const [elapsedTime, setElapsedTime] = useState('');

    useEffect(() => {
      const interval = setInterval(() => {
        setElapsedTime(formatElapsedTime(testDrive.startTime));
      }, 1000);

      return () => clearInterval(interval);
    }, [testDrive.startTime]);

    return (
      <tr className="border-b border-gray-200 hover:bg-gray-50">
        <td className="px-4 py-3">
          <div className="font-mono text-sm">{testDrive.vin}</div>
        </td>
        <td className="px-4 py-3">
          <div className="font-medium">{testDrive.carModel}</div>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-blue-500" />
            <span className="font-medium">{testDrive.employeeScanned}</span>
          </div>
        </td>
        <td className="px-4 py-3">
          <div className="text-sm text-gray-600">
            {testDrive.startTime.toLocaleTimeString()}
          </div>
        </td>
        <td className="px-4 py-3">
          <div className="text-2xl font-mono font-bold text-green-600">
            {elapsedTime}
          </div>
        </td>
        <td className="px-4 py-3">
          <Button 
            onClick={() => openEndTestDriveDialog(testDrive)}
            size="sm"
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <StopCircle className="h-4 w-4 mr-1" />
            END TEST DRIVE
          </Button>
        </td>
      </tr>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center mb-8">
        <Button 
          variant="outline" 
          size="sm" 
          className="mr-4"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back
        </Button>
        <div className="text-center flex-1">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            INSTANT Test Drive Scanner
          </h1>
          <p className="text-gray-600 text-lg">
            Scan VIN → Car instantly taken for test drive → Fill details when returning
          </p>
        </div>
      </div>

      {/* Active Test Drives Monitor */}
      {activeTestDrives.length > 0 && (
        <Card className="border-green-200 bg-green-50 border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <Monitor className="h-6 w-6" />
              🟢 LIVE TEST DRIVES - CURRENTLY ACTIVE ({activeTestDrives.length})
              <Badge className="bg-green-500 text-white px-3 py-1 text-sm">
                {activeTestDrives.length} Cars Out
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-green-300 bg-green-100">
                    <th className="px-4 py-3 text-left font-semibold">VIN</th>
                    <th className="px-4 py-3 text-left font-semibold">Vehicle</th>
                    <th className="px-4 py-3 text-left font-semibold">Taken By</th>
                    <th className="px-4 py-3 text-left font-semibold">Start Time</th>
                    <th className="px-4 py-3 text-left font-semibold">Duration (Live)</th>
                    <th className="px-4 py-3 text-left font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {activeTestDrives.map(testDrive => (
                    <TestDriveTimer key={testDrive.id} testDrive={testDrive} />
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* INSTANT VIN Scanner */}
        <Card className="border-blue-300 bg-blue-50 border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700 text-xl">
              <Zap className="h-6 w-6" />
                              INSTANT VIN Scanner
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Camera View */}
            <div className="relative">
              {capturedPhoto ? (
                <img 
                  src={capturedPhoto} 
                  alt="Captured VIN" 
                  className="w-full h-64 rounded-md object-contain border-2 border-blue-300"
                />
              ) : (
                <>
                  <video 
                    ref={videoRef} 
                    className="w-full h-64 rounded-md bg-gray-100 object-cover border-2 border-blue-300" 
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
                    <p className="text-sm text-gray-500">Camera not active</p>
                  </div>
                </div>
              )}
              
              {hasActiveStream && !capturedPhoto && (
                <div className="absolute top-3 left-3">
                  <div className="flex items-center gap-2 bg-red-500 text-white px-3 py-2 rounded-full text-sm font-bold">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    LIVE - READY TO SCAN
                  </div>
                </div>
              )}
            </div>
            
            {/* Camera Controls */}
            <div className="flex gap-2">
              {!hasActiveStream ? (
                <Button onClick={handleStartCamera} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  <Camera className="h-4 w-4 mr-2" />
                  Start Camera
                </Button>
              ) : !capturedPhoto ? (
                <Button onClick={capturePhoto} className="flex-1 bg-blue-600 hover:bg-blue-700 text-lg font-bold py-3">
                  <Camera className="h-5 w-5 mr-2" />
                  📸 CAPTURE VIN
                </Button>
              ) : (
                <>
                  <Button 
                    onClick={startInstantTestDrive} 
                    disabled={isProcessing}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white text-lg font-bold py-4"
                  >
                    {isProcessing ? (
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    ) : (
                      <Zap className="h-5 w-5 mr-2" />
                    )}
                    {isProcessing ? 'STARTING...' : (
                  <>
                    <Car className="w-4 h-4 mr-2" />
                    START INSTANT TEST DRIVE
                  </>
                )}
                  </Button>
                  <Button 
                    onClick={() => setCapturedPhoto(null)}
                    variant="outline"
                    className="text-sm"
                  >
                    Retake
                  </Button>
                </>
              )}
            </div>

            {/* Manual VIN Entry */}
            <div className="space-y-3 border-t-2 border-blue-200 pt-4">
              <Label htmlFor="manualVin" className="text-base font-semibold">⌨️ Or Enter VIN Manually</Label>
              <div className="flex gap-2">
                <Input
                  id="manualVin"
                  value={manualVin}
                  onChange={(e) => setManualVin(e.target.value.toUpperCase())}
                  placeholder="Enter 17-character VIN"
                  maxLength={17}
                  className="flex-1 h-12 text-base"
                />
                <Button 
                  onClick={processManualVinInstant} 
                  className="bg-green-600 hover:bg-green-700 text-white font-bold px-6"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  START!
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="border-yellow-300 bg-yellow-50 border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-700 text-xl">
              <Users className="h-6 w-6" />
                              How Instant Test Drive Works
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-yellow-200">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                <div>
                  <h4 className="font-semibold text-blue-700">Scan or Enter VIN</h4>
                  <p className="text-sm text-gray-600">Point camera at VIN or type it manually</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-yellow-200">
                <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                <div>
                  <h4 className="font-semibold text-green-700 flex items-center gap-2">
                  <Car className="w-4 h-4" />
                  INSTANT START!
                </h4>
                  <p className="text-sm text-gray-600">Test drive timer starts immediately - take the car and go!</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-yellow-200">
                <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                <div>
                  <h4 className="font-semibold text-orange-700">🕐 Live Tracking</h4>
                  <p className="text-sm text-gray-600">Your name and timer are logged automatically</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-yellow-200">
                <div className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
                <div>
                  <h4 className="font-semibold text-red-700">🛑 End & Log Details</h4>
                  <p className="text-sm text-gray-600">Click "END TEST DRIVE" and fill in client information</p>
                </div>
              </div>
            </div>

            <div className="bg-green-100 p-4 rounded-lg border-2 border-green-300">
              <p className="text-sm font-bold text-green-800 text-center">
                Perfect for quick test drives! No waiting, no forms upfront!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* End Test Drive Dialog */}
      <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <StopCircle className="h-6 w-6" />
              🛑 Complete Test Drive - Log Client Details
            </DialogTitle>
          </DialogHeader>
          
          {endingTestDrive && (
            <div className="space-y-6">
              {/* Test Drive Summary */}
              <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                <h4 className="font-semibold mb-3 text-blue-700 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Test Drive Summary
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Vehicle:</span>
                    <p className="font-semibold">{endingTestDrive.carModel}</p>
                  </div>
                  <div>
                    <span className="font-medium">VIN:</span>
                    <p className="font-mono">{endingTestDrive.vin}</p>
                  </div>
                  <div>
                    <span className="font-medium">Taken by:</span>
                    <p className="font-semibold text-blue-600">{endingTestDrive.employeeScanned}</p>
                  </div>
                  <div>
                    <span className="font-medium">Duration:</span>
                    <p className="font-bold text-green-600">{formatElapsedTime(endingTestDrive.startTime)}</p>
                  </div>
                </div>
              </div>

              {/* Test Drive Type */}
              <div className="space-y-3">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Car className="w-4 h-4" />
                  Test Drive Type
                </Label>
                <div className="flex gap-2">
                  <Button
                    variant={endDetails.isClientTestDrive ? "default" : "outline"}
                    onClick={() => setEndDetails(prev => ({ ...prev, isClientTestDrive: true }))}
                    className="flex-1"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Client Test Drive
                  </Button>
                  <Button
                    variant={!endDetails.isClientTestDrive ? "default" : "outline"}
                    onClick={() => setEndDetails(prev => ({ ...prev, isClientTestDrive: false }))}
                    className="flex-1"
                  >
                    👨‍💼 Employee Test Drive
                  </Button>
                </div>
              </div>

              {/* Driver & Client Details */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="driverName" className="text-base font-semibold flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Driver Name *
                </Label>
                  <Input
                    id="driverName"
                    value={endDetails.driverName}
                    onChange={(e) => setEndDetails(prev => ({ ...prev, driverName: e.target.value }))}
                    placeholder="Who actually drove the vehicle?"
                    className="h-12"
                  />
                </div>

                {endDetails.isClientTestDrive && (
                  <div>
                    <Label htmlFor="clientName" className="text-base font-semibold flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Client Name *
                </Label>
                    <Input
                      id="clientName"
                      value={endDetails.clientName}
                      onChange={(e) => setEndDetails(prev => ({ ...prev, clientName: e.target.value }))}
                      placeholder="Client's full name"
                      className="h-12"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="testDriveNotes" className="text-base font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Test Drive Notes
                </Label>
                  <Textarea
                    id="testDriveNotes"
                    value={endDetails.testDriveNotes}
                    onChange={(e) => setEndDetails(prev => ({ ...prev, testDriveNotes: e.target.value }))}
                    placeholder="How was the test drive? Any observations, client feedback, issues..."
                    rows={4}
                    className="text-base"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setShowEndDialog(false)}
                  className="px-6"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleEndTestDrive}
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-base font-bold"
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  COMPLETE TEST DRIVE
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TestDriveScannerPage; 