import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getCacheStats, clearPerformanceCache } from '@/utils/dashboardPerformanceFix';
import { Zap, Clock, Database, RefreshCw } from 'lucide-react';

interface PerformanceMetrics {
  dashboardLoadTime: number;
  cacheHitRate: number;
  totalCacheEntries: number;
  validCacheEntries: number;
}

const DashboardPerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    dashboardLoadTime: 0,
    cacheHitRate: 0,
    totalCacheEntries: 0,
    validCacheEntries: 0
  });
  const [isVisible, setIsVisible] = useState(false);

  const updateMetrics = () => {
    const cacheStats = getCacheStats();
    setMetrics(prev => ({
      ...prev,
      cacheHitRate: cacheStats.cacheHitRate,
      totalCacheEntries: cacheStats.totalEntries,
      validCacheEntries: cacheStats.validEntries
    }));
  };

  useEffect(() => {
    // Update metrics every 5 seconds
    const interval = setInterval(updateMetrics, 5000);
    updateMetrics(); // Initial update
    
    return () => clearInterval(interval);
  }, []);

  const handleClearCache = () => {
    clearPerformanceCache();
    updateMetrics();
  };

  // Only show in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsVisible(!isVisible)}
        className="mb-2"
      >
        <Zap className="w-4 h-4 mr-2" />
        Performance
      </Button>
      
      {isVisible && (
        <Card className="w-80">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Performance Monitor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Cache Hit Rate:</span>
              <Badge variant={metrics.cacheHitRate > 0.5 ? "default" : "secondary"}>
                {(metrics.cacheHitRate * 100).toFixed(1)}%
              </Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm">Cache Entries:</span>
              <Badge variant="outline">
                {metrics.validCacheEntries}/{metrics.totalCacheEntries}
              </Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm">Load Time:</span>
              <Badge variant={metrics.dashboardLoadTime < 1000 ? "default" : "destructive"}>
                {metrics.dashboardLoadTime}ms
              </Badge>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearCache}
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Clear Cache
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DashboardPerformanceMonitor; 