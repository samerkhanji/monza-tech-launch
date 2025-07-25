
import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface RepairsTabNavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const RepairsTabNavigation: React.FC<RepairsTabNavigationProps> = ({
  activeTab,
  setActiveTab
}) => {
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="repairs">Repairs</TabsTrigger>
        <TabsTrigger value="garage">Garage</TabsTrigger>
      </TabsList>
    </Tabs>
  );
};

export default RepairsTabNavigation;
