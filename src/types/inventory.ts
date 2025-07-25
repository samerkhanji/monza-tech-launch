export interface InventoryLocation {
  shelf: string;
  column: string;
  row: string;
  room?: string;
  floor: 'Floor 1' | 'Floor 2' | 'Garage';
}

export interface TechnicalSpecification {
  id: string;
  name: string;
  value: string;
  unit?: string;
  category: 'dimensions' | 'electrical' | 'mechanical' | 'material' | 'performance' | 'environmental' | 'other';
  description?: string;
}

export interface TransferRecord {
  id: string;
  fromVin: string;
  toVin: string;
  date: string;
  reason: string;
  authorizedBy: string;
  quantity?: number;
}

export interface InventoryItem {
  id: string;
  carModel: string;
  partName: string;
  partNumber: string;
  quantity: number;
  location: InventoryLocation;
  lastUpdated: string;
  supplier?: string;
  vehicleType: VehicleType;
  category: Category;
  vin?: string;
  pdiStatus?: PdiStatus;
  pdiNotes?: string;
  notes?: string;
  technicalSpecs?: TechnicalSpecification[];
  weight?: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    unit: 'mm' | 'cm' | 'in';
  };
  material?: string;
  color?: string;
  warranty?: {
    duration: number;
    unit: 'months' | 'years';
    terms?: string;
  };
  compatibleModels?: string[];
  installationNotes?: string;
  safetyInstructions?: string;
  // New export category fields
  exportCategory?: 'EU' | 'REV' | 'ICEU' | 'Universal';
  transferHistory?: TransferRecord[];
  isReusable?: boolean;
}

export type VehicleType = 'EV' | 'ICE' | 'Hybrid' | 'REV' | 'ICEV';
export type Category = 'part' | 'accessory';
export type PdiStatus = 'pending' | 'in progress' | 'completed' | 'failed';
