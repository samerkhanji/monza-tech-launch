import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle } from 'lucide-react';

interface WarrantyBadgeProps {
  warranty_life: string | null;
  delivery_date?: string | null;
  vehicle_expiry_date?: string | null;
  battery_expiry_date?: string | null;
  dms_deadline_date?: string | null;
  onClick: () => void;
}

const WarrantyBadge: React.FC<WarrantyBadgeProps> = ({
  warranty_life,
  delivery_date,
  vehicle_expiry_date,
  battery_expiry_date,
  dms_deadline_date,
  onClick
}) => {
  const getWarrantyStatus = () => {
    if (!warranty_life && !vehicle_expiry_date && !battery_expiry_date) {
      return { color: 'bg-gray-100 text-gray-600', icon: <Clock className="h-3 w-3" />, text: 'Add Warranty' };
    }

    // Check if any warranty is expired
    const now = new Date();
    const vehicleExpired = vehicle_expiry_date && new Date(vehicle_expiry_date) < now;
    const batteryExpired = battery_expiry_date && new Date(battery_expiry_date) < now;
    const dmsExpired = dms_deadline_date && new Date(dms_deadline_date) < now;

    if (vehicleExpired || batteryExpired || dmsExpired) {
      return { color: 'bg-red-100 text-red-800', icon: <AlertTriangle className="h-3 w-3" />, text: 'Expired' };
    }

    // Check if any warranty is expiring soon (within 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const vehicleExpiringSoon = vehicle_expiry_date && new Date(vehicle_expiry_date) < thirtyDaysFromNow;
    const batteryExpiringSoon = battery_expiry_date && new Date(battery_expiry_date) < thirtyDaysFromNow;
    const dmsExpiringSoon = dms_deadline_date && new Date(dms_deadline_date) < thirtyDaysFromNow;

    if (vehicleExpiringSoon || batteryExpiringSoon || dmsExpiringSoon) {
      return { color: 'bg-yellow-100 text-yellow-800', icon: <AlertTriangle className="h-3 w-3" />, text: 'Expiring Soon' };
    }

    // All warranties are active
    return { color: 'bg-green-100 text-green-800', icon: null, text: 'Active' };
  };

  const getDisplayText = () => {
    if (warranty_life) {
      return warranty_life;
    }
    
    if (vehicle_expiry_date || battery_expiry_date) {
      const parts = [];
      if (vehicle_expiry_date) parts.push('Vehicle');
      if (battery_expiry_date) parts.push('Battery');
      if (dms_deadline_date) parts.push('DMS');
      return `${parts.join(' + ')} Warranty`;
    }
    
    return 'Add Warranty';
  };

  const { color, icon, text } = getWarrantyStatus();

  return (
    <div className="flex flex-col items-center gap-1">
      <Badge
        variant="secondary"
        className={`${color} cursor-pointer hover:opacity-80 transition-opacity text-xs flex items-center gap-1`}
        onClick={onClick}
      >
        {icon}
        {getDisplayText()}
      </Badge>
      
      {/* Status indicator */}
      <div className="text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
        {text}
      </div>
      
      {/* Click hint */}
      <div className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
        Click to edit
      </div>
    </div>
  );
};

export default WarrantyBadge;
