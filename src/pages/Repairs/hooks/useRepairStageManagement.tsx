
import { GarageCar, GarageCarStatus } from '../types';
import { toast } from '@/hooks/use-toast';

export const useRepairStageManagement = (
  cars: GarageCar[], 
  setCars: React.Dispatch<React.SetStateAction<GarageCar[]>>
) => {
  const moveToNextStage = (car: GarageCar) => {
    let nextStatus: GarageCarStatus;
    let workTypeChange: string;
    
    switch (car.status) {
      case 'in_diagnosis':
        nextStatus = 'in_repair';
        workTypeChange = 'Diagnosis → Repair';
        break;
      case 'in_repair':
        nextStatus = 'in_quality_check';
        workTypeChange = 'Repair → Quality Check';
        break;
      case 'in_quality_check':
        nextStatus = 'ready';
        workTypeChange = 'Quality Check → Ready';
        break;
      case 'ready':
        nextStatus = 'delivered';
        workTypeChange = 'Ready → Delivered';
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
    
    // Record work type change in repair history
    recordWorkTypeChange(car, car.status, nextStatus, workTypeChange, nowISOString);
    
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
    
    // Determine work type change description
    const workTypeChange = `${car.status.replace('_', ' ').toUpperCase()} → ${newStatus.replace('_', ' ').toUpperCase()}`;
    
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
    
    // Record work type change in repair history
    recordWorkTypeChange(car, car.status, newStatus, workTypeChange, nowISOString);
    
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

  const recordWorkTypeChange = (
    car: GarageCar, 
    fromStatus: string, 
    toStatus: string, 
    workTypeChange: string, 
    timestamp: string
  ) => {
    const workTypeHistoryEntry = {
      id: `worktype-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      carCode: car.carCode,
      carModel: car.carModel,
      customerName: car.customerName,
      fromWorkType: fromStatus,
      toWorkType: toStatus,
      workTypeChange: workTypeChange,
      timestamp: timestamp,
      assignedEmployee: car.assignedEmployee,
      mechanics: car.mechanics || [],
      notes: `Work type changed from ${fromStatus.replace('_', ' ')} to ${toStatus.replace('_', ' ')}`,
      duration: calculateDurationInStage(car, fromStatus, timestamp),
      partsUsed: car.partsUsed || [],
      partsUsedInStage: getPartsUsedInStage(car, fromStatus),
      totalPartsCost: calculatePartsCost(car.partsUsed || []),
      toolsUsed: car.toolsUsed || [],
      toolsUsedInStage: getToolsUsedInStage(car, fromStatus),
      totalToolsCost: calculateToolsCost(car.toolsUsed || []),
      workNotes: car.workNotes,
      issueDescription: car.issueDescription
    };

    // Save to repair history
    const savedHistory = localStorage.getItem('repairHistory');
    const history = savedHistory ? JSON.parse(savedHistory) : [];
    
    // Add work type change entry
    history.unshift({
      ...workTypeHistoryEntry,
      type: 'work_type_change',
      date: new Date(timestamp).toLocaleDateString(),
      description: workTypeChange,
      technician: car.assignedEmployee,
      notes: workTypeHistoryEntry.notes,
      workTypeTransition: workTypeChange,
      fromStage: fromStatus,
      toStage: toStatus,
      transitionTimestamp: timestamp,
      partsUsed: workTypeHistoryEntry.partsUsed,
      partsUsedInStage: workTypeHistoryEntry.partsUsedInStage,
      totalPartsCost: workTypeHistoryEntry.totalPartsCost,
      toolsUsed: workTypeHistoryEntry.toolsUsed,
      toolsUsedInStage: workTypeHistoryEntry.toolsUsedInStage,
      totalToolsCost: workTypeHistoryEntry.totalToolsCost
    });
    
    localStorage.setItem('repairHistory', JSON.stringify(history));
    
    // Also save to a dedicated work type history
    const savedWorkTypeHistory = localStorage.getItem('workTypeHistory');
    const workTypeHistory = savedWorkTypeHistory ? JSON.parse(savedWorkTypeHistory) : [];
    workTypeHistory.unshift(workTypeHistoryEntry);
    localStorage.setItem('workTypeHistory', JSON.stringify(workTypeHistory));
  };

  const getPartsUsedInStage = (car: GarageCar, stage: string): string[] => {
    // This function would track parts used specifically in each stage
    // For now, we'll return all parts used, but in a real system you'd track stage-specific parts
    return car.partsUsed || [];
  };

  const getToolsUsedInStage = (car: GarageCar, stage: string): string[] => {
    // This function would track tools used specifically in each stage
    // For now, we'll return all tools used, but in a real system you'd track stage-specific tools
    return car.toolsUsed || [];
  };

  const calculatePartsCost = (parts: string[]): number => {
    // This is a simplified calculation - in a real system you'd have actual part costs
    // For now, we'll estimate based on part count and type
    let totalCost = 0;
    
    parts.forEach(part => {
      // Simplified cost estimation based on part type
      if (part.toLowerCase().includes('battery')) {
        totalCost += 1500; // Battery cost
      } else if (part.toLowerCase().includes('brake')) {
        totalCost += 200; // Brake parts
      } else if (part.toLowerCase().includes('filter')) {
        totalCost += 50; // Filters
      } else if (part.toLowerCase().includes('sensor')) {
        totalCost += 300; // Sensors
      } else if (part.toLowerCase().includes('motor')) {
        totalCost += 800; // Motors
      } else {
        totalCost += 100; // Default part cost
      }
    });
    
    return totalCost;
  };

  const calculateToolsCost = (tools: string[]): number => {
    // This is a simplified calculation - in a real system you'd have actual tool costs
    // For now, we'll estimate based on tool count and type
    let totalCost = 0;
    
    tools.forEach(tool => {
      // Simplified cost estimation based on tool type
      if (tool.toLowerCase().includes('diagnostic')) {
        totalCost += 500; // Diagnostic tools
      } else if (tool.toLowerCase().includes('lift')) {
        totalCost += 200; // Lift usage
      } else if (tool.toLowerCase().includes('scanner')) {
        totalCost += 300; // Scanner tools
      } else if (tool.toLowerCase().includes('welder')) {
        totalCost += 150; // Welding tools
      } else if (tool.toLowerCase().includes('tester')) {
        totalCost += 250; // Testing equipment
      } else if (tool.toLowerCase().includes('meter')) {
        totalCost += 100; // Meters and gauges
      } else if (tool.toLowerCase().includes('torque')) {
        totalCost += 80; // Torque wrenches
      } else if (tool.toLowerCase().includes('socket')) {
        totalCost += 50; // Socket sets
      } else {
        totalCost += 75; // Default tool cost
      }
    });
    
    return totalCost;
  };

  const calculateDurationInStage = (car: GarageCar, stage: string, endTimestamp: string): string => {
    let startTime: Date;
    
    // Determine start time based on the stage
    switch (stage) {
      case 'in_diagnosis':
        startTime = car.startTimestamp ? new Date(car.startTimestamp) : new Date(car.entryDate);
        break;
      case 'in_repair':
        // Find when diagnosis ended (approximate)
        startTime = car.startTimestamp ? new Date(car.startTimestamp) : new Date(car.entryDate);
        break;
      case 'in_quality_check':
        // Find when repair ended (approximate)
        startTime = car.startTimestamp ? new Date(car.startTimestamp) : new Date(car.entryDate);
        break;
      default:
        startTime = new Date(car.entryDate);
    }
    
    const endTime = new Date(endTimestamp);
    const durationHours = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60));
    const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
    
    if (durationHours > 0) {
      return `${durationHours}h ${durationMinutes % 60}m`;
    } else {
      return `${durationMinutes}m`;
    }
  };

  return {
    moveToNextStage,
    changeCarStatus
  };
};
