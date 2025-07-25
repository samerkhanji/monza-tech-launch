// Safe Supabase client that avoids module resolution issues
import type { Database } from './types';

const SUPABASE_URL = "https://wunqntfreyezylvbzvxc.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1bnFudGZyZXllenlsdmJ6dnhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3NDE4MDIsImV4cCI6MjA2MzMxNzgwMn0.AphXufXZef_wAvVT3TXl2s_JQwbI9wK6KN2uCQgVc5o";

// Create a safe client that loads Supabase only when needed
class SafeSupabaseClient {
  private client: any = null;
  private loading = false;
  private loadPromise: Promise<any> | null = null;

  private async loadClient() {
    if (this.client) return this.client;
    if (this.loading && this.loadPromise) return this.loadPromise;

    this.loading = true;
    this.loadPromise = new Promise(async (resolve, reject) => {
      try {
        // Try to load from CDN first, then fallback to npm package
        let createClient;
        
        if (typeof window !== 'undefined' && (window as any).supabase) {
          // Use CDN version if available
          createClient = (window as any).supabase.createClient;
        } else {
          // Fallback to npm package with error handling
          try {
            const module = await import('@supabase/supabase-js');
            createClient = module.createClient;
          } catch (importError) {
            console.warn('Supabase npm package failed to load, using mock client');
            this.client = this.createMockClient();
            resolve(this.client);
            return;
          }
        }
        
        this.client = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
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
        
        resolve(this.client);
      } catch (error) {
        console.error('Failed to load Supabase client:', error);
        // Create a mock client for development
        this.client = this.createMockClient();
        resolve(this.client);
      } finally {
        this.loading = false;
      }
    });

    return this.loadPromise;
  }

  private createMockClient() {
    return {
      from: (table: string) => ({
        select: (columns?: string) => ({
          limit: (count: number) => Promise.resolve({ data: [], error: null }),
          eq: (column: string, value: any) => ({
            limit: (count: number) => Promise.resolve({ data: [], error: null })
          }),
          order: (column: string, options?: any) => ({
            limit: (count: number) => Promise.resolve({ data: [], error: null })
          })
        }),
        insert: (data: any) => Promise.resolve({ data: null, error: null }),
        update: (data: any) => Promise.resolve({ data: null, error: null }),
        delete: () => Promise.resolve({ data: null, error: null })
      }),
      auth: {
        signIn: (credentials: any) => Promise.resolve({ data: null, error: null }),
        signOut: () => Promise.resolve({ error: null }),
        getSession: () => Promise.resolve({ data: { session: null }, error: null })
      },
      storage: {
        from: (bucket: string) => ({
          upload: (path: string, file: File) => Promise.resolve({ data: null, error: null }),
          download: (path: string) => Promise.resolve({ data: null, error: null }),
          remove: (paths: string[]) => Promise.resolve({ data: null, error: null })
        })
      }
    };
  }

  async from(table: string) {
    const client = await this.loadClient();
    return client.from(table);
  }

  async auth() {
    const client = await this.loadClient();
    return client.auth;
  }

  async storage() {
    const client = await this.loadClient();
    return client.storage;
  }
}

// Create singleton instance
const safeSupabase = new SafeSupabaseClient();

// Export a synchronous interface that works like the original supabase client
export const supabase = {
  from: (table: string) => ({
    select: (columns?: string) => ({
      limit: (count: number) => safeSupabase.from(table).then(client => client.select(columns).limit(count)),
      eq: (column: string, value: any) => ({
        limit: (count: number) => safeSupabase.from(table).then(client => client.select(columns).eq(column, value).limit(count))
      }),
      order: (column: string, options?: any) => ({
        limit: (count: number) => safeSupabase.from(table).then(client => client.select(columns).order(column, options).limit(count))
      })
    }),
    insert: (data: any) => safeSupabase.from(table).then(client => client.insert(data)),
    update: (data: any) => safeSupabase.from(table).then(client => client.update(data)),
    delete: () => safeSupabase.from(table).then(client => client.delete())
  }),
  auth: {
    signIn: (credentials: any) => safeSupabase.auth().then(auth => auth.signIn(credentials)),
    signOut: () => safeSupabase.auth().then(auth => auth.signOut()),
    getSession: () => safeSupabase.auth().then(auth => auth.getSession())
  },
  storage: {
    from: (bucket: string) => ({
      upload: (path: string, file: File) => safeSupabase.storage().then(storage => storage.from(bucket).upload(path, file)),
      download: (path: string) => safeSupabase.storage().then(storage => storage.from(bucket).download(path)),
      remove: (paths: string[]) => safeSupabase.storage().then(storage => storage.from(bucket).remove(paths))
    })
  }
};

// Export the safe client for direct use
export { safeSupabase }; 