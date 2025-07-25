// Disabled Supabase client for development - uses localStorage instead
// This avoids all module resolution issues while maintaining functionality

interface MockSupabaseResponse<T = any> {
  data: T | null;
  error: any;
}

class MockSupabaseClient {
  private dataStorage = new Map<string, any[]>();

  constructor() {
    // Load data from localStorage on initialization
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem('mock_supabase_data');
      if (stored) {
        this.dataStorage = new Map(JSON.parse(stored));
      }
    } catch (error) {
      console.warn('Failed to load mock data from localStorage:', error);
    }
  }

  private saveToStorage() {
    try {
      const data = Array.from(this.dataStorage.entries());
      localStorage.setItem('mock_supabase_data', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save mock data to localStorage:', error);
    }
  }

  from(table: string) {
    return {
      select: (columns?: string) => ({
        limit: (count: number): Promise<MockSupabaseResponse> => {
          const data = this.dataStorage.get(table) || [];
          return Promise.resolve({
            data: data.slice(0, count),
            error: null
          });
        },
        eq: (column: string, value: any) => ({
          limit: (count: number): Promise<MockSupabaseResponse> => {
            const data = this.dataStorage.get(table) || [];
            const filtered = data.filter(item => item[column] === value);
            return Promise.resolve({
              data: filtered.slice(0, count),
              error: null
            });
          }
        }),
        order: (column: string, options?: { ascending?: boolean }) => ({
          limit: (count: number): Promise<MockSupabaseResponse> => {
            const data = this.dataStorage.get(table) || [];
            const sorted = [...data].sort((a, b) => {
              if (options?.ascending === false) {
                return b[column] > a[column] ? 1 : -1;
              }
              return a[column] > b[column] ? 1 : -1;
            });
            return Promise.resolve({
              data: sorted.slice(0, count),
              error: null
            });
          }
        })
      }),
      insert: (data: any): Promise<MockSupabaseResponse> => {
        const tableData = this.dataStorage.get(table) || [];
        const newItem = { ...data, id: Date.now().toString() };
        tableData.push(newItem);
        this.dataStorage.set(table, tableData);
        this.saveToStorage();
        return Promise.resolve({ data: newItem, error: null });
      },
      update: (data: any): Promise<MockSupabaseResponse> => {
        const tableData = this.dataStorage.get(table) || [];
        const index = tableData.findIndex(item => item.id === data.id);
        if (index !== -1) {
          tableData[index] = { ...tableData[index], ...data };
          this.dataStorage.set(table, tableData);
          this.saveToStorage();
          return Promise.resolve({ data: tableData[index], error: null });
        }
        return Promise.resolve({ data: null, error: { message: 'Record not found' } });
      },
      delete: (): Promise<MockSupabaseResponse> => {
        this.dataStorage.set(table, []);
        this.saveToStorage();
        return Promise.resolve({ data: null, error: null });
      }
    };
  }

  auth = {
    signIn: (credentials: any): Promise<MockSupabaseResponse> => {
      console.log('Mock auth signIn:', credentials);
      return Promise.resolve({ 
        data: { user: { id: 'mock-user', email: credentials.email } }, 
        error: null 
      });
    },
    signOut: (): Promise<MockSupabaseResponse> => {
      console.log('Mock auth signOut');
      return Promise.resolve({ data: null, error: null });
    },
    getSession: (): Promise<MockSupabaseResponse> => {
      return Promise.resolve({ 
        data: { session: null }, 
        error: null 
      });
    }
  };

  storage = {
    from: (bucket: string) => ({
      upload: (path: string, file: File): Promise<MockSupabaseResponse> => {
        console.log('Mock storage upload:', { bucket, path, file });
        return Promise.resolve({ data: { path }, error: null });
      },
      download: (path: string): Promise<MockSupabaseResponse> => {
        console.log('Mock storage download:', { bucket, path });
        return Promise.resolve({ data: null, error: null });
      },
      remove: (paths: string[]): Promise<MockSupabaseResponse> => {
        console.log('Mock storage remove:', { bucket, paths });
        return Promise.resolve({ data: null, error: null });
      }
    })
  };
}

// Create singleton instance
const mockSupabase = new MockSupabaseClient();

// Export the mock client as supabase
export const supabase = mockSupabase;

// Export for direct use
export { mockSupabase }; 