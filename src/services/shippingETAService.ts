import { supabase } from '@/integrations/supabase/client';
import { enhancedMonzaBotService } from './enhancedMonzaBotService';

interface ShippingCompanyData {
  name: string;
  averageDeliveryDays: number;
  trackingPattern: RegExp;
  apiEndpoint?: string;
}

interface OrderedCarRecord {
  id: string;
  vin_number?: string;
  model: string;
  year: number;
  color?: string;
  order_date: string;
  expected_delivery?: string;
  status: string;
  supplier: string;
  order_reference: string;
  price?: number;
  receipt_photos?: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
  shipping_company?: string;
  tracking_code?: string;
  estimated_eta?: string;
}

interface OrderedPartRecord {
  id: string;
  part_name: string;
  part_number: string;
  quantity: number;
  supplier: string;
  order_reference: string;
  order_date: string;
  expected_delivery?: string;
  estimated_eta?: string;
  status: string;
  price?: number;
  shipping_company?: string;
  tracking_code?: string;
  notes?: string;
  receipt_photos?: string[];
  created_at: string;
  updated_at: string;
}

class ShippingETAService {
  private shippingCompanies: ShippingCompanyData[] = [
    {
      name: 'DHL',
      averageDeliveryDays: 7,
      trackingPattern: /^[0-9]{10,11}$/
    },
    {
      name: 'FedEx',
      averageDeliveryDays: 5,
      trackingPattern: /^[0-9]{12,14}$/
    },
    {
      name: 'UPS',
      averageDeliveryDays: 6,
      trackingPattern: /^1Z[A-Z0-9]{16}$/
    },
    {
      name: 'TNT',
      averageDeliveryDays: 8,
      trackingPattern: /^[0-9]{9}$/
    },
    {
      name: 'Aramex',
      averageDeliveryDays: 10,
      trackingPattern: /^[0-9]{10,12}$/
    }
  ];

  // Identify shipping company from tracking code
  identifyShippingCompany(trackingCode: string): ShippingCompanyData | null {
    return this.shippingCompanies.find(company => 
      company.trackingPattern.test(trackingCode.replace(/\s/g, ''))
    ) || null;
  }

  // Calculate estimated ETA using MonzaBot intelligence
  async calculateETA(shippingCompany: string, trackingCode: string, orderDate: string): Promise<string | null> {
    try {
      const company = this.shippingCompanies.find(c => 
        c.name.toLowerCase() === shippingCompany.toLowerCase()
      );

      const message = `Calculate shipping ETA for:
        - Shipping Company: ${shippingCompany}
        - Tracking Code: ${trackingCode}
        - Order Date: ${orderDate}
        - Average delivery time for ${shippingCompany}: ${company?.averageDeliveryDays || 7} days
        
        Provide a realistic estimated delivery date in YYYY-MM-DD format.`;

      const response = await enhancedMonzaBotService.processEnhancedMessage(message, {
        source: 'shipping_eta_calculation',
        shippingCompany,
        trackingCode
      });

      // Extract date from response
      const dateMatch = response.textResponse.match(/(\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        return dateMatch[1];
      }

      // Fallback calculation
      const orderDateObj = new Date(orderDate);
      const estimatedDays = company?.averageDeliveryDays || 7;
      orderDateObj.setDate(orderDateObj.getDate() + estimatedDays);
      return orderDateObj.toISOString().split('T')[0];

    } catch (error) {
      console.error('Error calculating ETA:', error);
      return null;
    }
  }

  // Update all ordered cars with shipping ETAs
  async updateAllShippingETAs(): Promise<void> {
    try {
      // Update ordered cars
      const { data: orderedCars, error: carsError } = await supabase
        .from('ordered_cars')
        .select('*')
        .eq('status', 'ordered')
        .not('shipping_company', 'is', null);

      if (carsError) throw carsError;

      for (const car of (orderedCars as OrderedCarRecord[]) || []) {
        const eta = await this.calculateETA(
          car.shipping_company || '',
          car.tracking_code || 'NO_TRACKING',
          car.order_date
        );

        if (eta) {
          await supabase
            .from('ordered_cars')
            .update({ 
              estimated_eta: eta,
              expected_delivery: eta 
            })
            .eq('id', car.id);
        }
      }

      // Update ordered parts
      const { data: orderedParts, error: partsError } = await supabase
        .from('ordered_parts')
        .select('*')
        .eq('status', 'ordered')
        .not('shipping_company', 'is', null);

      if (partsError) throw partsError;

      for (const part of (orderedParts as OrderedPartRecord[]) || []) {
        const eta = await this.calculateETA(
          part.shipping_company || '',
          part.tracking_code || 'NO_TRACKING',
          part.order_date
        );

        if (eta) {
          await supabase
            .from('ordered_parts')
            .update({ 
              estimated_eta: eta,
              expected_delivery: eta 
            })
            .eq('id', part.id);
        }
      }

      console.log(`Updated ETAs for ${(orderedCars?.length || 0) + (orderedParts?.length || 0)} items`);
    } catch (error) {
      console.error('Error updating shipping ETAs:', error);
    }
  }

  // Remember shipping company patterns for future use
  async learnShippingPattern(company: string, trackingCode: string): Promise<void> {
    try {
      const message = `Learn and remember this shipping pattern:
        - Company: ${company}
        - Tracking Code: ${trackingCode}
        
        Store this pattern for future ETA calculations and shipping company identification.`;

      await enhancedMonzaBotService.processEnhancedMessage(message, {
        source: 'shipping_pattern_learning',
        company,
        trackingCode
      });

    } catch (error) {
      console.error('Error learning shipping pattern:', error);
    }
  }

  // Get shipping status update
  async getShippingStatusUpdate(trackingCode: string, shippingCompany: string): Promise<string | null> {
    try {
      const message = `Provide a shipping status update for:
        - Tracking Code: ${trackingCode}
        - Shipping Company: ${shippingCompany}
        
        Return the current status and estimated delivery time if available.`;

      const response = await enhancedMonzaBotService.processEnhancedMessage(message, {
        source: 'shipping_status_check',
        trackingCode,
        shippingCompany
      });

      return response.textResponse;
    } catch (error) {
      console.error('Error getting shipping status:', error);
      return null;
    }
  }

  // New method: Check for shipping delays and notify
  async checkForDelaysAndNotify(): Promise<void> {
    try {
      // Check ordered cars
      const { data: orderedCars, error: carsError } = await supabase
        .from('ordered_cars')
        .select('*')
        .eq('status', 'ordered')
        .not('shipping_company', 'is', null)
        .not('expected_delivery', 'is', null);

      if (carsError) throw carsError;

      const today = new Date();
      
      // Check for car shipment delays
      for (const car of (orderedCars as OrderedCarRecord[]) || []) {
        if (car.expected_delivery) {
          const expectedDate = new Date(car.expected_delivery);
          if (expectedDate < today && car.status === 'ordered') {
            // This shipment is delayed
            await enhancedMonzaBotService.notifyShippingDelay(car.id, 'car');
            
            // Update the car record to note the delay
            await supabase
              .from('ordered_cars')
              .update({ 
                notes: car.notes ? `${car.notes}\nDELAYED: Original delivery was ${car.expected_delivery}` : `DELAYED: Original delivery was ${car.expected_delivery}`
              })
              .eq('id', car.id);
          }
        }
      }
      
      // Check ordered parts
      const { data: orderedParts, error: partsError } = await supabase
        .from('ordered_parts')
        .select('*')
        .eq('status', 'ordered')
        .not('shipping_company', 'is', null)
        .not('expected_delivery', 'is', null);

      if (partsError) throw partsError;
      
      // Check for part shipment delays
      for (const part of (orderedParts as OrderedPartRecord[]) || []) {
        if (part.expected_delivery) {
          const expectedDate = new Date(part.expected_delivery);
          if (expectedDate < today && part.status === 'ordered') {
            // This shipment is delayed
            await enhancedMonzaBotService.notifyShippingDelay(part.id, 'part');
            
            // Update the part record to note the delay
            await supabase
              .from('ordered_parts')
              .update({ 
                notes: part.notes ? `${part.notes}\nDELAYED: Original delivery was ${part.expected_delivery}` : `DELAYED: Original delivery was ${part.expected_delivery}`
              })
              .eq('id', part.id);
          }
        }
      }
      
      console.log('Completed delay check and notifications');
    } catch (error) {
      console.error('Error checking for shipping delays:', error);
    }
  }

  // Schedule daily ETA updates and delay notifications
  async scheduleDailyETAUpdates(): Promise<void> {
    try {
      await this.updateAllShippingETAs();
      await this.checkForDelaysAndNotify();
      console.log('Daily ETA updates and delay notifications completed');
    } catch (error) {
      console.error('Error in daily ETA updates:', error);
    }
  }
}

export const shippingETAService = new ShippingETAService();
