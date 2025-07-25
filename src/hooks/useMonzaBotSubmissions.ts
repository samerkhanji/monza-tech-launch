
import { useState, useEffect } from 'react';
import { monzaBotFormService } from '@/services/monzaBotFormService';

export const useMonzaBotSubmissions = () => {
  const [pendingCount, setPendingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const loadPendingCount = async () => {
    try {
      const submissions = await monzaBotFormService.getPendingSubmissions();
      setPendingCount(submissions.length);
    } catch (error) {
      console.error('Error loading pending submissions count:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPendingCount();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(loadPendingCount, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    pendingCount,
    isLoading,
    refreshCount: loadPendingCount
  };
};
