import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface UserPermissions {
  can: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  permissions: Set<string>;
  roles: Set<string>;
  isLoading: boolean;
}

export function usePermissions(): UserPermissions {
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const [roles, setRoles] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setPermissions(new Set());
      setRoles(new Set());
      setIsLoading(false);
      return;
    }

    loadUserPermissions();
  }, [user]);

  const loadUserPermissions = async () => {
    try {
      setIsLoading(true);
      
      // Get user permissions
      const { data: permissionsData, error: permError } = await supabase
        .rpc('current_user_permissions');
      
      if (permError) {
        console.error('Error loading permissions:', permError);
        setPermissions(new Set());
      } else {
        setPermissions(new Set(permissionsData || []));
      }

      // Get user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('role_id')
        .eq('user_id', user?.id);

      if (rolesError) {
        console.error('Error loading roles:', rolesError);
        setRoles(new Set());
      } else {
        setRoles(new Set((rolesData || []).map(r => r.role_id)));
      }
    } catch (error) {
      console.error('Error in loadUserPermissions:', error);
      setPermissions(new Set());
      setRoles(new Set());
    } finally {
      setIsLoading(false);
    }
  };

  const can = (permission: string): boolean => {
    // OWNERS have access to everything - bypass permission checks
    if (user?.role === 'OWNER') {
      return true;
    }
    return permissions.has(permission);
  };

  const hasRole = (role: string): boolean => {
    // Check user role directly for development/fallback scenarios
    if (user?.role && user.role.toUpperCase() === role.toUpperCase()) {
      return true;
    }
    return roles.has(role);
  };

  return {
    can,
    hasRole,
    permissions,
    roles,
    isLoading
  };
}

// Helper hook for common permission checks
export function usePermissionChecks() {
  const { can, hasRole } = usePermissions();

  return {
    // Admin checks
    canManageUsers: () => can('admin.manage_users'),
    isOwner: () => hasRole('owner'),
    
    // Request management
    canCreateRequests: () => can('request.create'),
    canViewAllRequests: () => can('request.view_all'),
    canUpdateAllRequests: () => can('request.update_all'),
    canAssignRequests: () => can('request.assign'),
    
    // Inventory
    canViewInventory: () => can('inventory.view'),
    canEditInventory: () => can('inventory.edit'),
    
    // Garage
    canViewGarage: () => can('garage.view'),
    canEditGarage: () => can('garage.edit'),
    
    // Sales
    canViewSales: () => can('sales.view'),
    canEditSales: () => can('sales.edit'),
    
    // Cars
    canViewCars: () => can('cars.view'),
    canEditCars: () => can('cars.edit'),
    
    // Orders
    canViewOrders: () => can('orders.view'),
    canEditOrders: () => can('orders.edit'),
    
    // Schedule
    canViewSchedule: () => can('schedule.view'),
    canEditSchedule: () => can('schedule.edit'),
    
    // Financial
    canViewFinancial: () => can('financial.view'),
    canViewPricing: () => can('pricing.view'),
    
    // Customers
    canViewCustomers: () => can('customers.view'),
    canEditCustomers: () => can('customers.edit'),
    
    // Reports
    canViewReports: () => can('reports.view'),
    
    // Messages
    canSendMessages: () => can('message.send'),
    
    // Role-based checks
    isGarageManager: () => hasRole('garage_manager'),
    isSales: () => hasRole('sales'),
    isTechnician: () => hasRole('technician'),
    isAssistant: () => hasRole('assistant'),
    isMarketing: () => hasRole('marketing'),
    isCustomer: () => hasRole('customer')
  };
}