import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { logSupabaseError } from '@/utils/errorLogger';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
// Removed Select imports - using native HTML select elements to prevent page shifting
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, User, X } from 'lucide-react';
import { requestMessagingService, CreateRequestData } from '@/services/requestMessagingService';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { PermissionGuard } from '@/components/PermissionGuard';

interface RequestFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateRequestData) => Promise<void>;
  initialData?: CreateRequestData;
}



const RequestForm: React.FC<RequestFormProps> = ({
  open,
  onOpenChange,
  onSubmit,
  initialData
}) => {
  const { user } = useAuth();
  const { can } = usePermissions();
  const [formData, setFormData] = useState<CreateRequestData>({
    title: '',
    description: '',
    priority: 'medium',
    category: 'Other',
    assigned_to: undefined
  });
  const [users, setUsers] = useState<{ id: string; full_name: string; role: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<{ id: string; full_name: string; role: string }[]>([]);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadUsers();
      if (initialData) {
        setFormData({
          title: initialData.title || '',
          description: initialData.description || '',
          priority: initialData.priority || 'medium',
          category: initialData.category || 'Other',
          assigned_to: initialData.assigned_to
        });
      } else {
        setFormData({
          title: '',
          description: '',
          priority: 'medium',
          category: 'Other',
          assigned_to: undefined
        });
      }
    }
  }, [open, initialData]);

  // Load users when dialog opens
  useEffect(() => {
    if (open) {
      loadUsers();
    }
  }, [open]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = users.filter(user =>
        user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.role?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      const userList = await requestMessagingService.getUsers();
      setUsers(userList);
      setFilteredUsers(userList);
    } catch (error) {
      logSupabaseError('load users', error, 'using fallback');
      // Use authorized users when service fails
      const fallbackUsers = [
        { id: '1', full_name: 'Houssam', role: 'Owner' },
        { id: '2', full_name: 'Samer', role: 'Owner' },
        { id: '3', full_name: 'Kareem', role: 'Owner' },
        { id: '4', full_name: 'Mark', role: 'Garage Manager' },
        { id: '5', full_name: 'Lara', role: 'Assistant' },
        { id: '6', full_name: 'Samaya', role: 'Assistant' },
        { id: '7', full_name: 'Khalil', role: 'Hybrid' },
        { id: '8', full_name: 'Tamara', role: 'Hybrid' },
        { id: '9', full_name: 'Elie', role: 'Hybrid' },
      ];
      setUsers(fallbackUsers);
      setFilteredUsers(fallbackUsers);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit(formData);
      onOpenChange(false);
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        category: 'Other',
        assigned_to: undefined
      });
    } catch (error) {
      console.error('Error submitting request:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserSelect = (userId: string) => {
    setFormData(prev => ({ ...prev, assigned_to: userId }));
    setShowUserSearch(false);
    setSearchQuery('');
  };

  const handleRemoveAssignment = () => {
    setFormData(prev => ({ ...prev, assigned_to: undefined }));
  };



  const getSelectedUser = () => {
    return users.find(user => user.id === formData.assigned_to);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px]" aria-describedby="request-form-description">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Edit Request' : 'Create New Request'}
          </DialogTitle>
          <p id="request-form-description" className="text-sm text-gray-600">
            {initialData ? 'Update the details of this request' : 'Fill out the form to create a new request for assistance'}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter request title..."
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the request details..."
              rows={4}
            />
          </div>

          {/* Category & Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as CreateRequestData['category'] }))}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="" disabled>Select category</option>
                <option value="Part Request">Part Request</option>
                <option value="Task Help">Task Help</option>
                <option value="Client Issue">Client Issue</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <select
                id="priority"
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as 'low' | 'medium' | 'high' | 'urgent' }))}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                {can("request.assign") && (
                  <option value="urgent">Urgent Priority</option>
                )}
              </select>
            </div>
          </div>

          {/* Assignment - Only show if user can assign requests */}
          <PermissionGuard permission="request.assign">
            <div className="space-y-2">
              <Label>Assign To</Label>
            <div className="relative">
              {formData.assigned_to ? (
                <div className="flex items-center gap-2 p-3 border rounded-lg">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {getSelectedUser()?.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{getSelectedUser()?.full_name}</p>
                    <p className="text-sm text-muted-foreground">{getSelectedUser()?.role}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveAssignment}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  className="w-full justify-start bg-white border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 text-gray-700 font-medium h-10 px-4 py-2 rounded-md transition-colors !bg-white"
                  style={{ 
                    backgroundColor: 'white', 
                    opacity: 1, 
                    background: 'white',
                    backgroundImage: 'none',
                    backgroundClip: 'padding-box',
                    backgroundOrigin: 'initial',
                    backgroundSize: 'auto',
                    backgroundRepeat: 'repeat',
                    backgroundAttachment: 'scroll',
                    backgroundPosition: '0% 0%'
                  }}
                  onClick={() => setShowUserSearch(!showUserSearch)}
                >
                  <User className="h-4 w-4 mr-2" />
                  Assign to someone...
                </button>
              )}
            </div>

                              {/* User Search Dropdown */}
                  {/* User Search Dropdown */}
                  {showUserSearch && (
                    <div className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-2xl nuclear-white-bg dropdown-content" style={{ 
                      backgroundColor: '#ffffff !important', 
                      opacity: 1, 
                      background: '#ffffff !important',
                      mixBlendMode: 'normal',
                      position: 'absolute',
                      zIndex: 50,
                      width: '100%',
                      marginTop: '4px',
                      border: '2px solid #d1d5db',
                      borderRadius: '8px',
                      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                    }}>

                      <div className="p-3 border-b-2 border-gray-200 bg-gray-50">
                        <div className="relative">
                          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                          <Input
                            id="userSearch"
                            name="userSearch"
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      
                                            {/* Users List with Native Scrollbar */}
                      <div className="max-h-60 overflow-y-auto bg-white nuclear-white-bg" style={{
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#d1d5db #f3f4f6'
                      }}>
                        <div className="p-2 bg-white nuclear-white-bg">
                          {usersLoading ? (
                            <div className="flex items-center justify-center py-8 bg-white nuclear-white-bg">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                              <span className="ml-2 text-gray-500">Loading users...</span>
                            </div>
                          ) : filteredUsers.length > 0 ? (
                            filteredUsers.map((user) => (
                              <div
                                key={user.id}
                                className="flex items-center gap-3 p-3 hover:bg-blue-50 rounded-lg cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors bg-white nuclear-white-bg"
                                onClick={() => handleUserSelect(user.id)}
                              >
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="bg-blue-100 text-blue-800">
                                    {user.full_name?.charAt(0) || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 nuclear-white-bg">
                                  <p className="font-medium text-gray-900">{user.full_name}</p>
                                  <p className="text-sm text-gray-600">{user.role}</p>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-6 bg-white nuclear-white-bg">
                              <p className="text-gray-500 mb-2">No users available</p>
                              <p className="text-xs text-gray-400">Please check your connection or try again</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
            </div>
          </PermissionGuard>

          {/* Form Actions */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !formData.title.trim()}>
              {isLoading ? 'Creating...' : initialData ? 'Update Request' : 'Create Request'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RequestForm; 