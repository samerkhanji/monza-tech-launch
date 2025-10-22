import React from 'react';
import { Clock, Battery, Car, AlertTriangle, CheckCircle, Edit } from 'lucide-react';
import { 
  getDMSWarrantyStatus, 
  getBatteryWarrantyStatus, 
  getVehicleWarrantyStatus,
  getWarrantySummary 
} from '@/utils/warranty';

interface EnhancedWarrantyBadgeProps {
  dms_deadline_date?: string | null;
  battery_expiry_date?: string | null;
  vehicle_expiry_date?: string | null;
  delivery_date?: string | null;
  warranty_life?: string | null;
  onClick: () => void;
  compact?: boolean;
}

const EnhancedWarrantyBadge: React.FC<EnhancedWarrantyBadgeProps> = ({
  dms_deadline_date,
  battery_expiry_date,
  vehicle_expiry_date,
  delivery_date,
  warranty_life,
  onClick,
  compact = false
}) => {
  const dmsStatus = getDMSWarrantyStatus(dms_deadline_date);
  const batteryStatus = getBatteryWarrantyStatus(battery_expiry_date);
  const vehicleStatus = getVehicleWarrantyStatus(vehicle_expiry_date);

  // Check if any warranty exists
  const hasAnyWarranty = dms_deadline_date || battery_expiry_date || vehicle_expiry_date;

  if (!hasAnyWarranty) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">No Warranty</span>
        <button
          onClick={onClick}
          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
        >
          <Edit className="w-3 h-3" />
          Add
        </button>
      </div>
    );
  }

  if (compact) {
    // Compact view - show summary with edit button
    const summary = getWarrantySummary(dms_deadline_date, battery_expiry_date, vehicle_expiry_date);
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-600">{summary}</span>
        <button
          onClick={onClick}
          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
        >
          <Edit className="w-3 h-3" />
          Edit
        </button>
      </div>
    );
  }

  // Full view - show all warranty types
  return (
    <div className="space-y-2">
      {/* DMS Warranty */}
      {dms_deadline_date && (
        <div 
          className={dmsStatus.className}
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
          {dmsStatus.icon}
          {dmsStatus.text}
        </div>
      )}

      {/* Battery Warranty */}
      {battery_expiry_date && (
        <div 
          className={batteryStatus.className}
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
          {batteryStatus.icon}
          {batteryStatus.text}
        </div>
      )}

      {/* Vehicle Warranty */}
      {vehicle_expiry_date && (
        <div 
          className={vehicleStatus.className}
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
          {vehicleStatus.icon}
          {vehicleStatus.text}
        </div>
      )}

      {/* Edit button */}
      <button
        onClick={onClick}
        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-colors w-full justify-center"
      >
        <Edit className="w-3 h-3" />
        Edit Warranty
      </button>
    </div>
  );
};

export default EnhancedWarrantyBadge;
