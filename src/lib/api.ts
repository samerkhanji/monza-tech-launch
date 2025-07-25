import { supabase } from '@/integrations/supabase/client';

// Enhanced error handling for RLS policies
const handleSupabaseError = (error: any, operation: string) => {
  console.error(`Supabase ${operation} error:`, error);
  
  if (error.code === 'PGRST116' || error.message?.includes('row-level security')) {
    throw new Error('Access denied. Please check your permissions.');
  }
  
  if (error.code === '23505') {
    throw new Error('A record with this information already exists.');
  }
  
  if (error.code === '23503') {
    throw new Error('Cannot perform this operation due to related data constraints.');
  }
  
  throw new Error(error.message || `Failed to ${operation}`);
};

// API for Car Inventory
export const carInventoryAPI = {
  getAll: async () => {
    try {
      const { data, error } = await supabase
        .from('car_inventory')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) handleSupabaseError(error, 'fetch car inventory');
      return data || [];
    } catch (error) {
      console.error('Error fetching car inventory:', error);
      throw error;
    }
  },

  getById: async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('car_inventory')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) handleSupabaseError(error, 'fetch car');
      return data;
    } catch (error) {
      console.error('Error fetching car by ID:', error);
      throw error;
    }
  },

  create: async (carData: any) => {
    try {
      const { data, error } = await supabase
        .from('car_inventory')
        .insert({
          ...carData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) handleSupabaseError(error, 'create car');
      return data;
    } catch (error) {
      console.error('Error creating car:', error);
      throw error;
    }
  },

  update: async (id: string, updates: any) => {
    try {
      const { data, error } = await supabase
        .from('car_inventory')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) handleSupabaseError(error, 'update car');
      return data;
    } catch (error) {
      console.error('Error updating car:', error);
      throw error;
    }
  },

  delete: async (id: string) => {
    try {
      const { error } = await supabase
        .from('car_inventory')
        .delete()
        .eq('id', id);
      
      if (error) handleSupabaseError(error, 'delete car');
    } catch (error) {
      console.error('Error deleting car:', error);
      throw error;
    }
  }
};

// API for Garage Cars
export const garageAPI = {
  getAll: async () => {
    try {
      const { data, error } = await supabase
        .from('garage_cars')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) handleSupabaseError(error, 'fetch garage cars');
      return data || [];
    } catch (error) {
      console.error('Error fetching garage cars:', error);
      throw error;
    }
  },

  create: async (carData: any) => {
    try {
      const { data, error } = await supabase
        .from('garage_cars')
        .insert({
          ...carData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) handleSupabaseError(error, 'create garage car');
      return data;
    } catch (error) {
      console.error('Error creating garage car:', error);
      throw error;
    }
  },

  update: async (id: string, updates: any) => {
    try {
      const { data, error } = await supabase
        .from('garage_cars')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) handleSupabaseError(error, 'update garage car');
      return data;
    } catch (error) {
      console.error('Error updating garage car:', error);
      throw error;
    }
  },

  updateStatus: async (id: string, status: string) => {
    try {
      const { data, error } = await supabase
        .from('garage_cars')
        .update({ 
          status, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) handleSupabaseError(error, 'update garage car status');
      return data;
    } catch (error) {
      console.error('Error updating garage car status:', error);
      throw error;
    }
  }
};

// API for New Car Arrivals
export const newCarArrivalsAPI = {
  getAll: async () => {
    try {
      const { data, error } = await supabase
        .from('new_car_arrivals')
        .select('*')
        .order('arrival_date', { ascending: false });
      
      if (error) handleSupabaseError(error, 'fetch new car arrivals');
      return data || [];
    } catch (error) {
      console.error('Error fetching new car arrivals:', error);
      throw error;
    }
  },

  create: async (carData: any) => {
    try {
      const { data, error } = await supabase
        .from('new_car_arrivals')
        .insert({
          ...carData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) handleSupabaseError(error, 'create new car arrival');
      return data;
    } catch (error) {
      console.error('Error creating new car arrival:', error);
      throw error;
    }
  },

  update: async (id: string, updates: any) => {
    try {
      const { data, error } = await supabase
        .from('new_car_arrivals')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) handleSupabaseError(error, 'update new car arrival');
      return data;
    } catch (error) {
      console.error('Error updating new car arrival:', error);
      throw error;
    }
  }
};

// API for Requests with improved relationship handling
export const requestsAPI = {
  getAll: async () => {
    try {
      const { data, error } = await supabase
        .from('requests')
        .select(`
          *,
          request_comments (
            id,
            comment_text,
            author,
            timestamp
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) handleSupabaseError(error, 'fetch requests');
      return data || [];
    } catch (error) {
      console.error('Error fetching requests:', error);
      throw error;
    }
  },

  create: async (requestData: any) => {
    try {
      const { data, error } = await supabase
        .from('requests')
        .insert({
          ...requestData,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) handleSupabaseError(error, 'create request');
      return data;
    } catch (error) {
      console.error('Error creating request:', error);
      throw error;
    }
  },

  addComment: async (requestId: string, comment: any) => {
    try {
      const { data, error } = await supabase
        .from('request_comments')
        .insert({
          request_id: requestId,
          comment_text: comment.comment_text || comment.text,
          author: comment.author,
          timestamp: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) handleSupabaseError(error, 'add comment');
      return data;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }
};

// API for Inventory Items
export const inventoryAPI = {
  getAll: async () => {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .order('last_updated', { ascending: false });
      
      if (error) handleSupabaseError(error, 'fetch inventory items');
      return data || [];
    } catch (error) {
      console.error('Error fetching inventory items:', error);
      throw error;
    }
  },

  getByLocation: async (location: string) => {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('location', location);
      
      if (error) handleSupabaseError(error, 'fetch inventory by location');
      return data || [];
    } catch (error) {
      console.error('Error fetching inventory by location:', error);
      throw error;
    }
  },

  create: async (itemData: any) => {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .insert({
          ...itemData,
          created_at: new Date().toISOString(),
          last_updated: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) handleSupabaseError(error, 'create inventory item');
      return data;
    } catch (error) {
      console.error('Error creating inventory item:', error);
      throw error;
    }
  },

  update: async (id: string, updates: any) => {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .update({
          ...updates,
          last_updated: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) handleSupabaseError(error, 'update inventory item');
      return data;
    } catch (error) {
      console.error('Error updating inventory item:', error);
      throw error;
    }
  }
};

// API for Notifications with proper user filtering
export const notificationsAPI = {
  getForUser: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) handleSupabaseError(error, 'fetch user notifications');
      return data || [];
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      throw error;
    }
  },

  getAll: async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) handleSupabaseError(error, 'fetch all notifications');
      return data || [];
    } catch (error) {
      console.error('Error fetching all notifications:', error);
      throw error;
    }
  },

  create: async (notificationData: any) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          ...notificationData,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) handleSupabaseError(error, 'create notification');
      return data;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  },

  markAsRead: async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id)
        .select()
        .single();
      
      if (error) handleSupabaseError(error, 'mark notification as read');
      return data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  markAllAsRead: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);
      
      if (error) handleSupabaseError(error, 'mark all notifications as read');
      return data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }
};

// API for Sales Data
export const salesAPI = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('sales_data')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  create: async (salesData: any) => {
    const { data, error } = await supabase
      .from('sales_data')
      .insert(salesData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  getByDateRange: async (startDate: string, endDate: string) => {
    const { data, error } = await supabase
      .from('sales_data')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data;
  }
};

// API for Garage Schedule
export const scheduleAPI = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('garage_schedule')
      .select(`
        *,
        scheduled_cars (*)
      `)
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  create: async (scheduleData: any) => {
    const { data, error } = await supabase
      .from('garage_schedule')
      .insert(scheduleData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  update: async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from('garage_schedule')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// API Key Management
export const apiKeysAPI = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  create: async (keyName: string, userId: string) => {
    // Generate a secure API key
    const apiKey = 'mk_' + Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        user_id: userId,
        key_name: keyName,
        api_key: apiKey
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating API key:', error);
      throw error;
    }
    return data;
  },

  delete: async (id: string) => {
    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  toggleStatus: async (id: string, isActive: boolean) => {
    const { data, error } = await supabase
      .from('api_keys')
      .update({ is_active: isActive })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// API for Parts Usage Tracking
export const partsUsageAPI = {
  getAll: async () => {
    try {
      const { data, error } = await supabase
        .from('parts_usage_tracking')
        .select('*')
        .order('usage_date', { ascending: false });
      
      if (error) handleSupabaseError(error, 'fetch parts usage history');
      return data || [];
    } catch (error) {
      console.error('Error fetching parts usage history:', error);
      throw error;
    }
  },

  create: async (usageData: any) => {
    try {
      const { data, error } = await supabase
        .from('parts_usage_tracking')
        .insert({
          ...usageData,
          usage_date: usageData.usage_date || new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) handleSupabaseError(error, 'create parts usage record');
      return data;
    } catch (error) {
      console.error('Error creating parts usage record:', error);
      throw error;
    }
  },

  getByCarVin: async (carVin: string) => {
    try {
      const { data, error } = await supabase
        .from('parts_usage_tracking')
        .select('*')
        .eq('car_vin', carVin)
        .order('usage_date', { ascending: false });
      
      if (error) handleSupabaseError(error, 'fetch parts usage by car VIN');
      return data || [];
    } catch (error) {
      console.error('Error fetching parts usage by car VIN:', error);
      throw error;
    }
  },

  getByDateRange: async (startDate: string, endDate: string) => {
    try {
      const { data, error } = await supabase
        .from('parts_usage_tracking')
        .select('*')
        .gte('usage_date', startDate)
        .lte('usage_date', endDate)
        .order('usage_date', { ascending: false });
      
      if (error) handleSupabaseError(error, 'fetch parts usage by date range');
      return data || [];
    } catch (error) {
      console.error('Error fetching parts usage by date range:', error);
      throw error;
    }
  },

  getByTechnician: async (technician: string) => {
    try {
      const { data, error } = await supabase
        .from('parts_usage_tracking')
        .select('*')
        .eq('technician', technician)
        .order('usage_date', { ascending: false });
      
      if (error) handleSupabaseError(error, 'fetch parts usage by technician');
      return data || [];
    } catch (error) {
      console.error('Error fetching parts usage by technician:', error);
      throw error;
    }
  }
};
