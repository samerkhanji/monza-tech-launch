
import React from 'react';
import { GarageViewProps } from '../types';
import GarageTable from './GarageTable';
import CarDetailsDialog from './CarDetailsDialog';
import { useGarageActions } from '../hooks/useGarageActions';
import { toast } from '@/hooks/use-toast';

const GarageView: React.FC<GarageViewProps> = ({
  cars,
  onUpdateStatus
}) => {
  const {
    selectedCar,
    detailsModalOpen,
    setDetailsModalOpen,
    openCarDetails,
    handleUpdateCarDetails
  } = useGarageActions(cars, () => {
    toast({
      title: "Real-time update",
      description: "Vehicle information has been updated and is visible to all team members",
    });
  });
  
  const handleOpenDetails = (car: any) => {
    openCarDetails(car);
  };
  
  const handleSaveDetails = (carId: string, updates: any) => {
    handleUpdateCarDetails(carId, updates);
    onUpdateStatus(carId, selectedCar?.status || 'in_diagnosis');
  };
  
  return (
    <div className="space-y-6">
      <GarageTable 
        cars={cars} 
        onUpdateStatus={onUpdateStatus}
        onOpenDetails={handleOpenDetails}
      />
      
      <CarDetailsDialog
        isOpen={detailsModalOpen}
        setIsOpen={setDetailsModalOpen}
        selectedCar={selectedCar}
        onSave={handleSaveDetails}
      />
    </div>
  );
};

export default GarageView;
