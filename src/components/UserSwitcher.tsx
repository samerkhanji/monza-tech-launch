import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { User, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// This component allows you to switch between different Monza employees for testing
export function UserSwitcher() {
  const { user, switchUser, availableUsers } = useAuth() as any;

  // Only show if we have the switchUser function (i.e., in mock mode)
  if (!switchUser || !availableUsers) {
    return null;
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'OWNER': return 'text-purple-600 bg-purple-100';
      case 'GARAGE_MANAGER': return 'text-blue-600 bg-blue-100';
      case 'SALES_MANAGER': return 'text-green-600 bg-green-100';
      case 'MARKETING_MANAGER': return 'text-orange-600 bg-orange-100';
      case 'TECHNICIAN': return 'text-gray-600 bg-gray-100';
      case 'ASSISTANT': return 'text-pink-600 bg-pink-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <div className="text-left">
              <div className="text-sm font-medium">{user?.name}</div>
              <div className={`text-xs px-2 py-1 rounded-full ${getRoleColor(user?.role)}`}>
                {user?.role}
              </div>
            </div>
          </div>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-64" align="end">
        <DropdownMenuLabel>Switch User (Development Mode)</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {availableUsers.map((employee: any) => (
          <DropdownMenuItem
            key={employee.id}
            onClick={() => switchUser(employee.id)}
            className={employee.id === user?.id ? 'bg-blue-50' : ''}
          >
            <div className="flex items-center space-x-3 w-full">
              <User className="h-4 w-4" />
              <div className="flex-1">
                <div className="text-sm font-medium">{employee.name}</div>
                <div className="text-xs text-gray-500">{employee.email}</div>
              </div>
              <div className={`text-xs px-2 py-1 rounded-full ${getRoleColor(employee.role)}`}>
                {employee.role}
              </div>
            </div>
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-gray-500 text-xs">
          This switcher only appears in development mode
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
