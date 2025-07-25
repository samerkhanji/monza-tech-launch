import React from 'react';
import { Badge } from '@/components/ui/badge';
import type { NewCarArrival } from '../types';

interface StatusBadgeProps {
  status: NewCarArrival['status'];
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStatusConfig = (status: NewCarArrival['status']) => {
    switch (status) {
      case 'arrived':
        return {
          label: 'Arrived',
          className: 'bg-monza-yellow/20 text-monza-black border-monza-yellow/40'
        };
      case 'taken_to_garage':
        return {
          label: 'In Garage',
          className: 'bg-monza-gray/15 text-monza-gray border-monza-gray/30'
        };
      case 'ready_for_inventory':
        return {
          label: 'Ready for Inventory',
          className: 'bg-monza-yellow/15 text-monza-black border-monza-yellow/30'
        };
      default:
        return {
          label: status,
          className: 'bg-monza-gray/10 text-monza-gray border-monza-gray/20'
        };
    }
  };

  const config = getStatusConfig(status);
  
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
};
