// ========================================
// SCAN CONTEXT TYPES
// ========================================
// Enumerate scanner contexts to prevent typos and ensure consistency

export type ScanContext =
  // Showroom Floors
  | 'FLOOR_1'
  | 'FLOOR_2'
  | 'SHOWROOM_1'
  | 'SHOWROOM_2'
  
  // Garage Zones
  | 'GARAGE_ZONE_1'
  | 'GARAGE_ZONE_2'
  | 'GARAGE_ZONE_3'
  | 'GARAGE_ZONE_4'
  
  // Service & Operations
  | 'TEST_DRIVE'
  | 'DELIVERY'
  | 'STORAGE_YARD'
  | 'INVENTORY'
  
  // Special: Reject VINs here
  | 'PARTS_INVENTORY';

/**
 * Maps scan contexts to human-readable names
 */
export const SCAN_CONTEXT_LABELS: Record<ScanContext, string> = {
  // Showroom Floors
  'FLOOR_1': 'Showroom Floor 1',
  'FLOOR_2': 'Showroom Floor 2',
  'SHOWROOM_1': 'Showroom 1',
  'SHOWROOM_2': 'Showroom 2',
  
  // Garage Zones
  'GARAGE_ZONE_1': 'Garage Zone 1',
  'GARAGE_ZONE_2': 'Garage Zone 2',
  'GARAGE_ZONE_3': 'Garage Zone 3',
  'GARAGE_ZONE_4': 'Garage Zone 4',
  
  // Service & Operations
  'TEST_DRIVE': 'Test Drive',
  'DELIVERY': 'Delivery',
  'STORAGE_YARD': 'Storage Yard',
  'INVENTORY': 'Main Inventory',
  
  // Special
  'PARTS_INVENTORY': 'Parts Inventory'
};

/**
 * Maps scan contexts to their respective database table names
 */
export const SCAN_CONTEXT_TABLES: Record<ScanContext, string> = {
  // Showroom Floors
  'FLOOR_1': 'car_inventory',
  'FLOOR_2': 'car_inventory',
  'SHOWROOM_1': 'car_inventory',
  'SHOWROOM_2': 'car_inventory',
  
  // Garage Zones
  'GARAGE_ZONE_1': 'car_inventory',
  'GARAGE_ZONE_2': 'car_inventory',
  'GARAGE_ZONE_3': 'car_inventory',
  'GARAGE_ZONE_4': 'car_inventory',
  
  // Service & Operations
  'TEST_DRIVE': 'car_inventory',
  'DELIVERY': 'car_inventory',
  'STORAGE_YARD': 'car_inventory',
  'INVENTORY': 'car_inventory',
  
  // Special
  'PARTS_INVENTORY': 'inventory_parts'
};

/**
 * Checks if a scan context allows VIN scanning
 * @param context - The scan context to check
 * @returns true if VIN scanning is allowed, false otherwise
 */
export function allowsVinScanning(context: ScanContext): boolean {
  return context !== 'PARTS_INVENTORY';
}

/**
 * Gets the appropriate icon for a scan context
 * @param context - The scan context
 * @returns Icon name for the context
 */
export function getScanContextIcon(context: ScanContext): string {
  switch (context) {
    case 'FLOOR_1':
    case 'FLOOR_2':
    case 'SHOWROOM_1':
    case 'SHOWROOM_2':
      return 'building';
    case 'GARAGE_ZONE_1':
    case 'GARAGE_ZONE_2':
    case 'GARAGE_ZONE_3':
    case 'GARAGE_ZONE_4':
      return 'wrench';
    case 'TEST_DRIVE':
      return 'car';
    case 'DELIVERY':
      return 'truck';
    case 'STORAGE_YARD':
      return 'warehouse';
    case 'INVENTORY':
      return 'package';
    case 'PARTS_INVENTORY':
      return 'cog';
    default:
      return 'scan';
  }
}

/**
 * Gets the color theme for a scan context
 * @param context - The scan context
 * @returns Color theme string
 */
export function getScanContextColor(context: ScanContext): string {
  switch (context) {
    case 'FLOOR_1':
    case 'FLOOR_2':
    case 'SHOWROOM_1':
    case 'SHOWROOM_2':
      return 'blue';
    case 'GARAGE_ZONE_1':
    case 'GARAGE_ZONE_2':
    case 'GARAGE_ZONE_3':
    case 'GARAGE_ZONE_4':
      return 'orange';
    case 'TEST_DRIVE':
      return 'green';
    case 'DELIVERY':
      return 'purple';
    case 'STORAGE_YARD':
      return 'gray';
    case 'INVENTORY':
      return 'indigo';
    case 'PARTS_INVENTORY':
      return 'red';
    default:
      return 'gray';
  }
}

/**
 * Validates if a string is a valid scan context
 * @param context - The string to validate
 * @returns true if valid scan context, false otherwise
 */
export function isValidScanContext(context: string): context is ScanContext {
  return Object.values(SCAN_CONTEXT_LABELS).includes(context as ScanContext);
}

/**
 * Gets all scan contexts that allow VIN scanning
 * @returns Array of scan contexts that allow VIN scanning
 */
export function getVinScanningContexts(): ScanContext[] {
  return Object.keys(SCAN_CONTEXT_LABELS).filter(
    (context): context is ScanContext => allowsVinScanning(context as ScanContext)
  );
}

/**
 * Gets all scan contexts that are for parts only
 * @returns Array of scan contexts for parts only
 */
export function getPartsOnlyContexts(): ScanContext[] {
  return Object.keys(SCAN_CONTEXT_LABELS).filter(
    (context): context is ScanContext => !allowsVinScanning(context as ScanContext)
  );
}
