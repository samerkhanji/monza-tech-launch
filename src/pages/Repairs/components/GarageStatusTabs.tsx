
import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface GarageStatusTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const GarageStatusTabs: React.FC<GarageStatusTabsProps> = ({
  activeTab,
  setActiveTab
}) => {
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
      <TabsList>
        <TabsTrigger value="all">All</TabsTrigger>
        <TabsTrigger value="in_garage">In Garage</TabsTrigger>
        <TabsTrigger value="delivered">Delivered</TabsTrigger>
      </TabsList>
    </Tabs>
  );
};

export default GarageStatusTabs;
