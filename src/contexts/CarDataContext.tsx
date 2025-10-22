import React, { createContext, useContext, useState, useEffect } from 'react';
import { Car } from '@/pages/CarInventory/types';
import { GarageCar } from '@/pages/Repairs/types';
import { ScheduledCar, GarageSchedule } from '@/types';

// Unified car interface that combines all car data
export interface UnifiedCarData {
  // Basic identification
  id: string;
  carCode: string; // VIN or unique identifier
  model: string;
  year: number;
  brand?: string;
  color: string;
  
  // Inventory data
  inventoryData?: Car;
  
  // Garage/repair data
  garageData?: GarageCar;
  
  // Financial data
  financialRecords?: CarFinancialRecord[];
  
  // Schedule data
  scheduleData?: ScheduledCar & { scheduleDate: string; scheduleTime: string };
  
  // Current status across all systems
  currentLocation: 'inventory' | 'garage' | 'scheduled' | 'delivered' | 'sold';
  
  // Repair history
  repairHistory?: RepairHistoryEntry[];
  
  // Client information
  clientName?: string;
  clientPhone?: string;
  clientEmail?: string;
}

export interface CarFinancialRecord {
  carCode: string;
  carModel: string;
  customerName: string;
  repairType: string;
  startDate: string;
  completionDate?: string;
  laborHours: number;
  laborCost: number;
  partsCost: number;
  electricityCost: number;
  equipmentCost: number;
  overheadCost: number;
  totalCost: number;
  profit: number;
  profitMargin: number;
  currency: 'LBP' | 'USD';
  exchangeRate: number;
  partsUsed: Array<{
    name: string;
    quantity: number;
    unitCost: number;
    isImported: boolean;
    supplier: string;
  }>;
  employeesWorked: Array<{
    name: string;
    role: string;
    hours: number;
    hourlyRate: number;
  }>;
}

export interface RepairHistoryEntry {
  id: string;
  carCode: string;
  carModel: string;
  customerName: string;
  repairType: string;
  startDate: string;
  completionDate: string;
  laborHours: number;
  totalCost: number;
  partsUsed: string[];
  technician: string;
  notes?: string;
}

interface CarDataContextType {
  unifiedCars: UnifiedCarData[];
  getCarByCode: (carCode: string) => UnifiedCarData | undefined;
  getCarRepairHistory: (carCode: string) => RepairHistoryEntry[];
  getCarFinancialData: (carCode: string) => CarFinancialRecord[];
  updateCarData: (carCode: string, updates: Partial<UnifiedCarData>) => void;
  refreshData: () => void;
  linkCarAcrossSystems: (carCode: string) => UnifiedCarData | null;
}

const CarDataContext = createContext<CarDataContextType | undefined>(undefined);

export const CarDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unifiedCars, setUnifiedCars] = useState<UnifiedCarData[]>([]);

  // Load and merge data from all systems
  const loadAndMergeData = () => {
    try {
      // Check if any data exists before processing
      const inventoryData = localStorage.getItem('carInventory');
      const garageData = localStorage.getItem('garageCars');
      const scheduleData = localStorage.getItem('garageSchedule');
      const repairHistoryData = localStorage.getItem('repairHistory');
      
      // If no data exists, return early with empty state
      if (!inventoryData && !garageData && !scheduleData && !repairHistoryData) {
        setUnifiedCars([]);
        return;
      }

      // Load inventory cars
      const inventory: Car[] = inventoryData ? JSON.parse(inventoryData) : [];

      // Load garage cars
      const garageCars: GarageCar[] = garageData ? JSON.parse(garageData) : [];

      // Load scheduled cars
      const schedules: GarageSchedule[] = scheduleData ? JSON.parse(scheduleData) : [];
      
      // Load repair history
      const repairHistory: RepairHistoryEntry[] = repairHistoryData ? JSON.parse(repairHistoryData) : [];

      // Create unified car data
      const unifiedMap = new Map<string, UnifiedCarData>();

      // Process inventory cars
      if (Array.isArray(inventory)) {
        inventory.forEach(car => {
        const carCode = car.vinNumber || car.id;
        unifiedMap.set(carCode, {
          id: car.id,
          carCode,
          model: car.model,
          year: car.year,
          brand: car.brand,
          color: car.color,
          inventoryData: car,
          currentLocation: car.status === 'sold' ? 'sold' : 'inventory',
          clientName: car.clientName,
          clientPhone: car.clientPhone,
          clientEmail: car.clientEmail,
          repairHistory: repairHistory.filter(r => r.carCode === carCode),
          financialRecords: []
        });
      });
      } else {
        console.warn('Inventory data is not an array:', inventory);
      }

      // Process garage cars
      if (Array.isArray(garageCars)) {
        garageCars.forEach(car => {
        const carCode = car.carCode;
        const existing = unifiedMap.get(carCode);
        
        if (existing) {
          existing.garageData = car;
          existing.currentLocation = car.status === 'delivered' ? 'delivered' : 'garage';
          existing.clientName = existing.clientName || car.customerName;
        } else {
          unifiedMap.set(carCode, {
            id: car.id,
            carCode,
            model: car.carModel,
            year: new Date().getFullYear(), // Default year if not available
            color: 'Unknown',
            garageData: car,
            currentLocation: car.status === 'delivered' ? 'delivered' : 'garage',
            clientName: car.customerName,
            repairHistory: repairHistory.filter(r => r.carCode === carCode),
            financialRecords: []
          });
        }
      });
      } else {
        console.warn('Garage cars data is not an array:', garageCars);
      }

      // Process scheduled cars - Add type checking to prevent forEach errors
      if (Array.isArray(schedules)) {
        schedules.forEach(schedule => {
          if (schedule && schedule.scheduledCars && Array.isArray(schedule.scheduledCars)) {
            schedule.scheduledCars.forEach(car => {
              const carCode = car.carCode;
              const existing = unifiedMap.get(carCode);
              
              const scheduleInfo = {
                ...car,
                scheduleDate: schedule.date,
                scheduleTime: `${schedule.startTime} - ${schedule.endTime}`
              };

              if (existing) {
                existing.scheduleData = scheduleInfo;
                if (existing.currentLocation === 'inventory') {
                  existing.currentLocation = 'scheduled';
                }
              } else {
                unifiedMap.set(carCode, {
                  id: car.id,
                  carCode,
                  model: car.carModel,
                  year: new Date().getFullYear(),
                  color: 'Unknown',
                  scheduleData: scheduleInfo,
                  currentLocation: 'scheduled',
                  clientName: car.customerName,
                  repairHistory: repairHistory.filter(r => r.carCode === carCode),
                  financialRecords: []
                });
              }
            });
          }
        });
      } else {
        console.warn('Schedules data is not an array:', schedules);
      }

      // Add financial records to existing cars
      if (Array.isArray(repairHistory)) {
        repairHistory.forEach(repair => {
          const car = unifiedMap.get(repair.carCode);
          if (car && repair.totalCost) {
            // Convert repair history to financial record format
            const financialRecord: CarFinancialRecord = {
              carCode: repair.carCode,
              carModel: repair.carModel,
              customerName: repair.customerName,
              repairType: repair.repairType,
              startDate: repair.startDate,
              completionDate: repair.completionDate,
              laborHours: repair.laborHours,
              laborCost: repair.totalCost * 0.6, // Estimate 60% labor
              partsCost: repair.totalCost * 0.3, // Estimate 30% parts
              electricityCost: repair.totalCost * 0.05, // Estimate 5% electricity
              equipmentCost: 0,
              overheadCost: repair.totalCost * 0.05, // Estimate 5% overhead
              totalCost: repair.totalCost,
              profit: repair.totalCost * 0.2, // Estimate 20% profit
              profitMargin: 20,
              currency: 'USD',
              exchangeRate: 89500,
              partsUsed: repair.partsUsed.map(part => ({
                name: part,
                quantity: 1,
                unitCost: 50, // Default estimate
                isImported: Math.random() > 0.5,
                supplier: 'Auto Parts Supply'
              })),
              employeesWorked: [{
                name: repair.technician,
                role: 'Technician',
                hours: repair.laborHours,
                hourlyRate: 28
              }]
            };
            
            if (!car.financialRecords) car.financialRecords = [];
            car.financialRecords.push(financialRecord);
          }
        });
      } else {
        console.warn('Repair history data is not an array:', repairHistory);
      }

      setUnifiedCars(Array.from(unifiedMap.values()));
    } catch (error) {
      console.error('Error loading and merging car data:', error);
    }
  };

  // Initial load
  useEffect(() => {
    loadAndMergeData();
  }, []);

  // Listen for storage changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (['carInventory', 'garageCars', 'garageSchedules', 'repairHistory'].includes(e.key || '')) {
        loadAndMergeData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const getCarByCode = (carCode: string): UnifiedCarData | undefined => {
    return unifiedCars.find(car => car.carCode === carCode);
  };

  const getCarRepairHistory = (carCode: string): RepairHistoryEntry[] => {
    const car = getCarByCode(carCode);
    return car?.repairHistory || [];
  };

  const getCarFinancialData = (carCode: string): CarFinancialRecord[] => {
    const car = getCarByCode(carCode);
    return car?.financialRecords || [];
  };

  const updateCarData = (carCode: string, updates: Partial<UnifiedCarData>) => {
    setUnifiedCars(prev => prev.map(car => 
      car.carCode === carCode ? { ...car, ...updates } : car
    ));
  };

  const linkCarAcrossSystems = (carCode: string): UnifiedCarData | null => {
    const car = getCarByCode(carCode);
    if (car) {
      // Refresh data for this specific car
      loadAndMergeData();
      return getCarByCode(carCode) || null;
    }
    return null;
  };

  const refreshData = () => {
    loadAndMergeData();
  };

  return (
    <CarDataContext.Provider value={{
      unifiedCars,
      getCarByCode,
      getCarRepairHistory,
      getCarFinancialData,
      updateCarData,
      refreshData,
      linkCarAcrossSystems
    }}>
      {children}
    </CarDataContext.Provider>
  );
};

export const useCarData = () => {
  const context = useContext(CarDataContext);
  if (context === undefined) {
    throw new Error('useCarData must be used within a CarDataProvider');
  }
  return context;
}; 