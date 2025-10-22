import { Car } from '@/types';
import { carService } from './carService';
import { toast } from '@/hooks/use-toast';

// Enhanced car interface with complete tracking information
export interface CentralCarRecord extends Omit<Car, 'status' | 'photos'> {
  // Location tracking - updated with all workflow locations
  currentLocation: 'new_arrivals' | 'car_inventory' | 'garage_inventory' | 'showroom_floor_1' | 'showroom_floor_2' | 'showroom_inventory' | 'inventory_floor_2' | 'inventory_garage' | 'repairs' | 'garage_schedule' | 'quality_control' | 'sold' | 'shipped' | 'test_drive';
  locationHistory: LocationHistoryEntry[];
  
  // Status tracking - updated with all workflow statuses (extends base Car status)
  status: 'in_stock' | 'sold' | 'reserved' | 'available_for_display' | 'pdi_pending' | 'pdi_in_progress' | 'pdi_completed' | 'repair_needed' | 'repair_in_progress' | 'repair_completed' | 'quality_check' | 'showroom_ready' | 'test_drive_ready' | 'negotiation' | 'delivery_prep' | 'delivered';
  statusHistory: StatusHistoryEntry[];
  
  // PDI tracking
  pdiHistory: PDIHistoryEntry[];
  
  // Test drive tracking
  testDriveHistory: TestDriveHistoryEntry[];
  
  // Financial tracking
  financialHistory: FinancialHistoryEntry[];
  
  // Client interactions
  clientInteractions: ClientInteractionEntry[];
  
  // Documents and photos (enhanced from base Car type)
  documents: DocumentEntry[];
  photos: PhotoEntry[];
  
  // Service and maintenance
  serviceHistory: ServiceHistoryEntry[];
  
  // Custom fields for filtering and reporting
  tags: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  // Audit trail
  createdAt: string;
  updatedAt: string;
  lastModifiedBy: string;
}

// Supporting interfaces for complete data tracking
import { CarMovementReason } from '@/types/purposeReason';

export interface LocationHistoryEntry {
  id: string;
  fromLocation: string;
  toLocation: string;
  movedAt: string;
  movedBy: string;
  reason: CarMovementReason;
  notes?: string;
}

export interface StatusHistoryEntry {
  id: string;
  fromStatus: string;
  toStatus: string;
  changedAt: string;
  changedBy: string;
  reason: CarMovementReason;
  notes?: string;
}

export interface PDIHistoryEntry {
  id: string;
  type: 'initial' | 'follow_up' | 'final';
  completedAt: string;
  technician: string;
  status: 'passed' | 'failed' | 'conditional';
  checklist: PDIChecklistItem[];
  photos: string[];
  notes: string;
  nextActionRequired?: string;
}

export interface PDIChecklistItem {
  category: string;
  item: string;
  status: 'pass' | 'fail' | 'na';
  notes?: string;
  photos?: string[];
}

export interface TestDriveHistoryEntry {
  id: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  driverName: string;
  driverPhone: string;
  driverLicense: string;
  isClientTestDrive: boolean;
  route?: string;
  feedback?: string;
  outcome: 'interested' | 'not_interested' | 'purchased' | 'follow_up';
  followUpDate?: string;
  notes?: string;
}

export interface FinancialHistoryEntry {
  id: string;
  type: 'price_change' | 'discount_applied' | 'deposit_received' | 'payment_received' | 'refund_issued';
  amount: number;
  currency: string;
  date: string;
  processedBy: string;
  reference: string;
  notes?: string;
}

export interface ClientInteractionEntry {
  id: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  interactionType: 'inquiry' | 'viewing' | 'test_drive' | 'negotiation' | 'purchase' | 'complaint' | 'follow_up';
  date: string;
  handledBy: string;
  summary: string;
  outcome?: string;
  nextAction?: string;
  nextActionDate?: string;
}

export interface DocumentEntry {
  id: string;
  type: 'invoice' | 'contract' | 'insurance' | 'registration' | 'warranty' | 'pdi_report' | 'customs' | 'other';
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
  uploadedBy: string;
  description?: string;
}

export interface PhotoEntry {
  id: string;
  category: 'exterior' | 'interior' | 'engine' | 'damage' | 'pdi' | 'delivery' | 'other';
  url: string;
  takenAt: string;
  takenBy: string;
  description?: string;
  location?: string;
}

export interface ServiceHistoryEntry {
  id: string;
  type: 'maintenance' | 'repair' | 'recall' | 'upgrade' | 'inspection';
  description: string;
  startDate: string;
  completionDate?: string;
  technician: string;
  cost?: number;
  partsUsed?: ServicePart[];
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
}

export interface ServicePart {
  partNumber: string;
  partName: string;
  quantity: number;
  unitCost: number;
  supplier?: string;
}

class CentralCarService {
  private cars: Map<string, CentralCarRecord> = new Map(); // VIN as key
  private storageKey = 'central_car_database';

  constructor() {
    this.loadFromStorage();
  }

  // Core VIN-based operations
  getCarByVIN(vin: string): CentralCarRecord | null {
    return this.cars.get(vin.toUpperCase()) || null;
  }

  getAllCars(): CentralCarRecord[] {
    return Array.from(this.cars.values());
  }

  getCarsByLocation(location: CentralCarRecord['currentLocation']): CentralCarRecord[] {
    return this.getAllCars().filter(car => car.currentLocation === location);
  }

  getCarsByStatus(status: string): CentralCarRecord[] {
    return this.getAllCars().filter(car => car.status === status);
  }

  // Advanced search and filtering
  searchCars(criteria: {
    vin?: string;
    model?: string;
    color?: string;
    status?: string;
    location?: string;
    clientName?: string;
    pdiStatus?: boolean;
    priceRange?: { min: number; max: number };
    arrivalDateRange?: { start: string; end: string };
    tags?: string[];
  }): CentralCarRecord[] {
    let results = this.getAllCars();

    if (criteria.vin) {
      results = results.filter(car => 
        car.vinNumber?.toLowerCase().includes(criteria.vin!.toLowerCase())
      );
    }

    if (criteria.model) {
      results = results.filter(car => 
        car.model.toLowerCase().includes(criteria.model!.toLowerCase())
      );
    }

    if (criteria.color) {
      results = results.filter(car => 
        car.color.toLowerCase().includes(criteria.color!.toLowerCase())
      );
    }

    if (criteria.status) {
      results = results.filter(car => car.status === criteria.status);
    }

    if (criteria.location) {
      results = results.filter(car => car.currentLocation === criteria.location);
    }

    if (criteria.clientName) {
      results = results.filter(car => 
        car.clientName?.toLowerCase().includes(criteria.clientName!.toLowerCase())
      );
    }

    if (criteria.pdiStatus !== undefined) {
      results = results.filter(car => car.pdiCompleted === criteria.pdiStatus);
    }

    if (criteria.priceRange) {
      results = results.filter(car => 
        car.sellingPrice && 
        car.sellingPrice >= criteria.priceRange!.min && 
        car.sellingPrice <= criteria.priceRange!.max
      );
    }

    if (criteria.arrivalDateRange) {
      results = results.filter(car => 
        car.arrivalDate >= criteria.arrivalDateRange!.start && 
        car.arrivalDate <= criteria.arrivalDateRange!.end
      );
    }

    if (criteria.tags && criteria.tags.length > 0) {
      results = results.filter(car => 
        criteria.tags!.some(tag => car.tags.includes(tag))
      );
    }

    return results;
  }

  // Storage management
  private saveToStorage(): void {
    try {
      const data = Array.from(this.cars.entries());
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save to storage:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        const entries: [string, CentralCarRecord][] = JSON.parse(data);
        this.cars = new Map(entries);
      }
    } catch (error) {
      console.error('Failed to load from storage:', error);
      this.cars = new Map();
    }
  }



  // Car lifecycle management
  addCar(carData: Partial<Car>, addedBy: string): string {
    const vin = carData.vinNumber?.toUpperCase();
    if (!vin) {
      throw new Error('VIN number is required');
    }

    if (this.cars.has(vin)) {
      throw new Error(`Car with VIN ${vin} already exists`);
    }

    const now = new Date().toISOString();
    const centralRecord: CentralCarRecord = {
      ...carData as Car,
      vinNumber: vin,
      currentLocation: 'car_inventory',
      locationHistory: [{
        id: crypto.randomUUID(),
        fromLocation: 'factory',
        toLocation: 'car_inventory',
        movedAt: now,
        movedBy: addedBy,
        reason: CarMovementReason.INITIAL_ARRIVAL,
        notes: 'Car added to inventory system'
      }],
      statusHistory: [{
        id: crypto.randomUUID(),
        fromStatus: 'new',
        toStatus: carData.status || 'in_stock',
        changedAt: now,
        changedBy: addedBy,
        reason: CarMovementReason.INITIAL_STATUS_ASSIGNMENT
      }],
      pdiHistory: [],
      testDriveHistory: [],
      financialHistory: carData.sellingPrice ? [{
        id: crypto.randomUUID(),
        type: 'price_change',
        amount: carData.sellingPrice,
        currency: 'USD',
        date: now,
        processedBy: addedBy,
        reference: 'Initial pricing'
      }] : [],
      clientInteractions: [],
      documents: [],
      photos: [],
      serviceHistory: [],
      tags: [],
      priority: 'medium',
      createdAt: now,
      updatedAt: now,
      lastModifiedBy: addedBy
    };

    this.cars.set(vin, centralRecord);
    this.saveToStorage();
    return vin;
  }

  updateCar(vin: string, updates: Partial<CentralCarRecord>, modifiedBy: string): void {
    const car = this.getCarByVIN(vin);
    if (!car) {
      throw new Error(`Car with VIN ${vin} not found`);
    }

    const now = new Date().toISOString();

    // Track status changes
    if (updates.status && updates.status !== car.status) {
      car.statusHistory.push({
        id: crypto.randomUUID(),
        fromStatus: car.status,
        toStatus: updates.status,
        changedAt: now,
        changedBy: modifiedBy,
        reason: CarMovementReason.OTHER
      });
    }

    // Track location changes
    if (updates.currentLocation && updates.currentLocation !== car.currentLocation) {
      car.locationHistory.push({
        id: crypto.randomUUID(),
        fromLocation: car.currentLocation,
        toLocation: updates.currentLocation,
        movedAt: now,
        movedBy: modifiedBy,
        reason: CarMovementReason.INVENTORY_MANAGEMENT
      });
    }

    // Track financial changes
    if (updates.sellingPrice && updates.sellingPrice !== car.sellingPrice) {
      car.financialHistory.push({
        id: crypto.randomUUID(),
        type: 'price_change',
        amount: updates.sellingPrice,
        currency: 'USD',
        date: now,
        processedBy: modifiedBy,
        reference: 'Price updated'
      });
    }

    // Apply updates
    Object.assign(car, updates, {
      updatedAt: now,
      lastModifiedBy: modifiedBy
    });

    this.cars.set(vin, car);
    this.saveToStorage();
  }

  // Location management
  moveCarToLocation(vin: string, newLocation: CentralCarRecord['currentLocation'], reason: string, movedBy: string): void {
    this.updateCar(vin, { currentLocation: newLocation, notes: reason }, movedBy);
  }

  // PDI management
  addPDIRecord(vin: string, pdiData: Omit<PDIHistoryEntry, 'id'>, technician: string): void {
    const car = this.getCarByVIN(vin);
    if (!car) {
      throw new Error(`Car with VIN ${vin} not found`);
    }

    const pdiRecord: PDIHistoryEntry = {
      id: crypto.randomUUID(),
      ...pdiData
    };

    car.pdiHistory.push(pdiRecord);
    
    // Update PDI status based on latest record
    car.pdiCompleted = pdiRecord.status === 'passed';
    car.pdiDate = pdiRecord.completedAt;
    car.pdiTechnician = pdiRecord.technician;
    car.pdiNotes = pdiRecord.notes;

    this.updateCar(vin, car, technician);
  }

  // Test drive management
  addTestDriveRecord(vin: string, testDriveData: Omit<TestDriveHistoryEntry, 'id'>): void {
    const car = this.getCarByVIN(vin);
    if (!car) {
      throw new Error(`Car with VIN ${vin} not found`);
    }

    const testDriveRecord: TestDriveHistoryEntry = {
      id: crypto.randomUUID(),
      ...testDriveData
    };

    car.testDriveHistory.push(testDriveRecord);
    this.updateCar(vin, car, 'system');
  }

  // Client interaction management
  addClientInteraction(vin: string, interaction: Omit<ClientInteractionEntry, 'id'>): void {
    const car = this.getCarByVIN(vin);
    if (!car) {
      throw new Error(`Car with VIN ${vin} not found`);
    }

    const interactionRecord: ClientInteractionEntry = {
      id: crypto.randomUUID(),
      ...interaction
    };

    car.clientInteractions.push(interactionRecord);
    
    // Update client info if this is a purchase interaction
    if (interaction.interactionType === 'purchase') {
      car.clientName = interaction.clientName;
      car.clientPhone = interaction.clientPhone;
      car.clientEmail = interaction.clientEmail;
    }

    this.updateCar(vin, car, interaction.handledBy);
  }

  // Document and photo management
  addDocument(vin: string, document: Omit<DocumentEntry, 'id'>): void {
    const car = this.getCarByVIN(vin);
    if (!car) {
      throw new Error(`Car with VIN ${vin} not found`);
    }

    const documentRecord: DocumentEntry = {
      id: crypto.randomUUID(),
      ...document
    };

    car.documents.push(documentRecord);
    this.updateCar(vin, car, document.uploadedBy);
  }

  addPhoto(vin: string, photo: Omit<PhotoEntry, 'id'>): void {
    const car = this.getCarByVIN(vin);
    if (!car) {
      throw new Error(`Car with VIN ${vin} not found`);
    }

    const photoRecord: PhotoEntry = {
      id: crypto.randomUUID(),
      ...photo
    };

    car.photos.push(photoRecord);
    this.updateCar(vin, car, photo.takenBy);
  }

  // Export methods for easy integration
  exportCarData(vin: string): CentralCarRecord | null {
    return this.getCarByVIN(vin);
  }

  exportAllData(): CentralCarRecord[] {
    return this.getAllCars();
  }

  // Cleanup and reset
  clearAllData(): void {
    this.cars.clear();
    localStorage.removeItem(this.storageKey);
  }


}

// Supporting interfaces for reports
export interface TimelineEvent {
  date: string;
  type: 'arrival' | 'location_change' | 'pdi' | 'test_drive' | 'client_interaction' | 'status_change' | 'financial';
  description: string;
  actor: string;
  vin?: string;
}

// Create singleton instance
export const centralCarService = new CentralCarService(); 