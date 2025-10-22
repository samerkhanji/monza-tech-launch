import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchWithCache, batchApiCalls, useOptimizedState } from '@/utils/dashboardOptimization';

// Optimized garage schedule data hook
export const useOptimizedGarageSchedule = () => {
  const [scheduleData, setScheduleData] = useOptimizedState([]);
  const [carsBeingWorked, setCarsBeingWorked] = useOptimizedState([]);
  const [carStatusCounts, setCarStatusCounts] = useOptimizedState({});
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Batch load all garage data
      const results = await batchApiCalls([
        { key: 'garage-schedule', fn: () => fetchWithCache('garage-schedule', async () => {
          // Mock data for now - replace with actual API call
          return [];
        })},
        { key: 'cars-being-worked', fn: () => fetchWithCache('cars-being-worked', async () => {
          // Mock data for now - replace with actual API call
          return [];
        })},
        { key: 'car-status-counts', fn: () => fetchWithCache('car-status-counts', async () => {
          // Mock data for now - replace with actual API call
          return {};
        })}
      ]);

      setScheduleData(results['garage-schedule'] as any[] || []);
      setCarsBeingWorked(results['cars-being-worked'] as any[] || []);
      setCarStatusCounts(results['car-status-counts'] as any || {});
      
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
export const useOptimizedCarStatus = () => {
  const [carStatusData, setCarStatusData] = useOptimizedState([]);
  const [statusSummary, setStatusSummary] = useOptimizedState({ totalCars: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const results = await batchApiCalls([
        { key: 'car-status-data', fn: () => fetchWithCache('car-status-data', async () => {
          // Mock data for now - replace with actual API call
          return [];
        })},
        { key: 'status-summary', fn: () => fetchWithCache('status-summary', async () => {
          // Mock data for now - replace with actual API call
          return [{ totalCars: 0 }];
        })}
      ]);

      setCarStatusData(results['car-status-data'] as any[] || []);
      setStatusSummary(results['status-summary'] as any || { totalCars: 0 });
      
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
export const useOptimizedCarMileage = () => {
  const [mileageData, setMileageData] = useOptimizedState([]);
  const [weeklySummary, setWeeklySummary] = useOptimizedState({});
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const results = await batchApiCalls([
        { key: 'mileage-data', fn: () => fetchWithCache('mileage-data', async () => {
          // Mock data for now - replace with actual API call
          return [];
        })},
        { key: 'weekly-summary', fn: () => fetchWithCache('weekly-summary', async () => {
          // Mock data for now - replace with actual API call
          return {};
        })}
      ]);

      setMileageData(results['mileage-data'] as any[] || []);
      setWeeklySummary(results['weekly-summary'] as any || {});
      
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
    return mileageData.filter((car: any) => 
      !car.lastMileageUpdate || 
      (Date.now() - new Date(car.lastMileageUpdate).getTime()) > 7 * 24 * 60 * 60 * 1000
    );
  }, [mileageData]);

  return {
    mileageData,
    weeklySummary,
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
      const results = await batchApiCalls([
        { key: 'pending-requests', fn: () => fetchWithCache('pending-requests', async () => 0)},
        { key: 'scheduled-today', fn: () => fetchWithCache('scheduled-today', async () => 0)},
        { key: 'cars-in-garage', fn: () => fetchWithCache('cars-in-garage', async () => 0)},
        { key: 'low-stock-items', fn: () => fetchWithCache('low-stock-items', async () => 0)},
        { key: 'recent-activity', fn: () => fetchWithCache('recent-activity', async () => [])},
        { key: 'role-metrics', fn: () => fetchWithCache('role-metrics', async () => ({}))}
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

// Optimized time tracking dashboard hook
export const useOptimizedTimeTracking = () => {
  const [timeTrackingData, setTimeTrackingData] = useOptimizedState([]);
  const [filteredData, setFilteredData] = useOptimizedState([]);
  const [employeePerformance, setEmployeePerformance] = useOptimizedState([]);
  const [activityAnalytics, setActivityAnalytics] = useOptimizedState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      const results = await batchApiCalls([
        { key: 'time-tracking', fn: () => fetchWithCache('time-tracking', async () => [])},
        { key: 'employee-performance', fn: () => fetchWithCache('employee-performance', async () => [])},
        { key: 'activity-analytics', fn: () => fetchWithCache('activity-analytics', async () => [])}
      ]);

      setTimeTrackingData(results['time-tracking'] || []);
      setEmployeePerformance(results['employee-performance'] || []);
      setActivityAnalytics(results['activity-analytics'] || []);
      
    } catch (error) {
      console.error('Error loading time tracking data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    timeTrackingData,
    filteredData,
    employeePerformance,
    activityAnalytics,
    loading,
    refresh: loadData
  };
};

// Optimized AI productivity dashboard hook
export const useOptimizedAIProductivity = () => {
  const [weeklyData, setWeeklyData] = useOptimizedState([]);
  const [currentWeekData, setCurrentWeekData] = useOptimizedState(null);
  const [mechanicPerformance, setMechanicPerformance] = useOptimizedState([]);
  const [aiInsights, setAiInsights] = useOptimizedState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      const results = await batchApiCalls([
        { key: 'weekly-data', fn: () => fetchWithCache('weekly-data', async () => [])},
        { key: 'current-week', fn: () => fetchWithCache('current-week', async () => null)},
        { key: 'mechanic-performance', fn: () => fetchWithCache('mechanic-performance', async () => [])},
        { key: 'ai-insights', fn: () => fetchWithCache('ai-insights', async () => [])}
      ]);

      setWeeklyData(results['weekly-data'] || []);
      setCurrentWeekData(results['current-week'] || null);
      setMechanicPerformance(results['mechanic-performance'] || []);
      setAiInsights(results['ai-insights'] || []);
      
    } catch (error) {
      console.error('Error loading AI productivity data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    weeklyData,
    currentWeekData,
    mechanicPerformance,
    aiInsights,
    loading,
    refresh: loadData
  };
}; 