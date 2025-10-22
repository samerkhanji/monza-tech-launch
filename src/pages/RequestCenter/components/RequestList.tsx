
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  MessageCircle,
  User,
  Calendar,
  Clock
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { RequestWithMessages, RequestFilters } from '@/services/requestMessagingService';
import { formatDistanceToNow } from 'date-fns';

interface RequestListProps {
  requests: RequestWithMessages[];
  isLoading: boolean;
  filters: RequestFilters;
  onFiltersChange: (filters: RequestFilters) => void;
  onRequestSelect: (request: RequestWithMessages) => void;
  onRequestUpdate: (id: string, updates: Partial<RequestWithMessages>) => Promise<void>;
  onRequestDelete: (id: string) => Promise<void>;
  getPriorityColor: (priority: string) => string;
  getStatusColor: (status: string) => string;
}

const RequestList: React.FC<RequestListProps> = ({
  requests,
  isLoading,
  filters,
  onFiltersChange,
  onRequestSelect,
  onRequestUpdate,
  onRequestDelete,
  getPriorityColor,
  getStatusColor
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         request.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleStatusChange = async (requestId: string, newStatus: string) => {
    try {
      await onRequestUpdate(requestId, { status: newStatus });
    } catch (error) {
      console.error('Error updating request status:', error);
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (confirm('Are you sure you want to delete this request?')) {
      try {
        await onRequestDelete(requestId);
      } catch (error) {
        console.error('Error deleting request:', error);
      }
    }
  };

  const getStatusOptions = () => [
    { value: 'open', label: 'Open' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'done', label: 'Done' },
    { value: 'pending_review', label: 'Pending Review' }
  ];

  const getPriorityOptions = () => [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' }
  ];

  const getBorderByPriority = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-red-400 bg-red-50';
      case 'high': return 'border-orange-400 bg-orange-50';
      case 'medium': return 'border-yellow-300 bg-yellow-50';
      case 'low': return 'border-gray-200 bg-gray-50';
      default: return 'border-gray-200 bg-white';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading requests...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search requests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>

            {/* Status Filter */}
            <Select
              value={filters.status || 'all'}
              onValueChange={(value) => onFiltersChange({ ...filters, status: value === 'all' ? undefined : value })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {getStatusOptions().map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Priority Filter */}
            <Select
              value={filters.priority || 'all'}
              onValueChange={(value) => onFiltersChange({ ...filters, priority: value === 'all' ? undefined : value })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                {getPriorityOptions().map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Assigned Filter */}
            <Input
              placeholder="Assigned User ID"
              value={filters.assigned_to || ''}
              onChange={(e) => onFiltersChange({ ...filters, assigned_to: e.target.value || undefined })}
            />

            {/* Clear Filters */}
            <Button
              variant="outline"
              onClick={() => {
                onFiltersChange({});
                setSearchQuery('');
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Requests ({filteredRequests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRequests.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No requests found</h3>
              <p className="text-muted-foreground">
                {requests.length === 0 ? 'No requests have been created yet.' : 'No requests match your filters.'}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {filteredRequests.map((request) => (
                  <div
                    key={request.id}
                    className={`p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors ${getBorderByPriority(request.priority)}`}
                    onClick={() => onRequestSelect(request)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{request.title}</h3>
                          <Badge className={getPriorityColor(request.priority)}>
                            {request.priority}
                          </Badge>
                          <Badge className={getStatusColor(request.status)}>
                            {request.status}
                          </Badge>
                          {request.type && (
                            <Badge variant="secondary">{request.type}</Badge>
                          )}
                        </div>
                        {request.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {request.description}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            <span>Created by {request.created_by_user?.full_name}</span>
                          </div>
                          {request.assigned_to_user && (
                            <div className="flex items-center gap-1">
                              <Avatar className="h-4 w-4">
                                <AvatarFallback className="text-xs">
                                  {request.assigned_to_user.full_name?.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <span>Assigned to {request.assigned_to_user.full_name}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}</span>
                          </div>
                          {request.messages && request.messages.length > 0 && (
                            <div className="flex items-center gap-1">
                              <MessageCircle className="h-4 w-4" />
                              <span>{request.messages.length} messages</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onRequestSelect(request)}>
                            <MessageCircle className="h-4 w-4 mr-2" />
                            View Messages
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(request.id, 'in_progress')}>
                            <Edit className="h-4 w-4 mr-2" />
                            Mark In Progress
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(request.id, 'done')}>
                            <Edit className="h-4 w-4 mr-2" />
                            Mark Done
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteRequest(request.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RequestList;
