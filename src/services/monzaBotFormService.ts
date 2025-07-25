
import { supabase } from '@/integrations/supabase/client';

export interface MonzaBotFormSubmission {
  id?: string;
  user_id: string;
  form_type: string;
  form_data: any;
  target_table: string;
  extracted_from?: string;
  monzabot_confidence?: number;
  status: 'pending' | 'approved' | 'rejected';
  user_notes?: string;
  created_at?: string;
  approved_at?: string;
  submitted_at?: string;
}

export const monzaBotFormService = {
  async createSubmission(submission: Omit<MonzaBotFormSubmission, 'id' | 'created_at'>): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('monzabot_form_submissions')
        .insert([submission])
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error creating MonzaBot submission:', error);
      return null;
    }
  },

  async getPendingSubmissions(): Promise<MonzaBotFormSubmission[]> {
    try {
      const { data, error } = await supabase
        .from('monzabot_form_submissions')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Cast the data to ensure proper typing
      return (data || []).map(item => ({
        ...item,
        status: item.status as 'pending' | 'approved' | 'rejected'
      }));
    } catch (error) {
      console.error('Error fetching pending submissions:', error);
      return [];
    }
  },

  async approveAndSubmit(submissionId: string, userNotes?: string): Promise<boolean> {
    try {
      // Get the submission
      const { data: submission, error: fetchError } = await supabase
        .from('monzabot_form_submissions')
        .select('*')
        .eq('id', submissionId)
        .single();

      if (fetchError) throw fetchError;

      // Insert into target table using dynamic table name with type assertion
      const { error: insertError } = await (supabase as any)
        .from(submission.target_table)
        .insert([submission.form_data]);

      if (insertError) throw insertError;

      // Update submission status
      const { error: updateError } = await supabase
        .from('monzabot_form_submissions')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          user_notes: userNotes
        })
        .eq('id', submissionId);

      if (updateError) throw updateError;
      return true;
    } catch (error) {
      console.error('Error approving submission:', error);
      return false;
    }
  },

  async rejectSubmission(submissionId: string, userNotes?: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('monzabot_form_submissions')
        .update({
          status: 'rejected',
          user_notes: userNotes
        })
        .eq('id', submissionId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error rejecting submission:', error);
      return false;
    }
  },

  async updateFormData(submissionId: string, newFormData: any, userNotes?: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('monzabot_form_submissions')
        .update({
          form_data: newFormData,
          user_notes: userNotes
        })
        .eq('id', submissionId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating form data:', error);
      return false;
    }
  }
};
