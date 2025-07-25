import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Zap, HardDrive, Activity } from 'lucide-react';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  bundleSize: number;
}

export const PerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    renderTime: 0,
    memoryUsage: 0,
    bundleSize: 0
  });

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV !== 'development') return;

    // Measure page load time
    const measureLoadTime = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        const loadTime = navigation.loadEventEnd - navigation.loadEventStart;
        setMetrics(prev => ({ ...prev, loadTime }));
      }
    };

    // Measure render time
    const measureRenderTime = () => {
      const renderTime = performance.now();
      setMetrics(prev => ({ ...prev, renderTime }));
    };

    // Measure memory usage
    const measureMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // MB
        setMetrics(prev => ({ ...prev, memoryUsage }));
      }
    };

    // Initial measurements
    measureLoadTime();
    measureRenderTime();
    measureMemory();

    // Update metrics every 5 seconds
    const interval = setInterval(() => {
      measureMemory();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Only render in development
  if (process.env.NODE_ENV !== 'development') return null;

  const getPerformanceColor = (value: number, threshold: number) => {
    if (value <= threshold * 0.7) return 'bg-green-100 text-green-800';
    if (value <= threshold) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-80 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Performance Monitor
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Load Time:</span>
            </div>
            <Badge className={getPerformanceColor(metrics.loadTime, 3000)}>
              {metrics.loadTime.toFixed(0)}ms
            </Badge>
          </div>
          
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              <span>Render Time:</span>
            </div>
            <Badge className={getPerformanceColor(metrics.renderTime, 16)}>
              {metrics.renderTime.toFixed(1)}ms
            </Badge>
          </div>
          
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <HardDrive className="h-3 w-3" />
              <span>Memory:</span>
            </div>
            <Badge className={getPerformanceColor(metrics.memoryUsage, 100)}>
              {metrics.memoryUsage.toFixed(1)}MB
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 