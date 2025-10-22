// User and auth types
export type UserRole = 'owner' | 'garage_manager' | 'assistant' | 'sales';

export type HybridRole = 'sales_garage_marketing' | 'sales_assistant_marketing';

// Notification system types
export type NotificationType = "message" | "car" | "request";

export interface NotificationRow {
  id: string;
  created_at: string;
  type: NotificationType;
  title: string;
  body: string | null;
  entity_id: string | null;
  route: string | null;
  read_at: string | null;
  meta: Record<string, any> | null;
  actor_id: string | null;
  recipient_id: string;
  action_required: boolean;
  action_state: "pending" | "accepted" | "denied";
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  hybridRole?: HybridRole;
  phoneNumber?: string;
}

// Request center types
export type RequestPriority = 'high' | 'medium' | 'low';

export type RequestStatus = 'submitted' | 'reviewed' | 'answered' | 'approved' | 'closed';

export interface Comment {
  author: string;
  text: string;
  timestamp: string;
}

export interface Request {
  id: string;
  requestType: string;
  message: string;
  fileUrl?: string;
  priority: RequestPriority;
  status: RequestStatus;
  submittedBy: string;
  submittedAt: string;
  completedAt?: string;
  details?: string;
  comments?: Comment[];
}

// Car and repair types
export type RepairStage = 'diagnosis' | 'repair' | 'quality_check' | 'ready' | 'completed';

export interface CarModel {
  id: string;
  name: string;
  year: number;
}

export const CAR_MODELS = [
  { id: '1', name: 'Voyah Free', year: 2024 },
  { id: '2', name: 'Voyah Free', year: 2025 },
  { id: '3', name: 'Voyah Passion', year: 2024 },
  { id: '4', name: 'Voyah Dream', year: 2024 },
  { id: '5', name: 'Voyah Dream', year: 2025 },
  { id: '6', name: 'Voyah Courage', year: 2025 },
  { id: '7', name: 'MHero 917', year: 2024 },
  { id: '8', name: 'MHero 917', year: 2025 },
  { id: '9', name: 'Tesla Model 3', year: 2024 },
  { id: '10', name: 'Tesla Model Y', year: 2024 },
  { id: '11', name: 'BYD Tang', year: 2024 },
  { id: '12', name: 'BMW iX3', year: 2024 },
  { id: '13', name: 'Mercedes EQC', year: 2024 },
  { id: '14', name: 'Other Vehicle', year: 2024 },
];

// Enhanced vehicle types - Updated with new categories
export type VehicleCategory = 'EV' | 'REV' | 'ICEV' | 'Other';
export type TaxStatus = 'paid' | 'unpaid';

export interface VehicleDamage {
  id: string;
  description: string;
  severity: 'minor' | 'moderate' | 'severe';
  location: string;
  timestamp: string;
  photos?: string[];
}

export interface EnhancedVehicle {
  id: string;
  vinNumber: string;
  model: string;
  year: number;
  color: string;
  category: VehicleCategory;
  taxStatus: TaxStatus;
  batteryPercentage?: number;
  damages: VehicleDamage[];
  arrivalTimestamp: string;
  currentFloor?: 'Floor 1' | 'Floor 2';
  brand?: string;
  customModelName?: string;
}

// Car type for inventory and showroom
export interface Car {
  id: string;
  model: string;
  year: number;
  color: string;
  arrivalDate: string;
  soldDate?: string;
  status: 'in_stock' | 'sold' | 'reserved';
  vinNumber: string;
  currentFloor?: 'Showroom 1' | 'Showroom 2';
  batteryPercentage?: number;
  pdiCompleted?: boolean;
  pdiTechnician?: string;
  pdiDate?: string;
  pdiPhotos?: string[];
  pdiNotes?: string;
  notes?: string;
  inShowroom?: boolean;
  showroomEntryDate?: string;
  showroomExitDate?: string;
  showroomNote?: string;
  category?: 'EV' | 'REV' | 'ICEV' | 'Other';
  customs?: 'paid' | 'not paid';
  purchasePrice?: number;
  sellingPrice?: number;
  lastUpdated?: string;
  brand?: string;
  customModelName?: string;
  clientName?: string;
  clientPhone?: string;
  clientLicensePlate?: string;
  clientEmail?: string;
  clientAddress?: string;
  reservedDate?: string;
  pickupDate?: string; // Date when client plans to pick up reserved car
  damages?: Array<{
    id: string;
    description: string;
    severity: 'minor' | 'moderate' | 'severe';
    location: string;
    timestamp: string;
    photos?: string[];
  }>;
  photos?: string[];
  shipmentCode?: string;
  // Warranty tracking fields
  warrantyStartDate?: string;
  warrantyEndDate?: string;
  warrantyMonthsRemaining?: number;
  warrantyDaysRemaining?: number;
  warrantyStatus?: 'active' | 'expiring_soon' | 'expired';
  lastWarrantyUpdate?: string;
}

// Ordered Parts type - Adding the missing type
export interface OrderedPart {
  id: string;
  part_name: string;
  part_number: string;
  quantity: number;
  supplier: string;
  order_reference: string;
  order_date: string;
  expected_delivery?: string;
  estimated_eta?: string;
  status: 'ordered' | 'shipped' | 'delivered';
  price?: number;
  shipping_company?: string;
  tracking_code?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  category: 'ev_erev' | 'normal_engine';
}

// Form types for MonzaBot
export type MonzaBotFormType = 'new_car_arrival' | 'repair' | 'inventory' | 'parts' | 'schedule' | 'calendar' | 'ordered_cars';

// Enhanced MonzaBot Context interface
export interface MonzaBotContext {
  currentRoute?: string;
  source?: string;
  user?: any;
  imageData?: string;
  formType?: MonzaBotFormType;
  extractedData?: any;
  timestamp?: string;
  shippingCompany?: string;
  company?: string;
  trackingCode?: string;
  currentFormData?: any;
  orderDate?: string;
  type?: string;
  canAccessAnalytics?: boolean;
  canAccessClientData?: boolean;
}

// Mechanic change history
export interface MechanicChange {
  timestamp: string;
  changedBy: string;
  previousMechanics: string[];
  newMechanics: string[];
  reason: string;
}

// Enhanced repair history types
export interface EnhancedRepairHistory {
  id: string;
  car_vin: string;
  car_model: string;
  car_year?: number;
  car_color?: string;
  client_name: string;
  client_phone?: string;
  client_email?: string;
  client_license_plate?: string;
  issue_description: string;
  solution_description: string;
  repair_steps: string[];
  parts_used: PartUsed[];
  tools_used: string[];
  labor_hours?: number;
  total_cost?: number;
  technician_name: string;
  assigned_mechanic?: string;
  repair_date: string;
  completion_date?: string;
  start_time?: string;
  end_time?: string;
  actual_duration?: string;
  estimated_duration?: string;
  photos?: string[];
  before_photos?: string[];
  after_photos?: string[];
  repair_category?: string;
  work_type?: string;
  difficulty_level?: 'easy' | 'medium' | 'hard' | 'expert';
  quality_rating?: number;
  client_satisfaction?: number;
  warranty_period?: number;
  follow_up_required?: boolean;
  follow_up_notes?: string;
  mechanic_notes?: string;
  recommendation?: string;
  schedule_details?: {
    scheduledDate?: string;
    timeSlot?: string;
    priority?: string;
    location?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface PartUsed {
  part_number: string;
  part_name: string;
  quantity: number;
  cost?: number;
  supplier?: string;
}

export interface PartsKnowledgeBase {
  id: string;
  part_number: string;
  part_name: string;
  part_category?: string;
  compatible_models: string[];
  supplier?: string;
  average_cost?: number;
  installation_difficulty?: 'easy' | 'medium' | 'hard';
  installation_time_hours?: number;
  common_issues: string[];
  installation_notes?: string;
  warranty_months?: number;
  photos?: string[];
  usage_count: number;
  last_used?: string;
  created_at: string;
  updated_at: string;
}

export interface RepairSolutionsKB {
  id: string;
  issue_keywords: string[];
  issue_description: string;
  solution_description: string;
  repair_steps: string[];
  required_parts: PartUsed[];
  estimated_time_hours?: number;
  difficulty_level?: 'easy' | 'medium' | 'hard' | 'expert';
  success_rate?: number;
  car_models: string[];
  technician_notes?: string;
  photos?: string[];
  video_links?: string[];
  usage_count: number;
  effectiveness_rating?: number;
  created_at: string;
  updated_at: string;
}

// Updated repair types with quality check and software update info
export interface RepairRecord {
  id: string;
  carCode: string;
  carModel: string;
  customerName: string;
  assignedEmployee: string;
  mechanics: string[];
  repairStage: RepairStage;
  arrivalTimestamp: string;
  startDate: string;
  startTimestamp: string;
  endDate?: string;
  endTimestamp?: string;
  description: string;
  partsUsed: string[];
  estimatedCompletionDate?: string;
  estimatedCompletionTimestamp?: string;
  completionPercentage: number;
  mechanicChangeHistory?: MechanicChange[];
  lastUpdated?: string;
  
  // Enhanced repair information
  qualityCheckStatus?: 'pending' | 'in_progress' | 'completed' | 'failed';
  softwareUpdateInfo?: {
    required: boolean;
    version?: string;
    status?: 'pending' | 'in_progress' | 'completed';
  };
  
  // Existing fields
  issueDescription?: string;
  workNotes?: string;
  statusComments?: string;
  repairDuration?: string;
}

// New schedule types for Mark's availability and car planning
export interface GarageSchedule {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  available: boolean;
  notes?: string;
  // New fields for car scheduling
  maxCarsCapacity?: number;
  currentCarsScheduled?: number;
  scheduledCars?: ScheduledCar[];
}

// New type for scheduled cars in the garage - Updated with new categories
export interface ScheduledCar {
  id: string;
  carCode: string;
  carModel: string;
  customerName: string;
  priority: 'high' | 'medium' | 'low';
  estimatedDuration: number; // in minutes
  workType: 'electrical' | 'painter' | 'detailer' | 'mechanic' | 'body_work';
  assignedMechanic?: string;
  notes?: string;
  status: 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'delayed';
  vin?: string; // VIN number for tracking
  // Test drive properties
  testDriveStatus?: 'available' | 'on_test_drive' | 'not_available';
  testDriveStartTime?: string;
  testDriveDriver?: string;
  testDriveDuration?: number; // in minutes
  // New properties for enhanced scheduling
  workTitle?: string;
  scheduledDate?: string;
  startTime?: string;
  requiredSkills?: string[];
}

// Car history tracking
export interface CarHistoryRecord {
  id: string;
  vinNumber: string;
  internalCode?: string;
  documents: {
    fileName: string;
    fileUrl: string;
    uploadedAt: string;
    uploadedBy: string;
  }[];
}

// Workflow tracking
export type WorkflowStep = 'arrival' | 'pdi' | 'showroom_display';

export interface WorkflowStatus {
  step: WorkflowStep;
  completed: boolean;
  timestamp?: string;
  notes?: string;
}

export interface VehicleWorkflow {
  vehicleId: string;
  steps: WorkflowStatus[];
  currentStep: WorkflowStep;
}

// Financial analytics types
export interface RepairFinancial {
  id: string;
  repair_id: string;
  car_vin: string;
  client_name: string;
  labor_hours: number;
  labor_rate_per_hour: number;
  total_labor_cost: number;
  parts_cost: number;
  parts_markup_percentage: number;
  total_parts_cost: number;
  equipment_usage_cost: number;
  electricity_cost: number;
  overhead_cost: number;
  quoted_price: number;
  final_price: number;
  total_cost: number;
  gross_profit: number;
  profit_margin_percentage: number;
  estimated_completion_hours?: number;
  actual_completion_hours?: number;
  efficiency_rating?: number;
  repair_date: string;
}

export interface VehicleSalesFinancial {
  id: string;
  vehicle_id: string;
  vin_number: string;
  model: string;
  year: number;
  purchase_price: number;
  import_duty: number;
  shipping_cost: number;
  preparation_cost: number;
  total_acquisition_cost: number;
  storage_cost_per_day: number;
  days_in_inventory: number;
  total_holding_cost: number;
  insurance_cost: number;
  listing_price: number;
  final_sale_price: number;
  sales_commission: number;
  total_cost: number;
  gross_profit: number;
  profit_margin_percentage: number;
  purchase_date?: string;
  sale_date?: string;
}

export interface EquipmentAsset {
  id: string;
  name: string;
  category: 'equipment' | 'tool' | 'vehicle';
  purchase_date: string;
  purchase_price: number;
  current_value: number;
  depreciation_method: 'straight_line' | 'declining_balance';
  useful_life_years: number;
  salvage_value: number;
  location?: string;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  maintenance_cost: number;
  last_maintenance_date?: string;
}

export interface InventoryValuation {
  id: string;
  inventory_item_id: string;
  part_number: string;
  part_name: string;
  unit_cost: number;
  quantity_on_hand: number;
  total_value: number;
  storage_cost_per_unit_per_month: number;
  insurance_cost_per_unit_per_month: number;
  carrying_cost_percentage: number;
  usage_rate_per_month: number;
  months_of_supply: number;
  last_used_date?: string;
  depreciation_rate_per_month: number;
  expiry_date?: string;
  valuation_date: string;
}

export interface OperationalCost {
  id: string;
  cost_category: 'electricity' | 'rent' | 'insurance' | 'maintenance' | 'supplies';
  subcategory?: string;
  cost_amount: number;
  cost_per_unit?: number;
  units_consumed?: number;
  unit_type?: 'kWh' | 'hours' | 'sqft' | 'units';
  garage_allocation_percentage: number;
  showroom_allocation_percentage: number;
  office_allocation_percentage: number;
  billing_period_start: string;
  billing_period_end: string;
  invoice_date?: string;
  invoice_number?: string;
}

export interface FinancialSummary {
  totalRepairRevenue: number;
  totalRepairCosts: number;
  totalRepairProfit: number;
  repairProfitMargin: number;
  totalVehicleSalesRevenue: number;
  totalVehicleSalesCosts: number;
  totalVehicleSalesProfit: number;
  vehicleSalesProfitMargin: number;
  totalInventoryValue: number;
  totalEquipmentValue: number;
  totalEquipmentDepreciation: number;
  totalOperationalCosts: number;
  totalElectricityCosts: number;
  totalLaborHours: number;
  averageHourlyRate: number;
  overallProfitMargin: number;
}
