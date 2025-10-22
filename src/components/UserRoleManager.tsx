import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePermissions } from "@/hooks/usePermissions";
import { AlertCircle, Users, Shield, UserCheck } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface User {
  id: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
}

interface Role {
  id: string;
  label: string;
}

export default function UserRoleManager() {
  const { can } = usePermissions();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [userRoles, setUserRoles] = useState<Record<string, Set<string>>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user has admin permissions
  if (!can("admin.manage_users")) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to manage users. Contact an administrator for access.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      // Load users, roles, and user_roles in parallel
      const [usersResult, rolesResult, userRolesResult] = await Promise.all([
        supabase.from("user_profiles").select("id, full_name, phone, avatar_url"),
        supabase.from("roles").select("id, label"),
        supabase.from("user_roles").select("user_id, role_id")
      ]);

      if (usersResult.error) throw usersResult.error;
      if (rolesResult.error) throw rolesResult.error;
      if (userRolesResult.error) throw userRolesResult.error;

      setUsers(usersResult.data || []);
      setRoles(rolesResult.data || []);

      // Build user roles map
      const roleMap: Record<string, Set<string>> = {};
      (userRolesResult.data || []).forEach((row) => {
        if (!roleMap[row.user_id]) roleMap[row.user_id] = new Set();
        roleMap[row.user_id].add(row.role_id);
      });
      setUserRoles(roleMap);
    } catch (err: any) {
      console.error("Error loading user role data:", err);
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  async function toggleRole(userId: string, roleId: string) {
    try {
      const hasRole = userRoles[userId]?.has(roleId);
      
      if (hasRole) {
        // Remove role
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .eq("role_id", roleId);
        
        if (error) throw error;
        
        const newUserRoles = { ...userRoles };
        newUserRoles[userId]?.delete(roleId);
        setUserRoles(newUserRoles);
      } else {
        // Add role
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role_id: roleId });
        
        if (error) throw error;
        
        const newUserRoles = { ...userRoles };
        if (!newUserRoles[userId]) newUserRoles[userId] = new Set();
        newUserRoles[userId].add(roleId);
        setUserRoles(newUserRoles);
      }
    } catch (err: any) {
      console.error("Error toggling role:", err);
      setError(`Failed to ${userRoles[userId]?.has(roleId) ? 'remove' : 'add'} role: ${err.message}`);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-6 w-6 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold">User Role Management</h1>
          <p className="text-muted-foreground">Manage user roles and permissions</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Available Roles
            </CardTitle>
            <CardDescription>
              Users can have multiple roles for hybrid access (e.g., Sales + Garage Manager)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {roles.map(role => (
                <Badge key={role.id} variant="outline" className="px-3 py-1">
                  {role.label}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {users.map(user => (
          <Card key={user.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <UserCheck className="h-5 w-5" />
                <div>
                  <div className="font-medium">
                    {user.full_name || "Unnamed User"}
                  </div>
                  {user.phone && (
                    <div className="text-sm text-muted-foreground font-normal">
                      {user.phone}
                    </div>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm font-medium text-muted-foreground">
                  Current Roles:
                </div>
                <div className="flex gap-2 flex-wrap">
                  {roles.map(role => {
                    const hasRole = userRoles[user.id]?.has(role.id);
                    return (
                      <Button
                        key={role.id}
                        variant={hasRole ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleRole(user.id, role.id)}
                        className={hasRole ? "bg-blue-600 hover:bg-blue-700" : ""}
                      >
                        {role.label}
                      </Button>
                    );
                  })}
                </div>
                {userRoles[user.id]?.size === 0 && (
                  <div className="text-sm text-muted-foreground italic">
                    No roles assigned
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6">
        <Button onClick={loadData} variant="outline">
          Refresh Data
        </Button>
      </div>
    </div>
  );
}
