import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { authenticateUser, createDefaultUsers, AuthUser } from '@/lib/auth';
import { useNavigate, useLocation } from 'react-router-dom';

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  hasPermission: (permission: string) => boolean;
  canAccessRoute: (route: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// Define route permissions
const ROUTE_PERMISSIONS = {
  '/user-management': ['owner'] as const,
  '/employee-analytics': ['owner', 'garage_manager'] as const,
  '/financial-analytics': ['owner'] as const,
  '/business-analytics': ['owner'] as const,
  '/audit-log': ['owner'] as const,
  '/admin': ['owner'] as const,
} as const;

// Define feature permissions
const FEATURE_PERMISSIONS = {
  'view_client_data': ['owner'] as const,
  'view_financial_data': ['owner'] as const,
  'view_employee_analytics': ['owner'] as const,
  'view_business_analytics': ['owner', 'garage_manager'] as const,
  'manage_users': ['owner'] as const,
  'edit_inventory': ['owner', 'garage_manager', 'assistant'] as const,
  'schedule_repairs': ['owner', 'garage_manager'] as const,
  'view_repairs': ['owner', 'garage_manager', 'sales'] as const,
  'manage_showroom': ['owner', 'sales'] as const,
  'view_analytics': ['owner', 'garage_manager'] as const,
} as const;

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const initializeAuth = async () => {
    try {
      // Create default users if needed
      await createDefaultUsers();
      
      // Check for stored auth
      const storedUser = localStorage.getItem('monza_auth_user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        } catch (error) {
          console.warn('Failed to parse stored user, clearing localStorage');
          localStorage.removeItem('monza_auth_user');
        }
      }
    } catch (error) {
      console.warn('Auth initialization error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initializeAuth();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {

    setIsLoading(true);
    
    try {
      const authenticatedUser = await authenticateUser(email, password);
      
      if (authenticatedUser) {
        console.log('AuthContext: Login successful, setting user state');
        setUser(authenticatedUser);
        localStorage.setItem('monza_auth_user', JSON.stringify(authenticatedUser));
        
        // Navigate to dashboard after successful login
        navigate('/dashboard');
        return true;
      } else {
        console.log('AuthContext: Login failed');
        return false;
      }
    } catch (error) {
      console.error('💥 AuthContext: Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  const logout = useCallback(() => {
    console.log('🚪 AuthContext: Logging out user');
    setUser(null);
    localStorage.removeItem('monza_auth_user');
    navigate('/login');
  }, [navigate]);

  const hasPermission = useCallback((permission: string): boolean => {
    if (!user) return false;
    
    const allowedRoles = FEATURE_PERMISSIONS[permission as keyof typeof FEATURE_PERMISSIONS];
    if (!allowedRoles) return false;
    
    // Check primary role
    if (allowedRoles.includes(user.role as any)) return true;
    
    // Check hybrid roles
    if (user.hybridRole) {
      if (user.hybridRole.includes('garage') && allowedRoles.includes('garage_manager' as any)) return true;
      if (user.hybridRole.includes('sales') && allowedRoles.includes('sales' as any)) return true;
      if (user.hybridRole.includes('assistant') && allowedRoles.includes('assistant' as any)) return true;
    }
    
    return false;
  }, [user]);

  const canAccessRoute = useCallback((route: string): boolean => {
    if (!user) return false;
    
    const allowedRoles = ROUTE_PERMISSIONS[route as keyof typeof ROUTE_PERMISSIONS];
    if (!allowedRoles) return true; // Allow access to routes without restrictions
    
    // Check primary role
    if (allowedRoles.includes(user.role as any)) return true;
    
    // Check hybrid roles
    if (user.hybridRole) {
      if (user.hybridRole.includes('garage') && allowedRoles.includes('garage_manager' as any)) return true;
      if (user.hybridRole.includes('sales') && allowedRoles.includes('sales' as any)) return true;
      if (user.hybridRole.includes('assistant') && allowedRoles.includes('assistant' as any)) return true;
    }
    
    return false;
  }, [user]);

  const contextValue = useMemo(() => ({
    user,
    login,
    logout,
    isLoading,
    hasPermission,
    canAccessRoute,
  }), [user, login, logout, isLoading, hasPermission, canAccessRoute]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
