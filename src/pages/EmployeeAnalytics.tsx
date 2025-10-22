import React, { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Database } from 'lucide-react';

// Importing components
import MechanicPerformanceAnalytics from '@/components/analytics/MechanicPerformanceAnalytics';

const EmployeeAnalytics: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Always call hooks at the top level - BEFORE any conditional returns  
  const [period, setPeriod] = useState('month');
  const [mechanicData, setMechanicData] = useState<any[]>([]);

  useEffect(() => {
    // Hook called unconditionally at top level
    // Only load data if user has proper access
    if (user?.role?.toUpperCase() === 'OWNER' || user?.role?.toLowerCase() === 'garage_manager') {
      // Load mechanic data here
    }
  }, [period, user]);

  // Simulate fetching repair data from repairs and garage sections
  useEffect(() => {
    // Only fetch data if user has access
    if (user?.role?.toUpperCase() !== 'OWNER' && user?.role?.toLowerCase() !== 'garage_manager') {
      return;
    }

    // This would be replaced with actual API calls in a real implementation
    // This would be replaced with actual API calls in a real implementation
    const fetchRepairData = () => {
      // Simulated mechanic performance data derived from repair records
      const mechanicsPerformanceData = [
        {
          name: "Ali Hassan",
          completedRepairs: 18,
          avgRepairTime: 2.3,
          onTimeRate: 92,
          specialization: "Engine",
          mostRepairedCar: "Voyah Free 2024"
        },
        {
          name: "Walid Nassar",
          completedRepairs: 15,
          avgRepairTime: 1.8,
          onTimeRate: 96,
          specialization: "Electrical",
          mostRepairedCar: "Voyah Dream 2024"
        },
        {
          name: "Fadi Abboud",
          completedRepairs: 22,
          avgRepairTime: 2.7,
          onTimeRate: 88,
          specialization: "Brakes",
          mostRepairedCar: "MHero 917 2024"
        },
        {
          name: "Tarek Karam",
          completedRepairs: 12,
          avgRepairTime: 3.1,
          onTimeRate: 85,
          specialization: "Suspension",
          mostRepairedCar: "Voyah Courage 2025"
        }
      ];
      
      setMechanicData(mechanicsPerformanceData);
    };

    fetchRepairData();
  }, [user]);

  // Conditional logic after hooks
  if (user?.role?.toUpperCase() !== 'OWNER' && user?.role?.toLowerCase() !== 'garage_manager') {
    toast({
      title: "Access Denied",
      description: "Only owners and garage managers can access employee analytics.",
      variant: "destructive"
    });
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Employee Analytics</h1>
          <p className="text-muted-foreground">
            Track individual employee performance and productivity metrics
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => navigate('/repairs')}
            className="flex items-center gap-2"
          >
            <Database className="h-4 w-4" />
            View Repairs
          </Button>
          
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
        {/* Mechanics Performance Analytics */}
        <MechanicPerformanceAnalytics data={mechanicData} period={period} />
      </div>
    </div>
  );
};

export default EmployeeAnalytics;
