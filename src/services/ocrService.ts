import { createWorker } from 'tesseract.js';
import { supabase } from '@/integrations/supabase/client';

export interface OCRResult {
  text: string;
  confidence: number;
  partNumber?: string;
  partName?: string;
}

export interface InventoryCheckResult {
  found: boolean;
  part?: {
    id: string;
    partNumber: string;
    partName: string;
    stockQuantity: number;
    supplier: string;
    cost: number;
  };
  needsOrder: boolean;
}

class OCRService {
  private worker: Tesseract.Worker | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.worker = await createWorker('eng', 1, {
        logger: m => console.log('OCR Progress:', m)
      });
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize OCR worker:', error);
      throw new Error('OCR initialization failed');
    }
  }

  async scanImage(imageDataUrl: string): Promise<OCRResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.worker) {
      throw new Error('OCR worker not initialized');
    }

    try {
      const { data } = await this.worker.recognize(imageDataUrl);
      
      const extractedText = data.text.trim();
      const confidence = data.confidence;

      // Extract part number and name from OCR text
      const { partNumber, partName } = this.extractPartInfo(extractedText);

      return {
        text: extractedText,
        confidence,
        partNumber,
        partName
      };
    } catch (error) {
      console.error('OCR scanning error:', error);
      throw new Error('Failed to process image with OCR');
    }
  }

  private extractPartInfo(text: string): { partNumber?: string; partName?: string } {
    // Common part number patterns
    const partNumberPatterns = [
      /\b[A-Z]{2,4}-?\d{4,8}-?[A-Z0-9]{0,4}\b/i, // Format: ABC-12345-XY
      /\b\d{4,8}-[A-Z]{2,4}-?\d{0,4}\b/i,        // Format: 12345-ABC-01
      /\b[A-Z0-9]{8,15}\b/i,                      // Format: ABCD12345678
      /\b\d{8,12}\b/                              // Format: 123456789
    ];

    // Common part name keywords
    const partNameKeywords = [
      'brake', 'pad', 'filter', 'spark', 'plug', 'battery', 'wiper', 'blade',
      'headlight', 'mount', 'transmission', 'radiator', 'fuel', 'pump',
      'alternator', 'starter', 'clutch', 'timing', 'belt', 'oil', 'air',
      'assembly', 'set', 'kit', 'element', 'housing', 'terminal', 'brush'
    ];

    let partNumber: string | undefined;
    let partName: string | undefined;

    // Extract part number
    for (const pattern of partNumberPatterns) {
      const match = text.match(pattern);
      if (match) {
        partNumber = match[0].toUpperCase();
        break;
      }
    }

    // Extract part name
    const words = text.toLowerCase().split(/\s+/);
    const nameWords = words.filter(word => 
      partNameKeywords.some(keyword => word.includes(keyword))
    );

    if (nameWords.length > 0) {
      partName = nameWords.join(' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    return { partNumber, partName };
  }

  async checkInventory(partNumber: string): Promise<InventoryCheckResult> {
    try {
      const { data, error } = await supabase
        .from('parts_inventory')
        .select('*')
        .eq('part_number', partNumber)
        .single();

      if (error || !data) {
        return {
          found: false,
          needsOrder: true
        };
      }

      const needsOrder = data.stock_quantity <= data.low_stock_threshold;

      return {
        found: true,
        part: {
          id: data.id,
          partNumber: data.part_number,
          partName: data.part_name,
          stockQuantity: data.stock_quantity,
          supplier: data.supplier,
          cost: data.cost
        },
        needsOrder
      };
    } catch (error) {
      console.error('Inventory check error:', error);
      return {
        found: false,
        needsOrder: true
      };
    }
  }

  async addPartToInventory(partData: {
    partNumber: string;
    partName: string;
    supplier?: string;
    cost?: number;
    stockQuantity?: number;
  }): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('parts_inventory')
        .insert({
          part_number: partData.partNumber,
          part_name: partData.partName,
          supplier: partData.supplier || 'Unknown',
          cost: partData.cost || 0,
          stock_quantity: partData.stockQuantity || 0,
          low_stock_threshold: 5,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Failed to add part to inventory:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Add part to inventory error:', error);
      return false;
    }
  }

  async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
    }
  }
}

export const ocrService = new OCRService(); 