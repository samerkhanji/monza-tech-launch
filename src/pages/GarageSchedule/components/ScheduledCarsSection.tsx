
import React from 'react';
import { GarageSchedule, ScheduledCar } from '@/types';
import EmployeeTypeScheduling from './EmployeeTypeScheduling';

interface ScheduledCarsSectionProps {
  schedule: GarageSchedule;
  date: string;
  onAddCar: (carData: Omit<ScheduledCar, 'id'>, targetDate: string) => void;
  onUpdateCarStatus: (carId: string, status: ScheduledCar['status'], targetDate: string) => void;
  onMoveToTomorrow?: (carId: string) => void;
  showMoveToTomorrow?: boolean;
}

const ScheduledCarsSection: React.FC<ScheduledCarsSectionProps> = ({
  schedule,
  date,
  onAddCar,
  onUpdateCarStatus,
  onMoveToTomorrow,
  showMoveToTomorrow = false
}) => {
  return (
    <EmployeeTypeScheduling
      schedule={schedule}
      date={date}
      onAddCar={onAddCar}
      onUpdateCarStatus={onUpdateCarStatus}
      onMoveToTomorrow={onMoveToTomorrow}
      showMoveToTomorrow={showMoveToTomorrow}
    />
  );
};

export default ScheduledCarsSection;
