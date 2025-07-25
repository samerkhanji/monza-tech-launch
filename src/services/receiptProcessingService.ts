
import { enhancedMonzaBotService } from './enhancedMonzaBotService';

export interface ReceiptData {
  supplier?: string;
  orderReference?: string;
  orderDate?: string;
  items: Array<{
    partName: string;
    partNumber: string;
    quantity: number;
    price?: number;
  }>;
  totalAmount?: number;
  shippingCompany?: string;
  trackingCode?: string;
}

export const receiptProcessingService = {
  async processReceiptImage(imageDataUrl: string): Promise<ReceiptData> {
    try {
      const response = await enhancedMonzaBotService.processEnhancedMessage(
        `Analyze this receipt image and extract the following information in JSON format:
        {
          "supplier": "supplier name",
          "orderReference": "order/invoice number",
          "orderDate": "date in YYYY-MM-DD format",
          "items": [
            {
              "partName": "part name",
              "partNumber": "part number",
              "quantity": number,
              "price": number
            }
          ],
          "totalAmount": total amount,
          "shippingCompany": "shipping company if mentioned",
          "trackingCode": "tracking code if mentioned"
        }
        Extract all visible parts/items from the receipt. Be thorough and accurate.`,
        {
          source: 'receipt_processing',
          imageData: imageDataUrl,
          currentRoute: '/ordered-parts'
        }
      );

      // Try to parse JSON from the response
      const jsonMatch = response.textResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not extract structured data from receipt');
      }
    } catch (error) {
      console.error('Error processing receipt:', error);
      throw new Error('Failed to process receipt. Please try again or enter data manually.');
    }
  }
};
