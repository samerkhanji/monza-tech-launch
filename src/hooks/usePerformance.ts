import { useCallback, useRef, useEffect, useState, useMemo } from 'react';
import { performanceService } from '@/services/performanceService';

// Hook for debounced state updates
export const useDebounce = <T>(value: T, delay: number = 300): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Hook for throttled function calls
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 100
): T => {
  const lastCall = useRef(0);
  const lastCallTimer = useRef<NodeJS.Timeout>();

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCall.current >= delay) {
        lastCall.current = now;
        return callback(...args);
      } else {
        if (lastCallTimer.current) {
          clearTimeout(lastCallTimer.current);
        }
        lastCallTimer.current = setTimeout(() => {
          lastCall.current = Date.now();
          callback(...args);
        }, delay - (now - lastCall.current));
      }
    },
    [callback, delay]
  ) as T;
};

// Hook for memoized expensive calculations
export const useMemoizedValue = <T>(
  factory: () => T,
  dependencies: any[],
  cacheKey?: string
): T => {
  const cacheKeyRef = useRef(cacheKey || JSON.stringify(dependencies));
  
  return useMemo(() => {
    if (cacheKey) {
      const cached = performanceService.getCache(cacheKey);
      if (cached !== null) {
        return cached;
      }
    }
    
    const result = factory();
    
    if (cacheKey) {
      performanceService.setCache(cacheKey, result, 5 * 60 * 1000); // 5 minutes
    }
    
    return result;
  }, dependencies);
};

// Hook for intersection observer (lazy loading)
export const useIntersectionObserver = (
  callback: () => void,
  options: IntersectionObserverInit = {}
) => {
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          callback();
          observer.unobserve(entry.target);
        }
      });
    }, options);

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [callback, options]);

  return elementRef;
};

// Hook for performance monitoring
export const usePerformanceMonitor = (componentName: string) => {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(performance.now());

  useEffect(() => {
    renderCount.current += 1;
    const currentTime = performance.now();
    const renderTime = currentTime - lastRenderTime.current;
    
    if (renderTime > 16) { // Longer than one frame (16ms)
      console.warn(`${componentName} took ${renderTime.toFixed(2)}ms to render (render #${renderCount.current})`);
    }
    
    lastRenderTime.current = currentTime;
  });

  return {
    renderCount: renderCount.current,
    getRenderTime: () => performance.now() - lastRenderTime.current
  };
};

// Hook for optimized list rendering
export const useOptimizedList = <T>(
  items: T[],
  pageSize: number = 50
) => {
  const [visibleItems, setVisibleItems] = useState<T[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    setVisibleItems(items.slice(startIndex, endIndex));
  }, [items, currentPage, pageSize]);

  const loadMore = useCallback(() => {
    setCurrentPage(prev => prev + 1);
  }, []);

  const hasMore = currentPage * pageSize < items.length;

  return {
    visibleItems,
    loadMore,
    hasMore,
    currentPage,
    totalItems: items.length
  };
}; 