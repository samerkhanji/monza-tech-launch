
import React, { useState } from 'react';
import { CarDamageDocumentation } from './CarDamageDocumentation';
import ActionDropdown from '@/components/ui/ActionDropdown';
import type { NewCarArrival } from '../types';
import MoveCarDialog from './MoveCarDialog';

interface NewCarArrivalsTableActionsProps {
  car: NewCarArrival;
  onUpdateStatus: (id: string, status: NewCarArrival['status']) => void;
  onMoveToInventory: (carId: string) => void;
  onMoveToGarage: (carId: string) => void;
  onUpdateNotes: (carId: string, notes: string) => void;
  onAddPhoto: (carId: string, photoUrl: string) => void;
  onPdiClick?: (carId: string) => void;
  onMoveCar: (carId: string, destination: string) => void;
}

export const NewCarArrivalsTableActions: React.FC<NewCarArrivalsTableActionsProps> = ({
  car,
  onUpdateStatus,
  onMoveToInventory,
  onMoveToGarage,
  onUpdateNotes,
  onAddPhoto,
  onPdiClick,
  onMoveCar
}) => {
  const [showMoveDialog, setShowMoveDialog] = useState(false);

  const handleMoveCar = (destination: string) => {
    onMoveCar(car.id, destination);
    setShowMoveDialog(false);
  };

  const handleMoveToInventory = () => {
    onMoveToInventory(car.id);
  };

  return (
    <div className="flex flex-col gap-2 items-end">
      <CarDamageDocumentation 
        car={car}
        onUpdateNotes={onUpdateNotes}
        onAddPhoto={onAddPhoto}
      />
      
      <ActionDropdown
        options={[
          { value: 'inventory', label: 'Move to Inventory' },
          { value: 'move', label: 'Move Car' }
        ]}
        onAction={(action) => {
          if (action === 'inventory') handleMoveToInventory();
          else if (action === 'move') setShowMoveDialog(true);
        }}
        ariaLabel={`Actions for ${car.id}`}
      />

      {showMoveDialog && (
        <MoveCarDialog
          isOpen={showMoveDialog}
          onClose={() => setShowMoveDialog(false)}
          car={car}
          onMoveCar={handleMoveCar}
        />
      )}
    </div>
  );
};
