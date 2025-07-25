
import { useState } from 'react';
import { useNewCarState } from './useNewCarState';
import { useCarAddition } from './useCarAddition';
import { useCarStatusManagement } from './useCarStatusManagement';
import { usePdiManagement } from './usePdiManagement';
import { useInventoryMovement } from './useInventoryMovement';
import { useCarUpdateActions } from './useCarUpdateActions';
import { useGarageScheduleIntegration } from './useGarageScheduleIntegration';

export const useNewCarArrivals = () => {
  const [showGarageScheduleDialog, setShowGarageScheduleDialog] = useState(false);
  const [selectedCarForSchedule, setSelectedCarForSchedule] = useState<any>(null);

  const {
    newCars,
    setNewCars,
    newVin,
    setNewVin,
    newModel,
    setNewModel,
    newColor,
    setNewColor,
    newNotes,
    setNewNotes,
    newBatteryPercentage,
    setNewBatteryPercentage,
    vehicleCategory,
    setVehicleCategory,
    hasDamages,
    setHasDamages,
    damageDescription,
    setDamageDescription,
    showPdiForm,
    setShowPdiForm,
    technician,
    setTechnician,
    pdiNotes,
    setPdiNotes,
  } = useNewCarState();

  const resetForm = () => {
    setNewVin('');
    setNewModel('');
    setNewColor('');
    setNewNotes('');
    setNewBatteryPercentage(50);
    setVehicleCategory('EV');
    setHasDamages(false);
    setDamageDescription('');
  };

  const { handleAddNewCar } = useCarAddition(
    newCars,
    setNewCars,
    newVin,
    newModel,
    newColor,
    newNotes,
    newBatteryPercentage,
    vehicleCategory,
    hasDamages,
    damageDescription,
    resetForm
  );

  const { handleUpdateStatus } = useCarStatusManagement(
    newCars,
    setNewCars
  );

  const { handleAssignPdiTechnician } = usePdiManagement(
    newCars,
    setNewCars,
    technician,
    pdiNotes,
    setShowPdiForm,
    setTechnician,
    setPdiNotes
  );

  const { handleMoveToInventory, handleMoveToGarage } = useInventoryMovement(
    newCars,
    setNewCars
  );

  const { addCarToGarageSchedule } = useGarageScheduleIntegration();

  const { 
    handleUpdateNotes,
    handleAddPhoto
  } = useCarUpdateActions(setNewCars);

  const handleMoveToGarageWithSchedule = (carId: string) => {
    const car = handleMoveToGarage(carId);
    if (car) {
      setSelectedCarForSchedule(car);
      setShowGarageScheduleDialog(true);
    }
  };

  const handleScheduleCar = (
    estimatedHours: string,
    workType: 'electrical' | 'painter' | 'detailer' | 'mechanic' | 'body_work',
    priority: 'high' | 'medium' | 'low',
    targetDate: string,
    notes: string
  ) => {
    if (selectedCarForSchedule) {
      const success = addCarToGarageSchedule(
        selectedCarForSchedule,
        estimatedHours,
        workType,
        priority,
        targetDate
      );

      if (success) {
        // Remove car from new arrivals after successful scheduling
        setNewCars((prevCars) => prevCars.filter((c) => c.id !== selectedCarForSchedule.id));
      }
    }
  };

  return {
    newCars,
    newVin,
    setNewVin,
    newModel,
    setNewModel,
    newColor,
    setNewColor,
    newNotes,
    setNewNotes,
    newBatteryPercentage,
    setNewBatteryPercentage,
    vehicleCategory,
    setVehicleCategory,
    hasDamages,
    setHasDamages,
    damageDescription,
    setDamageDescription,
    showPdiForm,
    technician,
    setTechnician,
    pdiNotes,
    setPdiNotes,
    showGarageScheduleDialog,
    setShowGarageScheduleDialog,
    selectedCarForSchedule,
    handleAddNewCar,
    handleUpdateStatus,
    handleAssignPdiTechnician,
    handleMoveToInventory,
    handleMoveToGarageWithSchedule,
    handleScheduleCar,
    handleUpdateNotes,
    handleAddPhoto
  };
};
