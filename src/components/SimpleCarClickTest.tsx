import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface SimpleCarClickTestProps {
  isOpen: boolean;
  onClose: () => void;
  car: any;
}

const SimpleCarClickTest: React.FC<SimpleCarClickTestProps> = ({
  isOpen,
  onClose,
  car
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>🧪 Car Click Test</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <h3 className="font-bold">SUCCESS! Car clicking is working!</h3>
            <p className="text-sm text-gray-600">The click handler successfully triggered this dialog.</p>
          </div>
          
          {car && (
            <div>
              <h4 className="font-medium">Car Data Received:</h4>
              <div className="bg-gray-100 p-3 rounded text-sm">
                <p><strong>VIN:</strong> {car.vinNumber || car.vin || 'N/A'}</p>
                <p><strong>Model:</strong> {car.model || 'N/A'}</p>
                <p><strong>Year:</strong> {car.year || 'N/A'}</p>
                <p><strong>Status:</strong> {car.status || 'N/A'}</p>
              </div>
            </div>
          )}
          
          <div className="text-xs text-gray-500">
            <p>If you see this dialog, the car clicking functionality is working correctly!</p>
            <p>We can now replace this with the full CarHistoryDetailsDialog.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SimpleCarClickTest;
