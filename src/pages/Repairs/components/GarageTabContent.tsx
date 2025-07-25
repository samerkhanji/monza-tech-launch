
import React from 'react';
import { GarageCar } from '../types';
import GarageView from './GarageView';
import GarageTabActions from './GarageTabActions';

interface GarageTabContentProps {
  cars: GarageCar[];
  onUpdateStatus: (id: string, status: GarageCar['status']) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  handleRefresh: () => void;
  handleExportToExcel: () => void;
  handleAddCar: () => void;
}

const GarageTabContent: React.FC<GarageTabContentProps> = ({
  cars,
  onUpdateStatus,
  searchTerm,
  setSearchTerm,
  activeTab,
  setActiveTab,
  handleRefresh,
  handleExportToExcel,
  handleAddCar
}) => {
  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold">Garage Overview</h2>
          <p className="text-sm text-monza-grey">View and manage cars in the garage</p>
        </div>
        <GarageTabActions 
          handleRefresh={handleRefresh}
          handleExportToExcel={handleExportToExcel}
        />
      </div>
      
      <GarageView 
        cars={cars} 
        onUpdateStatus={onUpdateStatus}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
    </>
  );
};

export default GarageTabContent;
