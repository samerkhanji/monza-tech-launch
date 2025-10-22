import * as React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { allowedDestinations, FLOOR_LABEL, type Floor, type TableContext } from '@/services/move-smart-helpers';
import { supabase } from '@/integrations/supabase/client';

async function moveLiveCar(carId: string, to: Floor) {
  console.log('🚗 Moving car:', carId, 'to:', to);
  
  // Skip RPC calls for now and use direct database update
  // The RPC functions have incompatible signatures with the car_inventory table
  console.log('🔄 Using direct update on car_inventory table...');
  
  const { data, error } = await supabase
    .from('car_inventory')
    .update({ 
      current_floor: to,  // Use current_floor field for ShowroomFloor1
      updated_at: new Date().toISOString()
    })
    .eq('id', carId)
    .select()
    .single();
    
  if (error) {
    console.error('❌ Database update failed:', error);
    throw error;
  }

  console.log('✅ Car moved successfully:', data);
  return data;
}

export function MoveMenuItemsLive({
  carId,
  currentFloor,
  tableContext,
}: {
  carId: string;
  currentFloor: Floor;
  tableContext: TableContext; // 'FLOOR_1'|'FLOOR_2'|'CAR_INVENTORY'|'GARAGE_INVENTORY'|'SCHEDULE'
}) {
  const qc = useQueryClient();
  const [busy, setBusy] = React.useState<Floor | null>(null);

  const options = allowedDestinations(tableContext).filter(f => f !== currentFloor);

  if (!options.length) {
    return <div className="px-3 py-2 text-sm text-muted-foreground">No valid destinations</div>;
  }

  return (
    <>
      {options.map((to) => (
        <div
          key={to}
          className="px-3 py-2 text-sm cursor-pointer hover:bg-accent"
          onClick={async () => {
            console.log('🎯 Move car clicked:', { carId, from: currentFloor, to, tableContext });
            try {
              setBusy(to);
              console.log('⏳ Setting busy state for:', to);
              const result = await moveLiveCar(carId, to);
              console.log('✅ Move operation completed:', result);

              // Invalidate multiple query patterns to refresh all car lists
              console.log('🔄 Invalidating queries for floors:', currentFloor, 'and', to);
              
              // Invalidate car queries with multiple patterns
              [currentFloor, to].forEach(f => {
                qc.invalidateQueries({ queryKey: ['cars-by-floor', f] });
                qc.invalidateQueries({ queryKey: ['cars', f] });
                qc.invalidateQueries({ queryKey: ['car-inventory'] });
                qc.invalidateQueries({ queryKey: ['showroom-cars'] });
                qc.invalidateQueries({ queryKey: ['garage-cars'] });
                qc.invalidateQueries({ queryKey: ['cleanMoveCarService', f] });
              });
              
              // Force refresh of all car-related queries
              qc.invalidateQueries({ queryKey: ['cars'] });
              qc.invalidateQueries({ queryKey: ['cleanMoveCarService'] });
              
              // Trigger immediate page reload to refresh all car lists
              console.log('🔄 Triggering page reload to refresh car lists...');
              setTimeout(() => {
                window.location.reload();
              }, 300); // Quick refresh for better user experience

              toast.success(`Moved → ${FLOOR_LABEL[to]}`);
              console.log('🎉 Move completed successfully with toast notification');
            } catch (e: any) {
              console.error('❌ Move operation failed:', e);
              console.error('Error details:', { message: e?.message, code: e?.code, details: e?.details });
              toast.error(e?.message ?? 'Move failed');
            } finally {
              setBusy(null);
              console.log('🔄 Cleared busy state');
            }
          }}
        >
          {busy === to ? 'Moving…' : FLOOR_LABEL[to]}
        </div>
      ))}
    </>
  );
}