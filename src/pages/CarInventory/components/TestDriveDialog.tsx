import React, { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Car } from '../types';
import { User, Briefcase, Clock, Car as CarIcon, UserCheck, Shield } from 'lucide-react';
import '@/styles/car-status-dialog-scrollbar.css';

// Safe auth hook that doesn't crash if AuthProvider is not available
const useSafeAuth = () => {
  try {
    const { useAuth } = require('@/contexts/AuthContext');
    return useAuth();
  } catch {
    return { user: null };
  }
};

interface TestDriveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  car: Car | null;
  onScheduleTestDrive: (carId: string, testDriveInfo: any) => void;
  isClientTestDrive?: boolean;
}

const TestDriveDialog: React.FC<TestDriveDialogProps> = ({
  isOpen,
  onClose,
  car,
  onScheduleTestDrive,
  isClientTestDrive = false
}) => {
  // Always call the hook at the top level
  const authResult = useSafeAuth();
  const { user } = authResult;
  const [testDriverName, setTestDriverName] = useState('');
  const [testDriverPhone, setTestDriverPhone] = useState('');
  const [testDriverLicense, setTestDriverLicense] = useState('');
  const [startTime, setStartTime] = useState(() => {
    // Default to current time + 5 minutes for scheduling
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5);
    return now.toISOString().slice(0, 16); // Format for datetime-local input
  });
  const [isRealTimeStart, setIsRealTimeStart] = useState(false);
  const [notes, setNotes] = useState('');
  const [purpose, setPurpose] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');

  const employeePurposes = [
    'Post-repair verification',
    'PDI quality check',
    'Customer delivery preparation',
    'Technical inspection',
    'Performance testing',
    'Battery/charging system test',
    'Brake system verification',
    'General maintenance check',
    'Pre-sale inspection',
    'Other'
  ];

  const handleSchedule = () => {
    if (!car) return;

    if (!testDriverName || !testDriverPhone || !testDriverLicense) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    if (!isClientTestDrive && !purpose) {
      toast({
        title: "Purpose Required",
        description: "Please select the purpose for this employee test drive.",
        variant: "destructive"
      });
      return;
    }

    // Use real-time timestamp if immediate start, otherwise use scheduled time
    const actualStartTime = isRealTimeStart ? new Date() : new Date(startTime);

    const testDriveInfo = {
      isOnTestDrive: true,
      testDriveStartTime: actualStartTime.toISOString(),
      actualStartTime: isRealTimeStart ? actualStartTime.toISOString() : null,
      scheduledStartTime: isRealTimeStart ? null : actualStartTime.toISOString(),
      testDriverName,
      testDriverPhone,
      testDriverLicense,
      notes,
      purpose: !isClientTestDrive ? purpose : 'Customer test drive',
      isClientTestDrive,
      startMethod: isRealTimeStart ? 'immediate' : 'scheduled',
      realTimeCapture: isRealTimeStart,
      // Activity tracking fields
      loggedBy: user?.email || 'System',
      loggedByName: (user as any)?.user_metadata?.full_name || user?.email || 'System User',
      loggedAt: new Date().toISOString(),
      emergencyContact,
      emergencyContactPhone,
      // Additional tracking
      vehicleVin: car.vinNumber,
      vehicleModel: car.model
    };

    onScheduleTestDrive(car.id, testDriveInfo);
    
    const actionText = isRealTimeStart ? 'started immediately' : 'scheduled';
    const timeText = isRealTimeStart ? 
      `at ${actualStartTime.toLocaleTimeString()}` : 
      `for ${actualStartTime.toLocaleString()}`;
    
    toast({
      title: `Test Drive ${isRealTimeStart ? 'Started' : 'Scheduled'}`,
      description: `${isClientTestDrive ? 'Client' : 'Employee'} test drive ${actionText} for ${car.model} with ${testDriverName} ${timeText}`,
      duration: 5000,
    });

    onClose();
    
    // Reset form
    setTestDriverName('');
    setTestDriverPhone('');
    setTestDriverLicense('');
    setStartTime(() => {
      const now = new Date();
      now.setMinutes(now.getMinutes() + 5);
      return now.toISOString().slice(0, 16);
    });
    setNotes('');
    setPurpose('');
    setEmergencyContact('');
    setEmergencyContactPhone('');
    setIsRealTimeStart(false);
  };

  const handleTakeCarNow = () => {
    setIsRealTimeStart(true);
    handleSchedule();
  };

  if (!car) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-[600px] w-[95vw] bg-white car-status-dialog flex flex-col" 
        overlayClassName="bg-black/30 backdrop-blur-0"
        style={{ 
          height: '85vh',
          maxHeight: '85vh'
        }}
      >
        <DialogHeader className="flex-shrink-0 border-b border-gray-200 pb-4">
          <DialogTitle className="text-center text-lg font-semibold">
            Schedule {isClientTestDrive ? 'Client' : 'Employee'} Test Drive
          </DialogTitle>
        </DialogHeader>
        
        {/* SCROLLABLE CONTENT AREA */}
        <div 
          className="flex-1 overflow-y-scroll pr-2 car-status-dialog" 
          style={{ 
            height: 'calc(85vh - 200px)',
            minHeight: '400px',
            scrollbarWidth: 'auto',
            scrollbarColor: '#ffd700 #f8fafc'
          }}
        >
          <div className="space-y-6 mt-4 pb-8" style={{ minHeight: '600px', paddingRight: '8px' }}>
          {/* Vehicle Information */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CarIcon className="h-4 w-4 text-gray-600" />
              <span className="font-medium text-gray-900">Vehicle Information</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">VIN:</span> {car.vinNumber}
              </div>
              <div>
                <span className="font-medium">Model:</span> {car.model} ({car.year})
              </div>
              <div>
                <span className="font-medium">Color:</span> {car.color}
              </div>
              {car.batteryPercentage && (
                <div>
                  <span className="font-medium">Battery:</span> {car.batteryPercentage}%
                </div>
              )}
            </div>
          </div>

          {/* Test Drive Type Badge */}
          <div className="flex justify-center">
            <Badge 
              variant={isClientTestDrive ? "default" : "outline"} 
              className={`px-4 py-2 text-sm ${
                isClientTestDrive 
                  ? 'bg-blue-100 text-blue-800 border-blue-300' 
                  : 'bg-orange-100 text-orange-800 border-orange-300'
              }`}
            >
              {isClientTestDrive ? (
                <>
                  <User className="h-4 w-4 mr-2" />
                  Client Test Drive
                </>
              ) : (
                <>
                  <Briefcase className="h-4 w-4 mr-2" />
                  Employee Test Drive
                </>
              )}
            </Badge>
          </div>

          {/* Logged By Information */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <UserCheck className="h-4 w-4 text-blue-600" />
                Test Drive Logged By
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">{(user as any)?.user_metadata?.full_name || user?.email || 'System User'}</p>
                  <p className="text-sm text-blue-700">{user?.email || 'System access'}</p>
                  <p className="text-xs text-blue-600">Logged on {new Date().toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Purpose Selection (Employee Only) */}
          {!isClientTestDrive && (
            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose/Reason *</Label>
              <Select value={purpose} onValueChange={setPurpose}>
                <SelectTrigger id="purpose">
                  <SelectValue placeholder="Select the purpose for this test drive" />
                </SelectTrigger>
                <SelectContent>
                  {employeePurposes.map((purposeOption) => (
                    <SelectItem key={purposeOption} value={purposeOption}>
                      {purposeOption}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Driver Information */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">
              {isClientTestDrive ? 'Client' : 'Employee'} Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="driverName">{isClientTestDrive ? 'Client' : 'Employee'} Name *</Label>
                <Input
                  id="driverName"
                  value={testDriverName}
                  onChange={(e) => setTestDriverName(e.target.value)}
                  placeholder={`Enter ${isClientTestDrive ? 'client' : 'employee'}'s full name`}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="driverPhone">Phone Number</Label>
                <Input
                  id="driverPhone"
                  value={testDriverPhone}
                  onChange={(e) => setTestDriverPhone(e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="driverLicense">Driver License Number *</Label>
              <Input
                id="driverLicense"
                value={testDriverLicense}
                onChange={(e) => setTestDriverLicense(e.target.value)}
                placeholder="Enter driver's license number"
              />
            </div>

            {/* Emergency Contact Information (Client Test Drives Only) */}
            {isClientTestDrive && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-3">Emergency Contact Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContact">Emergency Contact Name</Label>
                    <Input
                      id="emergencyContact"
                      placeholder="Enter emergency contact name"
                      value={emergencyContact}
                      onChange={(e) => setEmergencyContact(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContactPhone">Emergency Contact Phone</Label>
                    <Input
                      id="emergencyContactPhone"
                      placeholder="Enter emergency contact phone"
                      value={emergencyContactPhone}
                      onChange={(e) => setEmergencyContactPhone(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Test Drive Details */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Test Drive Details</h3>
            
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

            {/* Ready to Start Section */}
            <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border-2 border-green-300">
              <div className="text-center mb-3">
                <div className="text-lg font-bold text-green-800">Ready to Start Test Drive Now?</div>
                <div className="text-sm text-gray-600">Real-time timestamp will be captured instantly</div>
              </div>
              
              <Button 
                onClick={handleTakeCarNow}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-4 text-lg font-semibold"
                disabled={!testDriverName || !testDriverPhone || !testDriverLicense || (!isClientTestDrive && !purpose)}
              >
                <Clock className="h-5 w-5 mr-2" />
                🚗 Take Car Now - Real Time Start
              </Button>
            </div>

            {/* Alternative: Schedule for Later */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-center mb-3">
                <div className="text-base font-semibold text-gray-700">Or Schedule for Later</div>
                <div className="text-sm text-gray-600">Set a specific start time</div>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Scheduled Start Time</Label>
                  <Input
                    id="startTime"
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="test-drive-dialog cursor-pointer"
                  />
                  <p className="text-xs text-gray-500">
                    Scheduled for: {new Date(startTime).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-yellow-700">
                <Clock className="h-4 w-4" />
                <span>
                  <strong>Duration Tracking:</strong> The system automatically calculates actual duration regardless of start method (immediate or scheduled).
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  isClientTestDrive 
                    ? "Any special requirements or notes for the client..."
                    : "Specific areas to test or inspect during the drive..."
                }
                rows={3}
              />
            </div>
          </div>

                    {/* Important Reminders */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Clock className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Important Reminders:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Verify vehicle has sufficient fuel/battery charge</li>
                  <li>• Check driver's license validity before departure</li>
                  {isClientTestDrive ? (
                    <>
                      <li>• Record client information for sales follow-up</li>
                      <li>• Explain vehicle features during the drive</li>
                    </>
                  ) : (
                    <>
                      <li>• Focus on the specific inspection purpose</li>
                      <li>• Document any issues or findings</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Additional Safety Notes */}
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-sm text-red-800">
              <p className="font-medium mb-2">🔒 Safety Requirements:</p>
              <ul className="space-y-1 text-xs">
                <li>• Driver must be 21+ years old with valid license</li>
                <li>• Vehicle inspection must be completed before test drive</li>
                <li>• Insurance verification required for client test drives</li>
                <li>• Emergency contact information is mandatory</li>
                <li>• Test drive route must stay within designated areas</li>
                <li>• Maximum duration: 60 minutes for clients, 30 minutes for employees</li>
              </ul>
            </div>
          </div>

          {/* Legal Disclaimers */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="text-xs text-gray-600">
              <p className="font-medium mb-2">📋 Legal & Insurance Notes:</p>
              <ul className="space-y-1">
                <li>• Test driver assumes full responsibility during test drive period</li>
                <li>• Any damages during test drive will be charged to the driver</li>
                <li>• Dealership insurance covers liability only</li>
                <li>• GPS tracking is active during all test drives</li>
                <li>• By proceeding, driver agrees to all terms and conditions</li>
              </ul>
            </div>
        </div>
        </div>
        </div>

        <DialogFooter className="flex gap-3 mt-6 flex-shrink-0 border-t border-gray-200 pt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button 
            onClick={() => {
              setIsRealTimeStart(false);
              handleSchedule();
            }}
            className="flex-1 bg-monza-yellow text-monza-black hover:bg-monza-yellow/90 font-semibold"
            disabled={!testDriverName || !testDriverPhone || !testDriverLicense || (!isClientTestDrive && !purpose)}
          >
            Schedule Test Drive
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TestDriveDialog;
