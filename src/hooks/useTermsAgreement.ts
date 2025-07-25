import { useState, useEffect, useCallback, useMemo } from 'react';
import { termsService, TermsAgreement } from '@/services/termsService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useTermsAgreement = () => {
  const { user } = useAuth();
  const [terms, setTerms] = useState<TermsAgreement | null>(null);
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkTermsAgreement = async () => {
      if (!user) {
        setIsChecking(false);
        return;
      }

      try {
        setIsChecking(true);
        
        // Get current terms
        const currentTerms = await termsService.getCurrentTerms();
        if (!currentTerms) {
          setIsChecking(false);
          return;
        }

        setTerms(currentTerms);

        // Check if user has agreed to current terms
        const hasAgreed = await termsService.hasUserAgreedToCurrentTerms(user.id);
        
        if (!hasAgreed) {
          setShowTermsDialog(true);
        }
      } catch (error) {
        console.error('Error checking terms agreement:', error);
        toast.error('Error checking terms agreement');
      } finally {
        setIsChecking(false);
      }
    };

    checkTermsAgreement();
  }, [user]);

  const handleAgreeToTerms = useCallback(async () => {
    if (!user || !terms) {
      toast.error('Missing user or terms information');
      return;
    }

    try {
      setIsLoading(true);
      
      const success = await termsService.recordUserAgreement(user.id, terms.version);
      
      if (success) {
        setShowTermsDialog(false);
        toast.success('Terms agreement recorded successfully');
      } else {
        toast.error('Failed to record terms agreement. Please try again.');
      }
    } catch (error) {
      console.error('Error recording terms agreement:', error);
      toast.error('Error recording terms agreement. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [user, terms]);

  const handleDeclineTerms = useCallback(() => {
    // User declined terms, show warning and log them out
    toast.error('You must accept the terms to continue using the system');
    setTimeout(() => {
      window.location.href = '/login';
    }, 2000);
  }, []);

  const memoizedReturn = useMemo(() => ({
    terms,
    showTermsDialog,
    isLoading,
    isChecking,
    handleAgreeToTerms,
    handleDeclineTerms
  }), [terms, showTermsDialog, isLoading, isChecking, handleAgreeToTerms, handleDeclineTerms]);

  return memoizedReturn;
};
