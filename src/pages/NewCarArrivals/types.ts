export interface NewCar {
  id: string;
  vin: string;
  vinNumber: string; // Keep for backward compatibility
  model: string;
  year: number;
  color: string;
  arrivalDate: string;
  vehicleCategory?: 'EV' | 'REV' | 'ICEV' | 'Other';
  category?: 'EV' | 'REV' | 'ICEV' | 'Other';
  batteryPercentage?: number;
  hasDamages?: boolean;
  damageDescription?: string;
  notes?: string;
  status?: string;
  pdiCompleted?: boolean;
  pdiTechnician?: string;
  pdiPerformedBy?: string;
  pdiNotes?: string;
  pdiPhotos?: string[];
  photos?: string[];
  damages?: Array<{
    id: string;
    description: string;
    severity: 'minor' | 'moderate' | 'severe';
    location: string;
    timestamp: string;
    photos?: string[];
  }>;
  brand?: string;
}

// Export as NewCarArrival for backward compatibility
export type NewCarArrival = NewCar;

// Helper function to create a complete NewCar object from partial data
export const createNewCar = (data: Partial<NewCar> & { 
  id: string; 
  vinNumber: string; 
  model: string; 
  year: number; 
  color: string; 
  arrivalDate: string; 
}): NewCar => {
  return {
    ...data,
    vin: data.vin || data.vinNumber, // Use vin if provided, otherwise use vinNumber
    vinNumber: data.vinNumber,
    vehicleCategory: data.vehicleCategory || data.category || 'EV',
    category: data.category || data.vehicleCategory || 'EV',
    status: data.status || 'arrived',
    batteryPercentage: data.batteryPercentage || (data.vehicleCategory === 'EV' || data.category === 'EV' ? 50 : undefined),
    hasDamages: data.hasDamages || false,
    photos: data.photos || [],
    damages: data.damages || [],
  };
};

// Sample data for initial state
export const initialNewCars: NewCar[] = [
  createNewCar({
    id: '1',
    vinNumber: '1234567890ABCDEFG',
    model: 'Mercedes-Benz S-Class',
    year: 2024,
    color: 'Obsidian Black',
    arrivalDate: new Date().toISOString(),
    brand: 'Mercedes-Benz',
    vehicleCategory: 'EV',
    batteryPercentage: 85,
  }),
  createNewCar({
    id: '2',
    vinNumber: '9876543210ZYXWVUT',
    model: 'Porsche 911',
    year: 2023,
    color: 'Guards Red',
    arrivalDate: new Date().toISOString(),
    brand: 'Porsche',
    vehicleCategory: 'ICEV',
  })
];
