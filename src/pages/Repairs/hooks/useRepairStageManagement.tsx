
import { GarageCar, GarageCarStatus } from '../types';
import { toast } from '@/hooks/use-toast';

export const useRepairStageManagement = (
  cars: GarageCar[], 
  setCars: React.Dispatch<React.SetStateAction<GarageCar[]>>
) => {
  const moveToNextStage = (car: GarageCar) => {
    let nextStatus: GarageCarStatus;
    
    switch (car.status) {
      case 'in_diagnosis':
        nextStatus = 'in_repair';
        break;
      case 'in_repair':
        nextStatus = 'in_quality_check';
        break;
      case 'in_quality_check':
        nextStatus = 'ready';
        break;
      case 'ready':
        nextStatus = 'delivered';
        break;
      default:
        return;
    }
    
    const now = new Date();
    const nowISOString = now.toISOString();
    
    const updatedCars = cars.map(c => {
      if (c.id === car.id) {
        return {
          ...c, 
          status: nextStatus,
          endTimestamp: nextStatus === 'delivered' ? nowISOString : c.endTimestamp,
          lastUpdated: nowISOString
        };
      }
      return c;
    });
    
    setCars(updatedCars);
    
    // Save to localStorage
    localStorage.setItem('garageCars', JSON.stringify(updatedCars));
    
    // If delivered, handle the delivery workflow
    if (nextStatus === 'delivered') {
      handleCarDelivery(car, nowISOString);
    }
    
    toast({
      title: "Status Updated",
      description: `${car.carCode} moved to ${nextStatus.replace('_', ' ').toUpperCase()}`
    });
  };

  const changeCarStatus = (car: GarageCar, newStatus: GarageCarStatus) => {
    const now = new Date();
    const nowISOString = now.toISOString();
    
    const updatedCars = cars.map(c => {
      if (c.id === car.id) {
        return {
          ...c, 
          status: newStatus,
          endTimestamp: newStatus === 'delivered' ? nowISOString : c.endTimestamp,
          lastUpdated: nowISOString
        };
      }
      return c;
    });
    
    setCars(updatedCars);
    
    // Save to localStorage
    localStorage.setItem('garageCars', JSON.stringify(updatedCars));
    
    // If delivered, handle the delivery workflow
    if (newStatus === 'delivered') {
      handleCarDelivery(car, nowISOString);
    }
    
    toast({
      title: "Status Updated",
      description: `${car.carCode} moved to ${newStatus.replace('_', ' ').toUpperCase()}`
    });
  };

  const handleCarDelivery = (car: GarageCar, deliveryTimestamp: string) => {
    // Update car inventory to show as delivered
    updateCarInventoryOnDelivery(car, deliveryTimestamp);
    
    // Add to repair history
    addToRepairHistory(car, deliveryTimestamp);
    
    // Add to inventory history for parts used
    addPartsToInventoryHistory(car, deliveryTimestamp);
  };

  const updateCarInventoryOnDelivery = (car: GarageCar, deliveryTimestamp: string) => {
    const savedInventory = localStorage.getItem('carInventory');
    if (savedInventory) {
      try {
        const inventory = JSON.parse(savedInventory);
        const updatedInventory = inventory.map((invCar: any) => {
          // Match by car code or model (you may need to adjust this matching logic)
          if (invCar.model === car.carModel || invCar.vinNumber?.includes(car.carCode)) {
            return {
              ...invCar,
              status: 'sold',
              soldDate: deliveryTimestamp,
              currentFloor: undefined, // N/A - represents sold
              inShowroom: false,
              showroomExitDate: deliveryTimestamp,
              showroomNote: `Delivered to client - ${car.customerName}`,
              clientName: car.customerName,
              notes: `Delivered after repair completion. Work performed: ${car.workNotes || car.issueDescription || 'Repair completed'}`
            };
          }
          return invCar;
        });
        localStorage.setItem('carInventory', JSON.stringify(updatedInventory));
      } catch (error) {
        console.error('Error updating car inventory on delivery:', error);
      }
    }
  };

  const addToRepairHistory = (car: GarageCar, deliveryTimestamp: string) => {
    // Calculate repair duration
    const startTime = car.startTimestamp ? new Date(car.startTimestamp) : new Date(car.entryDate);
    const endTime = new Date(deliveryTimestamp);
    const durationHours = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60));

    const repairHistoryEntry = {
      id: Date.now().toString(),
      carCode: car.carCode,
      carModel: car.carModel,
      customerName: car.customerName,
      assignedEmployee: car.assignedEmployee,
      mechanics: car.mechanics || [],
      entryDate: car.entryDate,
      startTimestamp: car.startTimestamp,
      endTimestamp: deliveryTimestamp,
      deliveryTimestamp: deliveryTimestamp,
      issueDescription: car.issueDescription,
      workNotes: car.workNotes,
      partsUsed: car.partsUsed || [],
      repairDurationHours: durationHours,
      repairDuration: `${durationHours}h`,
      statusComments: car.statusComments,
      completedAt: deliveryTimestamp,
      status: 'delivered'
    };

    // Save to repair history
    const savedHistory = localStorage.getItem('repairHistory');
    const history = savedHistory ? JSON.parse(savedHistory) : [];
    history.unshift(repairHistoryEntry);
    localStorage.setItem('repairHistory', JSON.stringify(history));
  };

  const addPartsToInventoryHistory = (car: GarageCar, deliveryTimestamp: string) => {
    if (car.partsUsed && car.partsUsed.length > 0) {
      const savedHistory = localStorage.getItem('inventoryHistory');
      const history = savedHistory ? JSON.parse(savedHistory) : [];

      car.partsUsed.forEach(partName => {
        const historyEntry = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          partId: `part-${partName.replace(/\s+/g, '-').toLowerCase()}`,
          partName: partName,
          partNumber: `PN-${partName.replace(/\s+/g, '').toUpperCase()}`,
          quantity: 1, // Default to 1, could be enhanced to track actual quantities
          carVIN: car.carCode,
          employee: car.assignedEmployee,
          timestamp: deliveryTimestamp,
          partType: partName.includes('DF') ? 'DF' : (partName.includes('BM') ? 'BM' : undefined)
        };
        history.unshift(historyEntry);
      });

      localStorage.setItem('inventoryHistory', JSON.stringify(history));
    }
  };

  return {
    moveToNextStage,
    changeCarStatus
  };
};
