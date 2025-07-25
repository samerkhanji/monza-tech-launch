
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface RequestCounterBadgeProps {
  count?: number;
  className?: string;
}

const RequestCounterBadge: React.FC<RequestCounterBadgeProps> = ({ 
  count = 0, 
  className = "" 
}) => {
  if (count === 0) return null;

  return (
    <Badge 
      variant="destructive" 
      className={`ml-2 px-1.5 py-0.5 text-xs min-w-[1.25rem] h-5 rounded-full flex items-center justify-center ${className}`}
    >
      {count > 99 ? '99+' : count}
    </Badge>
  );
};

export default RequestCounterBadge;
