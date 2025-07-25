export interface ShowroomCar {
  id: string;
  vinNumber: string;
  model: string;
  year: number;
  color: string;
  price: number;
  status: 'in_stock' | 'reserved' | 'sold';
  batteryPercentage?: number;
  range?: number;
  features: string[];
  arrivalDate: string;
  pdiCompleted?: boolean;
  pdiTechnician?: string;
  pdiDate?: string;
  pdiPhotos?: string[];
  pdiNotes?: string;
  customs?: 'paid' | 'not paid' | 'pending';
  testDriveInfo?: {
    isOnTestDrive: boolean;
    testDriveStartTime?: string;
    testDriveEndTime?: string;
    testDriverName?: string;
    testDriverPhone?: string;
  };
}
