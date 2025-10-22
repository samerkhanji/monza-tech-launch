import React, { useState } from 'react';
import { ScheduledCar } from '@/types';
import { useGarageScheduleData } from './hooks/useGarageScheduleData';
import { EnhancedScheduleTable } from './components/EnhancedScheduleTable';
import GarageWorkflowManager from '@/components/GarageWorkflowManager';

const GarageSchedulePage: React.FC = () => {
  const { todaySchedule, today, saveSchedules, schedules } = useGarageScheduleData();
  const [showWorkflowManager, setShowWorkflowManager] = useState(false);
  const [selectedCompletedCar, setSelectedCompletedCar] = useState<any>(null);

  const handleUpdateCarStatus = (carId: string, status: ScheduledCar['status']) => {
    const targetSchedule = todaySchedule;
    if (!targetSchedule) return;
    const updatedSchedule = {
      ...targetSchedule,
      scheduledCars: targetSchedule.scheduledCars?.map(car =>
        car.id === carId ? { ...car, status } : car
      ) || []
    };
    const updatedSchedules = schedules.map(s =>
      s.id === targetSchedule.id ? updatedSchedule : s
    );
    saveSchedules(updatedSchedules);
  };

  const handleWorkflowComplete = (car: any) => {
    setSelectedCompletedCar(car);
    setShowWorkflowManager(true);
  };

  const handleWorkflowManagerClose = () => {
    setShowWorkflowManager(false);
    setSelectedCompletedCar(null);
    // Refresh the schedule data to show updated state
    window.location.reload();
  };

  return (
    <div className="p-6 garage-schedule-container">
      <div className="garage-schedule-content">
        <div className="mb-4">
          <h1 className="text-2xl font-bold">Garage Schedule</h1>
          <p className="text-gray-600">Today: {today}</p>
          <p className="text-gray-600">Cars scheduled: {todaySchedule?.scheduledCars?.length || 0}</p>
        </div>
        
        <div className="garage-schedule-table-container">
          <EnhancedScheduleTable
            scheduledCars={todaySchedule?.scheduledCars || []}
            onStatusUpdate={handleUpdateCarStatus}
            onViewDetails={() => {}}
            onWorkflowComplete={handleWorkflowComplete}
          />
        </div>

        {/* Garage Workflow Manager */}
        <GarageWorkflowManager
          isOpen={showWorkflowManager}
          onClose={handleWorkflowManagerClose}
          completedCar={selectedCompletedCar}
        />
      </div>
    </div>
  );
};

export default GarageSchedulePage;
