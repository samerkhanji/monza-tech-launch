export interface ShowroomCar {
  id: string;
  vinNumber: string;
  model: string;
  year: number;
  color: string;
  price: number;
  status: 'in_stock' | 'sold' | 'reserved';
  pdiCompleted: boolean;
  batteryPercentage?: number;
  range?: number; // Vehicle's range capacity (e.g., 300 km)
  kilometersDriven?: number; // Actual kilometers driven for depreciation
  inShowroom: boolean;
  testDriveInfo?: {
    isOnTestDrive: boolean;
    startTime?: string;
    endTime?: string;
    customerName?: string;
    customerPhone?: string;
  };
} 