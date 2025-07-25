import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Check, X, Calendar, Eye, MapPin, Car } from 'lucide-react';
import type { ShowroomCar } from '../types';
// Import dialogs if needed, though actions might just open dialogs in parent
// import TestDriveDialog from './TestDriveDialog';
// import PdiChecklistDialog from './PdiChecklistDialog';
import TestDriveDialog from '@/pages/CarInventory/components/TestDriveDialog';

interface ShowroomFloor2TableActionsProps {
  car: ShowroomCar;
  onEdit: (car: ShowroomCar) => void;
  onShowroomToggle: (carId: string, inShowroom: boolean, notes: string) => void;
  onPdiComplete: (car: ShowroomCar) => void; // Assuming this opens a PDI complete dialog
  onMoveCar: (car: ShowroomCar, destination: string, notes?: string) => void;
  onTestDriveSchedule: (carId: string, testDriveInfo: any) => void;
  onTestDriveEnd: (carId: string) => void;
  onOpenPdi: (car: ShowroomCar) => void;
  onOpenEditDialog: (car: ShowroomCar) => void;
  onOpenMoveDialog: (car: ShowroomCar) => void;
  onStatusChange: (car: ShowroomCar, newStatus: string) => void;
}

const ShowroomFloor2TableActions: React.FC<ShowroomFloor2TableActionsProps> = ({
  car,
  onEdit,
  onShowroomToggle,
  onPdiComplete,
  onMoveCar,
  onTestDriveSchedule,
  onTestDriveEnd,
  onOpenPdi,
  onOpenEditDialog,
  onOpenMoveDialog,
  onStatusChange,
}) => {
  const [showTestDriveDialog, setShowTestDriveDialog] = useState(false); // Assuming Test Drive Dialog is handled here

  // Note: onPdiComplete and onMoveCar directly call parent handlers here.
  // If dialogs are needed, the parent component should pass handlers that open them.

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-white">
          <DropdownMenuItem onClick={() => onOpenEditDialog(car)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Car
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => onShowroomToggle(car.id, !car.inShowroom, '')}>
            <MapPin className="mr-2 h-4 w-4" />
            {car.inShowroom ? 'Move to Garage' : 'Move to Showroom'}
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => onOpenMoveDialog(car)}>
            <Car className="mr-2 h-4 w-4" />
            Move Car
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Test Drive Dialog (Assuming handled here) */}
      <TestDriveDialog
        isOpen={showTestDriveDialog}
        onClose={() => setShowTestDriveDialog(false)}
        car={{
          ...car,
          arrivalDate: new Date().toISOString() // Add missing required property
        }}
        onScheduleTestDrive={(carId, testDriveInfo) => {
           onTestDriveSchedule(carId, testDriveInfo);
           setShowTestDriveDialog(false);
        }}
      />
    </>
  );
};

export default ShowroomFloor2TableActions; 