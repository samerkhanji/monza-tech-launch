
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Camera, Smartphone, QrCode } from 'lucide-react';

const VINInstructions: React.FC = () => {
  return (
    <div className="mt-8 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            VIN Scanning Instructions
          </CardTitle>
          <CardDescription>
            Follow these guidelines for accurate VIN scanning and inventory tracking
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Camera Scanning Tips
              </h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Ensure good lighting when scanning</li>
                <li>• Hold camera steady and close to VIN</li>
                <li>• VIN should be clearly visible in frame</li>
                <li>• Wait for automatic detection or capture photo</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <QrCode className="h-4 w-4" />
                VIN Format Requirements
              </h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Must be exactly 17 characters</li>
                <li>• Contains letters and numbers only</li>
                <li>• Excludes letters I, O, and Q</li>
                <li>• Example: 1HGBH41JXMN109186</li>
              </ul>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Inventory Integration</h4>
            <p className="text-sm text-muted-foreground">
              When you scan a VIN, the system will:
            </p>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1">
              <li>• Check existing inventory for the vehicle</li>
              <li>• Show current status if car already exists</li>
              <li>• Create new arrival record for unknown VINs</li>
              <li>• Allow you to route the vehicle to appropriate destination</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VINInstructions;
