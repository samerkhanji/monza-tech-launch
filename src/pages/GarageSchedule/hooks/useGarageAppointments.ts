import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/types/supabase';
import { toast } from 'sonner';

type GarageAppointment = Database['public']['Tables']['garage_appointments']['Row'];
type InsertGarageAppointment = Database['public']['Tables']['garage_appointments']['Insert'];
type UpdateGarageAppointment = Database['public']['Tables']['garage_appointments']['Update'];

export const useGarageAppointments = () => {
  const queryClient = useQueryClient();

  // Fetch all garage appointments
  const { data: appointments, isLoading, error } = useQuery<GarageAppointment[], Error>({
    queryKey: ['garageAppointments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('garage_appointments')
        .select('*'); // We will likely want to join with cars and technicians later
      if (error) throw error;
      return data;
    },
  });

  // Mutation to add a new appointment
  const addAppointmentMutation = useMutation<GarageAppointment, Error, InsertGarageAppointment>({
    mutationFn: async (newAppointment) => {
      const { data, error } = await supabase
        .from('garage_appointments')
        .insert(newAppointment)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['garageAppointments'] });
      toast.success('Appointment added successfully');
    },
    onError: (error) => {
      toast.error(`Failed to add appointment: ${error.message}`);
    },
  });

  // Mutation to update an existing appointment
  const updateAppointmentMutation = useMutation<GarageAppointment, Error, UpdateGarageAppointment>({
    mutationFn: async (updatedAppointment) => {
      if (!updatedAppointment.id) throw new Error('Appointment ID is required for updating');
      const { data, error } = await supabase
        .from('garage_appointments')
        .update(updatedAppointment)
        .eq('id', updatedAppointment.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['garageAppointments'] });
      toast.success('Appointment updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update appointment: ${error.message}`);
    },
  });

  // Mutation to delete an appointment
  const deleteAppointmentMutation = useMutation<void, Error, string>({
    mutationFn: async (appointmentId) => {
      const { error } = await supabase
        .from('garage_appointments')
        .delete()
        .eq('id', appointmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['garageAppointments'] });
      toast.success('Appointment deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete appointment: ${error.message}`);
    },
  });

  return {
    appointments,
    isLoading,
    error,
    addAppointment: addAppointmentMutation.mutate,
    updateAppointment: updateAppointmentMutation.mutate,
    deleteAppointment: deleteAppointmentMutation.mutate,
  };
}; 