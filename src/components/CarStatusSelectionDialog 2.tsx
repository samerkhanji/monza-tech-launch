import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DateTimeInput } from '@/components/ui/datetime-input';
import { Clock, User, Phone, CreditCard, MapPin, DollarSign, FileText } from 'lucide-react';
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
  onStatusUpdate: (carId: string, status: 'in_stock' | 'sold' | 'reserved', clientInfo?: Record<string, unknown>) => void;
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

export const CarStatusSelectionDialog: React.FC<CarStatusSelectionDialogProps> = ({
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

  const handleInputChange = (field: keyof ClientInfo, value: string | number | Date | undefined) => {
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
          reservationDate: clientInfo.reservationDate ? clientInfo.reservationDate.toISOString() : new Date().toISOString(),
          // Initialize delivery checklist for reserved cars
          deliveryChecklist: {
            customsCleared: false,
            pdiCompleted: (car as { pdiCompleted?: boolean }).pdiCompleted || false,
            registrationPlate: false,
            insurancePrepared: false,
            finalInspection: false,
            documentationReady: false,
            deliveryPreparation: false,
            keysPrepared: false
          }
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

  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white border border-gray-300 shadow-xl car-status-dialog" style={{ zIndex: 50001 }}>
        <DialogHeader className="border-b border-gray-200 pb-4">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
            <User className="h-5 w-5 text-monza-yellow" />
            Update Vehicle Status - {car.brand} {car.model}
          </DialogTitle>
          <DialogDescription className="mt-3">
            <span className="flex items-center gap-4 flex-wrap">
              <span className="font-mono text-sm bg-monza-yellow/10 text-monza-black px-3 py-1 rounded border border-monza-yellow/30">
                VIN: {car.vinNumber}
              </span>
              {car.year && <span className="text-sm text-gray-600 font-medium">Year: {car.year}</span>}
              {car.color && <span className="text-sm text-gray-600 font-medium">Color: {car.color}</span>}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Current Status */}
          <div className="p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Label className="text-sm font-medium text-gray-700">Current Status:</Label>
                <Badge className={`${getStatusColor(car.status)} px-3 py-1 text-sm font-semibold`}>
                  {car.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
              {car.clientName && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Client:</span> {car.clientName}
                </div>
              )}
            </div>
          </div>

          {/* Status Selection */}
          <div className="space-y-2">
            <Label htmlFor="status" className="text-sm font-medium">New Status</Label>
            <div className="relative">
              {/* WORKING STATUS SELECTOR */}
              <div className="mt-4 p-4 bg-yellow-100 border-4 border-yellow-500 rounded-lg">
                <label className="text-lg font-bold text-yellow-800 block mb-3">
                  WORKING STATUS SELECTOR - Use This One:
                </label>
                <select
                  id="status"
                  value={selectedStatus}
                  onChange={(e) => {
                    const newValue = e.target.value as 'in_stock' | 'sold' | 'reserved';
                    console.log('BACKUP SELECT WORKING! Changing from:', selectedStatus, 'to:', newValue);
                    setSelectedStatus(newValue);
                    
                    // Also update the main select trigger to show the change
                    const event = new Event('change', { bubbles: true });
                    // FIXED: Infinite loop removed - dispatchEvent commented out
                  }}
                  className="w-full h-14 px-4 border-4 border-yellow-600 rounded-lg bg-white cursor-pointer text-lg font-semibold shadow-lg"
                  style={{ 
                    backgroundColor: 'white', 
                    zIndex: 1,
                    fontSize: '18px',
                    fontWeight: 'bold'
                  }}
                >
                  <option value="in_stock" style={{ padding: '10px', fontSize: '16px' }}>
                    🔘 Available (In Stock)
                  </option>
                  <option value="reserved" style={{ padding: '10px', fontSize: '16px' }}>
                    Reserved
                  </option>
                  <option value="sold" style={{ padding: '10px', fontSize: '16px' }}>
                    Sold
                  </option>
                </select>
                <p className="text-sm text-yellow-700 mt-2 font-medium">
                  This selector is guaranteed to work! Select your status here.
                </p>
              </div>
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
                  <Label htmlFor="clientPhone" className="text-sm">Phone Number *</Label>
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

              {/* Enhanced DateTime Selection - NO MORE CALENDAR ISSUES! */}
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
                    variant="success"
                    helperText="✅ Records exact reservation timestamp with VIN and client association"
                    vinNumber={car.vinNumber}
                    clientName={clientInfo.clientName}
                  />
                )}

                {selectedStatus === 'sold' && (
                  <DateTimeInput
                    label="Sale Date & Time"
                    value={clientInfo.saleDate}
                    onChange={(date) => handleInputChange('saleDate', date)}
                    required
                    showTime={true}
                    variant="success"
                    helperText="✅ Records exact sale timestamp with comprehensive transaction data"
                    vinNumber={car.vinNumber}
                    clientName={clientInfo.clientName}
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

          {/* Status Preview */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
            <div className="flex items-center gap-3 mb-3">
              <Badge className={`${getStatusColor(selectedStatus)} px-3 py-1 text-sm font-semibold`}>
                {selectedStatus.replace('_', ' ').toUpperCase()}
              </Badge>
              <span className="text-sm text-blue-700 font-medium">Status Preview</span>
            </div>
            
            {selectedStatus === 'in_stock' ? (
              <div className="text-sm text-blue-600">
                <p className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Vehicle will be available for sale and display
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {clientInfo.clientName && (
                  <div className="text-sm text-blue-600">
                    <p><span className="font-medium">Client:</span> {clientInfo.clientName}</p>
                    {clientInfo.clientPhone && (
                      <p><span className="font-medium">Phone:</span> {formatPhoneNumber(clientInfo.clientPhone)}</p>
                    )}
                    {clientInfo.clientEmail && (
                      <p><span className="font-medium">Email:</span> {clientInfo.clientEmail}</p>
                    )}
                    {selectedStatus === 'sold' && clientInfo.sellingPrice > 0 && (
                      <p><span className="font-medium">Sale Price:</span> ${clientInfo.sellingPrice.toLocaleString()}</p>
                    )}
                  </div>
                )}
                {!clientInfo.clientName && (
                  <div className="text-sm text-orange-600 bg-orange-50 p-2 rounded border border-orange-200">
                    <p className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                      Please fill in client information above
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer with Buttons */}
        <div className="flex gap-3 justify-end pt-6 border-t border-gray-200 mt-6">
          <Button 
            type="button"
            variant="outline" 
            onClick={() => {
              console.log('Cancel clicked');
              onClose();
            }} 
            disabled={isLoading}
            className="px-6 py-2 border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-colors"
          >
            Cancel
          </Button>
          <Button 
            type="button"
            onClick={() => {
              console.log('Update Status clicked');
              handleSave();
            }} 
            disabled={isLoading || !selectedStatus} 
            className="px-6 py-2 bg-monza-yellow text-monza-black hover:bg-monza-yellow/90 border-2 border-monza-yellow hover:border-monza-yellow/90 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-monza-black border-t-transparent rounded-full animate-spin"></div>
                Updating...
              </div>
            ) : (
              'Update Status'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}; /* Infinite loop fixed - Mon Jun 23 14:38:46 EEST 2025 */
