import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { requestMessagingService, RequestWithMessages, CreateRequestData, RequestFilters } from '@/services/requestMessagingService';
import { logSupabaseError } from '@/utils/errorLogger';

export const useRequestData = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<RequestWithMessages[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<RequestFilters>({});

  useEffect(() => {
    if (user) {
      requestMessagingService.setCurrentUser(user);
      loadRequests();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadRequests();
    }
  }, [filters]);

  const loadRequests = async () => {
    try {
      setIsLoading(true);
      const data = await requestMessagingService.getRequests(filters);
      setRequests(data);
    } catch (error) {
      logSupabaseError('load requests', error, 'using empty state');
    } finally {
      setIsLoading(false);
    }
  };

  const createRequest = async (data: CreateRequestData) => {
    try {
      const newRequest = await requestMessagingService.createRequest(data);
      await loadRequests(); // Refresh the list
      return newRequest;
    } catch (error) {
      console.error('Error creating request:', error);
      throw error;
    }
  };

  const updateRequest = async (id: string, updates: Partial<RequestWithMessages>) => {
    try {
      const updatedRequest = await requestMessagingService.updateRequest(id, updates);
      setRequests(prev => 
        prev.map(req => req.id === id ? { ...req, ...updatedRequest } : req)
      );
      return updatedRequest;
    } catch (error) {
      console.error('Error updating request:', error);
      throw error;
    }
  };

  const deleteRequest = async (id: string) => {
    try {
      await requestMessagingService.deleteRequest(id);
      setRequests(prev => prev.filter(req => req.id !== id));
    } catch (error) {
      console.error('Error deleting request:', error);
      throw error;
    }
  };

  const refreshRequests = () => {
    loadRequests();
  };

  return {
    requests,
    isLoading,
    filters,
    setFilters,
    createRequest,
    updateRequest,
    deleteRequest,
    refreshRequests
  };
}; 