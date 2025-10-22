import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getCarsByFloor, type Floor } from '@/services/cleanMoveCarService';

export function useCarsByFloor(floor: Floor) {
  const [cars, setCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const subscribed = useRef(false);

  const loadCars = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await getCarsByFloor(floor);
      setCars(data);
      
      console.log(`✅ Loaded ${data.length} cars for ${floor}`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load cars';
      console.error(`❌ Error loading cars for ${floor}:`, errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Load cars on mount and when floor changes
  useEffect(() => {
    loadCars();
  }, [floor]);

  // Listen to centralized real-time updates
  useEffect(() => {
    const handleCarsChanged = (event: CustomEvent) => {
      const { eventType, record } = event.detail;
      
      // Only refresh if the change affects our floor
      if (record && record.current_floor === floor) {
        console.log(`🔌 Cars changed for ${floor}:`, eventType);
        loadCars();
      }
    };

    // Listen to the centralized real-time event
    window.addEventListener('carsChanged', handleCarsChanged as EventListener);

    return () => {
      window.removeEventListener('carsChanged', handleCarsChanged as EventListener);
    };
  }, [floor]);

  return {
    cars,
    loading,
    error,
    refetch: loadCars
  };
}
