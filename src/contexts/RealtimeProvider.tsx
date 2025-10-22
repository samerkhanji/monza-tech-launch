import React, { createContext, useContext, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RealtimeContextType {
  touch: () => void;
}

const RealtimeContext = createContext<RealtimeContextType>({ touch: () => {} });

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    console.log('🔌 Setting up centralized real-time subscription...');
    
    const channel = supabase
      .channel('cars-root')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'car_inventory'
        },
        (payload) => {
          console.log('🔌 Centralized real-time change detected:', payload);
          
          // Dispatch a custom event that components can listen to
          window.dispatchEvent(new CustomEvent('carsChanged', { 
            detail: { 
              eventType: payload.eventType,
              table: payload.table,
              record: payload.new || payload.old
            } 
          }));
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 Cleaning up centralized real-time subscription...');
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <RealtimeContext.Provider value={{ touch: () => {} }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  return useContext(RealtimeContext);
}
