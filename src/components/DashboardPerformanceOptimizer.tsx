import React, { useEffect, useRef } from 'react';
import { quickPerformanceMonitor, preloadQuickData, optimizeQuickImages } from '@/utils/quickDashboardOptimization';

interface DashboardPerformanceOptimizerProps {
  children: React.ReactNode;
  enablePreloading?: boolean;
  enableImageOptimization?: boolean;
  enableMonitoring?: boolean;
}

const DashboardPerformanceOptimizer: React.FC<DashboardPerformanceOptimizerProps> = ({
  children,
  enablePreloading = true,
  enableImageOptimization = true,
  enableMonitoring = true
}) => {
  const monitor = useRef(quickPerformanceMonitor());
  const imageObserver = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Start performance monitoring
    if (enableMonitoring) {
      monitor.current.mark('Dashboard Performance Optimizer initialized');
    }

    // Preload critical data
    if (enablePreloading) {
      preloadQuickData();
      monitor.current.mark('Critical data preloaded');
    }

    // Optimize image loading
    if (enableImageOptimization) {
      imageObserver.current = optimizeQuickImages();
      monitor.current.mark('Image optimization enabled');
    }

    // Cleanup
    return () => {
      if (imageObserver.current) {
        imageObserver.current.disconnect();
      }
    };
  }, [enablePreloading, enableImageOptimization, enableMonitoring]);

  return <>{children}</>;
};

export default DashboardPerformanceOptimizer; 