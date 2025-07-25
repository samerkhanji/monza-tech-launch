
import React from 'react';
import { Card } from '@/components/ui/card';
import { GarageCar } from '../types';
import { Input } from '@/components/ui/input';
import GarageStatusTabs from './GarageStatusTabs';

interface GarageSummaryProps {
  cars: GarageCar[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const GarageSummary: React.FC<GarageSummaryProps> = ({ 
  cars, 
  searchTerm, 
  setSearchTerm, 
  activeTab, 
  setActiveTab 
}) => {
  return (
    <Card className="p-4">
      <div className="flex flex-col space-y-4">
        <h3 className="font-medium">Garage Status Summary</h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="border rounded-md p-3">
            <div className="text-muted-foreground text-sm">In Diagnosis</div>
            <div className="text-2xl font-bold">{cars.filter(c => c.status === 'in_diagnosis').length}</div>
          </div>
          <div className="border rounded-md p-3">
            <div className="text-muted-foreground text-sm">In Repair</div>
            <div className="text-2xl font-bold">{cars.filter(c => c.status === 'in_repair').length}</div>
          </div>
          <div className="border rounded-md p-3">
            <div className="text-muted-foreground text-sm">In Quality Check</div>
            <div className="text-2xl font-bold">{cars.filter(c => c.status === 'in_quality_check').length}</div>
          </div>
          <div className="border rounded-md p-3">
            <div className="text-muted-foreground text-sm">Ready for Pickup</div>
            <div className="text-2xl font-bold">{cars.filter(c => c.status === 'ready').length}</div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <GarageStatusTabs 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
          />
          
          <div className="w-full sm:w-64">
            <Input
              placeholder="Search cars..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </Card>
  );
};

export default GarageSummary;
