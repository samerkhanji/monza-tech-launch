import { supabase } from '@/integrations/supabase/client';
import { extractTextFromImage } from '@/utils/ocrUtils';

export interface VinOcrResult {
  vin: string;
  confidence: number;
  extractedText: string;
  carData?: {
    brand: string;
    model: string;
    year: number;
    category: 'EV' | 'REV' | 'ICEV' | 'Other';
    estimatedPrice?: number;
  };
}

export interface LocationTarget {
  table: string;
  location: string;
  currentFloor: string;
  inShowroom?: boolean;
  showroomEntryDate?: string;
}

// VIN validation patterns
const VIN_PATTERNS = [
  // Standard 17-character VIN pattern (most common)
  /\b[A-HJ-NPR-Z0-9]{17}\b/gi,
  
  // VIN with separators (dashes, spaces, dots)
  /\b[A-HJ-NPR-Z0-9]{3}[-\s.]?[A-HJ-NPR-Z0-9]{2}[-\s.]?[A-HJ-NPR-Z0-9]{2}[-\s.]?[A-HJ-NPR-Z0-9]{2}[-\s.]?[A-HJ-NPR-Z0-9]{6}\b/gi,
  
  // VIN with various prefixes (common in receipts/manifests)
  /(?:VIN|V\.I\.N|VEHICLE\s+ID|CHASSIS|FRAME)[:#\s]*([A-HJ-NPR-Z0-9]{17})/gi,
  /(?:Serial|S\/N|IDENT)[:#\s]*([A-HJ-NPR-Z0-9]{17})/gi,
  
  // VIN in numbered lists (1. VIN: XXX, 2. VIN: XXX)
  /\d+[.)]\s*(?:VIN|VEHICLE)[:#\s]*([A-HJ-NPR-Z0-9]{17})/gi,
];

// Brand detection patterns from VIN
const VIN_BRAND_MAPPING: Record<string, { brand: string; category: 'EV' | 'REV' | 'ICEV' | 'Other' }> = {
  'JN': { brand: 'Nissan', category: 'EV' },
  'LFV': { brand: 'BMW', category: 'EV' },
  'WBA': { brand: 'BMW', category: 'EV' },
  'WBY': { brand: 'BMW', category: 'EV' },
  '5YJ': { brand: 'Tesla', category: 'EV' },
  '7SA': { brand: 'Tesla', category: 'EV' },
  'LGX': { brand: 'Voyah', category: 'EV' },
  'L6T': { brand: 'BYD', category: 'EV' },
  'LFP': { brand: 'Mercedes-Benz', category: 'EV' },
  'WDD': { brand: 'Mercedes-Benz', category: 'EV' },
  '1G1': { brand: 'Chevrolet', category: 'EV' },
  'KN': { brand: 'Hyundai', category: 'EV' },
  'ZAM': { brand: 'Lamborghini', category: 'ICEV' },
  'ZFF': { brand: 'Ferrari', category: 'ICEV' },
  'WP0': { brand: 'Porsche', category: 'EV' },
  'VF3': { brand: 'Peugeot', category: 'EV' },
};

// Voyah specific model detection
const VOYAH_MODEL_PATTERNS = [
  { pattern: /dream/i, model: 'Voyah Dream' },
  { pattern: /free/i, model: 'Voyah Free' },
  { pattern: /passion/i, model: 'Voyah Passion' },
  { pattern: /free\s*318/i, model: 'Voyah Free 318' },
];

export const vinOcrService = {
  
  // Extract VIN from image using OCR
  async extractVinFromImage(imageDataUrl: string): Promise<VinOcrResult> {
    try {
      console.log('Starting VIN extraction from image...');
      
      const extractedText = await extractTextFromImage(imageDataUrl);
      console.log('Extracted text:', extractedText);
      
      if (!extractedText || extractedText.length < 10) {
        throw new Error('No readable text found in image');
      }
      
      // Extract VIN using multiple patterns
      const vin = this.extractVinFromText(extractedText);
      
      if (!vin) {
        throw new Error('No valid VIN found in image');
      }
      
      // Analyze VIN to get car data
      const carData = this.analyzeVin(vin, extractedText);
      
      return {
        vin,
        confidence: 0.9,
        extractedText,
        carData
      };
      
    } catch (error) {
      console.error('VIN extraction error:', error);
      throw error;
    }
  },

  // Extract VIN from text using patterns
  extractVinFromText(text: string): string | null {
    for (const pattern of VIN_PATTERNS) {
      const matches = text.match(pattern);
      if (matches) {
        for (const match of matches) {
          // Extract captured group if present, otherwise use full match
          const possibleVin = match.includes('(') ? 
            match.replace(/.*?\(([A-HJ-NPR-Z0-9]{17})\).*/, '$1') : 
            match;
          
          // Clean the VIN (remove spaces, dashes, prefixes)
          const cleanVin = possibleVin
            .replace(/[^A-HJ-NPR-Z0-9]/gi, '')
            .toUpperCase();
          
          // Validate VIN length and characters
          if (cleanVin.length === 17 && /^[A-HJ-NPR-Z0-9]{17}$/i.test(cleanVin)) {
            return cleanVin;
          }
        }
      }
    }
    return null;
  },

  // Analyze VIN to extract car information
  analyzeVin(vin: string, fullText?: string): any {
    const wmi = vin.substring(0, 3); // World Manufacturer Identifier
    const vds = vin.substring(3, 9); // Vehicle Descriptor Section
    const vis = vin.substring(9); // Vehicle Identifier Section
    
    // Detect brand and category from VIN
    let brand = 'Unknown';
    let category: 'EV' | 'REV' | 'ICEV' | 'Other' = 'Other';
    
    // Check WMI patterns
    for (const [pattern, info] of Object.entries(VIN_BRAND_MAPPING)) {
      if (wmi.startsWith(pattern)) {
        brand = info.brand;
        category = info.category;
        break;
      }
    }
    
    // Special handling for Voyah models
    let model = '';
    if (brand === 'Voyah' && fullText) {
      for (const { pattern, model: modelName } of VOYAH_MODEL_PATTERNS) {
        if (pattern.test(fullText)) {
          model = modelName;
          break;
        }
      }
    }
    
    // Extract year from VIN (10th character)
    const yearCode = vin.charAt(9);
    const currentYear = new Date().getFullYear();
    let year = currentYear;
    
    // Year encoding for VINs (simplified)
    const yearMap: Record<string, number> = {
      'A': 2010, 'B': 2011, 'C': 2012, 'D': 2013, 'E': 2014,
      'F': 2015, 'G': 2016, 'H': 2017, 'J': 2018, 'K': 2019,
      'L': 2020, 'M': 2021, 'N': 2022, 'P': 2023, 'R': 2024,
      'S': 2025, 'T': 2026, 'V': 2027, 'W': 2028, 'X': 2029,
      'Y': 2030
    };
    
    if (yearMap[yearCode]) {
      year = yearMap[yearCode];
    } else if (/\d/.test(yearCode)) {
      // Handle numeric year codes
      const numericYear = parseInt(yearCode);
      if (numericYear >= 0 && numericYear <= 9) {
        year = 2000 + numericYear;
        if (year < 2000) year += 10; // Assume 2010s for single digits
      }
    }
    
    // Estimate price based on brand and category
    let estimatedPrice = 50000; // Default
    if (brand === 'Tesla') estimatedPrice = 85000;
    else if (brand === 'BMW') estimatedPrice = 75000;
    else if (brand === 'Mercedes-Benz') estimatedPrice = 80000;
    else if (brand === 'Voyah') estimatedPrice = 65000;
    else if (brand === 'Porsche') estimatedPrice = 120000;
    else if (category === 'EV') estimatedPrice = 60000;
    
    return {
      brand,
      model: model || `${brand} Model`,
      year,
      category,
      estimatedPrice,
      color: 'To be determined',
      batteryPercentage: category === 'EV' ? 100 : undefined,
      status: 'in_stock',
      arrivalDate: new Date().toISOString(),
      pdiCompleted: false,
      notes: `Added via VIN scan: ${vin}`
    };
  },

  // Add car to specific location/table
  async addCarToLocation(vinResult: VinOcrResult, target: LocationTarget): Promise<{ success: boolean; carId?: string; error?: string }> {
    try {
      if (!vinResult.carData) {
        throw new Error('No car data available from VIN analysis');
      }
      
      const carData = {
        vin_number: vinResult.vin,
        brand: vinResult.carData.brand,
        model: vinResult.carData.model,
        year: vinResult.carData.year,
        color: vinResult.carData.color,
        category: vinResult.carData.category,
        battery_percentage: vinResult.carData.batteryPercentage,
        status: vinResult.carData.status,
        arrival_date: vinResult.carData.arrivalDate,
        current_floor: target.currentFloor,
        in_showroom: target.inShowroom || false,
        showroom_entry_date: target.showroomEntryDate,
        pdi_completed: vinResult.carData.pdiCompleted,
        notes: vinResult.carData.notes,
        selling_price: vinResult.carData.estimatedPrice,
        customs: 'not_paid',
        last_updated: new Date().toISOString()
      };
      
      // Check if VIN already exists
      const { data: existingCars, error: checkError } = await supabase
        .from('car_inventory')
        .select('id, vin_number, current_floor')
        .eq('vin_number', vinResult.vin);
      
      if (checkError) {
        throw checkError;
      }
      
      if (existingCars && existingCars.length > 0) {
        // Car exists, move it to new location
        const existingCar = existingCars[0];
        const { error: updateError } = await supabase
          .from('car_inventory')
          .update({
            current_floor: target.currentFloor,
            in_showroom: target.inShowroom || false,
            showroom_entry_date: target.showroomEntryDate,
            last_updated: new Date().toISOString()
          })
          .eq('id', existingCar.id);
        
        if (updateError) throw updateError;
        
        return { 
          success: true, 
          carId: existingCar.id,
          error: `Car moved from ${existingCar.current_floor} to ${target.currentFloor}`
        };
      } else {
        // Add new car
        const { data, error } = await supabase
          .from('car_inventory')
          .insert(carData)
          .select()
          .single();
        
        if (error) throw error;
        
        return { success: true, carId: data.id };
      }
      
    } catch (error) {
      console.error('Error adding car to location:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  },

  // Get location target based on current page
  getLocationTarget(currentPath: string): LocationTarget {
    const locationMap: Record<string, LocationTarget> = {
      '/inventory': {
        table: 'car_inventory',
        location: 'Inventory',
        currentFloor: 'Inventory',
        inShowroom: false
      },
      '/showroom-floor-1': {
        table: 'car_inventory',
        location: 'Showroom Floor 1',
        currentFloor: 'Showroom 1',
        inShowroom: true,
        showroomEntryDate: new Date().toISOString()
      },
      '/showroom-floor-2': {
        table: 'car_inventory',
        location: 'Showroom Floor 2',
        currentFloor: 'Showroom 2',
        inShowroom: true,
        showroomEntryDate: new Date().toISOString()
      },
      '/garage-inventory': {
        table: 'car_inventory',
        location: 'Garage',
        currentFloor: 'Garage',
        inShowroom: false
      },
      '/new-arrivals': {
        table: 'car_inventory',
        location: 'New Arrivals',
        currentFloor: 'New Arrivals',
        inShowroom: false
      },
      '/inventory-floor2': {
        table: 'inventory_items',
        location: 'Inventory Floor 2',
        currentFloor: 'Inventory Floor 2',
        inShowroom: false
      },
      '/inventory-garage': {
        table: 'inventory_items',
        location: 'Inventory Garage',
        currentFloor: 'Inventory Garage',
        inShowroom: false
      },
      '/showroom-inventory': {
        table: 'car_inventory',
        location: 'Showroom Inventory',
        currentFloor: 'Showroom Inventory',
        inShowroom: true,
        showroomEntryDate: new Date().toISOString()
      }
    };
    
    return locationMap[currentPath] || {
      table: 'car_inventory',
      location: 'Inventory',
      currentFloor: 'Inventory',
      inShowroom: false
    };
  },

  // Validate VIN format
  isValidVin(vin: string): boolean {
    if (!vin || vin.length !== 17) return false;
    
    // Check for valid VIN characters (excludes I, O, Q)
    const validPattern = /^[A-HJ-NPR-Z0-9]{17}$/i;
    return validPattern.test(vin);
  }
}; 