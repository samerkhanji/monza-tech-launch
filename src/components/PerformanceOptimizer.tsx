import React, { useEffect } from 'react';
import { performanceService } from '@/services/performanceService';

interface PerformanceOptimizerProps {
  children: React.ReactNode;
}

export const PerformanceOptimizer: React.FC<PerformanceOptimizerProps> = ({ children }) => {
  useEffect(() => {
    // Preload critical resources
    const criticalResources = [
      '/src/components/ui/button.tsx',
      '/src/components/ui/card.tsx',
      '/src/components/ui/table.tsx',
      '/src/components/ui/dialog.tsx',
    ];

    performanceService.preloadResources(criticalResources);

    // Optimize images
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (img.src && !img.src.includes('?')) {
        img.src = performanceService.optimizeImage(img.src);
      }
    });

    // Add performance monitoring
    if (process.env.NODE_ENV === 'development') {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            console.log('Page Load Time:', navEntry.loadEventEnd - navEntry.loadEventStart, 'ms');
          }
        });
      });
      
      observer.observe({ entryTypes: ['navigation'] });
    }

    // Optimize scroll performance
    const optimizeScroll = () => {
      const elements = document.querySelectorAll('.scroll-optimize');
      elements.forEach(element => {
        if (element instanceof HTMLElement) {
          element.style.willChange = 'transform';
        }
      });
    };

    optimizeScroll();

    // Cleanup on unmount
    return () => {
      performanceService.cleanup();
    };
  }, []);

  return <>{children}</>;
};

// HOC for performance optimization
export const withPerformanceOptimization = <P extends object>(
  Component: React.ComponentType<P>
) => {
  return React.memo((props: P) => (
    <PerformanceOptimizer>
      <Component {...props} />
    </PerformanceOptimizer>
  ));
}; 