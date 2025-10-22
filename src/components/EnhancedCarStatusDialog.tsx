import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { DateTimeInput } from '@/components/ui/datetime-input';
import { User, Phone, CreditCard, DollarSign } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { carClientLinkingService } from '@/services/carClientLinkingService';

interface CarStatusSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  car: {
    id: string;
    model: string;
    vinNumber: string;
    brand?: string;
    year?: number;
    color?: string;
    status: 'in_stock' | 'sold' | 'reserved';
    clientName?: string;
    clientPhone?: string;
    clientEmail?: string;
    clientLicensePlate?: string;
    sellingPrice?: number;
    reservationDate?: string;
    saleDate?: string;
    notes?: string;
  };
  onStatusUpdate: (carId: string, status: 'in_stock' | 'sold' | 'reserved', clientInfo?: any) => void;
}

interface ClientInfo {
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  clientLicensePlate: string;
  sellingPrice: number;
  reservationDate?: Date;
  saleDate?: Date;
  notes: string;
}

export const EnhancedCarStatusDialog: React.FC<CarStatusSelectionDialogProps> = ({
  isOpen,
  onClose,
  car,
  onStatusUpdate
}) => {
  const [selectedStatus, setSelectedStatus] = useState<'in_stock' | 'sold' | 'reserved'>(car.status);
  const [clientInfo, setClientInfo] = useState<ClientInfo>({
    clientName: car.clientName || '',
    clientPhone: car.clientPhone || '',
    clientEmail: car.clientEmail || '',
    clientLicensePlate: car.clientLicensePlate || '',
    sellingPrice: car.sellingPrice || 0,
    reservationDate: car.reservationDate ? new Date(car.reservationDate) : undefined,
    saleDate: car.saleDate ? new Date(car.saleDate) : undefined,
    notes: car.notes || ''
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedStatus(car.status);
      setClientInfo({
        clientName: car.clientName || '',
        clientPhone: car.clientPhone || '',
        clientEmail: car.clientEmail || '',
        clientLicensePlate: car.clientLicensePlate || '',
        sellingPrice: car.sellingPrice || 0,
        reservationDate: car.reservationDate ? new Date(car.reservationDate) : undefined,
        saleDate: car.saleDate ? new Date(car.saleDate) : undefined,
        notes: car.notes || ''
      });
    }
  }, [isOpen, car]);

  const handleInputChange = (field: keyof ClientInfo, value: any) => {
    setClientInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateClientInfo = (): boolean => {
    if (selectedStatus === 'in_stock') return true;
    
    if (selectedStatus === 'reserved' || selectedStatus === 'sold') {
      if (!clientInfo.clientName.trim()) {
        toast({
          title: "Validation Error",
          description: "Client name is required for reserved or sold vehicles.",
          variant: "destructive"
        });
        return false;
      }
      
      if (!clientInfo.clientPhone.trim()) {
        toast({
          title: "Validation Error", 
          description: "Client phone is required for reserved or sold vehicles.",
          variant: "destructive"
        });
        return false;
      }

      if (selectedStatus === 'sold' && clientInfo.sellingPrice <= 0) {
        toast({
          title: "Validation Error",
          description: "Selling price must be greater than 0 for sold vehicles.",
          variant: "destructive"
        });
        return false;
      }

      // Enhanced validation for datetime
      if (selectedStatus === 'reserved' && !clientInfo.reservationDate) {
        toast({
          title: "Validation Error",
          description: "Reservation date and time is required.",
          variant: "destructive"
        });
        return false;
      }

      if (selectedStatus === 'sold' && !clientInfo.saleDate) {
        toast({
          title: "Validation Error",
          description: "Sale date and time is required.",
          variant: "destructive"
        });
        return false;
      }
    }
    
    return true;
  };

  const handleSave = async () => {
    if (!validateClientInfo()) return;
    
    setIsLoading(true);
    
    try {
      const updateData = {
        status: selectedStatus,
        ...(selectedStatus !== 'in_stock' ? {
          clientName: clientInfo.clientName,
          clientPhone: clientInfo.clientPhone,
          clientEmail: clientInfo.clientEmail,
          clientLicensePlate: clientInfo.clientLicensePlate,
          notes: clientInfo.notes
        } : {
          clientName: '',
          clientPhone: '',
          clientEmail: '',
          clientLicensePlate: '',
          notes: clientInfo.notes
        }),
        ...(selectedStatus === 'sold' ? {
          sellingPrice: clientInfo.sellingPrice,
          saleDate: clientInfo.saleDate ? clientInfo.saleDate.toISOString() : new Date().toISOString()
        } : {}),
        ...(selectedStatus === 'reserved' ? {
          reservationDate: clientInfo.reservationDate ? clientInfo.reservationDate.toISOString() : new Date().toISOString()
        } : {}),
        lastUpdated: new Date().toISOString()
      };

      // 🔗 ENHANCED: Use CarClientLinkingService for comprehensive data recording
      if (selectedStatus !== 'in_stock') {
        carClientLinkingService.linkCarWithClient(
          car.id,
          {
            vinNumber: car.vinNumber,
            model: car.model,
            brand: car.brand,
            year: car.year,
            color: car.color,
            status: selectedStatus as 'reserved' | 'sold',
            location: 'car_inventory'
          },
          {
            clientName: clientInfo.clientName,
            clientPhone: clientInfo.clientPhone,
            clientEmail: clientInfo.clientEmail,
            clientAddress: '',
            clientLicensePlate: clientInfo.clientLicensePlate,
            sellingPrice: selectedStatus === 'sold' ? clientInfo.sellingPrice : undefined,
            saleDate: selectedStatus === 'sold' && clientInfo.saleDate ? 
              clientInfo.saleDate.toISOString() : undefined,
            reservationDate: selectedStatus === 'reserved' && clientInfo.reservationDate ? 
              clientInfo.reservationDate.toISOString() : undefined,
            notes: clientInfo.notes
          },
          'car_status_dialog'
        );
        
        // 📊 Log comprehensive data integrity
        console.log(`🎯 COMPREHENSIVE DATA RECORDED:`, {
          vin: car.vinNumber,
          client: clientInfo.clientName,
          status: selectedStatus,
          timestamp: new Date().toISOString(),
          dataIntegrity: {
            hasVin: Boolean(car.vinNumber),
            hasClient: Boolean(clientInfo.clientName),
            hasPhone: Boolean(clientInfo.clientPhone),
            hasDateTime: Boolean(clientInfo.saleDate || clientInfo.reservationDate),
            hasPrice: selectedStatus === 'sold' ? Boolean(clientInfo.sellingPrice) : true
          }
        });
      }

      await onStatusUpdate(car.id, selectedStatus, updateData);
      
      toast({
        title: "✅ Status Updated Successfully!",
        description: `${car.model} (${car.vinNumber}) status updated to ${selectedStatus.replace('_', ' ')} with complete data recording.`,
      });
      
      onClose();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update vehicle status. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sold': return 'bg-green-500 text-white';
      case 'reserved': return 'bg-blue-500 text-white';
      case 'in_stock': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white border border-gray-300 shadow-xl">
        <DialogHeader className="border-b border-gray-200 pb-4">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
            <User className="h-5 w-5 text-monza-yellow" />
            🎯 Enhanced Vehicle Status Update - {car.brand} {car.model}
          </DialogTitle>
          <DialogDescription className="mt-3">
            <span className="flex items-center gap-4 flex-wrap">
              <span className="font-mono text-sm bg-monza-yellow/10 text-monza-black px-3 py-1 rounded border border-monza-yellow/30">
                VIN: {car.vinNumber}
              </span>
              {car.year && <span className="text-sm text-gray-600 font-medium">Year: {car.year}</span>}
              {car.color && <span className="text-sm text-gray-600 font-medium">Color: {car.color}</span>}
            </span>
            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm text-blue-700 font-medium">
                ✅ Enhanced system with comprehensive datetime recording and VIN/client tracking
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Status Selection */}
          <div className="space-y-2">
            <Label htmlFor="status" className="text-sm font-medium">New Status</Label>
            <div className="p-4 bg-green-50 border-2 border-green-500 rounded-lg">
              <label className="text-lg font-bold text-green-800 block mb-3">
                🎯 Enhanced Status Selector:
              </label>
              <select
                id="status"
                value={selectedStatus}
                onChange={(e) => {
                  const newValue = e.target.value as 'in_stock' | 'sold' | 'reserved';
                  console.log('✅ Status Change:', selectedStatus, '→', newValue);
                  setSelectedStatus(newValue);
                }}
                className="w-full h-14 px-4 border-2 border-green-600 rounded-lg bg-white cursor-pointer text-lg font-semibold shadow-lg"
                style={{ 
                  backgroundColor: 'white', 
                  fontSize: '18px',
                  fontWeight: 'bold'
                }}
              >
                <option value="in_stock">🔘 Available (In Stock)</option>
                <option value="reserved">Reserved</option>
                <option value="sold">💰 Sold</option>
              </select>
              <p className="text-sm text-green-700 mt-2 font-medium">
                ✅ Status selector with enhanced data recording capabilities
              </p>
            </div>
          </div>

          {/* Client Information - Only show if reserved or sold */}
          {(selectedStatus === 'reserved' || selectedStatus === 'sold') && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-center gap-2 mb-3">
                <User className="h-4 w-4" />
                <h3 className="font-medium">Client Information</h3>
                <span className="text-red-500 text-sm">*Required</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientName" className="text-sm">Full Name *</Label>
                  <Input
                    id="clientName"
                    value={clientInfo.clientName}
                    onChange={(e) => handleInputChange('clientName', e.target.value)}
                    placeholder="Enter client full name"
                    className="border-gray-300"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clientPhone" className="text-sm">Phone Number</FormLabel>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="clientPhone"
                      value={clientInfo.clientPhone}
                      onChange={(e) => handleInputChange('clientPhone', e.target.value)}
                      placeholder="(555) 123-4567"
                      className="pl-10 border-gray-300"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clientEmail" className="text-sm">Email Address</Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    value={clientInfo.clientEmail}
                    onChange={(e) => handleInputChange('clientEmail', e.target.value)}
                    placeholder="client@example.com"
                    className="border-gray-300"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clientLicensePlate" className="text-sm">License Plate</Label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="clientLicensePlate"
                      value={clientInfo.clientLicensePlate}
                      onChange={(e) => handleInputChange('clientLicensePlate', e.target.value.toUpperCase())}
                      placeholder="ABC-1234"
                      className="pl-10 border-gray-300 uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* Selling Price - Only for sold vehicles */}
              {selectedStatus === 'sold' && (
                <div className="space-y-2">
                  <Label htmlFor="sellingPrice" className="text-sm">Selling Price *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="sellingPrice"
                      type="number"
                      value={clientInfo.sellingPrice}
                      onChange={(e) => handleInputChange('sellingPrice', Number(e.target.value))}
                      placeholder="0"
                      className="pl-10 border-gray-300"
                      min="0"
                      step="1000"
                    />
                  </div>
                </div>
              )}

              {/* Enhanced DateTime Selection */}
              <div className="space-y-4 p-4 bg-green-50 border-2 border-green-500 rounded-lg">
                <div className="text-center">
                  <h4 className="text-lg font-bold text-green-800">🎯 ENHANCED DATETIME RECORDING</h4>
                  <p className="text-sm text-green-700">Precise date & time recording with VIN/client tracking!</p>
                </div>
                
                {selectedStatus === 'reserved' && (
                  <DateTimeInput
                    label="Reservation Date & Time"
                    value={clientInfo.reservationDate}
                    onChange={(date) => handleInputChange('reservationDate', date)}
                    required
                    showTime={true}
                  />
                )}

                {selectedStatus === 'sold' && (
                  <DateTimeInput
                    label="Sale Date & Time"
                    value={clientInfo.saleDate}
                    onChange={(date) => handleInputChange('saleDate', date)}
                    required
                    showTime={true}
                  />
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm">Notes</Label>
            <Textarea
              id="notes"
              value={clientInfo.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Additional notes or comments..."
              className="border-gray-300 min-h-[80px]"
            />
          </div>
        </div>

        {/* Footer with Buttons */}
        <div className="flex gap-3 justify-end pt-6 border-t border-gray-200 mt-6">
          <Button 
            type="button"
            variant="outline" 
            onClick={onClose} 
            disabled={isLoading}
            className="px-6 py-2"
          >
            Cancel
          </Button>
          <Button 
            type="button"
            onClick={handleSave} 
            disabled={isLoading || !selectedStatus} 
            className="px-6 py-2 bg-monza-yellow text-monza-black hover:bg-monza-yellow/90 font-semibold"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-monza-black border-t-transparent rounded-full animate-spin"></div>
                Updating...
              </div>
            ) : (
              '✅ Update Status'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedCarStatusDialog; 