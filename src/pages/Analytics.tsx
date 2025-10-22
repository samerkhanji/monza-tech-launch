
import React, { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { FileText } from 'lucide-react';

// Importing components
import SalesAnalytics from '@/components/analytics/SalesAnalytics';

// Importing data
import { 
  salesSourceData
} from '@/components/analytics/analyticsData';

const Analytics: React.FC = () => {
  const [period, setPeriod] = useState('month');
  const { user } = useAuth();
  const navigate = useNavigate();

  // If user is not an owner, redirect to dashboard
  if (user?.role?.toUpperCase() !== 'OWNER' && user?.role?.toLowerCase() !== 'sales') {
    toast({
      title: "Access Denied",
      description: "Only owners and sales staff can access the marketing analytics page.",
      variant: "destructive"
    });
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Marketing Analytics</h1>
          <p className="text-muted-foreground">
            Analyze sales performance, lead sources, and marketing effectiveness
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => navigate('/sales')}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Add Lead Source
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
        {/* Sales Analytics Section */}
        <SalesAnalytics data={salesSourceData} period={period} />
      </div>
    </div>
  );
};

export default Analytics;
