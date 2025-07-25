export interface RepairHistoryRecord {
  id: string;
  date: string;
  description: string;
  partsUsed: Array<{
    partName: string;
    partNumber: string;
    quantity: number;
    cost?: number;
  }>;
  technician: string;
  photos?: string[];
  notes?: string;
  // Enhanced repair history fields
  departments: Array<{
    name: string;
    workDone: string;
    duration: string;
    technician: string;
    startDate: string;
    endDate?: string;
  }>;
  issueCategory: string;
  severityLevel: 'minor' | 'moderate' | 'severe';
  resolutionStatus: 'resolved' | 'partial' | 'escalated';
  totalCost?: number;
  workOrderNumber?: string;
}

export interface TestDriveInfo {
  isOnTestDrive: boolean;
  testDriveStartTime?: string;
  testDriveEndTime?: string;
  testDriveDuration?: number; // in minutes
  testDriverName?: string;
  testDriverPhone?: string;
  testDriverLicense?: string;
  notes?: string;
  isClientTestDrive?: boolean; // To distinguish between client and employee test drives
  purpose?: string; // Purpose of the test drive
  // Activity tracking fields
  loggedBy?: string; // Email of the person who logged the test drive
  loggedByName?: string; // Full name of the person who logged it
  loggedAt?: string; // Timestamp when it was logged
  emergencyContact?: string; // Emergency contact name (for client test drives)
  emergencyContactPhone?: string; // Emergency contact phone (for client test drives)
  // Additional tracking
  vehicleVin?: string; // VIN of the vehicle
  vehicleModel?: string; // Model of the vehicle
}

export interface TechnicalSpecification {
  id: string;
  name: string;
  value: string;
  unit?: string;
  category: 'dimensions' | 'electrical' | 'mechanical' | 'material' | 'performance' | 'environmental' | 'other';
  description?: string;
}

export interface Car {
  id: string;
  model: string;
  year: number;
  color: string;
  arrivalDate: string;
  soldDate?: string;
  status: 'in_stock' | 'sold' | 'reserved';
  vinNumber: string;
  currentFloor?: 'Showroom 1' | 'Showroom 2' | 'Garage' | 'New Arrivals' | 'Inventory';
  batteryPercentage?: number;
  range?: number; // Vehicle's range capacity (e.g., 300 km)
  kilometersDriven?: number; // Actual kilometers driven for depreciation
  pdiCompleted?: boolean;
  pdiTechnician?: string;
  pdiDate?: string;
  pdiPhotos?: string[];
  pdiNotes?: string;
  // Complete PDI checklist data
  pdiData?: {
    formData?: Record<string, unknown>;
    checklistState?: Record<string, boolean>;
    overhauls?: Array<{
      type: string;
      description: string;
      completed: boolean;
      technician?: string;
      date?: string;
    }>;
    signatures?: Array<{
      name: string;
      role: string;
      timestamp: string;
      signatureData?: string;
    }>;
    finalStatus?: 'pending' | 'in_progress' | 'completed' | 'failed';
  };
  // Enhanced PDI fields
  pdiSoftwareIssues?: string[];
  pdiDamageAssessment?: Array<{
    location: string;
    severity: 'minor' | 'moderate' | 'severe';
    description: string;
    photos?: string[];
  }>;
  pdiSystemChecks?: Array<{
    system: string;
    status: 'pass' | 'fail' | 'needs_attention';
    notes?: string;
  }>;
  notes?: string;
  inShowroom?: boolean;
  showroomEntryDate?: string;
  showroomExitDate?: string;
  showroomNote?: string;
  category?: 'EV' | 'REV' | 'ICEV' | 'Other'; // Updated categories
  customs?: 'paid' | 'not paid' | 'pending';

  sellingPrice?: number;
  lastUpdated?: string;
  brand?: string; // New field for vehicle brand
  customModelName?: string; // For "Other" category vehicles
  // Enhanced client information - required for reserved/sold cars
  clientName?: string;
  clientPhone?: string;
  clientLicensePlate?: string;
  clientEmail?: string;
  clientAddress?: string;
  reservedDate?: string;
  // Delivery information
  deliveryDate?: string;
  deliveryNotes?: string;
  // Damage info
  damages?: Array<{
    id: string;
    description: string;
    severity: 'minor' | 'moderate' | 'severe';
    location: string;
    timestamp: string;
    photos?: string[];
  }>;
  // Enhanced repair history
  repairHistory?: RepairHistoryRecord[];
  // Test drive information
  testDriveInfo?: TestDriveInfo;
  testDriveHistory?: TestDriveInfo[];
  
  // Software Model for IT tracking (updated weekly)
  softwareVersion?: string;
  softwareLastUpdated?: string; // ISO date string
  softwareUpdateBy?: string; // IT technician who performed the update
  softwareUpdateNotes?: string;
  // Technical specifications
  technicalSpecs?: TechnicalSpecification[];
  weight?: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    unit: 'mm' | 'cm' | 'in';
  };
  material?: string;
  warranty?: {
    duration: number;
    unit: 'months' | 'years';
    terms?: string;
  };
  compatibleModels?: string[];
  installationNotes?: string;
  safetyInstructions?: string;
  customerRequirements?: string;
  shipmentCode?: string;
}
