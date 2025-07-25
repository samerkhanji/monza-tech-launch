import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Car } from 'lucide-react';
import '@/styles/car-status-dialog-scrollbar.css';

interface CarData {
  id: string;
  vinNumber: string;
  model: string;
  year: number;
  color: string;
  price: number;
  status: 'sold' | 'reserved' | 'in_stock';
  category: 'EV' | 'REV' | 'ICEV';
  batteryPercentage: number;
  range: number;
  features?: string[];
  arrivalDate: string;
  pdiCompleted?: boolean;
  pdiTechnician?: string;
  pdiDate?: string;
  pdiNotes?: string;
  customs?: 'paid' | 'not paid';
  brand?: string;
  currentFloor?: string;
  purchasePrice?: number;
  clientName?: string;
  clientPhone?: string;
  clientLicensePlate?: string;
  expectedDeliveryDate?: string;
  notes?: string;
  horsePower?: number;
  torque?: number;
  acceleration?: string;
  topSpeed?: number;
  chargingTime?: string;
  warranty?: string;
  nextServiceDate?: string;
}

interface CarDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  car: CarData | null;
}

const CarDetailsDialog: React.FC<CarDetailsDialogProps> = ({
  isOpen,
  onClose,
  car
}) => {
  if (!car) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-4xl max-h-[80vh] bg-white border border-gray-300 shadow-xl car-status-dialog flex flex-col" 
        style={{ 
          height: '80vh'
        }}
      >
        <DialogHeader className="border-b border-gray-200 pb-4 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Vehicle Details - {car.model}
          </DialogTitle>
        </DialogHeader>

        {/* SCROLLABLE CONTENT WRAPPER */}
        <div 
          className="flex-1 overflow-y-scroll pr-2" 
          style={{ 
            height: 'calc(80vh - 120px)',
            scrollbarWidth: 'auto',
            scrollbarColor: '#ffd700 #f8fafc'
          }}
        >
          <div className="space-y-6 pt-4 pb-20" style={{ paddingRight: '10px' }}>
          {/* Vehicle Overview */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-xs text-gray-500">VIN Number</Label>
                <p className="font-mono text-sm font-medium break-all">{car.vinNumber}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Model</Label>
                <p className="font-medium">{car.model}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Brand</Label>
                <p className="font-medium">{car.brand || 'Voyah'}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Year</Label>
                <p className="font-medium">{car.year}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">Basic Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm text-gray-600">Color</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <div 
                      className="w-4 h-4 rounded-full border border-gray-300"
                      style={{ backgroundColor: car.color?.toLowerCase() }}
                    />
                    <p className="font-medium">{car.color}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Category</Label>
                  <Badge className="mt-1" variant="outline">{car.category}</Badge>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Current Location</Label>
                  <p className="font-medium mt-1">Showroom Floor 2</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Arrival Date</Label>
                  <p className="font-medium mt-1">{car.arrivalDate ? new Date(car.arrivalDate).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Technical Specifications */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">Technical Specifications</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm text-gray-600">Battery Level</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${car.batteryPercentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{car.batteryPercentage}%</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Range</Label>
                  <p className="font-medium mt-1">{car.range} km</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Horsepower</Label>
                  <p className="font-medium mt-1">{car.horsePower || 'N/A'} HP</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Torque</Label>
                  <p className="font-medium mt-1">{car.torque || 'N/A'} Nm</p>
                </div>
              </div>
            </div>

            {/* Pricing Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">Pricing Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm text-gray-600">Selling Price</Label>
                  <p className="font-bold text-lg text-green-600">${car.price.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Purchase Price</Label>
                  <p className="font-medium">${(car.purchasePrice || 0).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Features & Equipment */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">Features & Equipment</h3>
              {car.features && car.features.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {car.features.map((feature: string, index: number) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">No features listed</p>
              )}
            </div>
          </div>

          {/* Client Information (if applicable) */}
          {car.clientName && (
            <div className="space-y-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h3 className="font-semibold text-lg border-b border-amber-200 pb-2">Client Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-600">Client Name</Label>
                  <p className="font-medium">{car.clientName}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Phone Number</Label>
                  <p className="font-medium">{car.clientPhone || 'N/A'}</p>
                </div>
                {car.clientLicensePlate && (
                  <div>
                    <Label className="text-sm text-gray-600">License Plate</Label>
                    <p className="font-medium">{car.clientLicensePlate}</p>
                  </div>
                )}
                {car.expectedDeliveryDate && (
                  <div>
                    <Label className="text-sm text-gray-600">Expected Delivery</Label>
                    <p className="font-medium">{new Date(car.expectedDeliveryDate).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Performance Specifications */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Performance Specifications</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm text-gray-600">Acceleration (0-100 km/h)</Label>
                <p className="font-medium">{car.acceleration || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Top Speed</Label>
                <p className="font-medium">{car.topSpeed ? `${car.topSpeed} km/h` : 'N/A'}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Charging Time</Label>
                <p className="font-medium">{car.chargingTime || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Warranty Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Warranty & Service</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-gray-600">Warranty Period</Label>
                <p className="font-medium">{car.warranty || 'Standard warranty applies'}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Service Due</Label>
                <p className="font-medium">{car.nextServiceDate || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          {car.notes && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">Additional Notes</h3>
              <div className="bg-gray-50 border rounded-lg p-4">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{car.notes}</p>
              </div>
            </div>
          )}
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CarDetailsDialog; 