// Warranty Status Badge Component
// Displays warranty status with appropriate colors and styling

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle, X } from 'lucide-react';

interface WarrantyStatusBadgeProps {
  warrantyStatus?: 'active' | 'expiring_soon' | 'expired';
  warrantyDaysRemaining?: number;
  warrantyMonthsRemaining?: number;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const WarrantyStatusBadge: React.FC<WarrantyStatusBadgeProps> = ({
  warrantyStatus = 'active',
  warrantyDaysRemaining = 0,
  warrantyMonthsRemaining = 0,
  showDetails = true,
  size = 'md'
}) => {
  const getStatusConfig = () => {
    switch (warrantyStatus) {
      case 'active':
        return {
          variant: 'default' as const,
          color: 'bg-green-100 text-green-800 border-green-300',
          icon: Clock,
          label: 'Active',
          description: showDetails ? `${warrantyMonthsRemaining}m ${warrantyDaysRemaining}d remaining` : 'Active'
        };
      case 'expiring_soon':
        return {
          variant: 'destructive' as const,
          color: 'bg-orange-100 text-orange-800 border-orange-300',
          icon: AlertTriangle,
          label: 'Expiring Soon',
          description: showDetails ? `${warrantyDaysRemaining} days left` : 'Expiring Soon'
        };
      case 'expired':
        return {
          variant: 'secondary' as const,
          color: 'bg-red-100 text-red-800 border-red-300',
          icon: X,
          label: 'Expired',
          description: 'Warranty Expired'
        };
      default:
        return {
          variant: 'outline' as const,
          color: 'bg-gray-100 text-gray-800 border-gray-300',
          icon: Clock,
          label: 'Unknown',
          description: 'Status Unknown'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2'
  };

  if (!showDetails) {
    return (
      <Badge 
        variant={config.variant}
        className={`inline-flex items-center gap-1 ${config.color} ${sizeClasses[size]}`}
      >
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <Badge 
        variant={config.variant}
        className={`inline-flex items-center gap-1 ${config.color} ${sizeClasses[size]}`}
      >
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
      {showDetails && (
        <span className="text-xs text-gray-600">
          {config.description}
        </span>
      )}
    </div>
  );
};

export default WarrantyStatusBadge;