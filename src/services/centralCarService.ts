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
export interface LocationHistoryEntry {
  id: string;
  fromLocation: string;
  toLocation: string;
  movedAt: string;
  movedBy: string;
  reason: string;
  notes?: string;
}

export interface StatusHistoryEntry {
  id: string;
  fromStatus: string;
  toStatus: string;
  changedAt: string;
  changedBy: string;
  reason: string;
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
    this.initializeWithMockData();
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

  private initializeWithMockData(): void {
    // Only initialize if no data exists
    if (this.cars.size === 0) {
      this.loadMockData();
    }
  }

  private loadMockData(): void {
    const now = new Date().toISOString();
    
    // Comprehensive mock data with full VIN linking
    const mockCars: CentralCarRecord[] = [
      {
        id: 'central-001',
        vinNumber: 'VF1VOY123456789012',
        model: 'Voyah Free',
        year: 2024,
        color: 'Pearl White',
        brand: 'Voyah',
        category: 'EV',
        status: 'in_stock',
        arrivalDate: '2024-12-01T08:00:00Z',
        batteryPercentage: 95,
        sellingPrice: 75000,
        customs: 'paid',
        shipmentCode: 'VF-2024-1201-001',
        currentLocation: 'car_inventory',
        locationHistory: [{
          id: crypto.randomUUID(),
          fromLocation: 'factory',
          toLocation: 'car_inventory',
          movedAt: '2024-12-01T08:00:00Z',
          movedBy: 'System',
          reason: 'Initial arrival from factory'
        }],
        statusHistory: [{
          id: crypto.randomUUID(),
          fromStatus: 'in_transit',
          toStatus: 'in_stock',
          changedAt: '2024-12-01T08:00:00Z',
          changedBy: 'System',
          reason: 'Arrival processed'
        }],
        pdiHistory: [],
        testDriveHistory: [],
        financialHistory: [{
          id: crypto.randomUUID(),
          type: 'price_change',
          amount: 75000,
          currency: 'USD',
          date: '2024-12-01T08:00:00Z',
          processedBy: 'System',
          reference: 'Initial pricing'
        }],
        clientInteractions: [],
        documents: [],
        photos: [],
        serviceHistory: [],
        tags: ['new_arrival', 'premium'],
        priority: 'medium',
        pdiCompleted: false,
        createdAt: now,
        updatedAt: now,
        lastModifiedBy: 'System',

      },
      {
        id: 'central-002',
        vinNumber: 'VF1VOY234567890123',
        model: 'Voyah Dream',
        year: 2024,
        color: 'Midnight Silver',
        brand: 'Voyah',
        category: 'REV',
        status: 'reserved',
        arrivalDate: '2024-12-05T10:30:00Z',
        batteryPercentage: 88,
        sellingPrice: 95000,
        customs: 'paid',
        shipmentCode: 'VF-2024-1205-002',
        currentLocation: 'showroom_floor_1',
        clientName: 'Ahmed Al-Rashid',
        clientPhone: '+971-50-123-4567',
        clientEmail: 'ahmed@example.com',
        locationHistory: [
          {
            id: crypto.randomUUID(),
            fromLocation: 'factory',
            toLocation: 'car_inventory',
            movedAt: '2024-12-05T10:30:00Z',
            movedBy: 'System',
            reason: 'Initial arrival from factory'
          },
          {
            id: crypto.randomUUID(),
            fromLocation: 'car_inventory',
            toLocation: 'showroom_floor_1',
            movedAt: '2024-12-08T14:00:00Z',
            movedBy: 'Sales Manager',
            reason: 'Client interest - moved for display'
          }
        ],
        statusHistory: [
          {
            id: crypto.randomUUID(),
            fromStatus: 'in_transit',
            toStatus: 'in_stock',
            changedAt: '2024-12-05T10:30:00Z',
            changedBy: 'System',
            reason: 'Arrival processed'
          },
          {
            id: crypto.randomUUID(),
            fromStatus: 'in_stock',
            toStatus: 'reserved',
            changedAt: '2024-12-10T16:30:00Z',
            changedBy: 'Sales Rep',
            reason: 'Client reservation received'
          }
        ],
        pdiHistory: [{
          id: crypto.randomUUID(),
          type: 'initial',
          completedAt: '2024-12-07T09:00:00Z',
          technician: 'Tech-001',
          status: 'passed',
          checklist: [
            { category: 'Exterior', item: 'Paint Quality', status: 'pass' },
            { category: 'Interior', item: 'Seat Condition', status: 'pass' },
            { category: 'Electrical', item: 'Battery Status', status: 'pass' }
          ],
          photos: [],
          notes: 'All systems verified and operational'
        }],
        testDriveHistory: [{
          id: crypto.randomUUID(),
          startTime: '2024-12-09T14:00:00Z',
          endTime: '2024-12-09T14:30:00Z',
          duration: 30,
          driverName: 'Ahmed Al-Rashid',
          driverPhone: '+971-50-123-4567',
          driverLicense: 'DL123456789',
          isClientTestDrive: true,
          route: 'City Center - Highway - Return',
          feedback: 'Excellent performance and comfort',
          outcome: 'purchased',
          notes: 'Client very satisfied with performance'
        }],
        financialHistory: [
          {
            id: crypto.randomUUID(),
            type: 'price_change',
            amount: 95000,
            currency: 'USD',
            date: '2024-12-05T10:30:00Z',
            processedBy: 'System',
            reference: 'Initial pricing'
          },
          {
            id: crypto.randomUUID(),
            type: 'deposit_received',
            amount: 10000,
            currency: 'USD',
            date: '2024-12-10T16:30:00Z',
            processedBy: 'Sales Rep',
            reference: 'Reservation deposit'
          }
        ],
        clientInteractions: [
          {
            id: crypto.randomUUID(),
            clientName: 'Ahmed Al-Rashid',
            clientPhone: '+971-50-123-4567',
            clientEmail: 'ahmed@example.com',
            interactionType: 'inquiry',
            date: '2024-12-08T11:00:00Z',
            handledBy: 'Sales Rep',
            summary: 'Initial inquiry about Voyah Dream features and pricing',
            outcome: 'Scheduled test drive'
          },
          {
            id: crypto.randomUUID(),
            clientName: 'Ahmed Al-Rashid',
            clientPhone: '+971-50-123-4567',
            clientEmail: 'ahmed@example.com',
            interactionType: 'test_drive',
            date: '2024-12-09T14:00:00Z',
            handledBy: 'Sales Rep',
            summary: 'Test drive completed successfully',
            outcome: 'Client very interested, negotiating price'
          },
          {
            id: crypto.randomUUID(),
            clientName: 'Ahmed Al-Rashid',
            clientPhone: '+971-50-123-4567',
            clientEmail: 'ahmed@example.com',
            interactionType: 'purchase',
            date: '2024-12-10T16:30:00Z',
            handledBy: 'Sales Manager',
            summary: 'Purchase agreement signed, deposit received',
            outcome: 'Purchase confirmed'
          }
        ],
        documents: [{
          id: crypto.randomUUID(),
          type: 'contract',
          fileName: 'purchase_agreement_ahmed.pdf',
          fileUrl: '/documents/purchase_agreement_ahmed.pdf',
          uploadedAt: '2024-12-10T16:30:00Z',
          uploadedBy: 'Sales Manager',
          description: 'Signed purchase agreement'
        }],
        photos: [],
        serviceHistory: [],
        tags: ['reserved', 'premium', 'test_driven'],
        priority: 'high',
        pdiCompleted: true,
        pdiDate: '2024-12-07T09:00:00Z',
        pdiTechnician: 'Tech-001',
        pdiNotes: 'All systems verified and operational',
        createdAt: now,
        updatedAt: now,
        lastModifiedBy: 'Sales Manager'
      },
      {
        id: 'central-003',
        vinNumber: 'MOCKVIN000000001',
        model: 'Test Vehicle',
        year: 2024,
        color: 'White',
        brand: 'Mock',
        category: 'EV',
        status: 'in_stock',
        arrivalDate: '2024-12-21T10:00:00Z',
        batteryPercentage: 85,
        sellingPrice: 50000,
        customs: 'paid',
        shipmentCode: 'MOCK-2024-1221-001',
        currentLocation: 'car_inventory',
        locationHistory: [{
          id: crypto.randomUUID(),
          fromLocation: 'external',
          toLocation: 'car_inventory',
          movedAt: '2024-12-21T10:00:00Z',
          movedBy: 'System',
          reason: 'Test vehicle for VIN scanner functionality'
        }],
        statusHistory: [{
          id: crypto.randomUUID(),
          fromStatus: 'new',
          toStatus: 'in_stock',
          changedAt: '2024-12-21T10:00:00Z',
          changedBy: 'System',
          reason: 'Test vehicle setup'
        }],
        pdiHistory: [],
        testDriveHistory: [],
        financialHistory: [{
          id: crypto.randomUUID(),
          type: 'price_change',
          amount: 50000,
          currency: 'USD',
          date: '2024-12-21T10:00:00Z',
          processedBy: 'System',
          reference: 'Initial test pricing'
        }],
        clientInteractions: [],
        documents: [],
        photos: [],
        serviceHistory: [],
        tags: ['test_vehicle', 'vin_scanner'],
        priority: 'low',
        pdiCompleted: false,
        createdAt: now,
        updatedAt: now,
        lastModifiedBy: 'System'
      }
    ];

    // Add all mock cars to the system
    mockCars.forEach(car => {
      this.cars.set(car.vinNumber, car);
    });

    this.saveToStorage();
    console.log(`Loaded ${mockCars.length} comprehensive mock cars with full VIN linking`);
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
        reason: 'Initial arrival',
        notes: 'Car added to inventory system'
      }],
      statusHistory: [{
        id: crypto.randomUUID(),
        fromStatus: 'new',
        toStatus: carData.status || 'in_stock',
        changedAt: now,
        changedBy: addedBy,
        reason: 'Initial status assignment'
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
        reason: updates.notes || 'Status updated'
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
        reason: updates.notes || 'Location changed'
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

  resetToMockData(): void {
    this.clearAllData();
    this.loadMockData();
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