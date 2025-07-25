
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NewCarArrivalsTable } from './NewCarArrivalsTable';
import type { NewCarArrival } from '../types';

interface NewCarArrivalsContentProps {
  newCars: NewCarArrival[];
  handleUpdateStatus: (id: string, status: NewCarArrival['status']) => void;
  handleMoveToInventory: (carId: string) => void;
  handleMoveToGarage: (carId: string) => void;
  handleUpdateNotes: (carId: string, notes: string) => void;
  handleAddPhoto: (carId: string, photoUrl: string) => void;
  onPdiClick?: (carId: string) => void;
  onMoveCar: (carId: string, destination: string) => void;
}

export const NewCarArrivalsContent: React.FC<NewCarArrivalsContentProps> = ({
  newCars,
  handleUpdateStatus,
  handleMoveToInventory,
  handleMoveToGarage,
  handleUpdateNotes,
  handleAddPhoto,
  onPdiClick,
  onMoveCar
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Car Arrivals ({newCars.length})</CardTitle>
        <CardDescription>
          Track newly arrived vehicles and move them through the workflow
        </CardDescription>
      </CardHeader>
      <CardContent>
        <NewCarArrivalsTable
          newCars={newCars}
          onUpdateStatus={handleUpdateStatus}
          onMoveToInventory={handleMoveToInventory}
          onMoveToGarage={handleMoveToGarage}
          onUpdateNotes={handleUpdateNotes}
          onAddPhoto={handleAddPhoto}
          onPdiClick={onPdiClick}
          onMoveCar={onMoveCar}
        />
      </CardContent>
    </Card>
  );
};
