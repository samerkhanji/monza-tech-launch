import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  User,
  Phone,
  Mail,
  Car,
  Calendar,
  CreditCard,
  MapPin,
  FileText
} from 'lucide-react';

interface GarageCar {
  id: string;
  model: string;
  vinNumber?: string;
  color: string;
  status: 'in_stock' | 'sold' | 'reserved';
  clientName?: string;
  clientPhone?: string;
  clientEmail?: string;
  reservedDate?: string;
  soldDate?: string;
  pickupDate?: string;
  licensePlate?: string;
  year?: number;
  brand?: string;
  notes?: string;
  garageLocation?: string;
  [key: string]: any;
}

interface ClientInfoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  car: GarageCar;
}

const ClientInfoDialog: React.FC<ClientInfoDialogProps> = ({
  isOpen,
  onClose,
  car
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sold': return 'bg-green-100 text-green-800 border-green-200';
      case 'reserved': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5 text-blue-600" />
            Client Information - {car.model}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Car Status */}
          <div className="flex items-center justify-between">
            <Badge variant="outline" className={`${getStatusColor(car.status)} text-lg px-4 py-2`}>
              {car.status === 'sold' ? 'SOLD' : 'RESERVED'}
            </Badge>
            <div className="text-sm text-gray-600">
              {car.status === 'sold' ? `Sold on ${formatDate(car.soldDate)}` : 
               car.status === 'reserved' ? `Reserved on ${formatDate(car.reservedDate)}` : ''}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Client Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5 text-blue-600" />
                  Client Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium">{car.clientName || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Phone Number</p>
                    <p className="font-medium">{car.clientPhone || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{car.clientEmail || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <CreditCard className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">License Plate</p>
                    <p className="font-medium">{car.licensePlate || 'Not assigned'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Vehicle Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Car className="h-5 w-5 text-green-600" />
                  Vehicle Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Car className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Model</p>
                    <p className="font-medium">{car.model}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">VIN Number</p>
                    <p className="font-medium font-mono text-sm">{car.vinNumber || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Year</p>
                    <p className="font-medium">{car.year || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border-2`} 
                       style={{backgroundColor: car.color?.toLowerCase() || '#gray'}}></div>
                  <div>
                    <p className="text-sm text-gray-600">Color</p>
                    <p className="font-medium">{car.color}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Current Location</p>
                    <p className="font-medium">{car.garageLocation || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Notes */}
          {car.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-purple-600" />
                  Additional Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{car.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Transaction Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5 text-orange-600" />
                Transaction Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">
                    {car.status === 'sold' ? 'Sale Date' : 'Reservation Date'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {car.status === 'sold' ? 'Vehicle was sold to client' : 'Vehicle was reserved by client'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {car.status === 'sold' ? formatDate(car.soldDate) : formatDate(car.reservedDate)}
                  </p>
                </div>
              </div>
              
              {/* Pickup Date for Reserved Cars */}
              {car.status === 'reserved' && (
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div>
                    <p className="font-medium text-blue-800">Scheduled Pickup Date</p>
                    <p className="text-sm text-blue-600">
                      Client scheduled to pick up vehicle
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-blue-800">
                      {formatDate(car.pickupDate)}
                    </p>
                    {car.pickupDate && new Date(car.pickupDate) < new Date() && (
                      <p className="text-xs text-red-600">Overdue</p>
                    )}
                    {car.pickupDate && new Date(car.pickupDate).toDateString() === new Date().toDateString() && (
                      <p className="text-xs text-orange-600">Today</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClientInfoDialog; 