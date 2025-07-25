import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { apiKeysAPI } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Key, Plus, Trash2, Eye, EyeOff, Copy, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

const ApiKeyManagement = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newKeyName, setNewKeyName] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const { data: apiKeys, isLoading } = useQuery({
    queryKey: ['api-keys'],
    queryFn: apiKeysAPI.getAll,
  });

  const createKeyMutation = useMutation({
    mutationFn: (keyName: string) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      return apiKeysAPI.create(keyName, user.id);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      setIsCreateDialogOpen(false);
      setNewKeyName('');
      toast.success('API key created successfully!');
      console.log('Created API key:', data);
    },
    onError: (error) => {
      console.error('Error creating API key:', error);
      toast.error(`Failed to create API key: ${error.message}`);
    },
  });

  const deleteKeyMutation = useMutation({
    mutationFn: apiKeysAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast.success('API key deleted successfully!');
    },
    onError: (error) => {
      console.error('Error deleting API key:', error);
      toast.error('Failed to delete API key');
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => 
      apiKeysAPI.toggleStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast.success('API key status updated!');
    },
    onError: (error) => {
      console.error('Error updating API key status:', error);
      toast.error('Failed to update API key status');
    },
  });

  const handleCreateKey = () => {
    if (!newKeyName.trim()) {
      toast.error('Please enter a name for the API key');
      return;
    }
    
    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }
    
    console.log('Creating API key for user:', user.id, 'with name:', newKeyName);
    createKeyMutation.mutate(newKeyName.trim());
  };

  const toggleKeyVisibility = (keyId: string) => {
    const newVisibleKeys = new Set(visibleKeys);
    if (newVisibleKeys.has(keyId)) {
      newVisibleKeys.delete(keyId);
    } else {
      newVisibleKeys.add(keyId);
    }
    setVisibleKeys(newVisibleKeys);
  };

  const copyToClipboard = async (text: string, keyId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(keyId);
      toast.success('API key copied to clipboard!');
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (error) {
      toast.error('Failed to copy API key');
    }
  };

  const maskApiKey = (key: string) => {
    const prefix = key.substring(0, 7); // "mk_" + first 4 chars
    const suffix = key.substring(key.length - 8);
    return `${prefix}${'*'.repeat(32)}${suffix}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-monza-yellow"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Key className="h-6 w-6 text-monza-yellow" />
          <h1 className="text-3xl font-bold text-monza-black">API Key Management</h1>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-monza-yellow hover:bg-monza-yellow/90 text-monza-black">
              <Plus className="h-4 w-4 mr-2" />
              Create API Key
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New API Key</DialogTitle>
              <DialogDescription>
                Create a new API key to access the Monza Automotive API. Give it a descriptive name to help you identify its purpose.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="keyName">API Key Name</Label>
                <Input
                  id="keyName"
                  placeholder="e.g., Mobile App, Analytics Dashboard"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateKey}
                disabled={createKeyMutation.isPending}
                className="bg-monza-yellow hover:bg-monza-yellow/90 text-monza-black"
              >
                {createKeyMutation.isPending ? 'Creating...' : 'Create API Key'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your API Keys</CardTitle>
          <CardDescription>
            Manage your API keys for accessing the Monza Automotive API. Keep your keys secure and never share them publicly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!apiKeys || apiKeys.length === 0 ? (
            <div className="text-center py-8">
              <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No API Keys</h3>
              <p className="text-gray-600 mb-4">Create your first API key to start using the API.</p>
              <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-monza-yellow hover:bg-monza-yellow/90 text-monza-black">
                <Plus className="h-4 w-4 mr-2" />
                Create API Key
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>API Key</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell className="font-medium">{key.key_name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">
                          {visibleKeys.has(key.id) ? key.api_key : maskApiKey(key.api_key)}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleKeyVisibility(key.id)}
                        >
                          {visibleKeys.has(key.id) ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(key.api_key, key.id)}
                        >
                          {copiedKey === key.id ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={key.is_active ? "default" : "secondary"}>
                        {key.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(key.created_at), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      {key.last_used_at 
                        ? format(new Date(key.last_used_at), 'MMM dd, yyyy') 
                        : 'Never'
                      }
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleStatusMutation.mutate({ 
                            id: key.id, 
                            isActive: !key.is_active 
                          })}
                          disabled={toggleStatusMutation.isPending}
                        >
                          {key.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteKeyMutation.mutate(key.id)}
                          disabled={deleteKeyMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security Best Practices</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• Never share your API keys or commit them to version control</li>
            <li>• Use environment variables to store API keys in your applications</li>
            <li>• Regularly rotate your API keys for enhanced security</li>
            <li>• Deactivate keys that are no longer needed</li>
            <li>• Monitor API key usage and watch for unusual activity</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApiKeyManagement;
