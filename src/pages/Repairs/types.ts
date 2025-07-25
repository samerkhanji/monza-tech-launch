import { RepairRecord, RepairStage } from '@/types';

// Stage configuration for the kanban board
export interface StageConfig {
  id: RepairStage;
  label: string;
  color: string;
  icon?: string;
}

// Props for RepairCard component
export interface RepairCardProps {
  repair: RepairRecord;
  moveToNextStage: (repair: RepairRecord) => void;
  changeRepairStage: (repair: RepairRecord, newStage: RepairStage) => void;
  formatDateTime: (timestamp: string) => string;
  stages: StageConfig[];
  changeMechanics?: (repair: RepairRecord, mechanics: string[], reason: string) => void;
  currentUser?: string;
  compactView?: boolean;
  onMarkAsDone?: (repair: RepairRecord) => void;
}

// Props for KanbanBoard component
export interface KanbanBoardProps {
  stages: StageConfig[];
  repairsByStage: Record<RepairStage, RepairRecord[]>;
  moveToNextStage: (repair: RepairRecord) => void;
  changeRepairStage: (repair: RepairRecord, newStage: RepairStage) => void;
  formatDateTime: (timestamp: string) => string;
  changeMechanics?: (repair: RepairRecord, mechanics: string[], reason: string) => void;
  currentUser?: string;
  onRefresh?: () => void;
  onMarkAsDone?: (repair: RepairRecord) => void;
}

// Props for RepairsHeader component
export interface RepairsHeaderProps {
  handleAddNewRepair: () => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  showSearchOnly?: boolean;
}

// Props for MechanicChange dialog
export interface MechanicChangeProps {
  isOpen: boolean;
  onClose: () => void;
  repair: RepairRecord;
  onSaveMechanics: (mechanics: string[], reason: string) => void;
}

// Status labels for garage cars
export const statusLabels = {
  in_diagnosis: 'In Diagnosis',
  in_repair: 'In Repair',
  in_quality_check: 'Quality Check',
  ready: 'Ready for Pickup',
  delivered: 'Delivered'
};

// Garage car status type
export type GarageCarStatus = 'in_diagnosis' | 'in_repair' | 'in_quality_check' | 'ready' | 'delivered';

// Garage car type - Updated to include all required photo properties
export interface GarageCar {
  id: string;
  carModel: string;
  carCode: string;
  vinNumber?: string; // VIN number for the car
  model?: string; // Car model (alias for carModel for compatibility)
  customerName: string;
  entryDate: string;
  status: GarageCarStatus;
  assignedEmployee?: string;
  mechanics?: string[];
  notes?: string;
  workNotes?: string;
  issueDescription?: string;
  statusComments?: string;
  expectedExitDate?: string;
  startTimestamp?: string;
  endTimestamp?: string;
  repairDuration?: string;
  lastUpdated: string;
  partsUsed?: string[];
  estimatedCompletionTimestamp?: string;
  beforePhotos?: string[];
  afterPhotos?: string[];
  // Test drive properties
  testDriveStatus?: 'available' | 'on_test_drive' | 'not_available';
  testDriveStartTime?: string;
  testDriveDriver?: string;
  testDriveDuration?: number; // in minutes
}

// Props for GarageView component
export interface GarageViewProps {
  cars: GarageCar[];
  onUpdateStatus: (id: string, status: GarageCarStatus) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

// New type for the repair record with lastUpdated field
export interface ExtendedRepairRecord extends RepairRecord {
  lastUpdated?: string;
}

// New component for displaying all mechanics in the garage
export interface MechanicsOverviewProps {
  cars: GarageCar[];
}
