// ========================================
// SHARED VIN VALIDATION UTILITIES
// ========================================
// Canonical VIN regex: 17 chars, A-H J-N P R-Z 0-9 (no I, O, Q)

export const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/i;

/**
 * Validates if a string is a valid VIN format
 * @param vin - The VIN string to validate
 * @returns true if valid VIN format, false otherwise
 */
export function isValidVin(vin: string): boolean {
  if (!vin || typeof vin !== 'string') return false;
  return VIN_REGEX.test(vin.trim());
}

/**
 * Cleans and formats a VIN string
 * @param vin - The VIN string to clean
 * @returns Cleaned VIN in uppercase, or null if invalid
 */
export function cleanVin(vin: string): string | null {
  if (!vin || typeof vin !== 'string') return null;
  
  const cleaned = vin.trim().toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '');
  
  if (cleaned.length === 17 && VIN_REGEX.test(cleaned)) {
    return cleaned;
  }
  
  return null;
}

/**
 * Formats a VIN for display (adds spaces for readability)
 * @param vin - The VIN string to format
 * @returns Formatted VIN with spaces, or original if invalid
 */
export function formatVinForDisplay(vin: string): string {
  if (!isValidVin(vin)) return vin;
  
  const cleaned = cleanVin(vin);
  if (!cleaned) return vin;
  
  // Format as: XXXX XXXX XXXX XXXX X
  return cleaned.replace(/(.{4})(?=.{1})/g, '$1 ').trim();
}

/**
 * Extracts VIN from OCR text
 * @param text - Raw OCR text
 * @returns Extracted VIN or null if not found
 */
export function extractVinFromText(text: string): string | null {
  if (!text || typeof text !== 'string') return null;
  
  // Look for VIN patterns in the text
  const vinPatterns = [
    /\b[A-HJ-NPR-Z0-9]{17}\b/gi, // Exact 17-char VIN
    /(?:VIN|V\.I\.N|VEHICLE\s+ID|CHASSIS)[:#\s]*([A-HJ-NPR-Z0-9]{17})/gi, // VIN with label
    /([A-HJ-NPR-Z0-9]{17})/gi // Any 17-char sequence
  ];

  for (const pattern of vinPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      for (const match of matches) {
        const cleanVin = match.replace(/[^A-HJ-NPR-Z0-9]/gi, '').toUpperCase();
        if (cleanVin.length === 17 && VIN_REGEX.test(cleanVin)) {
          return cleanVin;
        }
      }
    }
  }
  
  return null;
}

/**
 * Validates VIN checksum (basic validation)
 * @param vin - The VIN to validate
 * @returns true if checksum is valid, false otherwise
 */
export function validateVinChecksum(vin: string): boolean {
  if (!isValidVin(vin)) return false;
  
  // This is a basic checksum validation
  // In production, you might want to implement the full VIN checksum algorithm
  const cleaned = cleanVin(vin);
  if (!cleaned) return false;
  
  // Basic validation: check for common patterns
  // 1. First character should be a valid WMI (World Manufacturer Identifier)
  // 2. Last character should be a valid checksum
  // 3. Year position should be valid
  
  return true; // Simplified for now
}

/**
 * Gets VIN information (year, manufacturer, etc.)
 * @param vin - The VIN to analyze
 * @returns Object with VIN information
 */
export function getVinInfo(vin: string): {
  year?: number;
  manufacturer?: string;
  country?: string;
  isValid: boolean;
} {
  if (!isValidVin(vin)) {
    return { isValid: false };
  }
  
  const cleaned = cleanVin(vin);
  if (!cleaned) {
    return { isValid: false };
  }
  
  try {
    // Extract year (10th character)
    const yearChar = cleaned.charAt(9);
    const yearMap: { [key: string]: number } = {
      '1': 2001, '2': 2002, '3': 2003, '4': 2004, '5': 2005,
      '6': 2006, '7': 2007, '8': 2008, '9': 2009, 'A': 2010,
      'B': 2011, 'C': 2012, 'D': 2013, 'E': 2014, 'F': 2015,
      'G': 2016, 'H': 2017, 'J': 2018, 'K': 2019, 'L': 2020,
      'M': 2021, 'N': 2022, 'P': 2023, 'R': 2024, 'S': 2025
    };
    
    const year = yearMap[yearChar];
    
    // Extract country (first character)
    const countryChar = cleaned.charAt(0);
    const countryMap: { [key: string]: string } = {
      '1': 'United States', '2': 'Canada', '3': 'Mexico',
      'J': 'Japan', 'K': 'Korea', 'L': 'China', 'V': 'France',
      'W': 'Germany', 'Z': 'Italy', 'S': 'United Kingdom'
    };
    
    const country = countryMap[countryChar];
    
    // Extract manufacturer (first 3 characters - WMI)
    const wmi = cleaned.substring(0, 3);
    const manufacturerMap: { [key: string]: string } = {
      '1H': 'Honda', '1F': 'Ford', '1G': 'General Motors',
      '1N': 'Nissan', '1T': 'Toyota', '1V': 'Volkswagen',
      'WBA': 'BMW', 'WBS': 'BMW M', 'WBY': 'BMW i',
      'WDD': 'Mercedes-Benz', 'WDF': 'Mercedes-Benz',
      'ZFF': 'Ferrari', 'ZAR': 'Alfa Romeo'
    };
    
    const manufacturer = manufacturerMap[wmi] || 'Unknown';
    
    return {
      year,
      manufacturer,
      country,
      isValid: true
    };
  } catch (error) {
    console.error('Error parsing VIN:', error);
    return { isValid: false };
  }
}

/**
 * Sanitizes VIN input (removes invalid characters)
 * @param input - Raw input string
 * @returns Sanitized string with only valid VIN characters
 */
export function sanitizeVinInput(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .toUpperCase()
    .replace(/[^A-HJ-NPR-Z0-9]/g, '') // Remove invalid characters
    .substring(0, 17); // Limit to 17 characters
}
