import * as React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { FLOOR_LABEL, type Floor } from '@/services/move-smart-helpers';

// EXACT options you requested for Ordered Cars:
const ORDERED_DESTS: Floor[] = [
  'SHOWROOM_1',
  'SHOWROOM_2',
  'CAR_INVENTORY',
  'GARAGE_INVENTORY',
  'SCHEDULE',
];

async function moveFromOrdered(orderedId: string, to: Floor) {
  const { data, error } = await supabase.rpc('receive_ordered_car', {
    p_ordered_id: orderedId,
    p_to: to,
  });
  if (error) throw error;
  return data; // returns the live car row in public.car_inventory
}

export function MoveMenuItemsOrdered({ orderedId }: { orderedId: string }) {
  const qc = useQueryClient();
  const [busy, setBusy] = React.useState<Floor | null>(null);

  return (
    <>
      {ORDERED_DESTS.map((to) => (
        <div
          key={to}
          className="px-3 py-2 text-sm cursor-pointer hover:bg-accent"
          onClick={async () => {
            try {
              setBusy(to);
              await moveFromOrdered(orderedId, to);

              // Invalidate all live lists + ordered list
              (['SHOWROOM_1','SHOWROOM_2','CAR_INVENTORY','GARAGE_INVENTORY','SCHEDULE'] as Floor[])
                .forEach(f => qc.invalidateQueries({ queryKey: ['cars-by-floor', f] }));
              qc.invalidateQueries({ queryKey: ['ordered-cars'] });

              toast.success(`Moved → ${FLOOR_LABEL[to]}`);
            } catch (e: any) {
              toast.error(e?.message ?? 'Move failed');
            } finally {
              setBusy(null);
            }
          }}
        >
          {busy === to ? 'Moving…' : FLOOR_LABEL[to]}
        </div>
      ))}
    </>
  );
}
