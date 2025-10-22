import React, { useState, useEffect, useRef } from 'react';
import AppModal from '@/components/AppModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DateTimeInput } from '@/components/ui/datetime-input';
import { User, Phone, CreditCard, DollarSign } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { carClientLinkingService } from '@/services/carClientLinkingService';
import '@/styles/car-status-dialog-scrollbar.css';

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
  onStatusUpdate: (
    carId: string,
    status: 'in_stock' | 'sold' | 'reserved',
    clientInfo?: Record<string, unknown>
  ) => void;
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
  onStatusUpdate,
}) => {
  const dialogContentRef = useRef<HTMLDivElement | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<'in_stock' | 'sold' | 'reserved'>(car.status);
  const [clientInfo, setClientInfo] = useState<ClientInfo>({
    clientName: car.clientName || '',
    clientPhone: car.clientPhone || '',
    clientEmail: car.clientEmail || '',
    clientLicensePlate: car.clientLicensePlate || '',
    sellingPrice: car.sellingPrice || 0,
    reservationDate: car.reservationDate ? new Date(car.reservationDate) : undefined,
    saleDate: car.saleDate ? new Date(car.saleDate) : undefined,
    notes: car.notes || '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isStatusSelectOpen, setIsStatusSelectOpen] = useState(false);

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
        notes: car.notes || '',
      });
    }
  }, [isOpen, car]);

  const handleInputChange = (
    field: keyof ClientInfo,
    value: string | number | Date | undefined,
  ) => {
    setClientInfo((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateClientInfo = (): boolean => {
    if (selectedStatus === 'in_stock') return true;
    if (selectedStatus === 'reserved' || selectedStatus === 'sold') {
      if (!clientInfo.clientName.trim()) {
        toast({
          title: 'Validation Error',
          description: 'Client name is required for reserved or sold vehicles.',
          variant: 'destructive',
        });
        return false;
      }
      if (!clientInfo.clientPhone.trim()) {
        toast({
          title: 'Validation Error',
          description: 'Client phone is required for reserved or sold vehicles.',
          variant: 'destructive',
        });
        return false;
      }
      if (selectedStatus === 'sold' && clientInfo.sellingPrice <= 0) {
        toast({
          title: 'Validation Error',
          description: 'Selling price must be greater than 0 for sold vehicles.',
          variant: 'destructive',
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
        ...(selectedStatus !== 'in_stock'
          ? {
              clientName: clientInfo.clientName,
              clientPhone: clientInfo.clientPhone,
              clientEmail: clientInfo.clientEmail,
              clientLicensePlate: clientInfo.clientLicensePlate,
              notes: clientInfo.notes,
            }
          : {
              clientName: '',
              clientPhone: '',
              clientEmail: '',
              clientLicensePlate: '',
              notes: clientInfo.notes,
            }),
        ...(selectedStatus === 'sold'
          ? {
              sellingPrice: clientInfo.sellingPrice,
              saleDate: clientInfo.saleDate
                ? clientInfo.saleDate.toISOString()
                : new Date().toISOString(),
            }
          : {}),
        ...(selectedStatus === 'reserved'
          ? {
              reservationDate: clientInfo.reservationDate
                ? clientInfo.reservationDate.toISOString()
                : new Date().toISOString(),
              deliveryChecklist: {
                customsCleared: false,
                pdiCompleted: (car as { pdiCompleted?: boolean }).pdiCompleted || false,
                registrationPlate: false,
                insurancePrepared: false,
                finalInspection: false,
                documentationReady: false,
                deliveryPreparation: false,
                keysPrepared: false,
              },
            }
          : {}),
        lastUpdated: new Date().toISOString(),
      } as const;

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
            location: 'car_inventory',
          },
          {
            clientName: clientInfo.clientName,
            clientPhone: clientInfo.clientPhone,
            clientEmail: clientInfo.clientEmail,
            clientAddress: '',
            clientLicensePlate: clientInfo.clientLicensePlate,
            sellingPrice:
              selectedStatus === 'sold' ? clientInfo.sellingPrice : undefined,
            saleDate:
              selectedStatus === 'sold' && clientInfo.saleDate
                ? clientInfo.saleDate.toISOString()
                : undefined,
            reservationDate:
              selectedStatus === 'reserved' && clientInfo.reservationDate
                ? clientInfo.reservationDate.toISOString()
                : undefined,
            notes: clientInfo.notes,
          },
          'car_status_dialog',
        );
      }

      await onStatusUpdate(car.id, selectedStatus, updateData as any);
      onClose();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description:
          'Failed to update vehicle status. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sold':
        return 'bg-green-500 text-white';
      case 'reserved':
        return 'bg-blue-500 text-white';
      case 'in_stock':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-500 text-white';
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
    <AppModal open={isOpen} onClose={onClose} maxWidth="max-w-2xl">
      <div
        ref={dialogContentRef}
        className="max-h-[70vh] bg-white shadow-xl car-status-dialog flex flex-col rounded-none"
        style={{ height: '70vh', border: '1px solid #e5e7eb', boxShadow: 'none' }}
      >
        <div className="border-b border-gray-200 pb-4 flex-shrink-0">
          <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900">
            <User className="h-5 w-5 text-monza-yellow" />
            Update Vehicle Status - {car.brand} {car.model}
          </h2>
          <div className="mt-3">
            <span className="flex items-center gap-4 flex-wrap">
              <span className="font-mono text-sm bg-monza-yellow/10 text-monza-black px-3 py-1 rounded border border-monza-yellow/30">
                VIN: {car.vinNumber}
              </span>
              {car.year && (
                <span className="text-sm text-gray-600 font-medium">
                  Year: {car.year}
                </span>
              )}
              {car.color && (
                <span className="text-sm text-gray-600 font-medium">
                  Color: {car.color}
                </span>
              )}
            </span>
          </div>
        </div>

        {/* SCROLLABLE CONTENT WRAPPER - single scroll container within dialog */}
        <div className="overflow-y-auto max-h-[65vh] pr-2" style={{ scrollbarWidth: 'auto', scrollbarColor: '#ffd700 #f8fafc' }}>
          <div className="pt-4 pb-20 space-y-6" style={{ minHeight: '80vh', paddingRight: '10px' }}>
            {/* Current Status (no box styling) */}
            <div className="py-2">
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
              <Label htmlFor="status" className="text-sm font-medium">
                New Status
              </Label>
              <select
                id="status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as 'in_stock' | 'reserved' | 'sold')}
                className="w-full h-10 rounded-none border border-input bg-background px-3 py-2"
              >
                <option value="in_stock">Available (In Stock)</option>
                <option value="reserved">Reserved</option>
                <option value="sold">Sold</option>
              </select>
            </div>

            {/* Client Information (no box styling) */}
            {(selectedStatus === 'reserved' || selectedStatus === 'sold') && (
              <div className="pt-2 space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <User className="h-4 w-4" />
                  <h3 className="font-medium">Client Information</h3>
                  <span className="text-red-500 text-sm">*Required</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="clientName" className="text-sm">
                      Full Name *
                    </Label>
                    <Input id="clientName" value={clientInfo.clientName} onChange={(e) => handleInputChange('clientName', e.target.value)} placeholder="Enter client full name" className="border-gray-300" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clientPhone" className="text-sm">
                      Phone Number
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input id="clientPhone" value={clientInfo.clientPhone} onChange={(e) => handleInputChange('clientPhone', e.target.value)} placeholder="(555) 123-4567" className="pl-10 border-gray-300" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clientEmail" className="text-sm">
                      Email Address
                    </Label>
                    <Input id="clientEmail" type="email" value={clientInfo.clientEmail} onChange={(e) => handleInputChange('clientEmail', e.target.value)} placeholder="client@example.com" className="border-gray-300" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clientLicensePlate" className="text-sm">
                      License Plate
                    </Label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input id="clientLicensePlate" value={clientInfo.clientLicensePlate} onChange={(e) => handleInputChange('clientLicensePlate', e.target.value.toUpperCase())} placeholder="ABC-1234" className="pl-10 border-gray-300 uppercase" />
                    </div>
                  </div>
                </div>

                {selectedStatus === 'sold' && (
                  <div className="space-y-2">
                    <Label htmlFor="sellingPrice" className="text-sm">
                      Selling Price *
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input id="sellingPrice" type="number" value={clientInfo.sellingPrice} onChange={(e) => handleInputChange('sellingPrice', Number(e.target.value))} placeholder="0" className="pl-10 border-gray-300" min="0" step="1000" />
                    </div>
                  </div>
                )}

                {selectedStatus === 'reserved' && (
                  <DateTimeInput label="Reservation Date" value={clientInfo.reservationDate} onChange={(date) => handleInputChange('reservationDate', date)} required showTime={true} />
                )}

                {selectedStatus === 'sold' && (
                  <DateTimeInput label="Sale Date" value={clientInfo.saleDate} onChange={(date) => handleInputChange('saleDate', date)} required showTime={true} />
                )}
              </div>
            )}

            {/* Notes (no box) */}
            <div className="space-y-2 pt-2">
              <Label htmlFor="notes" className="text-sm">
                Notes
              </Label>
              <Textarea id="notes" value={clientInfo.notes} onChange={(e) => handleInputChange('notes', e.target.value)} placeholder="Additional notes or comments..." className="border-gray-300 min-h-[80px]" />
            </div>

            {/* Status Preview */}
            <div className="p-0">
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
                      <p>
                        <span className="font-medium">Client:</span> {clientInfo.clientName}
                      </p>
                      {clientInfo.clientPhone && (
                        <p>
                          <span className="font-medium">Phone:</span> {formatPhoneNumber(clientInfo.clientPhone)}
                        </p>
                      )}
                      {clientInfo.clientEmail && (
                        <p>
                          <span className="font-medium">Email:</span> {clientInfo.clientEmail}
                        </p>
                      )}
                      {selectedStatus === 'sold' && clientInfo.sellingPrice > 0 && (
                        <p>
                          <span className="font-medium">Sale Price:</span> ${clientInfo.sellingPrice.toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}
                  {!clientInfo.clientName && (
                    <div className="text-sm text-orange-600">
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
        </div>

        {/* Footer */}
        <div className="flex gap-3 justify-end pt-6 border-t border-gray-200 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onClose();
            }}
            disabled={isLoading}
            className="px-6 py-2 border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-colors"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
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
      </div>
    </AppModal>
  );
};
