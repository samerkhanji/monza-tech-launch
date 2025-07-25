import { useState, useEffect } from 'react';

interface CarStatusData {
  vin: string;
  model: string;
  location: string;
  status: string;
  pdiStatus: 'completed' | 'pending' | 'not_started' | 'failed';
  customsStatus: 'cleared' | 'pending' | 'in_progress' | 'blocked';
  softwareStatus: 'updated' | 'pending_update' | 'outdated' | 'error';
  lastUpdated: string;
  assignedTo?: string;
  notes?: string;
}

interface StatusSummary {
  totalCars: number;
  pdiCompleted: number;
  pdiPending: number;
  pdiNotStarted: number;
  pdiFailed: number;
  customsCleared: number;
  customsPending: number;
  customsInProgress: number;
  customsBlocked: number;
  softwareUpdated: number;
  softwarePendingUpdate: number;
  softwareOutdated: number;
  softwareError: number;
  carsByLocation: {
    [location: string]: number;
  };
  carsByStatus: {
    [status: string]: number;
  };
}

export const useComprehensiveCarStatus = () => {
  const [carStatusData, setCarStatusData] = useState<CarStatusData[]>([]);
  const [statusSummary, setStatusSummary] = useState<StatusSummary>({
    totalCars: 0,
    pdiCompleted: 0,
    pdiPending: 0,
    pdiNotStarted: 0,
    pdiFailed: 0,
    customsCleared: 0,
    customsPending: 0,
    customsInProgress: 0,
    customsBlocked: 0,
    softwareUpdated: 0,
    softwarePendingUpdate: 0,
    softwareOutdated: 0,
    softwareError: 0,
    carsByLocation: {},
    carsByStatus: {}
  });
  const [isLoading, setIsLoading] = useState(true);

  const loadComprehensiveCarData = () => {
    try {
      setIsLoading(true);
      
      // Load data from all inventory sources
      const carInventory = JSON.parse(localStorage.getItem('carInventory') || '[]');
      const garageInventory = JSON.parse(localStorage.getItem('garageInventory') || '[]');
      const showroomFloor1 = JSON.parse(localStorage.getItem('showroomFloor1') || '[]');
      const showroomFloor2 = JSON.parse(localStorage.getItem('showroomFloor2') || '[]');
      const garageCarInventory = JSON.parse(localStorage.getItem('garageCarInventory') || '[]');
      const inventoryFloor2 = JSON.parse(localStorage.getItem('inventoryFloor2') || '[]');

      // Combine all car data
      const allCars = [
        ...carInventory.map((car: any) => ({ ...car, source: 'carInventory' })),
        ...garageInventory.map((car: any) => ({ ...car, source: 'garageInventory' })),
        ...showroomFloor1.map((car: any) => ({ ...car, source: 'showroomFloor1' })),
        ...showroomFloor2.map((car: any) => ({ ...car, source: 'showroomFloor2' })),
        ...garageCarInventory.map((car: any) => ({ ...car, source: 'garageCarInventory' })),
        ...inventoryFloor2.map((car: any) => ({ ...car, source: 'inventoryFloor2' }))
      ];

      // Process and normalize car data
      const processedCars: CarStatusData[] = allCars.map((car: any) => {
        // Determine location based on source
        let location = car.location || car.source || 'Unknown';
        if (car.source === 'showroomFloor1') location = 'Showroom Floor 1';
        if (car.source === 'showroomFloor2') location = 'Showroom Floor 2';
        if (car.source === 'garageInventory' || car.source === 'garageCarInventory') location = 'Garage';
        if (car.source === 'inventoryFloor2') location = 'Inventory Floor 2';

        // Normalize PDI status
        let pdiStatus: CarStatusData['pdiStatus'] = 'not_started';
        if (car.pdiStatus) {
          pdiStatus = car.pdiStatus.toLowerCase() as CarStatusData['pdiStatus'];
        } else if (car.pdiCompleted) {
          pdiStatus = 'completed';
        } else if (car.pdiInProgress) {
          pdiStatus = 'pending';
        }

        // Normalize customs status
        let customsStatus: CarStatusData['customsStatus'] = 'pending';
        if (car.customsStatus) {
          customsStatus = car.customsStatus.toLowerCase() as CarStatusData['customsStatus'];
        } else if (car.customsCleared) {
          customsStatus = 'cleared';
        } else if (car.customsInProgress) {
          customsStatus = 'in_progress';
        }

        // Normalize software status
        let softwareStatus: CarStatusData['softwareStatus'] = 'pending_update';
        if (car.softwareStatus) {
          softwareStatus = car.softwareStatus.toLowerCase() as CarStatusData['softwareStatus'];
        } else if (car.softwareUpdated) {
          softwareStatus = 'updated';
        } else if (car.softwareOutdated) {
          softwareStatus = 'outdated';
        }

        return {
          vin: car.vin || car.vinNumber || car.id || 'Unknown',
          model: car.model || car.make || car.brand || 'Unknown Model',
          location,
          status: car.status || 'available',
          pdiStatus,
          customsStatus,
          softwareStatus,
          lastUpdated: car.lastUpdated || car.updatedAt || new Date().toISOString(),
          assignedTo: car.assignedTo || car.mechanic || car.owner,
          notes: car.notes || car.description
        };
      });

      // Remove duplicates based on VIN
      const uniqueCars = processedCars.filter((car, index, self) => 
        index === self.findIndex(c => c.vin === car.vin)
      );

      setCarStatusData(uniqueCars);

      // Calculate summary statistics
      const summary: StatusSummary = {
        totalCars: uniqueCars.length,
        pdiCompleted: uniqueCars.filter(car => car.pdiStatus === 'completed').length,
        pdiPending: uniqueCars.filter(car => car.pdiStatus === 'pending').length,
        pdiNotStarted: uniqueCars.filter(car => car.pdiStatus === 'not_started').length,
        pdiFailed: uniqueCars.filter(car => car.pdiStatus === 'failed').length,
        customsCleared: uniqueCars.filter(car => car.customsStatus === 'cleared').length,
        customsPending: uniqueCars.filter(car => car.customsStatus === 'pending').length,
        customsInProgress: uniqueCars.filter(car => car.customsStatus === 'in_progress').length,
        customsBlocked: uniqueCars.filter(car => car.customsStatus === 'blocked').length,
        softwareUpdated: uniqueCars.filter(car => car.softwareStatus === 'updated').length,
        softwarePendingUpdate: uniqueCars.filter(car => car.softwareStatus === 'pending_update').length,
        softwareOutdated: uniqueCars.filter(car => car.softwareStatus === 'outdated').length,
        softwareError: uniqueCars.filter(car => car.softwareStatus === 'error').length,
        carsByLocation: uniqueCars.reduce((acc, car) => {
          acc[car.location] = (acc[car.location] || 0) + 1;
          return acc;
        }, {} as { [location: string]: number }),
        carsByStatus: uniqueCars.reduce((acc, car) => {
          acc[car.status] = (acc[car.status] || 0) + 1;
          return acc;
        }, {} as { [status: string]: number })
      };

      setStatusSummary(summary);
    } catch (error) {
      console.error('Error loading comprehensive car data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadComprehensiveCarData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(loadComprehensiveCarData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getCarsByPDIStatus = (status: CarStatusData['pdiStatus']) => {
    return carStatusData.filter(car => car.pdiStatus === status);
  };

  const getCarsByCustomsStatus = (status: CarStatusData['customsStatus']) => {
    return carStatusData.filter(car => car.customsStatus === status);
  };

  const getCarsBySoftwareStatus = (status: CarStatusData['softwareStatus']) => {
    return carStatusData.filter(car => car.softwareStatus === status);
  };

  const getCarsByLocation = (location: string) => {
    return carStatusData.filter(car => car.location === location);
  };

  const getCarsNeedingAttention = () => {
    return carStatusData.filter(car => 
      car.pdiStatus === 'failed' || 
      car.pdiStatus === 'not_started' ||
      car.customsStatus === 'blocked' ||
      car.softwareStatus === 'error' ||
      car.softwareStatus === 'outdated'
    );
  };

  const getCarsReadyForSale = () => {
    return carStatusData.filter(car => 
      car.pdiStatus === 'completed' && 
      car.customsStatus === 'cleared' && 
      car.softwareStatus === 'updated' &&
      car.status === 'available'
    );
  };

  return {
    carStatusData,
    statusSummary,
    isLoading,
    getCarsByPDIStatus,
    getCarsByCustomsStatus,
    getCarsBySoftwareStatus,
    getCarsByLocation,
    getCarsNeedingAttention,
    getCarsReadyForSale,
    refreshData: loadComprehensiveCarData
  };
}; 