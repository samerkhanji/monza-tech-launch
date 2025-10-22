import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface CarHistoryDetailsDialogSimpleProps {
  isOpen: boolean;
  onClose: () => void;
  car: any;
}

const CarHistoryDetailsDialogSimple: React.FC<CarHistoryDetailsDialogSimpleProps> = ({
  isOpen,
  onClose,
  car
}) => {
  if (!car) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Car History</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <p>No car data available</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            🚗 Car History - {car.model} ({car.vinNumber})
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">VIN:</span>
                  <p className="font-mono">{car.vinNumber || car.vin || 'N/A'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Model:</span>
                  <p>{car.model || 'N/A'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Brand:</span>
                  <p>{car.brand || 'N/A'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Year:</span>
                  <p>{car.year || 'N/A'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Color:</span>
                  <p>{car.color || 'N/A'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Status:</span>
                  <Badge className="bg-blue-100 text-blue-800">
                    {car.status || 'Unknown'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Current Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Price:</span>
                  <span className="font-bold text-green-600">
                    ${car.sellingPrice?.toLocaleString() || car.price?.toLocaleString() || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Battery:</span>
                  <span>{car.batteryPercentage || 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Range:</span>
                  <span>{car.range || 0} km</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-center p-4 bg-green-50 rounded-lg">
            <h3 className="font-bold text-green-800">✅ SUCCESS!</h3>
            <p className="text-green-600">Car clicking is working correctly!</p>
            <p className="text-sm text-gray-600 mt-2">
              This is a simplified version of the car history dialog. 
              The full version with tabs will be available once this basic functionality is confirmed.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CarHistoryDetailsDialogSimple;
