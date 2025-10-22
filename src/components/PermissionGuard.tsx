import { ReactNode } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/contexts/AuthContext";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PermissionGuardProps {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
  showError?: boolean;
}

/**
 * PermissionGuard - Conditionally render content based on user permissions
 * 
 * @param permission - The permission string to check (e.g., "admin.manage_users")
 * @param children - Content to render if user has permission
 * @param fallback - Optional content to render if user lacks permission
 * @param showError - Whether to show an error message if permission is denied
 */
export function PermissionGuard({ 
  permission, 
  children, 
  fallback = null, 
  showError = false 
}: PermissionGuardProps) {
  const { can, isLoading } = usePermissions();
  const { user } = useAuth();

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // OWNERS have access to everything - bypass permission checks
  const isOwner = user?.role === 'OWNER';
  const hasPermission = can(permission) || isOwner;

  // Check permission
  if (!hasPermission) {
    if (showError) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to access this feature. Required permission: {permission}
            {user && (
              <span className="block text-xs mt-1">
                Current user: {user.name} ({user.role})
              </span>
            )}
          </AlertDescription>
        </Alert>
      );
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Multiple permissions guard - requires ALL permissions
 */
interface MultiPermissionGuardProps {
  permissions: string[];
  children: ReactNode;
  fallback?: ReactNode;
  showError?: boolean;
  requireAll?: boolean; // If false, requires ANY permission instead of ALL
}

export function MultiPermissionGuard({
  permissions,
  children,
  fallback = null,
  showError = false,
  requireAll = true
}: MultiPermissionGuardProps) {
  const { can, isLoading } = usePermissions();
  const { user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // OWNERS have access to everything - bypass permission checks
  const isOwner = user?.role === 'OWNER';
  const hasAccess = isOwner || (requireAll 
    ? permissions.every(permission => can(permission))
    : permissions.some(permission => can(permission)));

  if (!hasAccess) {
    if (showError) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You don't have the required permissions. Required: {permissions.join(", ")}
            {user && (
              <span className="block text-xs mt-1">
                Current user: {user.name} ({user.role})
              </span>
            )}
          </AlertDescription>
        </Alert>
      );
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Hook-based permission checking for inline conditions
 */
export function usePermissionGuard() {
  const { can, isLoading } = usePermissions();
  const { user } = useAuth();
  
  const isOwner = user?.role === 'OWNER';
  
  return {
    canAccess: (permission: string) => !isLoading && (can(permission) || isOwner),
    canAccessAny: (permissions: string[]) => !isLoading && (isOwner || permissions.some(p => can(p))),
    canAccessAll: (permissions: string[]) => !isLoading && (isOwner || permissions.every(p => can(p))),
    isLoading,
    isOwner
  };
}
