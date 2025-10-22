import React from 'react';
import type { OrderedCar } from '@/pages/CarOrders/types';
import PortalActionDropdown from '@/components/ui/PortalActionDropdown';

interface CarOrdersTableActionsProps {
  car: OrderedCar;
  onViewDetails: () => void;
  onEdit: () => void;
  onCancel: () => void;
  onStatusUpdate: (status: 'pending' | 'in_transit' | 'arrived') => void;
}

const CarOrdersTableActions: React.FC<CarOrdersTableActionsProps> = ({
  car,
  onViewDetails,
  onEdit,
  onCancel,
  onStatusUpdate,
}) => {
  return (
    <PortalActionDropdown
      options={[
        { value: 'view', label: 'View Details' },
        { value: 'edit', label: 'Edit Order' },
        { value: 'cancel', label: 'Cancel Order' },
        ...(car.status !== 'pending' ? [{ value: 'pending', label: 'Mark as Pending' }] : []),
        ...(car.status !== 'in_transit' ? [{ value: 'in_transit', label: 'Mark as In Transit' }] : []),
        ...(car.status !== 'arrived' ? [{ value: 'arrived', label: 'Mark as Arrived' }] : [])
      ]}
      onAction={(action) => {
        if (action === 'view') onViewDetails();
        else if (action === 'edit') onEdit();
        else if (action === 'cancel') onCancel();
        else if (action === 'pending') onStatusUpdate('pending');
        else if (action === 'in_transit') onStatusUpdate('in_transit');
        else if (action === 'arrived') onStatusUpdate('arrived');
      }}
      id={`actions-order-${car.id}`}
      ariaLabel={`Actions for order ${car.id}`}
    />
  );
};

export default CarOrdersTableActions; 