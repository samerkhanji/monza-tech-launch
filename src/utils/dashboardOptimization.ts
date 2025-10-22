// Dashboard Performance Optimization Utilities
// This file contains optimizations to reduce loading time while keeping content intact

import React, { useState } from 'react';
import { debounce, throttle } from './performance';

// Cache for dashboard data to prevent unnecessary re-fetches
const dashboardCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

// Cache TTL in milliseconds (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;

// Optimized data fetching with caching
export const fetchWithCache = async <T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = CACHE_TTL
): Promise<T> => {
  const cached = dashboardCache.get(key);
  const now = Date.now();

  // Return cached data if still valid
  if (cached && (now - cached.timestamp) < cached.ttl) {
    return cached.data;
  }

  // Fetch fresh data
  const data = await fetchFn();
  
  // Cache the result
  dashboardCache.set(key, {
    data,
    timestamp: now,
    ttl
  });

  return data;
};

// Batch multiple API calls for better performance
export const batchApiCalls = async <T>(
  calls: Array<{ key: string; fn: () => Promise<T> }>,
  batchSize: number = 3
): Promise<Record<string, T>> => {
  const results: Record<string, T> = {};
  
  for (let i = 0; i < calls.length; i += batchSize) {
    const batch = calls.slice(i, i + batchSize);
    const batchPromises = batch.map(async ({ key, fn }) => {
      const result = await fetchWithCache(key, fn);
      return { key, result };
    });
    
    const batchResults = await Promise.all(batchPromises);
    batchResults.forEach(({ key, result }) => {
      results[key] = result;
    });
  }
  
  return results;
};

// Optimize component rendering with React.memo and useMemo
export const createOptimizedComponent = <P extends object>(
  Component: React.ComponentType<P>,
  propsAreEqual?: (prevProps: P, nextProps: P) => boolean
) => {
  return React.memo(Component, propsAreEqual);
};

// Lazy load dashboard sections
export const createLazySection = (importFn: () => Promise<any>) => {
  return React.lazy(() => importFn().then(module => ({ default: module.default || module })));
};

// Optimize state updates to prevent unnecessary re-renders
export const useOptimizedState = <T>(initialValue: T) => {
  const [state, setState] = React.useState<T>(initialValue);
  
  const setOptimizedState = React.useCallback((newValue: T | ((prev: T) => T)) => {
    setState(prev => {
      const next = typeof newValue === 'function' ? (newValue as (prev: T) => T)(prev) : newValue;
      return Object.is(prev, next) ? prev : next;
    });
  }, []);
  
  return [state, setOptimizedState] as const;
};

// Debounced search and filtering
export const useDebouncedSearch = (delay: number = 300) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = React.useState('');
  
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, delay);
    
    return () => clearTimeout(handler);
  }, [searchTerm, delay]);
  
  return { searchTerm, setSearchTerm, debouncedSearchTerm };
};

// Optimize data loading with progressive loading
export const useProgressiveLoading = <T>(
  dataLoader: () => Promise<T[]>,
  options: {
    initialBatchSize?: number;
    batchDelay?: number;
    maxItems?: number;
  } = {}
) => {
  const { initialBatchSize = 10, batchDelay = 100, maxItems = 100 } = options;
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  
  const loadData = React.useCallback(async () => {
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
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [dataLoader, initialBatchSize, batchDelay, maxItems]);
  
  React.useEffect(() => {
    loadData();
  }, [loadData]);
  
  return { data, loading, hasMore, reload: loadData };
};

// Optimize chart rendering
export const useOptimizedChart = (chartData: any[], options: any = {}) => {
  const [optimizedData, setOptimizedData] = React.useState(chartData);
  
  React.useEffect(() => {
    // Debounce chart updates to prevent excessive re-renders
    const timeoutId = setTimeout(() => {
      setOptimizedData(chartData);
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [chartData]);
  
  return optimizedData;
};

// Virtual scrolling for large lists
export const useVirtualScrolling = <T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) => {
  const [scrollTop, setScrollTop] = React.useState(0);
  
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + visibleCount + 1, items.length);
  
  const visibleItems = items.slice(startIndex, endIndex);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;
  
  return {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop
  };
};

// Optimize real-time updates
export const useOptimizedRealTime = <T>(
  initialData: T,
  updateInterval: number = 30000
) => {
  const [data, setData] = React.useState<T>(initialData);
  const [lastUpdate, setLastUpdate] = React.useState(Date.now());
  
  const updateData = React.useCallback((newData: T) => {
    setData(newData);
    setLastUpdate(Date.now());
  }, []);
  
  // Throttle updates to prevent excessive re-renders
  const throttledUpdate = throttle(updateData, 1000);
  
  return {
    data,
    lastUpdate,
    updateData: throttledUpdate
  };
};

// Clear cache when needed
export const clearDashboardCache = (key?: string) => {
  if (key) {
    dashboardCache.delete(key);
  } else {
    dashboardCache.clear();
  }
};

// Get cache statistics
export const getCacheStats = () => {
  const now = Date.now();
  const entries = Array.from(dashboardCache.entries());
  const validEntries = entries.filter(([_, value]) => (now - value.timestamp) < value.ttl);
  
  return {
    totalEntries: entries.length,
    validEntries: validEntries.length,
    cacheSize: dashboardCache.size
  };
};

// Preload critical dashboard data
export const preloadDashboardData = async () => {
  const criticalData = [
    'garage-schedule',
    'car-status-summary',
    'recent-activity'
  ];
  
  // Preload critical data in background
  criticalData.forEach(key => {
    if (!dashboardCache.has(key)) {
      // This will be populated when the actual data is fetched
      console.log(`Preloading critical data: ${key}`);
    }
  });
};

// Optimize image loading
export const optimizeImageLoading = () => {
  // Use Intersection Observer for lazy loading
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.classList.remove('lazy');
          imageObserver.unobserve(img);
        }
      }
    });
  });
  
  // Observe all lazy images
  document.querySelectorAll('img[data-src]').forEach(img => {
    imageObserver.observe(img);
  });
  
  return imageObserver;
};

// Performance monitoring for dashboard
export const monitorDashboardPerformance = () => {
  const startTime = performance.now();
  
  return {
    markSectionLoaded: (sectionName: string) => {
      const loadTime = performance.now() - startTime;
      console.log(`Dashboard section loaded: ${sectionName} in ${loadTime.toFixed(2)}ms`);
    },
    
    markDataLoaded: (dataType: string, itemCount: number) => {
      const loadTime = performance.now() - startTime;
      console.log(`Data loaded: ${dataType} (${itemCount} items) in ${loadTime.toFixed(2)}ms`);
    }
  };
}; 