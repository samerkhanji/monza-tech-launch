import { useEffect, useRef, useCallback } from 'react';

interface PerformanceMetrics {
  componentName: string;
  renderTime: number;
  timestamp: number;
}

interface UsePerformanceMonitorOptions {
  enabled?: boolean;
  threshold?: number; // Log only if render time exceeds threshold (ms)
  detailed?: boolean;
}

export const usePerformanceMonitor = (
  componentName: string,
  options: UsePerformanceMonitorOptions = {}
) => {
  const {
    enabled = process.env.NODE_ENV === 'development',
    threshold = 16, // 60fps = 16.67ms per frame
    detailed = false
  } = options;

  const renderStartTime = useRef<number>(0);
  const renderCount = useRef<number>(0);
  const totalRenderTime = useRef<number>(0);

  // Start performance measurement
  const startMeasurement = useCallback(() => {
    if (!enabled) return;
    renderStartTime.current = performance.now();
  }, [enabled]);

  // End performance measurement
  const endMeasurement = useCallback(() => {
    if (!enabled || renderStartTime.current === 0) return;
    
    const renderTime = performance.now() - renderStartTime.current;
    renderCount.current += 1;
    totalRenderTime.current += renderTime;

    const metrics: PerformanceMetrics = {
      componentName,
      renderTime,
      timestamp: Date.now()
    };

    // Log if exceeds threshold or detailed logging is enabled
    if (renderTime > threshold || detailed) {
      console.log(`🎯 Performance: ${componentName}`, {
        renderTime: `${renderTime.toFixed(2)}ms`,
        renderCount: renderCount.current,
        averageRenderTime: `${(totalRenderTime.current / renderCount.current).toFixed(2)}ms`,
        exceedsThreshold: renderTime > threshold
      });
    }

    // Store metrics for potential analysis
    if (typeof window !== 'undefined') {
      window.performanceMetrics = window.performanceMetrics || [];
      window.performanceMetrics.push(metrics);
      
      // Keep only last 100 measurements
      if (window.performanceMetrics.length > 100) {
        window.performanceMetrics = window.performanceMetrics.slice(-100);
      }
    }

    renderStartTime.current = 0;
  }, [enabled, componentName, threshold, detailed]);

  // Measure render cycles
  useEffect(() => {
    startMeasurement();
    return endMeasurement;
  });

  // Get performance summary
  const getPerformanceSummary = useCallback(() => {
    if (!enabled) return null;

    return {
      componentName,
      totalRenders: renderCount.current,
      totalTime: totalRenderTime.current,
      averageTime: renderCount.current > 0 ? totalRenderTime.current / renderCount.current : 0,
      lastRenderTime: renderStartTime.current > 0 ? performance.now() - renderStartTime.current : 0
    };
  }, [enabled, componentName]);

  return {
    startMeasurement,
    endMeasurement,
    getPerformanceSummary
  };
};

// Global performance utilities
export const getGlobalPerformanceMetrics = () => {
  if (typeof window === 'undefined') return [];
  return window.performanceMetrics || [];
};

export const clearPerformanceMetrics = () => {
  if (typeof window !== 'undefined') {
    window.performanceMetrics = [];
  }
};

// Analyze performance bottlenecks
export const analyzePerformance = () => {
  const metrics = getGlobalPerformanceMetrics();
  if (metrics.length === 0) return null;

  const componentStats = metrics.reduce((acc, metric) => {
    if (!acc[metric.componentName]) {
      acc[metric.componentName] = {
        count: 0,
        totalTime: 0,
        maxTime: 0,
        slowRenders: 0
      };
    }

    const stats = acc[metric.componentName];
    stats.count += 1;
    stats.totalTime += metric.renderTime;
    stats.maxTime = Math.max(stats.maxTime, metric.renderTime);
    
    if (metric.renderTime > 16) {
      stats.slowRenders += 1;
    }

    return acc;
  }, {} as Record<string, any>);

  // Calculate derived metrics
  Object.keys(componentStats).forEach(componentName => {
    const stats = componentStats[componentName];
    stats.averageTime = stats.totalTime / stats.count;
    stats.slowRenderPercentage = (stats.slowRenders / stats.count) * 100;
  });

  // Sort by performance impact (total time)
  const sortedComponents = Object.entries(componentStats)
    .sort(([, a], [, b]) => b.totalTime - a.totalTime)
    .map(([name, stats]) => ({ name, ...stats }));

  return {
    totalComponents: Object.keys(componentStats).length,
    totalMeasurements: metrics.length,
    topBottlenecks: sortedComponents.slice(0, 5),
    allComponents: sortedComponents
  };
};

// Extend window interface for TypeScript
declare global {
  interface Window {
    performanceMetrics?: PerformanceMetrics[];
  }
} 