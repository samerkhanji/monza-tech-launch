import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Clock, User, Phone, Car, Briefcase, Eye, UserCheck, Shield, AlertTriangle, Calendar, MapPin, FileText, Activity } from 'lucide-react';
import { TestDriveInfo } from '../types';
import { format } from 'date-fns';

interface TestDriveStatusProps {
  testDriveInfo: TestDriveInfo;
  onEndTestDrive: () => void;
}

const TestDriveStatus: React.FC<TestDriveStatusProps> = ({ 
  testDriveInfo, 
  onEndTestDrive 
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second for real-time display
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Calculate time elapsed and remaining
  const startTime = testDriveInfo.testDriveStartTime ? new Date(testDriveInfo.testDriveStartTime) : new Date();
  const expectedDuration = testDriveInfo.testDriveDuration || 30; // Default 30 minutes
  const expectedEndTime = new Date(startTime.getTime() + expectedDuration * 60000);
  
  const elapsedMs = currentTime.getTime() - startTime.getTime();
  const elapsedMinutes = Math.floor(elapsedMs / 60000);
  const elapsedSeconds = Math.floor((elapsedMs % 60000) / 1000);
  
  const remainingMs = expectedEndTime.getTime() - currentTime.getTime();
  const isOverdue = remainingMs < 0;
  const overdueMs = Math.abs(remainingMs);
  const overdueMinutes = Math.floor(overdueMs / 60000);
  const overdueSeconds = Math.floor((overdueMs % 60000) / 1000);

  const formatTime = (minutes: number, seconds: number, showSign: boolean = false) => {
    const sign = showSign && isOverdue ? '+' : '';
    return `${sign}${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  return (
    <>
      {/* Compact Badge for Table */}
      <div className="flex items-center gap-2">
        <Badge 
          variant={isOverdue ? "destructive" : "default"} 
          className={`flex items-center gap-1 text-xs cursor-pointer hover:opacity-80 ${
            isOverdue ? 'bg-red-100 text-red-800 border-red-300' : 'bg-blue-100 text-blue-800 border-blue-300'
          }`}
          onClick={() => setShowDetails(true)}
        >
          {testDriveInfo.isClientTestDrive ? (
            <User className="h-3 w-3" />
          ) : (
            <Briefcase className="h-3 w-3" />
          )}
          {testDriveInfo.isClientTestDrive ? 'Client' : 'Employee'} Test Drive
          {isOverdue && <AlertTriangle className="h-3 w-3 ml-1" />}
        </Badge>
      </div>

      {/* Enhanced Test Drive Status Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-orange-600" />
              {testDriveInfo.isClientTestDrive ? 'Client' : 'Employee'} Test Drive In Progress
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Status Header with Timer */}
            <Card className={`border-2 ${isOverdue ? 'border-red-300 bg-red-50' : 'border-blue-300 bg-blue-50'}`}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    <span>Test Drive Status</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isOverdue && (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        OVERDUE
                      </Badge>
                    )}
                    <Button 
                      size="sm" 
                      variant={isOverdue ? "destructive" : "default"}
                      onClick={() => {
                        onEndTestDrive();
                        setShowDetails(false);
                      }}
                    >
                      End Test Drive
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Briefcase className="h-4 w-4 text-gray-600" />
                      <span className="font-medium">
                        {testDriveInfo.isClientTestDrive ? 'Client Test Drive' : 'Employee Test Drive'}
                      </span>
                    </div>
                  </div>
                  <div>
                    {isOverdue && (
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <span className="font-medium text-red-600">OVERDUE</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-gray-600" />
                    <span className="font-medium">
                      Time Remaining: {isOverdue ? 'OVERDUE:' : ''} 
                      <span className={`ml-2 font-mono text-lg ${isOverdue ? 'text-red-600' : 'text-blue-600'}`}>
                        {isOverdue 
                          ? formatTime(overdueMinutes, overdueSeconds, true)
                          : formatTime(Math.floor(Math.abs(remainingMs) / 60000), Math.floor((Math.abs(remainingMs) % 60000) / 1000))
                        }
                      </span>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mt-4">
                    <div>
                      <span className="font-medium">Started:</span>
                      <div>{format(startTime, 'MMMM do, yyyy h:mm a')}</div>
                    </div>
                    <div>
                      <span className="font-medium">Expected End:</span>
                      <div>{format(expectedEndTime, 'MMMM do, yyyy h:mm a')}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Driver Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-gray-600" />
                  Driver Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Name</p>
                        <p className="font-medium">
                          {testDriveInfo.testDriverName || 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Shield className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">License Number</p>
                        <p className="font-medium font-mono">
                          {testDriveInfo.testDriverLicense || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="font-medium">
                          {testDriveInfo.testDriverPhone || 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Duration</p>
                        <p className="font-medium">{expectedDuration} minutes</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Test Drive Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5 text-gray-600" />
                  Test Drive Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Purpose</p>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p>{testDriveInfo.purpose || 'General test drive'}</p>
                    </div>
                  </div>

                  {testDriveInfo.notes && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Notes</p>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm">{testDriveInfo.notes}</p>
                      </div>
                    </div>
                  )}

                  {(testDriveInfo.vehicleModel || testDriveInfo.vehicleVin) && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Vehicle Information</p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {testDriveInfo.vehicleModel && (
                          <div>
                            <span className="text-gray-500">Model:</span>
                            <span className="ml-2 font-medium">{testDriveInfo.vehicleModel}</span>
                          </div>
                        )}
                        {testDriveInfo.vehicleVin && (
                          <div>
                            <span className="text-gray-500">VIN:</span>
                            <span className="ml-2 font-mono text-xs">{testDriveInfo.vehicleVin}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Activity Tracking */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700">
                  <Activity className="h-5 w-5" />
                  Activity Tracking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="font-medium text-sm">Logged by</p>
                        <p className="text-sm text-gray-600">
                          {testDriveInfo.loggedBy || 'System'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">Start Time</p>
                      <p className="text-sm text-gray-600">
                        {format(startTime, 'h:mm a')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-orange-600" />
                      <div>
                        <p className="font-medium text-sm">Elapsed Time</p>
                        <p className="text-sm font-mono text-orange-600">
                          {formatTime(elapsedMinutes, elapsedSeconds)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">Status</p>
                      <Badge variant={isOverdue ? "destructive" : "default"} className="text-xs">
                        {isOverdue ? 'Overdue' : 'In Progress'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TestDriveStatus;
