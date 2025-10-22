import { Clock, Battery, Car, AlertTriangle, CheckCircle } from 'lucide-react';

export interface WarrantyStatus {
  status: 'active' | 'expiring_soon' | 'expired' | 'no_warranty';
  text: string;
  className: string;
  icon: React.ReactNode;
  color: string;
}

export function getWarrantyStatus(deadlineDate: string | null | undefined): WarrantyStatus {
  if (!deadlineDate) {
    return {
      status: 'no_warranty',
      text: 'No Warranty',
      className: 'text-sm text-muted-foreground',
      icon: null,
      color: 'text-gray-500'
    };
  }

  const now = new Date();
  const deadline = new Date(deadlineDate);
  const diffDays = Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays >= 30) {
    return {
      status: 'active',
      text: 'Active',
      className: 'rounded-full border font-semibold transition-colors bg-green-100 text-green-800 border-green-300 text-xs px-2 py-1 inline-flex items-center gap-1 hover:bg-green-200 cursor-pointer',
      icon: <CheckCircle className="w-3 h-3" />,
      color: 'text-green-800'
    };
  } else if (diffDays >= 0) {
    return {
      status: 'expiring_soon',
      text: 'Expiring Soon',
      className: 'rounded-full border font-semibold transition-colors bg-yellow-100 text-yellow-800 border-yellow-300 text-xs px-2 py-1 inline-flex items-center gap-1 hover:bg-yellow-200 cursor-pointer',
      icon: <Clock className="w-3 h-3" />,
      color: 'text-yellow-800'
    };
  } else {
    return {
      status: 'expired',
      text: 'Expired',
      className: 'rounded-full border font-semibold transition-colors bg-red-100 text-red-800 border-red-300 text-xs px-2 py-1 inline-flex items-center gap-1 hover:bg-red-200 cursor-pointer',
      icon: <AlertTriangle className="w-3 h-3" />,
      color: 'text-red-800'
    };
  }
}

export function getWarrantyBadgeClass(deadlineDate: string | null | undefined): string {
  return getWarrantyStatus(deadlineDate).className;
}

export function getWarrantyStatusText(deadlineDate: string | null | undefined): string {
  return getWarrantyStatus(deadlineDate).text;
}

export function getWarrantyIcon(deadlineDate: string | null | undefined): React.ReactNode {
  return getWarrantyStatus(deadlineDate).icon;
}

// Specific warranty type functions
export function getDMSWarrantyStatus(deadlineDate: string | null | undefined): WarrantyStatus {
  const status = getWarrantyStatus(deadlineDate);
  return {
    ...status,
    text: status.status === 'no_warranty' ? 'No DMS Warranty' : `DMS: ${status.text}`,
    icon: status.status === 'no_warranty' ? <Clock className="w-3 h-3" /> : status.icon
  };
}

export function getBatteryWarrantyStatus(expiryDate: string | null | undefined): WarrantyStatus {
  const status = getWarrantyStatus(expiryDate);
  return {
    ...status,
    text: status.status === 'no_warranty' ? 'No Battery Warranty' : `Battery: ${status.text}`,
    icon: status.status === 'no_warranty' ? <Battery className="w-3 h-3" /> : status.icon
  };
}

export function getVehicleWarrantyStatus(expiryDate: string | null | undefined): WarrantyStatus {
  const status = getWarrantyStatus(expiryDate);
  return {
    ...status,
    text: status.status === 'no_warranty' ? 'No Vehicle Warranty' : `Vehicle: ${status.text}`,
    icon: status.status === 'no_warranty' ? <Car className="w-3 h-3" /> : status.icon
  };
}

// Calculate days remaining
export function getDaysRemaining(deadlineDate: string | null | undefined): number | null {
  if (!deadlineDate) return null;
  
  const now = new Date();
  const deadline = new Date(deadlineDate);
  return Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

// Get warranty summary text
export function getWarrantySummary(
  dmsDeadline: string | null | undefined,
  batteryExpiry: string | null | undefined,
  vehicleExpiry: string | null | undefined
): string {
  const parts = [];
  
  if (dmsDeadline) {
    const days = getDaysRemaining(dmsDeadline);
    if (days !== null) {
      parts.push(`DMS: ${days >= 0 ? `${days} days` : 'Expired'}`);
    }
  }
  
  if (batteryExpiry) {
    const days = getDaysRemaining(batteryExpiry);
    if (days !== null) {
      parts.push(`Battery: ${days >= 0 ? `${days} days` : 'Expired'}`);
    }
  }
  
  if (vehicleExpiry) {
    const days = getDaysRemaining(vehicleExpiry);
    if (days !== null) {
      parts.push(`Vehicle: ${days >= 0 ? `${days} days` : 'Expired'}`);
    }
  }
  
  return parts.length > 0 ? parts.join(' | ') : 'No Warranty Set';
}
