import { createWorker } from 'tesseract.js';

class TesseractOCRService {
  private worker: any = null;

  async initializeWorker() {
    if (!this.worker) {
      this.worker = await createWorker('eng', 1, {
        logger: m => console.log('Tesseract:', m.status, m.progress)
      });

      // Configure for better VIN recognition
      await this.worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789',
        tessedit_pageseg_mode: '6', // Uniform block of text
        tessedit_ocr_engine_mode: '1' // Neural nets LSTM engine only
      });
    }
    return this.worker;
  }

  async extractVINFromImage(imageDataUrl: string): Promise<string> {
    try {
      const worker = await this.initializeWorker();
      
      const { data: { text } } = await worker.recognize(imageDataUrl);
      
      // Clean and extract VIN from recognized text
      const cleanedText = text.replace(/[^A-HJ-NPR-Z0-9]/g, '');
      
      // Look for 17-character VIN pattern
      const vinPattern = /[A-HJ-NPR-Z0-9]{17}/g;
      const vinMatches = cleanedText.match(vinPattern);
      
      if (vinMatches && vinMatches.length > 0) {
        console.log('Tesseract OCR found VIN:', vinMatches[0]);
        return vinMatches[0];
      }

      // Return the longest sequence if no complete VIN found
      if (cleanedText.length >= 10) {
        console.log('Tesseract OCR extracted partial VIN:', cleanedText);
        return cleanedText;
      }

      throw new Error('No VIN-like text found in image');
    } catch (error) {
      console.error('Tesseract OCR error:', error);
      throw error;
    }
  }

  async terminate() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}

export const tesseractOCRService = new TesseractOCRService();
export default tesseractOCRService; 