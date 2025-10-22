import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { locationTrackingService } from '@/services/locationTrackingService';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  department?: string;
  avatar_url?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (email: string, password: string, userData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function RealAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          await loadUserProfile(session.user.id);
        } else {
          setUser(null);
          setIsLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      setUser({
        id: userId,
        email: data.email,
        name: data.full_name || data.email.split('@')[0],
        role: data.role || 'USER',
        department: data.department,
        avatar_url: data.avatar_url
      });
    } catch (error) {
      console.error('Error loading user profile:', error);
      // Fallback for users without profiles
      const { data: authUser } = await supabase.auth.getUser();
      if (authUser.user) {
        setUser({
          id: authUser.user.id,
          email: authUser.user.email || '',
          name: authUser.user.email?.split('@')[0] || 'User',
          role: 'USER'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        // Record failed login attempt
        await locationTrackingService.recordFailedLogin(email, error.message);
        throw error;
      }

      // Record successful login attempt
      if (data.user) {
        await locationTrackingService.recordSuccessfulLogin(data.user.id, email);
      }
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const signup = async (email: string, password: string, userData: Partial<User>) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      });
      if (error) throw error;

      // Create user profile
      if (data.user) {
        await supabase.from('user_profiles').insert({
          id: data.user.id,
          email,
          full_name: userData.name,
          role: userData.role || 'USER',
          department: userData.department
        });
      }
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const value = {
    user,
    isLoading,
    login,
    logout,
    signup,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Enhanced MockAuthProvider with real Monza employees [[memory:6844799]]
export function EnhancedMockAuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User>({
    id: 'samer-owner',
    email: 'samer@monza.com',
    name: 'Samer',
    role: 'OWNER',
    department: 'Management'
  });

  const monzaEmployees: User[] = [
    { id: 'houssam-owner', email: 'houssam@monza.com', name: 'Houssam', role: 'OWNER', department: 'Management' },
    { id: 'samer-owner', email: 'samer@monza.com', name: 'Samer', role: 'OWNER', department: 'Management' },
    { id: 'kareem-owner', email: 'kareem@monza.com', name: 'Kareem', role: 'OWNER', department: 'Management' },
    { id: 'mark-garage-manager', email: 'mark@monza.com', name: 'Mark', role: 'GARAGE_MANAGER', department: 'Garage' },
    { id: 'lara-assistant', email: 'lara@monza.com', name: 'Lara', role: 'ASSISTANT', department: 'Admin' },
    { id: 'samaya-assistant', email: 'samaya@monza.com', name: 'Samaya', role: 'ASSISTANT', department: 'Admin' },
    { id: 'khalil-hybrid', email: 'khalil@monza.com', name: 'Khalil', role: 'SALES_MANAGER', department: 'Sales' },
    { id: 'tamara-hybrid', email: 'tamara@monza.com', name: 'Tamara', role: 'MARKETING_MANAGER', department: 'Marketing' },
    { id: 'elie-hybrid', email: 'elie@monza.com', name: 'Elie', role: 'TECHNICIAN', department: 'Garage' }
  ];

  const switchUser = (userId: string) => {
    const user = monzaEmployees.find(u => u.id === userId);
    if (user) {
      setCurrentUser(user);
      console.log('🔄 Switched to user:', user.name, '(' + user.role + ')');
    }
  };

  const value = {
    user: currentUser,
    isLoading: false,
    login: async (email: string, password: string) => {
      const user = monzaEmployees.find(u => u.email === email);
      if (user) {
        setCurrentUser(user);
        console.log('✅ Mock login:', user.name);
      } else {
        throw new Error('User not found');
      }
    },
    logout: async () => {
      console.log('👋 Mock logout');
      setCurrentUser(null); // Properly clear user on logout
    },
    signup: async (email: string, password: string, userData: Partial<User>) => {
      console.log('✅ Mock signup:', email);
    },
    switchUser, // Additional method for testing
    availableUsers: monzaEmployees // For user switcher component
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
