// Purpose and Reason Type Definitions
// This file provides strongly typed enums and types for Purpose and Reason fields

// Test Drive Purpose Types
export enum TestDrivePurpose {
  CLIENT_INTEREST = 'client_interest',
  EMPLOYEE_TRAINING = 'employee_training',
  QUALITY_CHECK = 'quality_check',
  DEMONSTRATION = 'demonstration',
  MAINTENANCE_TEST = 'maintenance_test',
  DELIVERY_PREP = 'delivery_prep',
  PHOTO_SHOOT = 'photo_shoot',
  INSPECTION = 'inspection',
  CUSTOMER_SERVICE = 'customer_service',
  SALES_PRESENTATION = 'sales_presentation',
  TECHNICAL_EVALUATION = 'technical_evaluation',
  SAFETY_CHECK = 'safety_check',
  OTHER = 'other'
}

// Car Movement Reason Types
export enum CarMovementReason {
  ARRIVAL_FROM_FACTORY = 'arrival_from_factory',
  MOVED_TO_SHOWROOM = 'moved_to_showroom',
  MOVED_TO_GARAGE = 'moved_to_garage',
  CLIENT_INTEREST = 'client_interest',
  TEST_DRIVE = 'test_drive',
  MAINTENANCE = 'maintenance',
  REPAIR = 'repair',
  PDI_INSPECTION = 'pdi_inspection',
  CUSTOMS_CLEARANCE = 'customs_clearance',
  DELIVERY_PREPARATION = 'delivery_preparation',
  PHOTO_SHOOT = 'photo_shoot',
  INVENTORY_MANAGEMENT = 'inventory_management',
  QUALITY_CHECK = 'quality_check',
  DEMONSTRATION = 'demonstration',
  SALE_PROCESSING = 'sale_processing',
  WARRANTY_WORK = 'warranty_work',
  RECALL_WORK = 'recall_work',
  STORAGE_RELOCATION = 'storage_relocation',
  INITIAL_ARRIVAL = 'initial_arrival',
  ARRIVAL_PROCESSED = 'arrival_processed',
  CLIENT_RESERVATION = 'client_reservation',
  TEST_VEHICLE_SETUP = 'test_vehicle_setup',
  INITIAL_STATUS_ASSIGNMENT = 'initial_status_assignment',
  CLIENT_INTEREST_DISPLAY = 'client_interest_display',
  TEST_VEHICLE_VIN_SCANNER = 'test_vehicle_vin_scanner',
  OTHER = 'other'
}

// Repair Reason Types
export enum RepairReason {
  REGULAR_MAINTENANCE = 'regular_maintenance',
  WARRANTY_REPAIR = 'warranty_repair',
  CUSTOMER_REQUEST = 'customer_request',
  DAMAGE_REPAIR = 'damage_repair',
  TECHNICAL_ISSUE = 'technical_issue',
  SAFETY_CONCERN = 'safety_concern',
  QUALITY_ISSUE = 'quality_issue',
  PREVENTIVE_MAINTENANCE = 'preventive_maintenance',
  INSPECTION_FAILURE = 'inspection_failure',
  RECALL_WORK = 'recall_work',
  UPGRADE_INSTALLATION = 'upgrade_installation',
  DIAGNOSTIC_TESTING = 'diagnostic_testing',
  OTHER = 'other'
}

// Workflow Reason Types
export enum WorkflowReason {
  INITIAL_PROCESSING = 'initial_processing',
  PDI_REQUIRED = 'pdi_required',
  CUSTOMS_PENDING = 'customs_pending',
  SOFTWARE_UPDATE = 'software_update',
  QUALITY_CHECK = 'quality_check',
  CLIENT_RESERVATION = 'client_reservation',
  SALE_PROCESSING = 'sale_processing',
  DELIVERY_PREPARATION = 'delivery_preparation',
  MAINTENANCE_SCHEDULED = 'maintenance_scheduled',
  INSPECTION_FAILED = 'inspection_failed',
  OTHER = 'other'
}

// Access Request Reason Types
export enum AccessRequestReason {
  EMPLOYEE_ONBOARDING = 'employee_onboarding',
  TEMPORARY_ACCESS = 'temporary_access',
  SYSTEM_MAINTENANCE = 'system_maintenance',
  EMERGENCY_ACCESS = 'emergency_access',
  PROJECT_WORK = 'project_work',
  TRAINING_PURPOSE = 'training_purpose',
  AUDIT_REQUIREMENT = 'audit_requirement',
  OTHER = 'other'
}

// Denial Reason Types
export enum DenialReason {
  INSUFFICIENT_PERMISSIONS = 'insufficient_permissions',
  SECURITY_CONCERN = 'security_concern',
  POLICY_VIOLATION = 'policy_violation',
  INCOMPLETE_REQUEST = 'incomplete_request',
  DUPLICATE_REQUEST = 'duplicate_request',
  EXPIRED_REQUEST = 'expired_request',
  OTHER = 'other'
}

// Sale Reason Types
export enum SaleReason {
  UPGRADE = 'upgrade',
  REPLACEMENT = 'replacement',
  END_OF_LIFE = 'end_of_life',
  INVENTORY_REDUCTION = 'inventory_reduction',
  CUSTOMER_REQUEST = 'customer_request',
  MAINTENANCE_ISSUE = 'maintenance_issue',
  DAMAGE = 'damage',
  OBSOLESCENCE = 'obsolescence',
  OTHER = 'other'
}

// Delay Reason Types
export enum DelayReason {
  PARTS_UNAVAILABLE = 'parts_unavailable',
  TECHNICIAN_UNAVAILABLE = 'technician_unavailable',
  CUSTOMER_APPROVAL = 'customer_approval',
  SUPPLIER_DELAY = 'supplier_delay',
  QUALITY_ISSUE = 'quality_issue',
  WEATHER_CONDITION = 'weather_condition',
  EQUIPMENT_FAILURE = 'equipment_failure',
  SAFETY_CONCERN = 'safety_concern',
  OTHER = 'other'
}

// Network Access Reason Types
export enum NetworkAccessReason {
  AUTHORIZED_USER = 'authorized_user',
  VALID_CREDENTIALS = 'valid_credentials',
  APPROVED_REQUEST = 'approved_request',
  EMERGENCY_ACCESS = 'emergency_access',
  SYSTEM_MAINTENANCE = 'system_maintenance',
  OTHER = 'other'
}

// Type Guards
export const isTestDrivePurpose = (value: string): value is TestDrivePurpose => {
  return Object.values(TestDrivePurpose).includes(value as TestDrivePurpose);
};

export const isCarMovementReason = (value: string): value is CarMovementReason => {
  return Object.values(CarMovementReason).includes(value as CarMovementReason);
};

export const isRepairReason = (value: string): value is RepairReason => {
  return Object.values(RepairReason).includes(value as RepairReason);
};

export const isWorkflowReason = (value: string): value is WorkflowReason => {
  return Object.values(WorkflowReason).includes(value as WorkflowReason);
};

export const isAccessRequestReason = (value: string): value is AccessRequestReason => {
  return Object.values(AccessRequestReason).includes(value as AccessRequestReason);
};

export const isDenialReason = (value: string): value is DenialReason => {
  return Object.values(DenialReason).includes(value as DenialReason);
};

export const isSaleReason = (value: string): value is SaleReason => {
  return Object.values(SaleReason).includes(value as SaleReason);
};

export const isDelayReason = (value: string): value is DelayReason => {
  return Object.values(DelayReason).includes(value as DelayReason);
};

export const isNetworkAccessReason = (value: string): value is NetworkAccessReason => {
  return Object.values(NetworkAccessReason).includes(value as NetworkAccessReason);
};

// Display Labels
export const getTestDrivePurposeLabel = (purpose: TestDrivePurpose): string => {
  const labels: Record<TestDrivePurpose, string> = {
    [TestDrivePurpose.CLIENT_INTEREST]: 'Client Interest',
    [TestDrivePurpose.EMPLOYEE_TRAINING]: 'Employee Training',
    [TestDrivePurpose.QUALITY_CHECK]: 'Quality Check',
    [TestDrivePurpose.DEMONSTRATION]: 'Demonstration',
    [TestDrivePurpose.MAINTENANCE_TEST]: 'Maintenance Test',
    [TestDrivePurpose.DELIVERY_PREP]: 'Delivery Preparation',
    [TestDrivePurpose.PHOTO_SHOOT]: 'Photo Shoot',
    [TestDrivePurpose.INSPECTION]: 'Inspection',
    [TestDrivePurpose.CUSTOMER_SERVICE]: 'Customer Service',
    [TestDrivePurpose.SALES_PRESENTATION]: 'Sales Presentation',
    [TestDrivePurpose.TECHNICAL_EVALUATION]: 'Technical Evaluation',
    [TestDrivePurpose.SAFETY_CHECK]: 'Safety Check',
    [TestDrivePurpose.OTHER]: 'Other'
  };
  return labels[purpose] || purpose;
};

export const getCarMovementReasonLabel = (reason: CarMovementReason): string => {
  const labels: Record<CarMovementReason, string> = {
    [CarMovementReason.ARRIVAL_FROM_FACTORY]: 'Arrival from Factory',
    [CarMovementReason.MOVED_TO_SHOWROOM]: 'Moved to Showroom',
    [CarMovementReason.MOVED_TO_GARAGE]: 'Moved to Garage',
    [CarMovementReason.CLIENT_INTEREST]: 'Client Interest',
    [CarMovementReason.TEST_DRIVE]: 'Test Drive',
    [CarMovementReason.MAINTENANCE]: 'Maintenance',
    [CarMovementReason.REPAIR]: 'Repair',
    [CarMovementReason.PDI_INSPECTION]: 'PDI Inspection',
    [CarMovementReason.CUSTOMS_CLEARANCE]: 'Customs Clearance',
    [CarMovementReason.DELIVERY_PREPARATION]: 'Delivery Preparation',
    [CarMovementReason.PHOTO_SHOOT]: 'Photo Shoot',
    [CarMovementReason.INVENTORY_MANAGEMENT]: 'Inventory Management',
    [CarMovementReason.QUALITY_CHECK]: 'Quality Check',
    [CarMovementReason.DEMONSTRATION]: 'Demonstration',
    [CarMovementReason.SALE_PROCESSING]: 'Sale Processing',
    [CarMovementReason.WARRANTY_WORK]: 'Warranty Work',
    [CarMovementReason.RECALL_WORK]: 'Recall Work',
    [CarMovementReason.STORAGE_RELOCATION]: 'Storage Relocation',
    [CarMovementReason.INITIAL_ARRIVAL]: 'Initial Arrival',
    [CarMovementReason.ARRIVAL_PROCESSED]: 'Arrival Processed',
    [CarMovementReason.CLIENT_RESERVATION]: 'Client Reservation',
    [CarMovementReason.TEST_VEHICLE_SETUP]: 'Test Vehicle Setup',
    [CarMovementReason.INITIAL_STATUS_ASSIGNMENT]: 'Initial Status Assignment',
    [CarMovementReason.CLIENT_INTEREST_DISPLAY]: 'Client Interest - Moved for Display',
    [CarMovementReason.TEST_VEHICLE_VIN_SCANNER]: 'Test Vehicle for VIN Scanner Functionality',
    [CarMovementReason.OTHER]: 'Other'
  };
  return labels[reason] || reason;
};

export const getRepairReasonLabel = (reason: RepairReason): string => {
  const labels: Record<RepairReason, string> = {
    [RepairReason.REGULAR_MAINTENANCE]: 'Regular Maintenance',
    [RepairReason.WARRANTY_REPAIR]: 'Warranty Repair',
    [RepairReason.CUSTOMER_REQUEST]: 'Customer Request',
    [RepairReason.DAMAGE_REPAIR]: 'Damage Repair',
    [RepairReason.TECHNICAL_ISSUE]: 'Technical Issue',
    [RepairReason.SAFETY_CONCERN]: 'Safety Concern',
    [RepairReason.QUALITY_ISSUE]: 'Quality Issue',
    [RepairReason.PREVENTIVE_MAINTENANCE]: 'Preventive Maintenance',
    [RepairReason.INSPECTION_FAILURE]: 'Inspection Failure',
    [RepairReason.RECALL_WORK]: 'Recall Work',
    [RepairReason.UPGRADE_INSTALLATION]: 'Upgrade Installation',
    [RepairReason.DIAGNOSTIC_TESTING]: 'Diagnostic Testing',
    [RepairReason.OTHER]: 'Other'
  };
  return labels[reason] || reason;
};

// Utility Functions
export const getAllTestDrivePurposes = (): Array<{ value: TestDrivePurpose; label: string }> => {
  return Object.values(TestDrivePurpose).map(purpose => ({
    value: purpose,
    label: getTestDrivePurposeLabel(purpose)
  }));
};

export const getAllCarMovementReasons = (): Array<{ value: CarMovementReason; label: string }> => {
  return Object.values(CarMovementReason).map(reason => ({
    value: reason,
    label: getCarMovementReasonLabel(reason)
  }));
};

export const getAllRepairReasons = (): Array<{ value: RepairReason; label: string }> => {
  return Object.values(RepairReason).map(reason => ({
    value: reason,
    label: getRepairReasonLabel(reason)
  }));
};

// Validation Functions
export const validateTestDrivePurpose = (purpose: string): TestDrivePurpose | null => {
  return isTestDrivePurpose(purpose) ? purpose : null;
};

export const validateCarMovementReason = (reason: string): CarMovementReason | null => {
  return isCarMovementReason(reason) ? reason : null;
};

export const validateRepairReason = (reason: string): RepairReason | null => {
  return isRepairReason(reason) ? reason : null;
};

// Default Values
export const DEFAULT_TEST_DRIVE_PURPOSE = TestDrivePurpose.CLIENT_INTEREST;
export const DEFAULT_CAR_MOVEMENT_REASON = CarMovementReason.OTHER;
export const DEFAULT_REPAIR_REASON = RepairReason.OTHER; 