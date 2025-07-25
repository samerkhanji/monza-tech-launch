// Performance optimization service
class PerformanceService {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private debounceTimers = new Map<string, NodeJS.Timeout>();

  // Cache data with TTL (Time To Live)
  setCache(key: string, data: any, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  // Get cached data if not expired
  getCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > cached.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  // Clear cache
  clearCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  // Debounce function calls
  debounce(key: string, fn: () => void, delay: number = 300): void {
    const existingTimer = this.debounceTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(() => {
      fn();
      this.debounceTimers.delete(key);
    }, delay);

    this.debounceTimers.set(key, timer);
  }

  // Throttle function calls
  throttle(fn: Function, delay: number = 100): Function {
    let lastCall = 0;
    return function (...args: any[]) {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        return fn.apply(this, args);
      }
    };
  }

  // Preload critical resources
  preloadResources(resources: string[]): void {
    resources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource;
      link.as = this.getResourceType(resource);
      document.head.appendChild(link);
    });
  }

  private getResourceType(resource: string): string {
    if (resource.endsWith('.js')) return 'script';
    if (resource.endsWith('.css')) return 'style';
    if (resource.endsWith('.woff2') || resource.endsWith('.woff')) return 'font';
    if (resource.endsWith('.png') || resource.endsWith('.jpg') || resource.endsWith('.webp')) return 'image';
    return 'fetch';
  }

  // Optimize images
  optimizeImage(url: string, width?: number, height?: number): string {
    // Add image optimization parameters
    const params = new URLSearchParams();
    if (width) params.append('w', width.toString());
    if (height) params.append('h', height.toString());
    params.append('q', '85'); // Quality
    params.append('f', 'auto'); // Format auto

    return `${url}?${params.toString()}`;
  }

  // Batch DOM updates
  batchDOMUpdates(updates: (() => void)[]): void {
    // Use requestAnimationFrame for smooth updates
    requestAnimationFrame(() => {
      updates.forEach(update => update());
    });
  }

  // Memory management
  cleanup(): void {
    this.cache.clear();
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
  }
}

export const performanceService = new PerformanceService();

// Auto cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    performanceService.cleanup();
  });
} 