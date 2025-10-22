// Optimized Dashboard Hooks - Performance Enhanced
// These hooks replace the slow loading hooks with optimized versions

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  fetchWithPerformanceCache, 
  batchApiCalls, 
  useOptimizedState,
  optimizedLocalStorage,
  quickLoadDashboardData,
  normalizeCarData
} from '@/utils/dashboardPerformanceFix';

// Optimized garage schedule data hook
export const useOptimizedGarageScheduleData = () => {
  const [scheduleData, setScheduleData] = useOptimizedState([]);
  const [carsBeingWorked, setCarsBeingWorked] = useOptimizedState([]);
  const [carStatusCounts, setCarStatusCounts] = useOptimizedState({});
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Use cached data loading
      const data = await fetchWithPerformanceCache('garage-schedule-data', async () => {
        const rawData = optimizedLocalStorage.getMultiple([
          'garageSchedules',
          'garageInventory',
          'garageCarInventory'
        ]);
        
        return {
          schedules: rawData.garageSchedules || [],
          garageCars: [
            ...(rawData.garageInventory || []),
            ...(rawData.garageCarInventory || [])
          ]
        };
      });

      setScheduleData(data.schedules);
      setCarsBeingWorked(data.garageCars);
      
      // Calculate comprehensive status counts to match Dashboard expectations
      const statusCounts = {
        totalCars: data.garageCars.length,
        readyCars: data.garageCars.filter((car: any) => 
          car.pdiStatus === 'completed' && 
          car.customsStatus === 'cleared' && 
          car.softwareStatus === 'updated'
        ).length,
        needsAttention: data.garageCars.filter((car: any) => 
          car.pdiStatus === 'failed' || 
          car.customsStatus === 'blocked' || 
          car.softwareStatus === 'error'
        ).length,
        inProgress: data.garageCars.filter((car: any) => 
          car.pdiStatus === 'pending' || 
          car.customsStatus === 'in_progress' || 
          car.softwareStatus === 'pending_update'
        ).length,
        // Also include basic status counts
        ...data.garageCars.reduce((acc: any, car: any) => {
          const status = car.status || 'unknown';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {})
      };
      
      setCarStatusCounts(statusCounts);
      
    } catch (error) {
      console.error('Error loading garage schedule:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    scheduleData,
    carsBeingWorked,
    carStatusCounts,
    isLoading,
    refresh: loadData
  };
};

// Optimized comprehensive car status hook
export const useOptimizedComprehensiveCarStatus = () => {
  const [carStatusData, setCarStatusData] = useOptimizedState([]);
  const [statusSummary, setStatusSummary] = useOptimizedState({ totalCars: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Use quick data loading
      const data = await fetchWithPerformanceCache('comprehensive-car-status', async () => {
        return await quickLoadDashboardData();
      });

      setCarStatusData(data.cars);
      
      // Calculate summary efficiently - match expected Dashboard structure
      const summary = {
        totalCars: data.cars.length,
        readyCars: data.cars.filter((car: any) => 
          car.pdiStatus === 'completed' && 
          car.customsStatus === 'cleared' && 
          car.softwareStatus === 'updated'
        ).length,
        needsAttention: data.cars.filter((car: any) => 
          car.pdiStatus === 'failed' || 
          car.customsStatus === 'blocked' || 
          car.softwareStatus === 'error'
        ).length,
        inProgress: data.cars.filter((car: any) => 
          car.pdiStatus === 'pending' || 
          car.customsStatus === 'in_progress' || 
          car.softwareStatus === 'pending_update'
        ).length,
        pdiCompleted: data.cars.filter((car: any) => car.pdiStatus === 'completed').length,
        pdiPending: data.cars.filter((car: any) => car.pdiStatus === 'pending').length,
        pdiNotStarted: data.cars.filter((car: any) => car.pdiStatus === 'not_started').length,
        pdiFailed: data.cars.filter((car: any) => car.pdiStatus === 'failed').length,
        customsCleared: data.cars.filter((car: any) => car.customsStatus === 'cleared').length,
        customsInProgress: data.cars.filter((car: any) => car.customsStatus === 'in_progress').length,
        softwareUpdated: data.cars.filter((car: any) => car.softwareStatus === 'updated').length,
        softwareOutdated: data.cars.filter((car: any) => car.softwareStatus === 'outdated').length,
        carsByLocation: data.cars.reduce((acc: any, car: any) => {
          acc[car.location] = (acc[car.location] || 0) + 1;
          return acc;
        }, {}),
        carsByStatus: data.cars.reduce((acc: any, car: any) => {
          acc[car.status] = (acc[car.status] || 0) + 1;
          return acc;
        }, {})
      };
      
      setStatusSummary(summary);
      
    } catch (error) {
      console.error('Error loading car status:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Memoized helper functions
  const getCarsByPDIStatus = useCallback((status: string) => {
    return carStatusData.filter((car: any) => car.pdiStatus === status);
  }, [carStatusData]);

  const getCarsByCustomsStatus = useCallback((status: string) => {
    return carStatusData.filter((car: any) => car.customsStatus === status);
  }, [carStatusData]);

  const getCarsBySoftwareStatus = useCallback((status: string) => {
    return carStatusData.filter((car: any) => car.softwareStatus === status);
  }, [carStatusData]);

  const getCarsByLocation = useCallback((location: string) => {
    return carStatusData.filter((car: any) => car.location === location);
  }, [carStatusData]);

  const getCarsNeedingAttention = useCallback(() => {
    return carStatusData.filter((car: any) => 
      car.pdiStatus === 'failed' || 
      car.customsStatus === 'blocked' || 
      car.softwareStatus === 'error'
    );
  }, [carStatusData]);

  const getCarsReadyForSale = useCallback(() => {
    return carStatusData.filter((car: any) => 
      car.pdiStatus === 'completed' && 
      car.customsStatus === 'cleared' && 
      car.softwareStatus === 'updated'
    );
  }, [carStatusData]);

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
    refresh: loadData
  };
};

// Optimized car mileage tracking hook
export const useOptimizedCarMileageTracking = () => {
  const [mileageData, setMileageData] = useOptimizedState([]);
  const [weeklySummary, setWeeklySummary] = useOptimizedState({});
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const data = await fetchWithPerformanceCache('car-mileage-data', async () => {
        const rawData = await quickLoadDashboardData();
        
        // Process mileage data efficiently
        const mileageRecords = rawData.mileageRecords || [];
        const carsWithMileage = rawData.cars.map((car: any) => {
          const carRecords = mileageRecords.filter((record: any) => record.vin === car.vin);
          const currentMileage = carRecords.length > 0 
            ? carRecords[carRecords.length - 1].mileage 
            : car.mileage || 0;
          
          // Calculate weekly average and total distance
          const weeklyAverage = carRecords.length > 0 
            ? carRecords[carRecords.length - 1].weeklyDistance || 0
            : 0;
          
          const totalDistance = carRecords.reduce((sum: number, record: any) => 
            sum + (record.weeklyDistance || 0), 0
          );
          
          return {
            ...car,
            currentMileage,
            weeklyAverage,
            totalDistance,
            lastMileageUpdate: carRecords.length > 0 
              ? carRecords[carRecords.length - 1].date 
              : new Date().toISOString(),
            mileageHistory: carRecords
          };
        });
        
        return {
          cars: carsWithMileage,
          mileageRecords
        };
      });

      setMileageData(data.cars);
      
      // Calculate weekly summary - match expected Dashboard structure
      const summary = {
        totalCars: data.cars.length,
        carsWithUpdates: data.cars.filter((car: any) => car.mileageHistory.length > 0).length,
        averageWeeklyDistance: (() => {
          const carsWithHistory = data.cars.filter((car: any) => car.mileageHistory.length > 0);
          if (carsWithHistory.length === 0) return 0;
          
          const totalWeeklyDistance = carsWithHistory.reduce((sum: number, car: any) => {
            const weeklyDistance = car.mileageHistory[car.mileageHistory.length - 1].weeklyDistance || 0;
            return sum + weeklyDistance;
          }, 0);
          
          return totalWeeklyDistance / carsWithHistory.length;
        })(),
        highestWeeklyDistance: (() => {
          const weeklyDistances = data.cars
            .filter((car: any) => car.mileageHistory.length > 0)
            .map((car: any) => car.mileageHistory[car.mileageHistory.length - 1].weeklyDistance || 0);
          return weeklyDistances.length > 0 ? Math.max(...weeklyDistances) : 0;
        })(),
        lowestWeeklyDistance: (() => {
          const weeklyDistances = data.cars
            .filter((car: any) => car.mileageHistory.length > 0)
            .map((car: any) => car.mileageHistory[car.mileageHistory.length - 1].weeklyDistance || 0);
          return weeklyDistances.length > 0 ? Math.min(...weeklyDistances) : 0;
        })(),
        carsNeedingUpdate: data.cars.filter((car: any) => {
          if (!car.lastMileageUpdate) return true;
          try {
            const lastUpdate = new Date(car.lastMileageUpdate);
            if (isNaN(lastUpdate.getTime())) return true;
            return (Date.now() - lastUpdate.getTime()) > 7 * 24 * 60 * 60 * 1000;
          } catch (error) {
            return true;
          }
        }).map((car: any) => car.vin)
      };
      
      setWeeklySummary(summary);
      
    } catch (error) {
      console.error('Error loading mileage data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getCarsNeedingMileageUpdate = useCallback(() => {
    return mileageData.filter((car: any) => {
      if (!car.lastMileageUpdate) return true;
      try {
        const lastUpdate = new Date(car.lastMileageUpdate);
        if (isNaN(lastUpdate.getTime())) return true;
        return (Date.now() - lastUpdate.getTime()) > 7 * 24 * 60 * 60 * 1000;
      } catch (error) {
        return true;
      }
    });
  }, [mileageData]);

  return {
    mileageData,
    weeklySummary: weeklySummary, // This should be named weeklySummary to match Dashboard expectations
    isLoading,
    getCarsNeedingMileageUpdate,
    refresh: loadData
  };
};

// Optimized dashboard data hook
export const useOptimizedDashboardData = () => {
  const [pendingRequests, setPendingRequests] = useOptimizedState(0);
  const [scheduledToday, setScheduledToday] = useOptimizedState(0);
  const [carsInGarage, setCarsInGarage] = useOptimizedState(0);
  const [lowStockItems, setLowStockItems] = useOptimizedState(0);
  const [recentActivity, setRecentActivity] = useOptimizedState([]);
  const [roleSpecificMetrics, setRoleSpecificMetrics] = useOptimizedState({});

  const loadData = useCallback(async () => {
    try {
      // Use batch loading for all dashboard metrics
      const results = await batchApiCalls([
        { key: 'pending-requests', fn: () => fetchWithPerformanceCache('pending-requests', async () => 0)},
        { key: 'scheduled-today', fn: () => fetchWithPerformanceCache('scheduled-today', async () => 0)},
        { key: 'cars-in-garage', fn: () => fetchWithPerformanceCache('cars-in-garage', async () => 0)},
        { key: 'low-stock-items', fn: () => fetchWithPerformanceCache('low-stock-items', async () => 0)},
        { key: 'recent-activity', fn: () => fetchWithPerformanceCache('recent-activity', async () => [])},
        { key: 'role-metrics', fn: () => fetchWithPerformanceCache('role-metrics', async () => ({}))}
      ]);

      setPendingRequests(results['pending-requests'] as number || 0);
      setScheduledToday(results['scheduled-today'] as number || 0);
      setCarsInGarage(results['cars-in-garage'] as number || 0);
      setLowStockItems(results['low-stock-items'] as number || 0);
      setRecentActivity(results['recent-activity'] as any[] || []);
      setRoleSpecificMetrics(results['role-metrics'] as any || {});
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    pendingRequests,
    scheduledToday,
    carsInGarage,
    lowStockItems,
    recentActivity,
    roleSpecificMetrics,
    refresh: loadData
  };
};

// Preload hook for critical data
export const usePreloadCriticalData = () => {
  useEffect(() => {
    // Preload critical data in background
    const preloadData = async () => {
      try {
        await quickLoadDashboardData();
        console.log('📦 Critical data preloaded successfully');
      } catch (error) {
        console.error('Error preloading critical data:', error);
      }
    };
    
    preloadData();
  }, []);
}; 