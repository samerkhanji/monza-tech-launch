import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Briefcase, Car, Clock, CheckCircle, Wrench } from 'lucide-react';

interface TestDriveSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTestDriveType: (isClientTestDrive: boolean) => void;
  carModel?: string;
  carVin?: string;
}

const TestDriveSelectionDialog: React.FC<TestDriveSelectionDialogProps> = ({
  isOpen,
  onClose,
  onSelectTestDriveType,
  carModel,
  carVin
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[95vh] overflow-y-auto">
        <DialogHeader className="sticky top-0 bg-white z-10 border-b pb-4">
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5 text-blue-600" />
            Schedule Test Drive
          </DialogTitle>
          <DialogDescription>
            {carModel && carVin ? (
              <>Choose the type of test drive for <strong>{carModel}</strong> (VIN: {carVin})</>
            ) : (
              'Choose the type of test drive for this vehicle'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4 px-1">
          {/* Client Test Drive Card */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-300">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                Client Test Drive
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600">
                For potential customers who want to experience the vehicle before making a purchase decision.
              </p>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Sales opportunity</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span>Typically 30-60 minutes</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-purple-500" />
                  <span>Customer information required</span>
                </div>
              </div>

              <Button 
                className="w-full mt-4" 
                onClick={() => onSelectTestDriveType(true)}
              >
                Schedule Client Test Drive
              </Button>
            </CardContent>
          </Card>

          {/* Employee Test Drive Card */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-orange-300">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Briefcase className="h-5 w-5 text-orange-600" />
                </div>
                Employee Test Drive
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600">
                For internal purposes such as post-repair testing, PDI verification, or quality control checks.
              </p>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Wrench className="h-4 w-4 text-orange-500" />
                  <span>Post-repair verification</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>PDI quality checks</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span>Usually 15-30 minutes</span>
                </div>
              </div>

              <Button 
                variant="outline" 
                className="w-full mt-4 border-orange-300 hover:bg-orange-50" 
                onClick={() => onSelectTestDriveType(false)}
              >
                Schedule Employee Test Drive
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-start gap-2">
            <Car className="h-4 w-4 text-gray-500 mt-0.5" />
            <div className="text-sm text-gray-600">
              <p className="font-medium mb-1">Important Notes:</p>
              <ul className="space-y-1 text-xs">
                <li>• Ensure the vehicle has sufficient fuel/battery charge</li>
                <li>• Valid driver's license is required for all test drives</li>
                <li>• Employee test drives require manager approval for luxury vehicles</li>
                <li>• Client test drives automatically create a sales lead record</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TestDriveSelectionDialog; 