import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Database } from 'lucide-react';

interface HealthCheck {
  name: string;
  status: 'healthy' | 'warning' | 'error';
  message: string;
  lastChecked: string;
}

const DatabaseHealthMonitor: React.FC = () => {
  // Temporarily disabled to prevent Supabase CORS/Auth errors
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Health Monitor
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-gray-500">
          <Database className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="mb-2">Database monitoring temporarily disabled</p>
          <p className="text-sm">Prevents Supabase CORS and authentication errors</p>
          <p className="text-xs mt-4 text-gray-400">Will be re-enabled once authentication is configured</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default DatabaseHealthMonitor;
