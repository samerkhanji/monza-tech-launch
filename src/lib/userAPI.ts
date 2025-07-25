
import { supabase } from '@/integrations/supabase/client';
import { hashPassword } from '@/lib/auth';

export interface User {
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
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: 'owner' | 'garage_manager' | 'assistant' | 'sales';
  hybridRole?: 'sales_garage_marketing' | 'sales_assistant_marketing';
  phoneNumber?: string;
  department?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  address?: string;
  notes?: string;
}

// API for User Management
export const userAPI = {
  getAll: async (): Promise<User[]> => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as 'owner' | 'garage_manager' | 'assistant' | 'sales',
      hybridRole: user.hybrid_role as 'sales_garage_marketing' | 'sales_assistant_marketing' | undefined,
      phoneNumber: user.phone_number,
      department: user.department,
      emergencyContactName: user.emergency_contact_name,
      emergencyContactPhone: user.emergency_contact_phone,
      address: user.address,
      notes: user.notes,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    }));
  },

  getById: async (id: string): Promise<User> => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role as 'owner' | 'garage_manager' | 'assistant' | 'sales',
      hybridRole: data.hybrid_role as 'sales_garage_marketing' | 'sales_assistant_marketing' | undefined,
      phoneNumber: data.phone_number,
      department: data.department,
      emergencyContactName: data.emergency_contact_name,
      emergencyContactPhone: data.emergency_contact_phone,
      address: data.address,
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  create: async (userData: CreateUserData): Promise<User> => {
    const hashedPassword = await hashPassword(userData.password);
    
    const { data, error } = await supabase
      .from('users')
      .insert({
        name: userData.name,
        email: userData.email,
        password_hash: hashedPassword,
        role: userData.role,
        hybrid_role: userData.hybridRole,
        phone_number: userData.phoneNumber,
        department: userData.department,
        emergency_contact_name: userData.emergencyContactName,
        emergency_contact_phone: userData.emergencyContactPhone,
        address: userData.address,
        notes: userData.notes,
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role as 'owner' | 'garage_manager' | 'assistant' | 'sales',
      hybridRole: data.hybrid_role as 'sales_garage_marketing' | 'sales_assistant_marketing' | undefined,
      phoneNumber: data.phone_number,
      department: data.department,
      emergencyContactName: data.emergency_contact_name,
      emergencyContactPhone: data.emergency_contact_phone,
      address: data.address,
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  update: async (id: string, updates: Partial<CreateUserData>): Promise<User> => {
    const updateData: any = {
      name: updates.name,
      email: updates.email,
      role: updates.role,
      hybrid_role: updates.hybridRole,
      phone_number: updates.phoneNumber,
      department: updates.department,
      emergency_contact_name: updates.emergencyContactName,
      emergency_contact_phone: updates.emergencyContactPhone,
      address: updates.address,
      notes: updates.notes,
    };

    // Only hash password if it's being updated
    if (updates.password) {
      updateData.password_hash = await hashPassword(updates.password);
    }

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role as 'owner' | 'garage_manager' | 'assistant' | 'sales',
      hybridRole: data.hybrid_role as 'sales_garage_marketing' | 'sales_assistant_marketing' | undefined,
      phoneNumber: data.phone_number,
      department: data.department,
      emergencyContactName: data.emergency_contact_name,
      emergencyContactPhone: data.emergency_contact_phone,
      address: data.address,
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};
