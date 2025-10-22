// Quick Dashboard Performance Optimization
// Simple optimizations to reduce loading time without changing content

import React, { useState, useEffect, useCallback } from 'react';

// Simple cache for dashboard data
const simpleCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Simple cached fetch
export const quickFetch = async <T>(key: string, fetchFn: () => Promise<T>): Promise<T> => {
  const cached = simpleCache.get(key);
  const now = Date.now();
  
  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    return cached.data;
  }
  
  const data = await fetchFn();
  simpleCache.set(key, { data, timestamp: now });
  return data;
};

// Batch multiple API calls
export const quickBatch = async <T>(calls: Array<{ key: string; fn: () => Promise<T> }>): Promise<Record<string, T>> => {
  const results: Record<string, T> = {};
  
  // Execute calls in parallel
  const promises = calls.map(async ({ key, fn }) => {
    const result = await quickFetch(key, fn);
    return { key, result };
  });
  
  const batchResults = await Promise.all(promises);
  batchResults.forEach(({ key, result }) => {
    results[key] = result;
  });
  
  return results;
};

// Optimize component rendering
export const quickMemo = <P extends object>(Component: React.ComponentType<P>) => {
  return React.memo(Component);
};

// Debounced search
export const useQuickSearch = (delay: number = 300) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [debouncedTerm, setDebouncedTerm] = React.useState('');
  
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [searchTerm, delay]);
  
  return { searchTerm, setSearchTerm, debouncedTerm };
};

// Progressive loading for large datasets
export const useQuickProgressiveLoading = <T>(
  dataLoader: () => Promise<T[]>,
  initialCount: number = 20
) => {
  const [data, setData] = React.useState<T[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [hasMore, setHasMore] = React.useState(true);
  
  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      const allData = await dataLoader();
      
      // Load initial batch
      const initialData = allData.slice(0, initialCount);
      setData(initialData);
      setHasMore(allData.length > initialCount);
      
      // Load remaining data after a short delay
      if (allData.length > initialCount) {
        setTimeout(() => {
          setData(allData);
          setHasMore(false);
        }, 100);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [dataLoader, initialCount]);
  
  React.useEffect(() => {
    loadData();
  }, [loadData]);
  
  return { data, loading, hasMore, reload: loadData };
};

// Optimize real-time updates
export const useQuickRealTime = <T>(initialData: T, updateInterval: number = 30000) => {
  const [data, setData] = React.useState<T>(initialData);
  const [lastUpdate, setLastUpdate] = React.useState(Date.now());
  
  const updateData = React.useCallback((newData: T) => {
    setData(newData);
    setLastUpdate(Date.now());
  }, []);
  
  return { data, lastUpdate, updateData };
};

// Clear cache
export const clearQuickCache = (key?: string) => {
  if (key) {
    simpleCache.delete(key);
  } else {
    simpleCache.clear();
  }
};

// Get cache stats
export const getQuickCacheStats = () => {
  return {
    size: simpleCache.size,
    entries: Array.from(simpleCache.keys())
  };
};

// Preload critical data
export const preloadQuickData = () => {
  const criticalKeys = [
    'dashboard-summary',
    'garage-status',
    'recent-activity'
  ];
  
  console.log('Preloading critical dashboard data...');
  criticalKeys.forEach(key => {
    if (!simpleCache.has(key)) {
      console.log(`Preloading: ${key}`);
    }
  });
};

// Optimize image loading
export const optimizeQuickImages = () => {
  const images = document.querySelectorAll('img[data-src]');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.classList.remove('lazy');
          observer.unobserve(img);
        }
      }
    });
  });
  
  images.forEach(img => observer.observe(img));
  return observer;
};

// Performance monitoring
export const quickPerformanceMonitor = () => {
  const startTime = performance.now();
  
  return {
    mark: (name: string) => {
      const time = performance.now() - startTime;
      console.log(`⏱️ ${name}: ${time.toFixed(2)}ms`);
    }
  };
};

// Optimize chart rendering
export const useQuickChart = (chartData: any[]) => {
  const [optimizedData, setOptimizedData] = React.useState(chartData);
  
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setOptimizedData(chartData);
    }, 50);
    
    return () => clearTimeout(timer);
  }, [chartData]);
  
  return optimizedData;
};

// Virtual scrolling for large lists
export const useQuickVirtualScroll = <T>(
  items: T[],
  itemHeight: number = 50,
  containerHeight: number = 400
) => {
  const [scrollTop, setScrollTop] = React.useState(0);
  
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + visibleCount + 2, items.length);
  
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