
import React, { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { FileText } from 'lucide-react';

// Importing components
import EmployeePerformance from '@/components/analytics/EmployeePerformance';
import PartsUsageSection from '@/components/analytics/PartsUsageSection';

// Importing data
import { 
  employeePerformance, 
  partUsageData, 
  carModelRepairs, 
  COLORS
} from '@/components/analytics/analyticsData';

const RepairAnalytics: React.FC = () => {
  const [period, setPeriod] = useState('month');
  const { user } = useAuth();

  // If user is not an owner or garage manager, redirect to dashboard
  if (user?.role?.toUpperCase() !== 'OWNER' && user?.role?.toLowerCase() !== 'garage_manager') {
    toast({
      title: "Access Denied",
      description: "Only owners and garage managers can access repair analytics.",
      variant: "destructive"
    });
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Repair Analytics</h1>
          <p className="text-muted-foreground">
            Analyze repair patterns, parts usage, and performance metrics
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            id="periodFilter"
            name="periodFilter"
            className="h-10 rounded-md border border-input bg-background px-3 py-2"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">Last Year</option>
          </select>
        </div>
      </div>

      <div className="space-y-8">
        {/* Employee Performance Section */}
        <EmployeePerformance data={employeePerformance} />

        {/* Parts Usage Analysis */}
        <PartsUsageSection 
          partUsageData={partUsageData}
          carModelRepairs={carModelRepairs}
          colors={COLORS}
        />
      </div>
    </div>
  );
};

export default RepairAnalytics;
