
import { extractTextFromImage } from '@/utils/ocrUtils';

export interface CarRecognitionResult {
  vin?: string;
  brand?: string;
  model?: string;
  year?: number;
  color?: string;
  category?: 'EV' | 'REV' | 'ICEV' | 'Other';
  confidence: number;
}

// Brand detection patterns
const BRAND_PATTERNS = {
  'Tesla': ['tesla', 'model s', 'model 3', 'model x', 'model y'],
  'BMW': ['bmw', 'i3', 'i4', 'i8', 'ix3', 'series'],
  'Mercedes': ['mercedes', 'benz', 'eqc', 'eqs', 'eqe'],
  'Audi': ['audi', 'e-tron', 'q4', 'a6'],
  'Voyah': ['voyah', 'free', 'dream', 'passion', 'courage'],
  'MHero': ['mhero', '917'],
  'BYD': ['byd', 'tang', 'han', 'song', 'seal'],
  'Toyota': ['toyota', 'prius', 'camry', 'corolla'],
  'Honda': ['honda', 'civic', 'accord', 'cr-v'],
  'Ford': ['ford', 'mustang', 'f-150', 'explorer'],
  'Chevrolet': ['chevrolet', 'chevy', 'silverado', 'equinox'],
  'Nissan': ['nissan', 'altima', 'sentra', 'rogue'],
  'Hyundai': ['hyundai', 'elantra', 'sonata', 'tucson'],
  'Kia': ['kia', 'optima', 'sorento', 'sportage'],
  'Volkswagen': ['volkswagen', 'vw', 'jetta', 'passat'],
  'Porsche': ['porsche', 'taycan', '911', 'macan']
};

// EV model patterns
const EV_PATTERNS = [
  'tesla', 'model s', 'model 3', 'model x', 'model y',
  'voyah', 'eqc', 'eqs', 'eqe', 'i3', 'i4', 'i8', 'ix3',
  'e-tron', 'taycan', 'leaf', 'bolt', 'id.4', 'mach-e'
];

// REV (Range Extended Vehicle) patterns
const REV_PATTERNS = [
  'i3 rex', 'volt', 'range extended', 'rex', 'erev'
];

// ICEV patterns (traditional combustion engines)
const ICEV_PATTERNS = [
  'gasoline', 'petrol', 'diesel', 'v6', 'v8', 'turbo',
  'engine', 'combustion'
];

export const analyzeCarPhoto = async (imageDataUrl: string): Promise<CarRecognitionResult> => {
  try {
    console.log('Starting car photo analysis...');
    
    // Extract text from image using OCR
    const extractedText = await extractTextFromImage(imageDataUrl);
    console.log('Extracted text:', extractedText);
    
    const textLower = extractedText.toLowerCase();
    
    // Extract VIN (17 character alphanumeric code)
    const vinPattern = /[A-HJ-NPR-Z0-9]{17}/g;
    const vinMatch = extractedText.match(vinPattern);
    const vin = vinMatch ? vinMatch[0] : undefined;
    
    // Detect brand
    let detectedBrand = '';
    let brandConfidence = 0;
    
    for (const [brand, patterns] of Object.entries(BRAND_PATTERNS)) {
      for (const pattern of patterns) {
        if (textLower.includes(pattern)) {
          detectedBrand = brand;
          brandConfidence = 0.8;
          break;
        }
      }
      if (detectedBrand) break;
    }
    
    // Extract year (4 digit number between 2000-2030)
    const yearPattern = /20[0-3][0-9]/g;
    const yearMatch = extractedText.match(yearPattern);
    const year = yearMatch ? parseInt(yearMatch[0]) : new Date().getFullYear();
    
    // Detect model from text
    let model = '';
    if (detectedBrand && BRAND_PATTERNS[detectedBrand as keyof typeof BRAND_PATTERNS]) {
      const brandPatterns = BRAND_PATTERNS[detectedBrand as keyof typeof BRAND_PATTERNS];
      for (const pattern of brandPatterns) {
        if (textLower.includes(pattern) && pattern !== detectedBrand.toLowerCase()) {
          model = pattern;
          break;
        }
      }
    }
    
    // Detect vehicle category
    let category: 'EV' | 'REV' | 'ICEV' | 'Other' = 'Other';
    
    // Check for EV patterns
    for (const pattern of EV_PATTERNS) {
      if (textLower.includes(pattern)) {
        category = 'EV';
        break;
      }
    }
    
    // Check for REV patterns
    if (category === 'Other') {
      for (const pattern of REV_PATTERNS) {
        if (textLower.includes(pattern)) {
          category = 'REV';
          break;
        }
      }
    }
    
    // Check for ICEV patterns
    if (category === 'Other') {
      for (const pattern of ICEV_PATTERNS) {
        if (textLower.includes(pattern)) {
          category = 'ICEV';
          break;
        }
      }
    }
    
    // Color detection (basic)
    const colorPatterns = {
      'White': ['white', 'pearl white', 'snow white'],
      'Black': ['black', 'obsidian black', 'midnight black'],
      'Silver': ['silver', 'metallic silver'],
      'Gray': ['gray', 'grey', 'charcoal'],
      'Red': ['red', 'crimson', 'cherry'],
      'Blue': ['blue', 'navy', 'royal blue'],
      'Green': ['green', 'forest green'],
      'Yellow': ['yellow', 'gold'],
      'Orange': ['orange', 'sunset'],
      'Brown': ['brown', 'bronze']
    };
    
    let detectedColor = '';
    for (const [color, patterns] of Object.entries(colorPatterns)) {
      for (const pattern of patterns) {
        if (textLower.includes(pattern)) {
          detectedColor = color;
          break;
        }
      }
      if (detectedColor) break;
    }
    
    // Calculate overall confidence
    let confidence = 0.3; // Base confidence
    if (vin) confidence += 0.4;
    if (detectedBrand) confidence += 0.2;
    if (model) confidence += 0.1;
    
    const result: CarRecognitionResult = {
      vin,
      brand: detectedBrand || undefined,
      model: model || undefined,
      year,
      color: detectedColor || undefined,
      category,
      confidence: Math.min(confidence, 1.0)
    };
    
    console.log('Car recognition result:', result);
    return result;
    
  } catch (error) {
    console.error('Error analyzing car photo:', error);
    return {
      confidence: 0,
      category: 'Other'
    };
  }
};
