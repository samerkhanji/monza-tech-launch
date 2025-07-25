// Memory optimization utilities for Monza Tech

// Memory usage monitoring
export const monitorMemoryUsage = () => {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    const used = Math.round(memory.usedJSHeapSize / 1048576);
    const total = Math.round(memory.totalJSHeapSize / 1048576);
    const limit = Math.round(memory.jsHeapSizeLimit / 1048576);
    
    console.log('Memory Usage:', {
      used: `${used} MB`,
      total: `${total} MB`,
      limit: `${limit} MB`,
      percentage: `${Math.round((used / limit) * 100)}%`
    });
    
    // Warn if memory usage is high
    if (used > limit * 0.8) {
      console.warn('⚠️ High memory usage detected!');
      return true;
    }
    return false;
  }
  return false;
};

// Cleanup event listeners to prevent memory leaks
export const cleanupEventListeners = (element: HTMLElement) => {
  const clone = element.cloneNode(true);
  element.parentNode?.replaceChild(clone, element);
};

// Debounce function for performance
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle function for performance
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Virtual scrolling for large lists
export const createVirtualScroller = (
  container: HTMLElement,
  itemHeight: number,
  totalItems: number,
  renderItem: (index: number) => HTMLElement
) => {
  const visibleItems = Math.ceil(container.clientHeight / itemHeight);
  let startIndex = 0;
  let endIndex = Math.min(visibleItems, totalItems);
  
  const updateVisibleItems = () => {
    const scrollTop = container.scrollTop;
    startIndex = Math.floor(scrollTop / itemHeight);
    endIndex = Math.min(startIndex + visibleItems, totalItems);
    
    // Clear container
    container.innerHTML = '';
    
    // Add padding for invisible items
    const paddingTop = startIndex * itemHeight;
    const paddingBottom = (totalItems - endIndex) * itemHeight;
    
    if (paddingTop > 0) {
      const topPadding = document.createElement('div');
      topPadding.style.height = `${paddingTop}px`;
      container.appendChild(topPadding);
    }
    
    // Render visible items
    for (let i = startIndex; i < endIndex; i++) {
      container.appendChild(renderItem(i));
    }
    
    if (paddingBottom > 0) {
      const bottomPadding = document.createElement('div');
      bottomPadding.style.height = `${paddingBottom}px`;
      container.appendChild(bottomPadding);
    }
  };
  
  container.addEventListener('scroll', throttle(updateVisibleItems, 16));
  updateVisibleItems();
  
  return {
    update: updateVisibleItems,
    destroy: () => {
      container.removeEventListener('scroll', updateVisibleItems);
    }
  };
};

// WeakMap for caching expensive calculations
export const createWeakCache = <T extends object, R>() => {
  const cache = new WeakMap<T, R>();
  
  return {
    get: (key: T): R | undefined => cache.get(key),
    set: (key: T, value: R) => cache.set(key, value),
    has: (key: T): boolean => cache.has(key),
    delete: (key: T): boolean => cache.delete(key)
  };
};

// Memoization with size limit
export const createMemoizedFunction = <T extends (...args: any[]) => any>(
  fn: T,
  maxSize: number = 100
) => {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = fn(...args);
    
    if (cache.size >= maxSize) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    
    cache.set(key, result);
    return result;
  }) as T;
};

// Garbage collection helper
export const forceGarbageCollection = () => {
  if ('gc' in window) {
    (window as any).gc();
  }
};

// Memory leak detection
export const detectMemoryLeaks = () => {
  const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
  
  return {
    check: () => {
      const currentMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const increase = currentMemory - initialMemory;
      
      if (increase > 50 * 1024 * 1024) { // 50MB increase
        console.warn('⚠️ Potential memory leak detected!');
        return true;
      }
      return false;
    },
    getIncrease: () => {
      const currentMemory = (performance as any).memory?.usedJSHeapSize || 0;
      return Math.round((currentMemory - initialMemory) / 1024 / 1024);
    }
  };
}; 