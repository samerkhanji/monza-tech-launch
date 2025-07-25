
import React from 'react';
import { format } from 'date-fns';
import { TableCell } from '@/components/ui/table';
import { User, Phone, FileText, Lock, Calendar } from 'lucide-react';
import { Car } from '../types';
import EditableCell from './EditableCell';
import { useAuth } from '@/contexts/AuthContext';

interface CarClientCellsProps {
  car: Car;
  isEditing: boolean;
  editValues: Partial<Car>;
  onUpdateEditValue: (field: keyof Car, value: any) => void;
  onClientInfoSave: (carId: string, clientInfo: { clientName: string, clientPhone: string, clientLicensePlate: string }) => void;
}

const CarClientCells: React.FC<CarClientCellsProps> = ({
  car,
  isEditing,
  editValues,
  onUpdateEditValue,
  onClientInfoSave,
}) => {
  const { user } = useAuth();
  const canAccessClientData = user?.role === 'owner';

  const handleClientInfoUpdate = (field: keyof Car, value: any) => {
    if (!canAccessClientData) return;
    
    onUpdateEditValue(field, value);
    
    if (!isEditing) {
      const clientInfo = {
        clientName: field === 'clientName' ? value : (car.clientName || ''),
        clientPhone: field === 'clientPhone' ? value : (car.clientPhone || ''),
        clientLicensePlate: field === 'clientLicensePlate' ? value : (car.clientLicensePlate || ''),
      };
      onClientInfoSave(car.id, clientInfo);
    }
  };

  const handleSoldDateUpdate = (field: keyof Car, value: any) => {
    onUpdateEditValue(field, value);
    
    if (!isEditing) {
      // Auto-save the sold date when changed
      onClientInfoSave(car.id, {
        clientName: car.clientName || '',
        clientPhone: car.clientPhone || '',
        clientLicensePlate: car.clientLicensePlate || '',
      });
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'MMM d, yyyy');
  };

  const formatDateForInput = (dateString: string | undefined) => {
    if (!dateString) return '';
    return new Date(dateString).toISOString().slice(0, 10);
  };

  // If user doesn't have access to client data and car is sold, show restricted message
  if (!canAccessClientData && car.status === 'sold') {
    return (
      <TableCell>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Lock className="h-4 w-4" />
          <span className="text-sm">Client info restricted</span>
        </div>
        {car.soldDate && (
          <div className="text-xs text-muted-foreground mt-1">
            Sold: {formatDate(car.soldDate)}
          </div>
        )}
      </TableCell>
    );
  }

  return (
    <TableCell>
      <div className="space-y-1">
        <EditableCell
          isEditing={isEditing && canAccessClientData}
          value={editValues.clientName || car.clientName}
          field="clientName"
          onUpdate={handleClientInfoUpdate}
          className="w-32"
          placeholder="Client name"
          disabled={!canAccessClientData}
        >
          {car.clientName ? (
            <div className="flex items-center gap-1">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{canAccessClientData ? car.clientName : '***'}</span>
            </div>
          ) : (
            <span className="text-muted-foreground text-sm">No client</span>
          )}
        </EditableCell>
        
        <EditableCell
          isEditing={isEditing && canAccessClientData}
          value={editValues.clientPhone || car.clientPhone}
          field="clientPhone"
          onUpdate={handleClientInfoUpdate}
          className="w-32"
          placeholder="Phone number"
          disabled={!canAccessClientData}
        >
          {car.clientPhone ? (
            <div className="flex items-center gap-1">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{canAccessClientData ? car.clientPhone : '***-***-****'}</span>
            </div>
          ) : (
            <span className="text-muted-foreground text-sm">-</span>
          )}
        </EditableCell>
        
        <EditableCell
          isEditing={isEditing && canAccessClientData}
          value={editValues.clientLicensePlate || car.clientLicensePlate}
          field="clientLicensePlate"
          onUpdate={handleClientInfoUpdate}
          className="w-32"
          placeholder="License plate"
          disabled={!canAccessClientData}
        >
          {car.clientLicensePlate ? (
            <div className="flex items-center gap-1">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{canAccessClientData ? car.clientLicensePlate : '***'}</span>
            </div>
          ) : (
            <span className="text-muted-foreground text-sm">-</span>
          )}
        </EditableCell>
        
        {car.status === 'sold' && (
          <EditableCell
            isEditing={isEditing}
            value={formatDateForInput(editValues.soldDate || car.soldDate)}
            field="soldDate"
            onUpdate={handleSoldDateUpdate}
            className="w-32"
            placeholder="YYYY-MM-DD"
            type="date"
          >
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
              <Calendar className="h-3 w-3" />
              <span>Sold: {formatDate(car.soldDate)}</span>
            </div>
          </EditableCell>
        )}
      </div>
    </TableCell>
  );
};

export default CarClientCells;
