import React, { useState, useEffect } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Car, Play, Square, Timer, User, Briefcase } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTimeTracking } from '@/hooks/useTimeTracking';

interface SimpleTestDriveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  car: any;
  onStartTestDrive: (carId: string, testDriveInfo: any) => void;
  onEndTestDrive: (carId: string) => void;
  isClientTestDrive?: boolean;
}

const SimpleTestDriveDialog: React.FC<SimpleTestDriveDialogProps> = ({
  isOpen,
  onClose,
  car,
  onStartTestDrive,
  onEndTestDrive,
  isClientTestDrive = false
}) => {
  const { user } = useAuth();
  const [employeeName, setEmployeeName] = useState('');
  const [clientName, setClientName] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);

  // Initialize time tracking for test drives
  const timeTracking = useTimeTracking({
    activityType: isClientTestDrive ? 'test_drive_client' : 'test_drive_employee',
    activityDescription: `${isClientTestDrive ? 'Client' : 'Employee'} test drive - ${car?.model || 'Vehicle'}`,
    carVin: car?.vinNumber || car?.vin,
    carModel: car?.model,
    clientName: isClientTestDrive ? clientName : undefined,
    estimatedDurationMinutes: isClientTestDrive ? 30 : 15,
    location: 'Test Drive Route',
    department: 'Sales',
    showNotifications: false // We'll handle notifications manually
  });

  // Timer effect for active test drives
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (car?.testDriveInfo?.isOnTestDrive && car?.testDriveInfo?.testDriveStartTime) {
      interval = setInterval(() => {
        const startTime = new Date(car.testDriveInfo.testDriveStartTime);
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        setElapsedTime(elapsed);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [car?.testDriveInfo?.isOnTestDrive, car?.testDriveInfo?.testDriveStartTime]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartTestDrive = async () => {
    if (!car) return;

    if (!employeeName.trim()) {
      toast({
        title: "Employee Required",
        description: "Please enter the employee name.",
        variant: "destructive"
      });
      return;
    }

    if (isClientTestDrive && !clientName.trim()) {
      toast({
        title: "Client Name Required",
        description: "Please enter the client name for client test drive.",
        variant: "destructive"
      });
      return;
    }

    // ✨ CAPTURE REAL-TIME TIMESTAMP - When car is actually taken
    const actualStartTime = new Date();
    
    const testDriveInfo = {
      isOnTestDrive: true,
      testDriveStartTime: actualStartTime.toISOString(), // Real timestamp
      actualStartTime: actualStartTime.toISOString(), // Duplicate for clarity
      scheduledStartTime: null, // No scheduled time for immediate starts
      employeeName: employeeName.trim(),
      clientName: isClientTestDrive ? clientName.trim() : null,
      isClientTestDrive,
      loggedBy: user?.email || 'Unknown',
      loggedAt: actualStartTime.toISOString(),
      vehicleVin: car.vinNumber || car.vin,
      vehicleModel: car.model,
      startMethod: 'immediate', // Indicates this was an immediate start, not scheduled
      realTimeCapture: true // Flag to indicate real-time capture
    };

    // Start time tracking automatically
    const trackingId = await timeTracking.trackTestDrive.start(isClientTestDrive);
    if (trackingId) {
      console.log(`Started time tracking for test drive: ${trackingId}`);
    }

    onStartTestDrive(car.id, testDriveInfo);
    
    toast({
      title: "🚗 Test Drive Started - Real Time",
      description: `${isClientTestDrive ? 'Client' : 'Employee'} test drive started NOW with ${employeeName} at ${actualStartTime.toLocaleTimeString()}`,
      duration: 5000,
    });

    // Reset form but keep dialog open to show timer
    setEmployeeName('');
    setClientName('');
  };

  // New function for immediate "Take Car Now" action
  const handleTakeCarNow = async () => {
    if (!employeeName.trim()) {
      toast({
        title: "Employee Required",
        description: "Please enter the employee name first.",
        variant: "destructive"
      });
      return;
    }

    if (isClientTestDrive && !clientName.trim()) {
      toast({
        title: "Client Name Required",
        description: "Please enter the client name first.",
        variant: "destructive"
      });
      return;
    }

    // Immediate start with real timestamp
    await handleStartTestDrive();
  };

  const handleEndTestDrive = async () => {
    if (!car) return;

    // End time tracking automatically
    const trackingResult = await timeTracking.trackTestDrive.end();
    if (trackingResult) {
      console.log(`Completed time tracking for test drive. Duration: ${trackingResult.durationMinutes} minutes`);
    }

    onEndTestDrive(car.id);
    
    const duration = formatTime(elapsedTime);
    toast({
      title: "Test Drive Completed",
      description: `Test drive completed. Duration: ${duration}`,
    });

    onClose();
  };

  if (!car) return null;

  const isOnTestDrive = car.testDriveInfo?.isOnTestDrive;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-[95vw] max-h-[95vh] overflow-y-auto">
        <DialogHeader className="sticky top-0 bg-white z-10 border-b pb-4">
          <DialogTitle className="flex items-center gap-2">
            {isClientTestDrive ? (
              <User className="h-5 w-5 text-blue-600" />
            ) : (
              <Briefcase className="h-5 w-5 text-orange-600" />
            )}
            {isClientTestDrive ? 'Client' : 'Employee'} Test Drive
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 px-1">
          {/* Vehicle Info */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Car className="h-4 w-4 text-gray-600" />
              <span className="font-medium text-sm">{car.model} ({car.year})</span>
            </div>
            <div className="text-xs text-gray-600 font-mono">VIN: {car.vinNumber || car.vin}</div>
          </div>

          {/* Test Drive Status */}
          {isOnTestDrive ? (
            <div className="space-y-4">
              <div className="text-center">
                <Badge className="bg-green-100 text-green-800 border-green-300 px-4 py-2">
                  <Timer className="h-4 w-4 mr-2" />
                  Test Drive Active - Real Time
                </Badge>
              </div>

              {/* Real-Time Clock Display */}
              <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border-2 border-green-300">
                <div className="text-sm text-gray-600 mb-1">Current Duration</div>
                <div className="text-4xl font-mono font-bold text-green-600">
                  {formatTime(elapsedTime)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Started: {new Date(car.testDriveInfo.testDriveStartTime).toLocaleString()}
                </div>
              </div>

              {/* Current Test Drive Info */}
              <div className="space-y-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Employee:</span>
                  <span>{car.testDriveInfo.employeeName}</span>
                </div>
                {car.testDriveInfo.clientName && (
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Client:</span>
                    <span>{car.testDriveInfo.clientName}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Actual Start:</span>
                  <span className="font-mono text-green-600 font-semibold">
                    {new Date(car.testDriveInfo.testDriveStartTime).toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Start Method:</span>
                  <span className="text-green-600 font-semibold">
                    {car.testDriveInfo.startMethod === 'immediate' ? '🕐 Real-Time Capture' : 'Scheduled'}
                  </span>
                </div>
              </div>

              <Button 
                onClick={handleEndTestDrive}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-3"
              >
                <Square className="h-4 w-4 mr-2" />
                End Test Drive & Calculate Duration
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Current Time Display */}
              <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-sm text-gray-600">Current Time</div>
                <div className="text-xl font-mono font-bold text-blue-600">
                  {new Date().toLocaleTimeString()}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date().toLocaleDateString()}
                </div>
              </div>

              {/* Employee Input */}
              <div className="space-y-2">
                <Label htmlFor="employeeName">
                  {isClientTestDrive ? 'Accompanying Employee' : 'Employee Name'} *
                </Label>
                <Input
                  id="employeeName"
                  value={employeeName}
                  onChange={(e) => setEmployeeName(e.target.value)}
                  placeholder="Enter employee name"
                  className="border-gray-300"
                />
              </div>

              {/* Client Input (for client test drives) */}
              {isClientTestDrive && (
                <div className="space-y-2">
                  <Label htmlFor="clientName">Client Name *</Label>
                  <Input
                    id="clientName"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Enter client name"
                    className="border-gray-300"
                  />
                </div>
              )}

              {/* Prominent "Take Car Now" Button */}
              <div className="space-y-3">
                <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border-2 border-green-300">
                  <div className="text-center mb-3">
                    <div className="text-lg font-bold text-green-800">Ready to Start Test Drive?</div>
                    <div className="text-sm text-gray-600">Click below to capture the real start time</div>
                  </div>
                  
                  <Button 
                    onClick={handleTakeCarNow}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-4 text-lg font-semibold"
                    disabled={!employeeName.trim() || (isClientTestDrive && !clientName.trim())}
                  >
                    <Play className="h-5 w-5 mr-2" />
                    🚗 Take Car Now - Start Real Time
                  </Button>
                </div>

                {/* Alternative: Schedule for Later */}
                <div className="text-center">
                  <Button 
                    onClick={handleStartTestDrive}
                    variant="outline"
                    className="text-sm"
                    disabled={!employeeName.trim() || (isClientTestDrive && !clientName.trim())}
                  >
                    Or Schedule Test Drive
                  </Button>
                </div>
              </div>

              {/* Real-Time Info Box */}
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-yellow-700">
                  <Timer className="h-4 w-4" />
                  <span>
                    <strong>Real-Time Tracking:</strong> When you click "Take Car Now", the system will capture the exact timestamp and start duration tracking automatically.
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SimpleTestDriveDialog; 