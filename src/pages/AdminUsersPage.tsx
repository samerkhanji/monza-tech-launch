import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';
import UserRoleManager from '@/components/admin/UserRoleManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Shield, Lock } from 'lucide-react';

const NoAccessComponent = ({ user }: { user: any }) => (
  <div className="container mx-auto py-12">
    <Card className="max-w-md mx-auto">
      <CardContent className="p-8 text-center">
        <div className="bg-red-50 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <Lock className="h-8 w-8 text-red-600" />
        </div>
        <h2 className="text-xl font-semibold mb-2 text-red-800">Access Denied</h2>
        <p className="text-red-600 mb-4">
          You don't have permission to access user management.
        </p>
        {user && (
          <p className="text-sm text-gray-600 mb-2">
            Current user: {user.name} ({user.role})
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          Only users with administrative privileges can manage user roles and permissions.
        </p>
      </CardContent>
    </Card>
  </div>
);

const LoadingComponent = () => (
  <div className="container mx-auto py-12">
    <Card className="max-w-md mx-auto">
      <CardContent className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-monza-yellow mx-auto mb-4"></div>
        <p className="text-muted-foreground">Checking permissions...</p>
      </CardContent>
    </Card>
  </div>
);

export default function AdminUsersPage() {
  const { can, isLoading } = usePermissions();
  const { user } = useAuth();

  if (isLoading) {
    return <LoadingComponent />;
  }

  // OWNERS have access to everything, including admin functions
  const isOwner = user?.role === 'OWNER';
  const hasAccess = can('admin.manage_users') || isOwner;

  if (!hasAccess) {
    return <NoAccessComponent user={user} />;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-monza-yellow p-2 rounded-lg">
            <Shield className="h-6 w-6 text-monza-black" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-monza-black">User Administration</h1>
            <p className="text-muted-foreground">Manage user roles and permissions</p>
          </div>
        </div>
        
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">System Information:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Role changes take effect immediately</li>
                  <li>Hybrid roles are supported (users can have multiple roles)</li>
                  <li>Owners automatically have all permissions</li>
                  <li>This page is only accessible to users with admin.manage_users permission</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <UserRoleManager />
    </div>
  );
}
