import { supabase } from '@/integrations/supabase/client';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'garage_manager' | 'assistant' | 'sales';
  hybridRole?: 'sales_garage_marketing' | 'sales_assistant_marketing';
  phoneNumber?: string;
  department?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  address?: string;
  notes?: string;
}

// Hash password using Web Crypto API (browser-compatible)
export const hashPassword = async (password: string): Promise<string> => {
  console.log('🔐 Hashing password...');
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  console.log('🔐 Password hash generated');
  return hash;
};

// Demo users for fallback authentication
const demoUsers = [
  { email: 'samer@monzasal.com', password: 'Monza123', name: 'Samer', role: 'owner' as const, id: '1' },
  { email: 'houssam@monza.com', password: 'Monza123', name: 'Houssam', role: 'owner' as const, id: '2' },
  { email: 'kareem@monza.com', password: 'Monza123', name: 'Kareem', role: 'owner' as const, id: '3' },
  { email: 'mark@monza.com', password: 'Monza123', name: 'Mark', role: 'garage_manager' as const, id: '4' },
  { email: 'lara@monza.com', password: 'Monza123', name: 'Lara', role: 'assistant' as const, id: '5' },
  { email: 'samaya@monza.com', password: 'Monza123', name: 'Samaya', role: 'assistant' as const, id: '6' },
  { email: 'khalil@monza.com', password: 'Monza123', name: 'Khalil', role: 'sales' as const, id: '7', hybridRole: 'sales_garage_marketing' as const },
  { email: 'tamara@monza.com', password: 'Monza123', name: 'Tamara', role: 'sales' as const, id: '8', hybridRole: 'sales_assistant_marketing' as const },
  { email: 'elie@monza.com', password: 'Monza123', name: 'Elie', role: 'sales' as const, id: '9', hybridRole: 'sales_garage_marketing' as const },
];

// Authenticate user with demo fallback only
export const authenticateUser = async (email: string, password: string): Promise<AuthUser | null> => {
  console.log('🔐 Starting demo authentication for:', email);
  
  // Use demo authentication only (database table doesn't exist)
  const demoUser = demoUsers.find(u => u.email === email && u.password === password);
  if (demoUser) {
    console.log('✅ Demo authentication successful for:', demoUser.name);
    return {
      id: demoUser.id,
      name: demoUser.name,
      email: demoUser.email,
      role: demoUser.role,
      hybridRole: demoUser.hybridRole,
    };
  }

  console.log('❌ Authentication failed for:', email);
  return null;
};

// Create default users (disabled since table doesn't exist)
export const createDefaultUsers = async () => {
  console.log('💡 Using demo users - database user creation disabled');
  // Database user creation disabled - using demo authentication only
      return;
};
