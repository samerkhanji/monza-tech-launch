// VIN Decoder Service - Decodes Vehicle Identification Numbers to provide detailed car information

export interface VINDecodedData {
  vin: string;
  make: string;
  model: string;
  year: number;
  bodyStyle: string;
  engineType: string;
  fuelType: 'Electric' | 'Gasoline' | 'Hybrid' | 'Diesel';
  transmission: string;
  driveType: string;
  country: string;
  manufacturer: string;
  category: 'EV' | 'REV' | 'ICEV';
  estimatedPrice?: number;
  specifications?: {
    horsePower?: number;
    torque?: number;
    topSpeed?: number;
    acceleration?: string;
    range?: number;
    batteryCapacity?: number;
    chargingTime?: string;
  };
  features?: string[];
  colors?: {
    exterior: string[];
    interior: string[];
  };
}

class VINDecoderService {
  private vinDatabase: Map<string, Partial<VINDecodedData>> = new Map();

  constructor() {
    this.initializeVINDatabase();
  }

  private initializeVINDatabase() {
    const voyahModels: Array<[string, Partial<VINDecodedData>]> = [
      ['LVGBB22E', {
        make: 'Voyah',
        model: 'FREE',
        manufacturer: 'Dongfeng Motor Corporation',
        country: 'China',
        bodyStyle: 'SUV',
        engineType: 'Range Extended Electric',
        fuelType: 'Hybrid',
        category: 'REV',
        transmission: 'Single-Speed Automatic',
        driveType: 'AWD',
        estimatedPrice: 85000,
        specifications: {
          horsePower: 510,
          torque: 1040,
          topSpeed: 200,
          acceleration: '4.4s',
          range: 860,
          batteryCapacity: 88,
          chargingTime: '30min (10-80%)'
        },
        features: [
          'Air Suspension',
          'Panoramic Roof',
          'Premium Audio System',
          'Advanced Driver Assistance'
        ],
        colors: {
          exterior: ['Pearl White', 'Midnight Black', 'Space Silver', 'Aurora Blue', 'Ruby Red'],
          interior: ['Black', 'Beige', 'Brown']
        }
      }],
      
      ['LVGBB22D', {
        make: 'Voyah',
        model: 'DREAM',
        manufacturer: 'Dongfeng Motor Corporation',
        country: 'China',
        bodyStyle: 'Sedan',
        engineType: 'Pure Electric',
        fuelType: 'Electric',
        category: 'EV',
        transmission: 'Single-Speed Automatic',
        driveType: 'RWD',
        estimatedPrice: 125000,
        specifications: {
          horsePower: 520,
          torque: 820,
          topSpeed: 200,
          acceleration: '3.8s',
          range: 605,
          batteryCapacity: 108,
          chargingTime: '28min (10-80%)'
        },
        features: [
          'Executive Seating Package',
          'Massage Seats',
          'Premium Sound System',
          'Advanced Autopilot'
        ],
        colors: {
          exterior: ['Phantom Black', 'Pearl White', 'Champagne Gold', 'Deep Blue'],
          interior: ['Black', 'White', 'Brown', 'Red']
        }
      }]
    ];

    voyahModels.forEach(([pattern, data]) => {
      this.vinDatabase.set(pattern, data);
    });
  }

  public async decodeVIN(vin: string): Promise<VINDecodedData | null> {
    try {
      const cleanVIN = this.validateAndCleanVIN(vin);
      if (!cleanVIN) {
        throw new Error('Invalid VIN format');
      }

      const basicInfo = this.extractBasicVINInfo(cleanVIN);
      const specificData = this.findSpecificVehicleData(cleanVIN);
      
      const decodedData: VINDecodedData = {
        vin: cleanVIN,
        make: specificData?.make || 'Unknown',
        model: specificData?.model || 'Unknown Model',
        year: basicInfo.year,
        bodyStyle: specificData?.bodyStyle || 'Unknown',
        engineType: specificData?.engineType || 'Unknown',
        fuelType: specificData?.fuelType || 'Gasoline',
        transmission: specificData?.transmission || 'Unknown',
        driveType: specificData?.driveType || 'Unknown',
        country: specificData?.country || basicInfo.country,
        manufacturer: specificData?.manufacturer || 'Unknown',
        category: specificData?.category || 'ICEV',
        ...specificData
      };

      return decodedData;
    } catch (error) {
      console.error('VIN decoding error:', error);
      return null;
    }
  }

  private validateAndCleanVIN(vin: string): string | null {
    const cleaned = vin.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '');
    
    if (cleaned.length !== 17) {
      return null;
    }
    
    if (/[IOQ]/.test(cleaned)) {
      return null;
    }
    
    return cleaned;
  }

  private extractBasicVINInfo(vin: string) {
    const countryCode = vin.charAt(0);
    const yearCode = vin.charAt(9);
    
    const countries: Record<string, string> = {
      '1': 'USA',
      '2': 'Canada', 
      '3': 'Mexico',
      'J': 'Japan',
      'K': 'South Korea',
      'L': 'China',
      'V': 'France',
      'W': 'Germany',
      'Z': 'Italy'
    };

    const yearMapping: Record<string, number> = {
      'A': 2010, 'B': 2011, 'C': 2012, 'D': 2013, 'E': 2014,
      'F': 2015, 'G': 2016, 'H': 2017, 'J': 2018, 'K': 2019,
      'L': 2020, 'M': 2021, 'N': 2022, 'P': 2023, 'R': 2024,
      'S': 2025, 'T': 2026, 'V': 2027, 'W': 2028, 'X': 2029,
      'Y': 2030
    };

    const numericYear = parseInt(yearCode);
    let year = yearMapping[yearCode] || new Date().getFullYear();
    
    if (!isNaN(numericYear)) {
      if (numericYear >= 1 && numericYear <= 9) {
        year = 2001 + numericYear - 1;
      }
    }

    return {
      country: countries[countryCode] || 'Unknown',
      year: year
    };
  }

  private findSpecificVehicleData(vin: string): Partial<VINDecodedData> | null {
    for (const [pattern, data] of this.vinDatabase.entries()) {
      if (vin.startsWith(pattern)) {
        return data;
      }
    }

    if (vin.startsWith('5YJ')) {
      return {
        make: 'Tesla',
        manufacturer: 'Tesla Inc.',
        country: 'USA',
        fuelType: 'Electric',
        category: 'EV',
        engineType: 'Electric Motor'
      };
    }

    return null;
  }

  public getVINPattern(vin: string): string {
    if (vin.length < 8) return 'Unknown';
    return vin.substring(0, 8);
  }

  public isElectricVehicle(vin: string): boolean {
    const data = this.findSpecificVehicleData(vin);
    return data?.category === 'EV' || data?.fuelType === 'Electric';
  }

  public isHybridVehicle(vin: string): boolean {
    const data = this.findSpecificVehicleData(vin);
    return data?.category === 'REV' || data?.fuelType === 'Hybrid';
  }
}

export const vinDecoderService = new VINDecoderService();
export default vinDecoderService; 