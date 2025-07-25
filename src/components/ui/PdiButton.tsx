import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface PdiButtonProps {
  car: {
    id: string;
    vinNumber?: string;
    pdiCompleted?: boolean;
    pdiDate?: string;
    status?: string;
    deliveryDate?: string;
  };
  onPdiClick: (car: any) => void;
  variant?: 'button' | 'badge';
  size?: 'sm' | 'lg' | 'default';
}

export const PdiButton: React.FC<PdiButtonProps> = ({ 
  car, 
  onPdiClick, 
  variant = 'button',
  size = 'sm' 
}) => {
  const isPdiCompleted = car.pdiCompleted;
  const isReservedOrSold = car.status === 'reserved' || car.status === 'sold';
  const hasDeliveryDate = car.deliveryDate;
  const isUrgent = isReservedOrSold && hasDeliveryDate && !isPdiCompleted;

  if (variant === 'badge') {
    return (
      <Badge 
        variant={isPdiCompleted ? 'default' : (isUrgent ? 'destructive' : 'secondary')}
        className={`cursor-pointer hover:opacity-80 transition-opacity ${
          isPdiCompleted ? 'bg-green-600 text-white' : 
          isUrgent ? 'bg-red-600 text-white' : 
          'bg-yellow-600 text-white'
        }`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onPdiClick(car);
        }}
      >
        {isPdiCompleted ? (
          <>
            <span className="mr-1 text-lg">☺</span>
            Complete
          </>
        ) : isUrgent ? (
          <>
            <span className="mr-1 text-lg">☹</span>
            Urgent
          </>
        ) : (
          <>
            <span className="mr-1 text-lg">☹</span>
            Pending
          </>
        )}
      </Badge>
    );
  }

  return (
    <Button
      size={size}
      variant={isPdiCompleted ? 'default' : (isUrgent ? 'destructive' : 'outline')}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onPdiClick(car);
      }}
      className={`
        ${isPdiCompleted 
          ? 'bg-green-600 hover:bg-green-700 text-white' 
          : isUrgent 
            ? 'bg-red-600 hover:bg-red-700 text-white border-red-600'
            : 'border-yellow-600 text-yellow-600 hover:bg-yellow-50'
        }
        transition-all duration-200
      `}
    >
      {isPdiCompleted ? (
        <>
          <span className="mr-1 text-lg">☺</span>
          Complete
        </>
      ) : isUrgent ? (
        <>
          <span className="mr-1 text-lg">☹</span>
          Required
        </>
      ) : (
        <>
          <span className="mr-1 text-lg">☹</span>
          Start PDI
        </>
      )}
    </Button>
  );
};

export const getPdiStatusVariant = (completed?: boolean, isUrgent?: boolean) => {
  if (completed) return 'default';
  if (isUrgent) return 'destructive';
  return 'secondary';
};

export default PdiButton; 