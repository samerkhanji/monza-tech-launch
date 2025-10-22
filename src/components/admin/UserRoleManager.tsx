import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Users, Shield, UserPlus, AlertTriangle } from "lucide-react";

interface User {
  id: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
}

interface Role {
  id: string;
  label: string;
}

interface UserRole {
  user_id: string;
  role_id: string;
}

export default function UserRoleManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [byUser, setByUser] = useState<Record<string, Set<string>>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load users
      const { data: usersData, error: usersError } = await supabase
        .from("user_profiles")
        .select("id, full_name, phone, created_at")
        .order('created_at', { ascending: false });

      if (usersError) {
        console.error('Error loading users:', usersError);
        toast({
          title: "Error",
          description: "Failed to load users",
          variant: "destructive"
        });
        return;
      }

      // Load roles
      const { data: rolesData, error: rolesError } = await supabase
        .from("roles")
        .select("id, label")
        .order('label');

      if (rolesError) {
        console.error('Error loading roles:', rolesError);
        toast({
          title: "Error",
          description: "Failed to load roles",
          variant: "destructive"
        });
        return;
      }

      // Load user roles
      const { data: userRolesData, error: userRolesError } = await supabase
        .from("user_roles")
        .select("user_id, role_id");

      if (userRolesError) {
        console.error('Error loading user roles:', userRolesError);
        toast({
          title: "Error",
          description: "Failed to load user roles",
          variant: "destructive"
        });
        return;
      }

      setUsers(usersData || []);
      setRoles(rolesData || []);
      setUserRoles(userRolesData || []);

      // Build user roles map
      const map: Record<string, Set<string>> = {};
      (userRolesData || []).forEach((row) => {
        if (!map[row.user_id]) {
          map[row.user_id] = new Set();
        }
        map[row.user_id].add(row.role_id);
      });
      setByUser(map);

    } catch (error) {
      console.error('Error in loadData:', error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleRole = async (user_id: string, role_id: string) => {
    try {
      const hasRole = byUser[user_id]?.has(role_id);

      if (hasRole) {
        // Remove role
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", user_id)
          .eq("role_id", role_id);

        if (error) {
          console.error('Error removing role:', error);
          toast({
            title: "Error",
            description: "Failed to remove role",
            variant: "destructive"
          });
          return;
        }

        // Update local state
        const newByUser = { ...byUser };
        if (newByUser[user_id]) {
          newByUser[user_id].delete(role_id);
        }
        setByUser(newByUser);

        const user = users.find(u => u.id === user_id);
        const role = roles.find(r => r.id === role_id);
        
        toast({
          title: "Role Removed",
          description: `Removed ${role?.label} role from ${user?.full_name || 'user'}`,
        });

      } else {
        // Add role
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id, role_id });

        if (error) {
          console.error('Error adding role:', error);
          toast({
            title: "Error",
            description: "Failed to add role",
            variant: "destructive"
          });
          return;
        }

        // Update local state
        const newByUser = { ...byUser };
        if (!newByUser[user_id]) {
          newByUser[user_id] = new Set();
        }
        newByUser[user_id].add(role_id);
        setByUser(newByUser);

        const user = users.find(u => u.id === user_id);
        const role = roles.find(r => r.id === role_id);
        
        toast({
          title: "Role Added",
          description: `Added ${role?.label} role to ${user?.full_name || 'user'}`,
        });
      }
    } catch (error) {
      console.error('Error toggling role:', error);
      toast({
        title: "Error",
        description: "Failed to update role",
        variant: "destructive"
      });
    }
  };

  const getRoleColor = (roleId: string) => {
    switch (roleId) {
      case 'owner':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'garage_manager':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'sales':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'assistant':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'technician':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'marketing':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'customer':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-monza-yellow mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading users and roles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            User Role Management
          </CardTitle>
          <CardDescription>
            Manage user roles and permissions for the Monza TECH system. 
            Users can have multiple roles for hybrid responsibilities.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Important Notes:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Owners have all permissions automatically</li>
                  <li>Hybrid roles are supported (e.g., Khalil can be both Sales + Garage Manager)</li>
                  <li>Changes take effect immediately</li>
                  <li>Only users with admin.manage_users permission can access this page</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {users.map((user) => (
              <Card key={user.id} className="border border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-monza-yellow p-2 rounded-full">
                        <Users className="h-4 w-4 text-monza-black" />
                      </div>
                      <div>
                        <h3 className="font-medium text-lg">
                          {user.full_name || 'Unnamed User'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          ID: {user.id.slice(0, 8)}...
                        </p>
                        {user.phone && (
                          <p className="text-xs text-muted-foreground">
                            📞 {user.phone}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        Joined: {new Date(user.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-xs font-medium">
                        {byUser[user.id]?.size || 0} role(s)
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700">Assigned Roles:</h4>
                    <div className="flex gap-2 flex-wrap">
                      {roles.map((role) => {
                        const hasRole = byUser[user.id]?.has(role.id);
                        return (
                          <Button
                            key={role.id}
                            variant={hasRole ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleRole(user.id, role.id)}
                            className={`
                              ${hasRole 
                                ? getRoleColor(role.id) + ' border' 
                                : 'border-gray-300 hover:border-gray-400'
                              }
                              transition-all duration-200
                            `}
                          >
                            {role.label}
                            {hasRole && (
                              <span className="ml-1 font-bold">✓</span>
                            )}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {users.length === 0 && (
            <div className="text-center py-8">
              <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No users found</p>
              <p className="text-sm text-muted-foreground">
                Users will appear here after they sign up or are created
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
