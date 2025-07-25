
import { enhancedMonzaBotService } from '@/services/enhancedMonzaBotService';

export const extractPartNumberFromImage = async (imageDataUrl: string): Promise<string> => {
  try {
    const response = await enhancedMonzaBotService.processEnhancedMessage(
      'Extract and return ONLY the part number from this image. Look for alphanumeric codes that could be part numbers. Return only the part number, nothing else.',
      {
        source: 'part_number_extraction',
        imageData: imageDataUrl,
        currentRoute: '/scan-part'
      }
    );

    // Clean up the response to extract just the part number
    const cleanedResponse = response.textResponse
      .trim()
      .replace(/[^\w-]/g, '') // Keep alphanumeric and hyphens
      .substring(0, 50); // Reasonable length limit

    return cleanedResponse;
  } catch (error) {
    console.error('Part number OCR extraction error:', error);
    throw new Error('Failed to extract part number from image');
  }
};
