import React from 'react';
import { Package, Clock, AlertTriangle, Shield } from 'lucide-react';

interface CarInventoryWarrantyBadgeProps {
  warranty_life: string | null;
  delivery_date?: string | null;
  vehicle_expiry_date?: string | null;
  battery_expiry_date?: string | null;
  dms_deadline_date?: string | null;
  onClick: () => void;
}

const CarInventoryWarrantyBadge: React.FC<CarInventoryWarrantyBadgeProps> = ({
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
        color: 'bg-slate-100 text-slate-800 border-slate-300', 
        icon: <Package className="w-3 h-3" />, 
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
        color: 'bg-amber-100 text-amber-800 border-amber-300', 
        icon: <Clock className="w-3 h-3" />, 
        text: 'Expiring Soon' 
      };
    }

    // All warranties are active
    return { 
      color: 'bg-teal-100 text-teal-800 border-teal-300', 
      icon: <Shield className="w-3 h-3" />, 
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
      className={`rounded-full border font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 hover:bg-slate-100/80 inline-flex items-center gap-1 ${color} text-xs px-2 py-1 cursor-pointer`}
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

export default CarInventoryWarrantyBadge;
