import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart3 } from 'lucide-react';

const GarageScheduleHeader: React.FC = () => {
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Monza S.A.L. Garage</h1>
        <p className="text-muted-foreground mt-1">
          Daily car assignments and worker management system
        </p>
        <p className="text-lg text-gray-600 mt-1">
          {today}
        </p>
      </div>
      
      <div className="flex items-center gap-3">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => window.location.href = '/repairs'}
          className="bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          View Garage Overview
        </Button>
        <Badge className="bg-blue-100 text-blue-700">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-1"></div>
          Live System
        </Badge>
      </div>
    </div>
  );
};

export default GarageScheduleHeader;
