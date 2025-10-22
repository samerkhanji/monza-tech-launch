import React from 'react';
import { useWarrantyDialog } from '@/components/WarrantyLifeDialog';

interface StandardWarrantyButtonProps {
  car: {
    vinNumber?: string;
    warranty_start_date?: string;
    warranty_end_date?: string;
  };
}

const StandardWarrantyButton: React.FC<StandardWarrantyButtonProps> = ({ car }) => {
  const { openWarrantyDialog } = useWarrantyDialog();
  
  // Get warranty dates from the new fields
  const warrantyStartDate = car.warranty_start_date;
  const warrantyEndDate = car.warranty_end_date;
  
  const endDate = warrantyEndDate ? new Date(warrantyEndDate) : null;
  const isValid = endDate && !isNaN(endDate.getTime());
  const daysRemaining = isValid ? Math.max(0, Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : null;
  
  const getLabel = () => {
    if (!isValid) return "Not set";
    if (daysRemaining === 0) return "Expires today";
    if (daysRemaining === 1) return "Expires tomorrow";
    return `Expires ${endDate.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}`;
  };
  
  const getUrgencyStyle = () => {
    if (!isValid) return "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200";
    if (daysRemaining === 0) return "bg-red-100 text-red-700 border-red-200 hover:bg-red-200";
    if (daysRemaining <= 30) return "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200";
    return "bg-green-100 text-green-800 border-green-200 hover:bg-green-200";
  };
  
  const getTooltip = () => {
    if (!isValid) return "Click to set warranty dates";
    if (daysRemaining === 0) return `Expires today (${endDate.toLocaleDateString()})`;
    if (daysRemaining === 1) return `Expires tomorrow (${endDate.toLocaleDateString()})`;
    return `Expires on ${endDate.toLocaleDateString()} (${daysRemaining} days remaining)`;
  };
  
  return (
    <td className="p-4 align-middle text-sm text-gray-900 whitespace-nowrap border-b border-gray-200">
      <button 
        className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium transition-colors ${getUrgencyStyle()}`}
        onClick={() => openWarrantyDialog(car.vinNumber || '')}
        title={getTooltip()}
      >
        {getLabel()}
      </button>
    </td>
  );
};

export default StandardWarrantyButton;
