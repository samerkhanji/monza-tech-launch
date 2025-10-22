import React, { useState } from 'react';
import PortalActionDropdown from '@/components/ui/PortalActionDropdown';
import { Car as CarType } from '../types';
import TestDriveDialog from './TestDriveDialog';
import TestDriveHistoryDialog from './TestDriveHistoryDialog';

interface CarTableActionsProps {
  car: CarType;
  onEdit: (car: CarType) => void;
  onShowroomToggle: (car: CarType, inShowroom: boolean, note: string) => void;
  onMoveCar: (car: CarType, destination: string) => void;
  onTestDriveSchedule?: (car: CarType, testDriveInfo: any) => void;
  onTestDriveEnd?: (car: CarType) => void;
  onOpenEditDialog: (car: CarType) => void;
  onOpenMoveDialog: (car: CarType) => void;
  onStatusUpdate: (car: CarType, status: string) => void;
  onOpenTechSpecs?: (car: CarType) => void;
}

const CarTableActions: React.FC<CarTableActionsProps> = ({
  car,
  onEdit,
  onShowroomToggle,
  onMoveCar,
  onTestDriveSchedule,
  onTestDriveEnd,
  onOpenMoveDialog,
  onStatusUpdate,
  onOpenEditDialog,
  onOpenTechSpecs,
}) => {
  const [showTestDriveDialog, setShowTestDriveDialog] = useState(false);
  const [showTestDriveHistory, setShowTestDriveHistory] = useState(false);
  const [isClientTestDrive, setIsClientTestDrive] = useState(false);

  const handleTestDriveSchedule = (carId: string, testDriveInfo: any) => {
    if (onTestDriveSchedule) {
      onTestDriveSchedule(car, { ...testDriveInfo, isClientTestDrive });
    }
    setShowTestDriveDialog(false);
  };

  return (
    <>
      <PortalActionDropdown
        options={[
          { value: 'edit', label: 'Edit Car' },
          { value: 'history', label: 'Test Drive History' },
          { value: 'move', label: 'Move Car' },
          ...(onOpenTechSpecs ? [{ value: 'tech', label: 'Technical Specs' }] : [])
        ]}
        onAction={(action) => {
          if (action === 'edit') onOpenEditDialog(car);
          else if (action === 'history') setShowTestDriveHistory(true);
          else if (action === 'move') onOpenMoveDialog(car);
          else if (action === 'tech' && onOpenTechSpecs) onOpenTechSpecs(car);
        }}
        id={`actions-${car.id}`}
        ariaLabel={`Actions for ${car.model} ${car.vinNumber}`}
      />

      <TestDriveDialog
        isOpen={showTestDriveDialog}
        onClose={() => setShowTestDriveDialog(false)}
        car={car}
        onScheduleTestDrive={handleTestDriveSchedule}
        isClientTestDrive={isClientTestDrive}
      />

      <TestDriveHistoryDialog
        isOpen={showTestDriveHistory}
        onClose={() => setShowTestDriveHistory(false)}
        car={car}
      />
    </>
  );
};

export default CarTableActions;
