import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { receiveOrderedCar } from '@/services/move-smart-api';
import { FLOOR_LABEL, type Floor } from '@/services/move-smart-helpers';
import { toast } from 'sonner';

interface ReceiveMenuItemsProps {
  orderedId: string;
  receiveTo?: Floor[];
}

export function ReceiveMenuItems({ 
  orderedId, 
  receiveTo = ['INVENTORY'] as Floor[] 
}: ReceiveMenuItemsProps) {
  const qc = useQueryClient();
  const [busy, setBusy] = React.useState<Floor | null>(null);

  return (
    <>
      {receiveTo.map((to) => (
        <div
          key={to}
          className="px-3 py-2 text-sm cursor-pointer hover:bg-accent"
          onClick={async () => {
            try {
              setBusy(to);
              await receiveOrderedCar(orderedId, to);

              // Refresh all live floors + ordered list
              (['INVENTORY','SHOWROOM_1','SHOWROOM_2','GARAGE'] as Floor[]).forEach(f =>
                qc.invalidateQueries({ queryKey: ['cars-by-floor', f] })
              );
              qc.invalidateQueries({ queryKey: ['ordered-cars'] });

              toast.success(`Received → ${FLOOR_LABEL[to]}`);
            } catch (e: any) {
              toast.error(e?.message ?? 'Receive failed');
            } finally {
              setBusy(null);
            }
          }}
        >
          {busy === to ? 'Receiving…' : `Receive → ${FLOOR_LABEL[to]}`}
        </div>
      ))}
    </>
  );
}
