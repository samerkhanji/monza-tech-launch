// Fallback Supabase client with dynamic imports
import type { Database } from './types';

const SUPABASE_URL = "https://wunqntfreyezylvbzvxc.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1bnFudGZyZXllenlsdmJ6dnhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3NDE4MDIsImV4cCI6MjA2MzMxNzgwMn0.AphXufXZef_wAvVT3TXl2s_JQwbI9wK6KN2uCQgVc5o";

// Dynamic import to avoid module resolution issues
let supabaseClient: any = null;

export const getSupabaseClient = async () => {
  if (!supabaseClient) {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      supabaseClient = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
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
    } catch (error) {
      console.error('Failed to load Supabase client:', error);
      // Return a mock client for development
      supabaseClient = {
        from: () => ({
          select: () => ({ limit: () => Promise.resolve({ data: [], error: null }) }),
          insert: () => Promise.resolve({ data: null, error: null }),
          update: () => Promise.resolve({ data: null, error: null }),
          delete: () => Promise.resolve({ data: null, error: null })
        }),
        auth: {
          signIn: () => Promise.resolve({ data: null, error: null }),
          signOut: () => Promise.resolve({ error: null })
        }
      };
    }
  }
  return supabaseClient;
};

// Export a synchronous version for components that need it immediately
export const supabase = {
  from: (table: string) => ({
    select: (columns?: string) => ({
      limit: (count: number) => 
        getSupabaseClient().then(client => client.from(table).select(columns).limit(count))
    }),
    insert: (data: any) => 
      getSupabaseClient().then(client => client.from(table).insert(data)),
    update: (data: any) => 
      getSupabaseClient().then(client => client.from(table).update(data)),
    delete: () => 
      getSupabaseClient().then(client => client.from(table).delete())
  }),
  auth: {
    signIn: (credentials: any) => 
      getSupabaseClient().then(client => client.auth.signIn(credentials)),
    signOut: () => 
      getSupabaseClient().then(client => client.auth.signOut())
  }
}; 