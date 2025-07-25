
import React, { useState } from 'react';
import RepairHistoryHeader from './components/RepairHistoryHeader';
import RepairHistoryTable from './components/RepairHistoryTable';
import RepairHistorySidebar from '@/pages/Repairs/components/RepairHistorySidebar';
import PhotosViewDialog from './components/PhotosViewDialog';
import { useRepairHistoryData } from './hooks/useRepairHistoryData';
import { useRepairHistoryFilters } from './hooks/useRepairHistoryFilters';
import { GarageCar } from '@/pages/Repairs/types';

const RepairHistoryPage: React.FC = () => {
  const { repairHistory, formatDateTime } = useRepairHistoryData();
  const { filteredRepairs, ...filterProps } = useRepairHistoryFilters(repairHistory);
  
  const [selectedRepair, setSelectedRepair] = useState<GarageCar | null>(null);
  const [showRepairDetails, setShowRepairDetails] = useState(false);
  const [showPhotosDialog, setShowPhotosDialog] = useState(false);
  const [selectedPhotoType, setSelectedPhotoType] = useState<'before' | 'after'>('before');

  const handleViewDetails = (repair: GarageCar) => {
    setSelectedRepair(repair);
    setShowRepairDetails(true);
  };

  const handleViewPhotos = (repair: GarageCar, type: 'before' | 'after') => {
    setSelectedRepair(repair);
    setSelectedPhotoType(type);
    setShowPhotosDialog(true);
  };

  const handleCloseDetails = () => {
    setShowRepairDetails(false);
    setSelectedRepair(null);
  };

  const handleClosePhotos = () => {
    setShowPhotosDialog(false);
    setSelectedRepair(null);
  };

  return (
    <div className="container p-6 mx-auto max-w-7xl">
      <div className="space-y-6">
        <RepairHistoryHeader
          totalRepairs={repairHistory.length}
          filteredCount={filteredRepairs.length}
          {...filterProps}
        />
        
        <RepairHistoryTable
          repairs={filteredRepairs}
          onViewDetails={handleViewDetails}
          onViewPhotos={handleViewPhotos}
        />

        {selectedRepair && (
          <>
            <RepairHistorySidebar
              isOpen={showRepairDetails}
              onClose={handleCloseDetails}
              repair={selectedRepair}
              formatDateTime={formatDateTime}
            />

            <PhotosViewDialog
              isOpen={showPhotosDialog}
              onClose={handleClosePhotos}
              repair={selectedRepair}
              photoType={selectedPhotoType}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default RepairHistoryPage;
