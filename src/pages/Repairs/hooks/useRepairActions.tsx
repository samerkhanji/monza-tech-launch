
import { GarageCar } from '../types';
import { useRepairsSync } from './useRepairsSync';
import { useCarActions } from './useCarActions';
import { useRepairNavigation } from './useRepairNavigation';
import { useRepairStageManagement } from './useRepairStageManagement';
import { useMechanicManagement } from './useMechanicManagement';

export const useRepairActions = (
  cars: GarageCar[], 
  setCars: React.Dispatch<React.SetStateAction<GarageCar[]>>
) => {
  // Combine all the hooks - updated to work with GarageCar instead of RepairRecord
  const { handleRefresh } = useRepairsSync(cars, setCars);
  const { handleExportToExcel, handleAddCar } = useCarActions();
  const { handleAddNewRepair } = useRepairNavigation();
  const { moveToNextStage, changeCarStatus } = useRepairStageManagement(cars, setCars);
  const { changeMechanics } = useMechanicManagement(cars, setCars);

  // Return all the actions with delivery workflow integration
  return {
    handleAddNewRepair,
    handleRefresh,
    handleExportToExcel,
    handleAddCar,
    moveToNextStage,
    changeCarStatus, // Now includes delivery workflow
    changeMechanics,
  };
};
