// Test utility to verify Supabase client is working
import { supabase } from '@/integrations/supabase/client';

export const testSupabaseConnection = async () => {
  try {
    console.log('Testing Supabase connection...');
    
    // Test basic connection
    const { data, error } = await supabase
      .from('cars')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Supabase connection error:', error);
      return false;
    }
    
    console.log('Supabase connection successful:', data);
    return true;
  } catch (err) {
    console.error('Supabase test failed:', err);
    return false;
  }
};

// Export for use in components
export const initializeSupabase = async () => {
  const isConnected = await testSupabaseConnection();
  if (!isConnected) {
    console.warn('Supabase connection failed - some features may not work');
  }
  return isConnected;
}; 