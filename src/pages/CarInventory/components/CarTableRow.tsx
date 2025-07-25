import React, { useState, useEffect } from 'react';
import { TableCell, TableRow, StatusBadge } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Car } from '../types';
import TestDriveStatus from './TestDriveStatus';
import SimpleTestDriveDialog from '@/components/SimpleTestDriveDialog';
import { CarStatusSelectionDialog } from '@/components/CarStatusSelectionDialog';
import ActionDropdown from '@/components/ui/ActionDropdown';
import { CheckCircle, Clock, XCircle, Edit, MapPin, Car as CarIcon, Settings, Truck, DollarSign, Check, X, User, Briefcase, FileText } from 'lucide-react';

interface CarTableRowProps {
  car: Car;
  onStatusUpdate: (carId: string, newStatus: 'in_stock' | 'sold' | 'reserved') => void;
  onShowroomToggle: (carId: string, inShowroom: boolean, note: string) => void;
  onClientInfoSave: (carId: string, clientInfo: { clientName: string, clientPhone: string, clientLicensePlate: string }) => void;
  onMoveCar: (carId: string, destination: string) => void;
  onTestDriveSchedule?: (carId: string, testDriveInfo: any) => void;
  onTestDriveEnd?: (carId: string) => void;
  onOpenPdi: (car: Car) => void;
  onOpenEditDialog: (car: Car) => void;
  onOpenMoveDialog: (car: Car) => void;
  onOpenTechSpecs?: (car: Car) => void;
  onCarUpdate?: (carId: string, updates: Partial<Car>) => void;
  onShowClientInfo?: (car: Car) => void;
}

const CarTableRow: React.FC<CarTableRowProps> = ({
  car,
  onStatusUpdate,
  onShowroomToggle,
  onClientInfoSave,
  onMoveCar,
  onTestDriveSchedule,
  onTestDriveEnd,
  onOpenPdi,
  onOpenEditDialog,
  onOpenMoveDialog,
  onOpenTechSpecs,
  onCarUpdate,
  onShowClientInfo,
}) => {
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [priceValue, setPriceValue] = useState(car.sellingPrice?.toString() || '');
  const [showTestDriveDialog, setShowTestDriveDialog] = useState(false);
  const [isClientTestDrive, setIsClientTestDrive] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);

  useEffect(() => {
    setPriceValue(car.sellingPrice?.toString() || '');
  }, [car.sellingPrice]);

  const handlePriceEdit = () => {
    setIsEditingPrice(true);
    setPriceValue(car.sellingPrice?.toString() || '');
  };

  const handlePriceSave = () => {
    const numericPrice = parseFloat(priceValue);
    if (!isNaN(numericPrice) && numericPrice >= 0) {
      if (onCarUpdate) {
        onCarUpdate(car.id, { sellingPrice: numericPrice });
      }
    }
    setIsEditingPrice(false);
  };

  const handlePriceCancel = () => {
    setPriceValue(car.sellingPrice?.toString() || '');
    setIsEditingPrice(false);
  };

  const handlePriceKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handlePriceSave();
    } else if (e.key === 'Escape') {
      handlePriceCancel();
    }
  };

  const handleEndTestDrive = () => {
    if (onTestDriveEnd) {
      onTestDriveEnd(car.id);
    }
  };

  const handleStartTestDrive = (carId: string, testDriveInfo: any) => {
    if (onTestDriveSchedule) {
      onTestDriveSchedule(carId, testDriveInfo);
    }
    setShowTestDriveDialog(false);
  };

  const handleTestDriveEnd = (carId: string) => {
    if (onTestDriveEnd) {
      onTestDriveEnd(carId);
    }
    setShowTestDriveDialog(false);
  };

  const handleStatusUpdate = (carId: string, status: 'in_stock' | 'sold' | 'reserved', clientInfo?: any) => {
    if (clientInfo) {
      onCarUpdate?.(carId, {
        status,
        ...clientInfo
      });
    } else {
      onStatusUpdate(carId, status);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'in_stock': return 'success';
      case 'sold': return 'error';
      case 'reserved': return 'warning';
      default: return 'info';
    }
  };

  const getPdiStatusVariant = (completed?: boolean) => {
    return completed ? 'success' : 'warning';
  };

  const getCustomsStatusVariant = (status?: string) => {
    return status === 'paid' ? 'success' : 'warning';
  };

  const getLocationDisplay = (car: Car) => {
    if (car.currentFloor) {
      return car.currentFloor;
    }
    return car.inShowroom ? 'In Showroom' : 'In Stock';
  };

  const formatPhoneNumber = (phoneNumber?: string | null) => {
    if (!phoneNumber) return 'N/A';
    // Basic formatting for XXX-XXX-XXXX
    const cleaned = ('' + phoneNumber).replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `${match[1]}-${match[2]}-${match[3]}`;
    }
    return phoneNumber; // Return original if cannot format
  };

  // Check for data completeness
  const isDataComplete = car.vinNumber && car.model && car.year && car.color;

  return (
    <>
      <TableRow className={`hover:bg-monza-yellow/10 transition-colors ${!isDataComplete ? 'bg-red-50/50' : ''}`}>
        {/* Model */}
        <TableCell>
          <div>
            {car.brand && <div className="text-sm text-gray-500">{car.brand}</div>}
            <div className="font-semibold text-gray-900">
              {car.model} <span className="font-normal text-gray-600">({car.year})</span>
            </div>
            {car.customModelName && <div className="text-sm text-gray-500">{car.customModelName}</div>}
          </div>
        </TableCell>
        
        {/* VIN */}
        <TableCell className="font-mono text-sm text-gray-700">{car.vinNumber || 'N/A'}</TableCell>

        {/* Shipment Code */}
        <TableCell className="font-mono text-sm text-gray-700">
          {car.shipmentCode ? (
            <div className="flex items-center gap-2">
              <span>{car.shipmentCode}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  // Navigate to shipping ETA page with the tracking code
                  if (car.shipmentCode) {
                    window.open(`/shipping-eta?track=${encodeURIComponent(car.shipmentCode)}`, '_blank');
                  }
                }}
                className="h-6 w-6 p-0 border-gray-300 text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
                title="Track Shipment"
              >
                <Truck className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <span className="text-gray-500 text-sm">No code</span>
          )}
        </TableCell>

        {/* Color */}
        <TableCell className="text-gray-700">
          {car.color || 'N/A'}
        </TableCell>
        
        {/* Category */}
        <TableCell>
          <StatusBadge variant="info" className="border-gray-300">
            {car.category || 'Unknown'}
          </StatusBadge>
        </TableCell>
        
        {/* Battery */}
        <TableCell className="text-gray-700">
          {car.category === 'EV' || car.category === 'REV' ? (car.batteryPercentage !== undefined && car.batteryPercentage !== null ? `${car.batteryPercentage}%` : '0%') : 'N/A'}
        </TableCell>
        
        {/* Status */}
        <TableCell>
          <StatusBadge 
            variant={getStatusVariant(car.status)}
            className="cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setShowStatusDialog(true)}
            title="Click to change status (Available, Reserved, Sold)"
          >
            {car.status === 'in_stock' ? 'Available' : car.status.toUpperCase()}
          </StatusBadge>
        </TableCell>

        {/* Test Drive */}
        <TableCell>
          {car.testDriveInfo?.isOnTestDrive ? (
            <TestDriveStatus 
              testDriveInfo={car.testDriveInfo} 
              onEndTestDrive={handleEndTestDrive}
            />
          ) : car.status === 'sold' || car.status === 'reserved' ? (
            <StatusBadge variant="warning" className="border-gray-300">
              Not Available
            </StatusBadge>
          ) : (
            <div className="flex gap-1 flex-wrap">
              <Button 
                size="sm"
                className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-2 py-1 h-7"
                onClick={() => {
                  setIsClientTestDrive(false);
                  setShowTestDriveDialog(true);
                }}
                title="Employee Test Drive"
                >
                <Briefcase className="h-3 w-3 mr-1" />
                Test Drive
              </Button>
              <Button 
                size="sm"
                className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-2 py-1 h-7"
                onClick={() => {
                  setIsClientTestDrive(true);
                  setShowTestDriveDialog(true);
                }}
                title="Client Test Drive"
              >
                <User className="h-3 w-3 mr-1" />
                Client Test Drive
              </Button>
            </div>
          )}
        </TableCell>
        
        {/* PDI */}
        <TableCell>
          <div 
            className="cursor-pointer"
            onClick={() => onOpenPdi(car)}
          >
                    <StatusBadge variant={getPdiStatusVariant(car.pdiCompleted)}>
          {car.pdiCompleted ? (
            <><span className="mr-1 text-lg">☺</span> Complete</>
          ) : (
            <><span className="mr-1 text-lg">☹</span> Pending</>
          )}
        </StatusBadge>
          </div>
        </TableCell>
        
        {/* Price */}
        <TableCell>
          {isEditingPrice ? (
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4 text-gray-500" />
              <Input
                type="number"
                step="0.01"
                value={priceValue}
                onChange={(e) => setPriceValue(e.target.value)}
                onKeyDown={handlePriceKeyDown}
                className="w-24 h-8"
                placeholder="0.00"
                autoFocus
              />
              <Button
                size="sm"
                variant="outline"
                onClick={handlePriceSave}
                className="h-6 w-6 p-0 border-green-300 text-green-700 hover:bg-green-50"
                title="Save Price"
              >
                <Check className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handlePriceCancel}
                className="h-6 w-6 p-0 border-red-300 text-red-700 hover:bg-red-50"
                title="Cancel"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div 
              className="flex items-center gap-1 cursor-pointer hover:bg-gray-50 p-1 rounded"
              onClick={handlePriceEdit}
              title="Click to edit price"
            >
              <DollarSign className="h-4 w-4 text-gray-500" />
              <span className="text-gray-700 font-medium">
                {car.sellingPrice ? car.sellingPrice.toLocaleString('en-US', { 
                  minimumFractionDigits: 0, 
                  maximumFractionDigits: 0 
                }) : 'Set Price'}
              </span>
            </div>
          )}
        </TableCell>
        
        {/* Arrival Date */}
        <TableCell className="text-gray-700">
          {car.arrivalDate ? new Date(car.arrivalDate).toLocaleDateString() : 'N/A'}
        </TableCell>
        
        {/* Location */}
        <TableCell>
          <StatusBadge variant="info" className="border-gray-300">
            {getLocationDisplay(car) || 'N/A'}
          </StatusBadge>
        </TableCell>
        
        {/* Customs */}
        <TableCell>
          <StatusBadge variant={getCustomsStatusVariant(car.customs)}>
            {car.customs === 'paid' ? (
              <><CheckCircle className="mr-1 h-4 w-4" /> paid</>
            ) : (
              <><XCircle className="mr-1 h-4 w-4" /> not paid</>
            )}
          </StatusBadge>
        </TableCell>
        
        {/* Notes */}
        <TableCell>
          <div className="max-w-[400px] whitespace-normal">
            {car.notes ? (
              <p className="text-sm text-gray-700" title={car.notes}>
                  {car.notes}
                </p>
            ) : (
              <span className="text-gray-500 text-sm">No notes</span>
              )}
            </div>
        </TableCell>
        
        {/* Client Info */}
        <TableCell>
          {car.clientName ? (
            <div className="text-sm text-gray-700">
              <div className="font-medium text-gray-900">{car.clientName}</div>
              {car.clientPhone && <div className="text-gray-500">{formatPhoneNumber(car.clientPhone)}</div>}
              {car.clientLicensePlate && <div className="text-gray-500">{car.clientLicensePlate}</div>}
            </div>
          ) : (
            <span className="text-gray-500 text-sm">Not assigned</span>
          )}
        </TableCell>
        
        {/* Actions */}
        <TableCell className="text-right">
          <ActionDropdown
            options={[
              { value: 'edit', label: 'Edit Car' },
              { value: 'move', label: 'Move Car' },
              { value: 'pdi', label: 'PDI Checklist' },
              ...(onOpenTechSpecs ? [{ value: 'tech', label: 'Tech Specs' }] : [])
            ]}
            onAction={(action) => {
              if (action === 'edit') onOpenEditDialog(car);
              else if (action === 'move') onOpenMoveDialog(car);
              else if (action === 'pdi') onOpenPdi(car);
              else if (action === 'tech' && onOpenTechSpecs) onOpenTechSpecs(car);
            }}
            ariaLabel={`Actions for ${car.model} ${car.vinNumber}`}
          />
        </TableCell>
      </TableRow>

      {/* Car Status Selection Dialog */}
      <CarStatusSelectionDialog
        isOpen={showStatusDialog}
        onClose={() => setShowStatusDialog(false)}
        car={car}
        onStatusUpdate={handleStatusUpdate}
      />

      {/* Simple Test Drive Dialog */}
      <SimpleTestDriveDialog
        isOpen={showTestDriveDialog}
        onClose={() => setShowTestDriveDialog(false)}
        car={car}
        onStartTestDrive={handleStartTestDrive}
        onEndTestDrive={handleTestDriveEnd}
        isClientTestDrive={isClientTestDrive}
      />
    </>
  );
};

export default CarTableRow;
