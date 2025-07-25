// Temporary Supabase client using mock implementation to avoid module issues
// TODO: Re-enable real Supabase client once module resolution is fixed

// Re-export the disabled client to avoid module resolution issues
export { supabase } from './client-disabled';

// TODO: Uncomment below when module issues are resolved
/*
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://wunqntfreyezylvbzvxc.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1bnFudGZyZXllenlsdmJ6dnhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3NDE4MDIsImV4cCI6MjA2MzMxNzgwMn0.AphXufXZef_wAvVT3TXl2s_JQwbI9wK6KN2uCQgVc5o";

// Create Supabase client with proper configuration
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});
*/