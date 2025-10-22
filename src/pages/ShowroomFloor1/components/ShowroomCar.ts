export interface ShowroomCar {
  id: string;
  vinNumber: string;
  model: string;
  year: number;
  color: string;
  price: number;
  status: 'in_stock' | 'reserved' | 'sold';
  category: 'EV' | 'REV' | 'ICEV';
  batteryPercentage?: number;
  range?: number; // Vehicle's range capacity (e.g., 300 km)
  kilometersDriven?: number; // Actual kilometers driven for depreciation
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
  // Warranty tracking fields
  warrantyStartDate?: string;
  warrantyEndDate?: string;
  warrantyMonthsRemaining?: number;
  warrantyDaysRemaining?: number;
  warrantyStatus?: 'active' | 'expiring_soon' | 'expired';
  lastWarrantyUpdate?: string;
  // New simple warranty field
  warranty_life?: string | null;
  // Software Model for IT tracking
  softwareVersion?: string;
  softwareLastUpdated?: string;
  softwareUpdateBy?: string;
  softwareUpdateNotes?: string;
}
