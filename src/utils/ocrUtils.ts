import { createWorker } from 'tesseract.js';
import { enhancedMonzaBotService } from '@/services/enhancedMonzaBotService';

export const extractTextFromImage = async (imageDataUrl: string): Promise<string> => {
  try {
    // First try Tesseract.js for local OCR processing
    const worker = await createWorker('eng', 1, {
      logger: m => console.log('Tesseract:', m)
    });

    // Configure for better VIN recognition
    await worker.setParameters({
      tessedit_char_whitelist: 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789',
      tessedit_pageseg_mode: '6', // Uniform block of text
      tessedit_ocr_engine_mode: '1' // Neural nets LSTM engine only
    });

    const { data: { text } } = await worker.recognize(imageDataUrl);
    await worker.terminate();

    // Clean and extract VIN from recognized text
    const cleanedText = text.replace(/[^A-HJ-NPR-Z0-9]/g, '');
    
    // Look for 17-character VIN pattern
    const vinPattern = /[A-HJ-NPR-Z0-9]{17}/g;
    const vinMatches = cleanedText.match(vinPattern);
    
    if (vinMatches && vinMatches.length > 0) {
      console.log('Tesseract OCR found VIN:', vinMatches[0]);
      return vinMatches[0];
    }

    // If no 17-character VIN found, return the longest alphanumeric sequence
    if (cleanedText.length >= 10) {
      console.log('Tesseract OCR extracted text:', cleanedText);
      return cleanedText;
    }

    // Fallback to AI-based OCR if Tesseract didn't work well
    console.log('Falling back to AI-based OCR...');
    return await extractTextWithAI(imageDataUrl);

  } catch (error) {
    console.error('Tesseract OCR error:', error);
    
    // Fallback to AI-based OCR
    try {
      return await extractTextWithAI(imageDataUrl);
    } catch (aiError) {
      console.error('AI OCR fallback error:', aiError);
      throw new Error('Failed to extract text from image using both local and AI OCR');
    }
  }
};

const extractTextWithAI = async (imageDataUrl: string): Promise<string> => {
  try {
    const response = await enhancedMonzaBotService.processEnhancedMessage(
      'Extract and return ONLY the VIN number from this image. The VIN should be exactly 17 characters long and contain only letters A-Z (excluding I, O, Q) and numbers 0-9. Return only the VIN number, nothing else. If you cannot find a complete 17-character VIN, return any vehicle identification numbers you can see.',
      {
        source: 'vin_extraction',
        imageData: imageDataUrl,
        currentRoute: '/scan-vin'
      }
    );

    // Clean up the response to extract just the VIN
    const cleanedResponse = response.textResponse
      .replace(/[^A-HJ-NPR-Z0-9]/g, '') // Remove non-VIN characters
      .substring(0, 17); // Take first 17 characters

    return cleanedResponse;
  } catch (error) {
    console.error('AI OCR extraction error:', error);
    throw new Error('Failed to extract text from image using AI OCR');
  }
};

export const extractVinFromImage = extractTextFromImage;

// Enhanced VIN validation function
export const validateVIN = (vin: string): boolean => {
  // Remove any non-alphanumeric characters and convert to uppercase
  const cleanVIN = vin.toUpperCase().replace(/[^A-Z0-9]/g, '');
  
  // Check length
  if (cleanVIN.length !== 17) {
    return false;
  }
  
  // Check for invalid characters (I, O, Q are not allowed in VINs)
  if (/[IOQ]/.test(cleanVIN)) {
    return false;
  }
  
  // VIN check digit validation (position 9)
  const weights = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];
  const transliteration: Record<string, number> = {
    'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7, 'H': 8,
    'J': 1, 'K': 2, 'L': 3, 'M': 4, 'N': 5, 'P': 7, 'R': 9,
    'S': 2, 'T': 3, 'U': 4, 'V': 5, 'W': 6, 'X': 7, 'Y': 8, 'Z': 9,
    '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9
  };
  
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    if (i === 8) continue; // Skip check digit position
    const char = cleanVIN[i];
    const value = transliteration[char];
    if (value === undefined) return false;
    sum += value * weights[i];
  }
  
  const checkDigit = sum % 11;
  const expectedCheckDigit = checkDigit === 10 ? 'X' : checkDigit.toString();
  
  return cleanVIN[8] === expectedCheckDigit;
};

// Format VIN for display
export const formatVIN = (vin: string): string => {
  const clean = vin.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '');
  if (clean.length === 17) {
    // Format as: XXX XXXX XX X XXXXXX (WMI-VDS-Check-Year-Plant-Serial)
    return `${clean.substring(0, 3)} ${clean.substring(3, 7)} ${clean.substring(7, 9)} ${clean.substring(9, 10)} ${clean.substring(10, 17)}`;
  }
  return clean;
};

// Extract information from VIN without full decoding
export const getBasicVINInfo = (vin: string) => {
  if (!validateVIN(vin)) {
    return null;
  }
  
  const year = getModelYear(vin[9]);
  const country = getCountryOfOrigin(vin[0]);
  const manufacturer = getManufacturer(vin.substring(0, 3));
  
  return {
    year,
    country,
    manufacturer,
    wmi: vin.substring(0, 3), // World Manufacturer Identifier
    vds: vin.substring(3, 9), // Vehicle Descriptor Section
    vis: vin.substring(9, 17) // Vehicle Identifier Section
  };
};

const getModelYear = (yearCode: string): number => {
  const yearMap: Record<string, number> = {
    'A': 2010, 'B': 2011, 'C': 2012, 'D': 2013, 'E': 2014,
    'F': 2015, 'G': 2016, 'H': 2017, 'J': 2018, 'K': 2019,
    'L': 2020, 'M': 2021, 'N': 2022, 'P': 2023, 'R': 2024,
    'S': 2025, 'T': 2026, 'V': 2027, 'W': 2028, 'X': 2029,
    'Y': 2030, '1': 2001, '2': 2002, '3': 2003, '4': 2004,
    '5': 2005, '6': 2006, '7': 2007, '8': 2008, '9': 2009
  };
  
  return yearMap[yearCode] || new Date().getFullYear();
};

const getCountryOfOrigin = (firstChar: string): string => {
  const countryMap: Record<string, string> = {
    '1': 'United States', '2': 'Canada', '3': 'Mexico',
    '4': 'United States', '5': 'United States',
    'J': 'Japan', 'K': 'South Korea', 'L': 'China',
    'M': 'India', 'N': 'Turkey', 'P': 'Philippines',
    'S': 'United Kingdom', 'T': 'Czech Republic',
    'V': 'France', 'W': 'Germany', 'X': 'Russia',
    'Y': 'Sweden', 'Z': 'Italy'
  };
  
  return countryMap[firstChar] || 'Unknown';
};

const getManufacturer = (wmi: string): string => {
  const manufacturerMap: Record<string, string> = {
    'LVG': 'Dongfeng Motor (Voyah)',
    '1HG': 'Honda',
    '1FT': 'Ford',
    '1GM': 'General Motors',
    '1GT': 'General Motors',
    '5YJ': 'Tesla',
    'WBA': 'BMW',
    'WBS': 'BMW M',
    'WBY': 'BMW i',
    'JTD': 'Toyota',
    'JHM': 'Honda',
    'KMH': 'Hyundai'
  };
  
  return manufacturerMap[wmi] || 'Unknown';
};
