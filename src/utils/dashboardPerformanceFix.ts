// Dashboard Performance Fix - Comprehensive Solution
// This file addresses the slow dashboard loading by implementing multiple optimizations

import { useState, useEffect, useCallback, useMemo } from 'react';

// Performance cache with TTL
const performanceCache = new Map<string, { data: any; timestamp: number; ttl: number }>();
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes cache

// Optimized data fetching with caching
export const fetchWithPerformanceCache = async <T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = CACHE_TTL
): Promise<T> => {
  const cached = performanceCache.get(key);
  const now = Date.now();

  if (cached && (now - cached.timestamp) < cached.ttl) {
    console.log(`🚀 Cache hit for ${key}`);
    return cached.data;
  }

  console.log(`📡 Fetching fresh data for ${key}`);
  const data = await fetchFn();
  
  performanceCache.set(key, {
    data,
    timestamp: now,
    ttl
  });

  return data;
};

// Batch API calls for parallel execution
export const batchApiCalls = async <T extends Record<string, any>>(
  calls: Array<{ key: string; fn: () => Promise<any> }>
): Promise<T> => {
  const startTime = performance.now();
  
  const promises = calls.map(async ({ key, fn }) => {
    try {
      const result = await fn();
      return { key, result, success: true };
    } catch (error) {
      console.error(`Error in batch call ${key}:`, error);
      return { key, result: null, success: false };
    }
  });

  const results = await Promise.all(promises);
  const endTime = performance.now();
  
  console.log(`⚡ Batch API calls completed in ${(endTime - startTime).toFixed(2)}ms`);
  
  return results.reduce((acc, { key, result, success }) => {
    if (success) {
      (acc as any)[key] = result;
    }
    return acc;
  }, {} as T);
};

// Optimized state management
export const useOptimizedState = <T>(initialValue: T) => {
  const [state, setState] = useState<T>(initialValue);
  
  const setOptimizedState = useCallback((newValue: T | ((prev: T) => T)) => {
    setState(prev => {
      const nextValue = typeof newValue === 'function' ? (newValue as (prev: T) => T)(prev) : newValue;
      // Only update if value actually changed
      return JSON.stringify(prev) === JSON.stringify(nextValue) ? prev : nextValue;
    });
  }, []);

  return [state, setOptimizedState] as const;
};

// Progressive loading hook
export const useProgressiveLoading = <T>(
  dataLoader: () => Promise<T[]>,
  options: {
    initialBatchSize?: number;
    batchDelay?: number;
    maxItems?: number;
  } = {}
) => {
  const { initialBatchSize = 10, batchDelay = 100, maxItems = 50 } = options;
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const allData = await dataLoader();
      const initialData = allData.slice(0, initialBatchSize);
      setData(initialData);
      setHasMore(allData.length > initialBatchSize);
      
      // Load remaining data progressively
      if (allData.length > initialBatchSize) {
        setTimeout(() => {
          const remainingData = allData.slice(initialBatchSize, maxItems);
          setData(prev => [...prev, ...remainingData]);
          setHasMore(allData.length > maxItems);
        }, batchDelay);
      }
    } catch (error) {
      console.error('Error in progressive loading:', error);
    } finally {
      setLoading(false);
    }
  }, [dataLoader, initialBatchSize, batchDelay, maxItems]);
  
  useEffect(() => {
    loadData();
  }, [loadData]);
  
  return { data, loading, hasMore, reload: loadData };
};

// Debounced search hook
export const useDebouncedSearch = (delay: number = 300) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, delay);

    return () => clearTimeout(timer);
  }, [searchTerm, delay]);

  return { searchTerm, setSearchTerm, debouncedTerm };
};

// Performance monitoring
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<Record<string, number>>({});
  
  const markStart = useCallback((name: string) => {
    const startTime = performance.now();
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      setMetrics(prev => ({ ...prev, [name]: duration }));
      console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
    };
  }, []);

  return { markStart, metrics };
};

// Optimized localStorage operations
export const optimizedLocalStorage = {
  get: (key: string, defaultValue: any = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error reading localStorage key ${key}:`, error);
      return defaultValue;
    }
  },
  
  set: (key: string, value: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing localStorage key ${key}:`, error);
    }
  },
  
  getMultiple: (keys: string[]) => {
    return keys.reduce((acc, key) => {
      acc[key] = optimizedLocalStorage.get(key, []);
      return acc;
    }, {} as Record<string, any>);
  }
};

// Data normalization utility
export const normalizeCarData = (rawData: any[]) => {
  return rawData.map(car => ({
    id: car.id || car.vin || `car_${Date.now()}_${Math.random()}`,
    vin: car.vin || car.vinNumber || 'Unknown',
    model: car.model || car.make || car.brand || 'Unknown Model',
    location: car.location || car.source || 'Unknown',
    status: car.status || 'unknown',
    pdiStatus: car.pdiStatus || 'not_started',
    customsStatus: car.customsStatus || 'pending',
    softwareStatus: car.softwareStatus || 'pending_update',
    lastUpdated: car.lastUpdated || new Date().toISOString(),
    mileage: car.mileage || car.range || car.odometer || 0
  }));
};

// Quick data loading for dashboard
export const quickLoadDashboardData = async () => {
  const startTime = performance.now();
  
  try {
    // Load all localStorage data in parallel
    const storageKeys = [
      'carInventory',
      'garageInventory', 
      'showroomFloor1',
      'showroomFloor2',
      'garageCarInventory',
      'inventoryFloor2',
      'garageSchedules',
      'carMileageRecords'
    ];

    const rawData = optimizedLocalStorage.getMultiple(storageKeys);
    
    // Check if any data exists
    const hasAnyData = storageKeys.some(key => rawData[key] && rawData[key].length > 0);
    
    if (!hasAnyData) {
      // No data found, return empty result early
      console.log('📊 No dashboard data found in localStorage');
      return {
        cars: [],
        schedules: [],
        mileageRecords: [],
        loadTime: performance.now() - startTime
      };
    }
    
    // Process data efficiently (only if data exists)
    const allCars = [
      ...(rawData.carInventory || []).map((car: any) => ({ ...car, source: 'carInventory' })),
      ...(rawData.garageInventory || []).map((car: any) => ({ ...car, source: 'garageInventory' })),
      ...(rawData.showroomFloor1 || []).map((car: any) => ({ ...car, source: 'showroomFloor1' })),
      ...(rawData.showroomFloor2 || []).map((car: any) => ({ ...car, source: 'showroomFloor2' })),
      ...(rawData.garageCarInventory || []).map((car: any) => ({ ...car, source: 'garageCarInventory' })),
      ...(rawData.inventoryFloor2 || []).map((car: any) => ({ ...car, source: 'inventoryFloor2' }))
    ];

    const normalizedCars = normalizeCarData(allCars);
    
    const endTime = performance.now();
    console.log(`🚀 Dashboard data loaded in ${(endTime - startTime).toFixed(2)}ms`);
    
    return {
      cars: normalizedCars,
      schedules: rawData.garageSchedules || [],
      mileageRecords: rawData.carMileageRecords || [],
      loadTime: endTime - startTime
    };
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    return {
      cars: [],
      schedules: [],
      mileageRecords: [],
      loadTime: 0
    };
  }
};

// Preload critical data
export const preloadCriticalData = () => {
  // Preload data in background
  setTimeout(() => {
    quickLoadDashboardData().then(data => {
      console.log(`📦 Preloaded ${data.cars.length} cars, ${data.schedules.length} schedules`);
    });
  }, 100);
};

// Clear performance cache
export const clearPerformanceCache = () => {
  performanceCache.clear();
  console.log('🧹 Performance cache cleared');
};

// Get cache statistics
export const getCacheStats = () => {
  const now = Date.now();
  const validEntries = Array.from(performanceCache.entries()).filter(
    ([_, value]) => (now - value.timestamp) < value.ttl
  );
  
  return {
    totalEntries: performanceCache.size,
    validEntries: validEntries.length,
    cacheHitRate: validEntries.length / Math.max(performanceCache.size, 1)
  };
}; 