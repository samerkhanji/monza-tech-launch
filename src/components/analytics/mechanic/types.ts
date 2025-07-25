
export interface MechanicData {
  name: string;
  completedRepairs: number;
  avgRepairTime: number;
  onTimeRate: number;
  specialization: string;
  mostRepairedCar: string;
}

export interface MechanicPerformanceAnalyticsProps {
  data: MechanicData[];
  period: string;
}
