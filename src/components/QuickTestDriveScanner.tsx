import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Scan, Car, User, Briefcase, Play } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface QuickTestDriveScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTestDrive: (vinNumber: string, testDriveData: any) => void;
  cars: any[]; // Array of all cars to find by VIN
}

const QuickTestDriveScanner: React.FC<QuickTestDriveScannerProps> = ({
  isOpen,
  onClose,
  onStartTestDrive,
  cars
}) => {
  const { user } = useAuth();
  const [vinNumber, setVinNumber] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [clientName, setClientName] = useState('');
  const [isClientTestDrive, setIsClientTestDrive] = useState(false);

  const handleScan = () => {
    // Simulate camera scanning - in real implementation, this would use device camera
    toast({
      title: "Camera Not Available",
      description: "Please enter VIN manually. Camera scanning will be available in mobile app.",
      variant: "default"
    });
  };

  const handleStartTestDrive = () => {
    if (!vinNumber.trim()) {
      toast({
        title: "VIN Required",
        description: "Please enter or scan the vehicle VIN.",
        variant: "destructive"
      });
      return;
    }

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

    // Find the car by VIN
    const car = cars.find(c => 
      c.vinNumber?.toLowerCase() === vinNumber.toLowerCase() || 
      c.vin?.toLowerCase() === vinNumber.toLowerCase()
    );

    if (!car) {
      toast({
        title: "Vehicle Not Found",
        description: "No vehicle found with this VIN in the inventory.",
        variant: "destructive"
      });
      return;
    }

    if (car.status === 'sold' || car.status === 'reserved') {
      toast({
        title: "Vehicle Unavailable",
        description: "This vehicle is not available for test drives.",
        variant: "destructive"
      });
      return;
    }

    if (car.testDriveInfo?.isOnTestDrive) {
      toast({
        title: "Already on Test Drive",
        description: "This vehicle is currently on a test drive.",
        variant: "destructive"
      });
      return;
    }

    const testDriveData = {
      isOnTestDrive: true,
      testDriveStartTime: new Date().toISOString(),
      employeeName: employeeName.trim(),
      clientName: isClientTestDrive ? clientName.trim() : null,
      isClientTestDrive,
      loggedBy: user?.email || 'Unknown',
      loggedAt: new Date().toISOString(),
      vehicleVin: car.vinNumber || car.vin,
      vehicleModel: car.model
    };

    onStartTestDrive(vinNumber, testDriveData);

    toast({
      title: "Test Drive Started",
      description: `${isClientTestDrive ? 'Client' : 'Employee'} test drive started for ${car.model}`,
    });

    // Reset form
    setVinNumber('');
    setEmployeeName('');
    setClientName('');
    setIsClientTestDrive(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5 text-blue-600" />
            Quick Test Drive Scanner
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* VIN Input */}
          <div className="space-y-2">
            <Label htmlFor="vin">Vehicle VIN *</Label>
            <div className="flex gap-2">
              <Input
                id="vin"
                value={vinNumber}
                onChange={(e) => setVinNumber(e.target.value.toUpperCase())}
                placeholder="Enter or scan VIN"
                className="font-mono"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleScan}
                className="px-3"
                title="Scan VIN with camera"
              >
                <Scan className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Test Drive Type Selection */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={!isClientTestDrive ? "default" : "outline"}
              onClick={() => setIsClientTestDrive(false)}
              className="flex-1"
            >
              <Briefcase className="h-4 w-4 mr-2" />
              Employee Test Drive
            </Button>
            <Button
              type="button"
              variant={isClientTestDrive ? "default" : "outline"}
              onClick={() => setIsClientTestDrive(true)}
              className="flex-1"
            >
              <User className="h-4 w-4 mr-2" />
              Client Test Drive
            </Button>
          </div>

          {/* Employee Name */}
          <div>
            <Label htmlFor="employee">Employee Name *</Label>
            <Input
              id="employee"
              value={employeeName}
              onChange={(e) => setEmployeeName(e.target.value)}
              placeholder="Enter employee name"
              className="mt-1"
            />
          </div>

          {/* Client Name (if client test drive) */}
          {isClientTestDrive && (
            <div>
              <Label htmlFor="client">Client Name *</Label>
              <Input
                id="client"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Enter client name"
                className="mt-1"
              />
            </div>
          )}

          {/* Start Button */}
          <Button 
            onClick={handleStartTestDrive}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            <Play className="h-4 w-4 mr-2" />
            Start Test Drive
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuickTestDriveScanner; 