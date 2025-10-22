// Re-export from RealAuthContext to avoid breaking imports
export { useAuth } from '@/contexts/RealAuthContext';

export function MockAuthProvider({ children }: { children: React.ReactNode }) {
  const value: AuthValue = { 
    user: { 
      id: 'dev-user', 
      role: 'OWNER', 
      name: 'Samer',
      email: 'samer@monza.com'
    },
    logout: () => console.log('Mock logout called'),
    login: async (email: string, password: string) => {
      console.log('Mock login called with:', email);
    },
    isLoading: false
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Original AuthProvider for when you want to restore real auth
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // This would contain your real Supabase auth logic
  // For now, use MockAuthProvider
  return <MockAuthProvider>{children}</MockAuthProvider>;
}