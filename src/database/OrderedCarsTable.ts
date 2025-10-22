import { supabase } from '@/integrations/supabase/client';

export interface OrderedCar {
  id: string;
  vin: string;
  model: string;
  year: number;
  color: string;
  brand: string;
  vehicle_type: string;
  selling_price: number;
  status: string;
  order_date: string;
  expected_delivery: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  sales_person: string;
  deposit_amount: number;
  total_amount: number;
  payment_status: string;
  order_notes: string;
  created_at: string;
  updated_at: string;
}

export class OrderedCarsTable {
  // Get all ordered cars
  static async getAllOrderedCars(): Promise<OrderedCar[]> {
    try {
      const { data, error } = await supabase
        .from('ordered_cars')
        .select('*')
        .order('order_date', { ascending: false });
      
      if (error) {
        console.error('Error fetching ordered cars:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getAllOrderedCars:', error);
      return [];
    }
  }

  // Get ordered car count
  static async getOrderedCarCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('ordered_cars')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.error('Error getting ordered car count:', error);
        return 0;
      }
      
      return count || 0;
    } catch (error) {
      console.error('Error in getOrderedCarCount:', error);
      return 0;
    }
  }

  // Add a new car order
  static async addCarOrder(carData: any, customerInfo: any): Promise<boolean> {
    try {
      const orderItem = {
        vin: carData.vinNumber || carData.vin,
        model: carData.model,
        year: carData.year,
        color: carData.color,
        brand: carData.brand,
        vehicle_type: carData.category || carData.vehicle_type,
        selling_price: carData.price || carData.selling_price,
        status: 'ordered',
        order_date: new Date().toISOString().split('T')[0],
        expected_delivery: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
        customer_name: customerInfo.name || '',
        customer_email: customerInfo.email || '',
        customer_phone: customerInfo.phone || '',
        sales_person: customerInfo.salesPerson || '',
        deposit_amount: customerInfo.deposit || 0,
        total_amount: carData.price || carData.selling_price,
        payment_status: 'pending',
        order_notes: customerInfo.notes || `Order placed on ${new Date().toLocaleDateString()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('ordered_cars')
        .insert([orderItem]);
      
      if (error) {
        console.error('Error adding car order:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error in addCarOrder:', error);
      return false;
    }
  }

  // Update order status
  static async updateOrderStatus(orderId: string, newStatus: string, notes?: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ordered_cars')
        .update({ 
          status: newStatus,
          order_notes: notes || `Status updated to ${newStatus} on ${new Date().toLocaleDateString()}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);
      
      if (error) {
        console.error('Error updating order status:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error in updateOrderStatus:', error);
      return false;
    }
  }

  // Get orders by status
  static async getOrdersByStatus(status: string): Promise<OrderedCar[]> {
    try {
      const { data, error } = await supabase
        .from('ordered_cars')
        .select('*')
        .eq('status', status)
        .order('order_date', { ascending: false });
      
      if (error) {
        console.error('Error fetching orders by status:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getOrdersByStatus:', error);
      return [];
    }
  }

  // Search orders
  static async searchOrders(searchTerm: string): Promise<OrderedCar[]> {
    try {
      const { data, error } = await supabase
        .from('ordered_cars')
        .select('*')
        .or(`model.ilike.%${searchTerm}%,vin.ilike.%${searchTerm}%,customer_name.ilike.%${searchTerm}%`)
        .order('order_date', { ascending: false });
      
      if (error) {
        console.error('Error searching orders:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in searchOrders:', error);
      return [];
    }
  }

  // Delete order
  static async deleteOrder(orderId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ordered_cars')
        .delete()
        .eq('id', orderId);
      
      if (error) {
        console.error('Error deleting order:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error in deleteOrder:', error);
      return false;
    }
  }
}
