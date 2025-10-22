import React from 'react';
import { Wrench, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

interface GarageWarrantyBadgeProps {
  warranty_life: string | null;
  delivery_date?: string | null;
  vehicle_expiry_date?: string | null;
  battery_expiry_date?: string | null;
  dms_deadline_date?: string | null;
  onClick: () => void;
}

const GarageWarrantyBadge: React.FC<GarageWarrantyBadgeProps> = ({
  warranty_life,
  delivery_date,
  vehicle_expiry_date,
  battery_expiry_date,
  dms_deadline_date,
  onClick
}) => {
  const getWarrantyStatus = () => {
    if (!warranty_life && !vehicle_expiry_date && !battery_expiry_date) {
      return { 
        color: 'bg-blue-100 text-blue-800 border-blue-300', 
        icon: <Wrench className="w-3 h-3" />, 
        text: 'Add Warranty' 
      };
    }

    // Check if any warranty is expired
    const now = new Date();
    const vehicleExpired = vehicle_expiry_date && new Date(vehicle_expiry_date) < now;
    const batteryExpired = battery_expiry_date && new Date(battery_expiry_date) < now;
    const dmsExpired = dms_deadline_date && new Date(dms_deadline_date) < now;

    if (vehicleExpired || batteryExpired || dmsExpired) {
      return { 
        color: 'bg-red-100 text-red-800 border-red-300', 
        icon: <AlertTriangle className="w-3 h-3" />, 
        text: 'Expired' 
      };
    }

    // Check if any warranty is expiring soon (within 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const vehicleExpiringSoon = vehicle_expiry_date && new Date(vehicle_expiry_date) < thirtyDaysFromNow;
    const batteryExpiringSoon = battery_expiry_date && new Date(battery_expiry_date) < thirtyDaysFromNow;
    const dmsExpiringSoon = dms_deadline_date && new Date(dms_deadline_date) < thirtyDaysFromNow;

    if (vehicleExpiringSoon || batteryExpiringSoon || dmsExpiringSoon) {
      return { 
        color: 'bg-orange-100 text-orange-800 border-orange-300', 
        icon: <AlertTriangle className="w-3 h-3" />, 
        text: 'Expiring Soon' 
      };
    }

    // All warranties are active
    return { 
      color: 'bg-emerald-100 text-emerald-800 border-emerald-300', 
      icon: <CheckCircle className="w-3 h-3" />, 
      text: 'Active' 
    };
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
    <div
      className={`rounded-full border font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 hover:bg-blue-100/80 inline-flex items-center gap-1 ${color} text-xs px-2 py-1 cursor-pointer`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {icon}
      {getDisplayText()}
    </div>
  );
};

export default GarageWarrantyBadge;
