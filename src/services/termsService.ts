
import { supabase } from '@/integrations/supabase/client';

export interface TermsAgreement {
  id: string;
  version: string;
  title: string;
  content: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserAgreement {
  id: string;
  user_id: string;
  terms_version: string;
  agreed_at: string;
  ip_address?: string;
  user_agent?: string;
}

export interface EmployeeAgreementSummary {
  user_id: string;
  user_name: string;
  user_email: string;
  user_role: string;
  department: string;
  terms_version: string;
  agreed_at: string;
  ip_address?: string;
  user_agent?: string;
}

export const termsService = {
  // Get the current active terms
  async getCurrentTerms(): Promise<TermsAgreement | null> {
    try {
      const { data, error } = await supabase
        .from('terms_agreements')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching terms:', error);
        return null;
      }

      return data?.[0] || null;
    } catch (error) {
      console.error('Error in getCurrentTerms:', error);
      return null;
    }
  },

  // Check if user has agreed to current terms
  async hasUserAgreedToCurrentTerms(userId: string): Promise<boolean> {
    try {
      const currentTerms = await this.getCurrentTerms();
      if (!currentTerms) return true; // If no terms exist, consider as agreed

      const { data, error } = await supabase
        .from('user_agreements')
        .select('*')
        .eq('user_id', userId)
        .eq('terms_version', currentTerms.version)
        .limit(1);

      if (error) {
        console.error('Error checking user agreement:', error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error('Error in hasUserAgreedToCurrentTerms:', error);
      return false;
    }
  },

  // Record user agreement with enhanced tracking
  async recordUserAgreement(userId: string, termsVersion: string): Promise<boolean> {
    try {
      const userAgent = navigator.userAgent;
      
      // Get user's IP (this is a simplified approach)
      let ipAddress = '';
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        ipAddress = data.ip;
      } catch (error) {
        console.log('Could not fetch IP address:', error);
      }

      const { error } = await supabase
        .from('user_agreements')
        .insert({
          user_id: userId,
          terms_version: termsVersion,
          ip_address: ipAddress,
          user_agent: userAgent
        });

      if (error) {
        console.error('Error recording user agreement:', error);
        return false;
      }

      // Create notification for owners about the new agreement
      await this.notifyOwnersOfAgreement(userId, termsVersion, ipAddress);

      return true;
    } catch (error) {
      console.error('Error in recordUserAgreement:', error);
      return false;
    }
  },

  // Get employee agreements summary for owners
  async getEmployeeAgreementsSummary(): Promise<EmployeeAgreementSummary[]> {
    try {
      const { data, error } = await supabase
        .from('user_agreements')
        .select(`
          user_id,
          terms_version,
          agreed_at,
          ip_address,
          user_agent
        `)
        .order('agreed_at', { ascending: false });

      if (error) {
        console.error('Error fetching agreements summary:', error);
        return [];
      }

      // For demo purposes, we'll simulate user data lookup
      // In a real implementation, you'd join with a users table
      return data?.map(agreement => ({
        ...agreement,
        user_name: 'Employee Name', // Would come from users table
        user_email: 'employee@monza.com', // Would come from users table
        user_role: 'Employee', // Would come from users table
        department: 'Various' // Would come from users table
      })) || [];
    } catch (error) {
      console.error('Error in getEmployeeAgreementsSummary:', error);
      return [];
    }
  },

  // Notify owners of new agreement
  async notifyOwnersOfAgreement(userId: string, termsVersion: string, ipAddress?: string): Promise<void> {
    try {
      // Create notification for owners
      const { error } = await supabase
        .from('notifications')
        .insert({
          title: 'New Terms Agreement Recorded',
          message: `Employee has accepted Terms & Conditions v${termsVersion}`,
          type: 'terms_agreement',
          related_entity_type: 'user_agreement',
          related_entity_id: userId
        });

      if (error) {
        console.error('Error creating notification:', error);
      }
    } catch (error) {
      console.error('Error notifying owners:', error);
    }
  },

  // Get agreements by department for owners
  async getAgreementsByDepartment(): Promise<Record<string, EmployeeAgreementSummary[]>> {
    try {
      const agreements = await this.getEmployeeAgreementsSummary();
      
      return agreements.reduce((acc, agreement) => {
        const department = agreement.department || 'Unknown';
        if (!acc[department]) {
          acc[department] = [];
        }
        acc[department].push(agreement);
        return acc;
      }, {} as Record<string, EmployeeAgreementSummary[]>);
    } catch (error) {
      console.error('Error in getAgreementsByDepartment:', error);
      return {};
    }
  }
};
