
import { useEffect, useState } from 'react';
import { RepairRecord, RepairStage } from '@/types';
import { GarageCar } from '../types';

export const useSyncData = (
  repairs: RepairRecord[], 
  setCars: React.Dispatch<React.SetStateAction<GarageCar[]>>,
  cars: GarageCar[]
) => {
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [repairHistory, setRepairHistory] = useState<RepairRecord[]>([]);
  
  // Load repair history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('repairHistory');
    if (savedHistory) {
      try {
        setRepairHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error('Error parsing repair history:', error);
      }
    }
  }, []);
  
  // Real-time updates - sync data between tabs
  useEffect(() => {
    // Add event listeners for cross-tab communication
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'repairs' && e.newValue) {
        try {
          const updatedRepairs = JSON.parse(e.newValue);
          setLastSyncTime(new Date());
        } catch (error) {
          console.error('Error parsing repairs from storage event:', error);
        }
      } else if (e.key === 'garageCars' && e.newValue) {
        try {
          const updatedCars = JSON.parse(e.newValue);
          setCars(updatedCars);
          setLastSyncTime(new Date());
        } catch (error) {
          console.error('Error parsing garage cars from storage event:', error);
        }
      } else if (e.key === 'repairHistory' && e.newValue) {
        try {
          const updatedHistory = JSON.parse(e.newValue);
          setRepairHistory(updatedHistory);
        } catch (error) {
          console.error('Error parsing repair history from storage event:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [setCars]);

  // Enhanced sync repair status to garage cars and vice versa
  useEffect(() => {
    const syncRepairsToGarage = () => {
      // This would be handled by a backend in a real app
      // For demo, we'll sync based on car code
      const updatedCars = [...cars];
      let hasChanges = false;
      
      repairs.forEach(repair => {
        const carIndex = updatedCars.findIndex(car => car.carCode === repair.carCode);
        if (carIndex >= 0) {
          const car = updatedCars[carIndex];
          let newStatus: GarageCar['status'] = car.status;
          
          // Map repair stage to garage status
          if (repair.repairStage === 'diagnosis') newStatus = 'in_diagnosis';
          else if (repair.repairStage === 'repair') newStatus = 'in_repair';
          else if (repair.repairStage === 'quality_check') newStatus = 'in_quality_check';
          else if (repair.repairStage === 'ready') newStatus = 'ready';
          
          // Create updated car object with synchronized information
          updatedCars[carIndex] = {
            ...car,
            status: newStatus,
            mechanics: [...repair.mechanics],
            workNotes: repair.partsUsed ? repair.partsUsed.join(', ') : car.workNotes,
            issueDescription: repair.description || car.issueDescription,
            lastUpdated: new Date().toISOString(),
            startTimestamp: repair.startTimestamp || car.startTimestamp,
            endTimestamp: repair.endTimestamp || car.endTimestamp,
            expectedExitDate: repair.estimatedCompletionDate || car.expectedExitDate
          };
          
          hasChanges = true;
        }
      });
      
      if (hasChanges && typeof setCars === 'function') {
        setCars(updatedCars);
        localStorage.setItem('garageCars', JSON.stringify(updatedCars));
      }
    };
    
    // Run the sync when repairs change
    syncRepairsToGarage();
  }, [repairs, cars, setCars, lastSyncTime]);

  // Function to mark a repair as completed and add to history
  const completeRepair = (repair: RepairRecord) => {
    // Find corresponding car to get additional information
    const car = cars.find(c => c.carCode === repair.carCode);
    
    // Calculate duration
    const startDate = repair.startTimestamp ? new Date(repair.startTimestamp) : null;
    const endDate = new Date();
    const durationDays = startDate ? Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
    
    // Create a completed repair record with full details
    const completedRepair: RepairRecord = {
      ...repair,
      endTimestamp: new Date().toISOString(),
      completionPercentage: 100,
      repairStage: 'completed' as RepairStage,
      lastUpdated: new Date().toISOString(),
      // Add extra car details if available
      workNotes: car?.workNotes || repair.partsUsed?.join(', ') || '',
      startTimestamp: repair.startTimestamp || car?.startTimestamp || '',
      issueDescription: repair.description || car?.issueDescription || '',
      statusComments: car?.statusComments || '',
      repairDuration: car?.repairDuration || 
        `${durationDays} days`
    };
    
    // Add to repair history
    const updatedHistory = [...repairHistory, completedRepair];
    setRepairHistory(updatedHistory);
    
    // Save to localStorage
    localStorage.setItem('repairHistory', JSON.stringify(updatedHistory));
    
    return completedRepair;
  };

  return {
    lastSyncTime,
    setLastSyncTime,
    repairHistory,
    completeRepair
  };
};
