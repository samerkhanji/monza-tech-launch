import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type Car = Tables<'cars'>;

interface UseCarInventoryReturn {
  cars: Car[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  addCar: (car: Omit<Car, 'id' | 'created_at' | 'updated_at'>) => Promise<Car | null>;
  updateCar: (id: string, updates: Partial<Car>) => Promise<Car | null>;
  deleteCar: (id: string) => Promise<boolean>;
}

export function useCarInventory(): UseCarInventoryReturn {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCars = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('cars')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setCars(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch cars');
      console.error('Error fetching cars:', err);
    } finally {
      setLoading(false);
    }
  };

  const addCar = async (carData: Omit<Car, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error: insertError } = await supabase
        .from('cars')
        .insert([carData])
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      setCars(prev => [data, ...prev]);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add car');
      console.error('Error adding car:', err);
      return null;
    }
  };

  const updateCar = async (id: string, updates: Partial<Car>) => {
    try {
      const { data, error: updateError } = await supabase
        .from('cars')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      setCars(prev => prev.map(car => car.id === id ? data : car));
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update car');
      console.error('Error updating car:', err);
      return null;
    }
  };

  const deleteCar = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('cars')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      setCars(prev => prev.filter(car => car.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete car');
      console.error('Error deleting car:', err);
      return false;
    }
  };

  const refetch = async () => {
    await fetchCars();
  };

  useEffect(() => {
    fetchCars();
  }, []);

  return {
    cars,
    loading,
    error,
    refetch,
    addCar,
    updateCar,
    deleteCar
  };
} 